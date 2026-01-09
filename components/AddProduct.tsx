import React, { useState, useRef } from 'react';
import { Icons } from './Icons';
import { useSettings } from '../contexts/SettingsContext';
import { Product, PriceType } from '../services/villageData';

interface AddProductProps {
  onAdd: (product: Omit<Product, 'id'>) => void;
  onCancel: () => void;
}

export const AddProduct: React.FC<AddProductProps> = ({ onAdd, onCancel }) => {
  const { t } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('fixed');
  const [unitName, setUnitName] = useState(''); // e.g. "Ragheef" or "Kilo"
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files);
      const newPreviews = newFiles.map(f => URL.createObjectURL(f));
      setImages(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name || !price || images.length === 0) return;
    setIsSubmitting(true);

    // Default Unit Names if empty
    const finalUnitName = unitName.trim() || (priceType === 'fixed' ? 'قطعة' : 'كيلو');

    const newProduct: Omit<Product, 'id'> = {
        name,
        description,
        unitPrice: parseFloat(price),
        unitName: finalUnitName,
        priceType,
        images
    };

    setTimeout(() => {
        onAdd(newProduct);
        setIsSubmitting(false);
    }, 800); // Simulate network
  };

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen animate-slide-up flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 p-4 shadow-sm border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <Icons.Close className="w-6 h-6 dark:text-white" />
        </button>
        <h1 className="text-xl font-bold font-branding dark:text-white">إضافة منتج جديد</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* 1. Images Section (Hero) */}
        <div className="space-y-3">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block px-1">صور المنتج</label>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 flex-shrink-0 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/10 flex flex-col items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all cursor-pointer group"
                >
                    <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                        <Icons.Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">أضف صور</span>
                </button>
                
                {images.map((img, idx) => (
                    <div key={idx} className="w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden relative shadow-md group">
                        <img src={img} className="w-full h-full object-cover" alt="" />
                        <button 
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Icons.Trash className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
            <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
        </div>

        {/* 2. Basic Info */}
        <div className="space-y-4 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div>
                <label className="text-sm font-bold text-gray-500 mb-2 block">اسم المنتج</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: حواوشي سوبر"
                    className="w-full text-xl font-bold bg-transparent outline-none border-b-2 border-gray-100 dark:border-gray-700 focus:border-black dark:focus:border-white py-2 dark:text-white placeholder-gray-300 transition-colors"
                />
            </div>
            <div>
                <label className="text-sm font-bold text-gray-500 mb-2 block">وصف مختصر</label>
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="مكونات المنتج، الطعم..."
                    className="w-full text-base bg-transparent outline-none border-b-2 border-gray-100 dark:border-gray-700 focus:border-black dark:focus:border-white py-2 dark:text-white placeholder-gray-300 transition-colors resize-none h-20"
                />
            </div>
        </div>

        {/* 3. Price & Type (The Magic Part) */}
        <div>
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-4 px-1">طريقة الحساب والسعر</label>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                    onClick={() => { setPriceType('fixed'); setUnitName('رغيف'); }}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative ${priceType === 'fixed' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}
                >
                    <div className={`p-3 rounded-full ${priceType === 'fixed' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                        <Icons.ShoppingBag className="w-6 h-6" />
                    </div>
                    <span className={`font-bold ${priceType === 'fixed' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}>بالعدد/القطعة</span>
                    {priceType === 'fixed' && <div className="absolute top-2 right-2 text-orange-500"><Icons.Check className="w-5 h-5 fill-current" /></div>}
                </button>

                <button 
                    onClick={() => { setPriceType('variable'); setUnitName('كيلو'); }}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative ${priceType === 'variable' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}
                >
                    <div className={`p-3 rounded-full ${priceType === 'variable' ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                        <Icons.Scale className="w-6 h-6" />
                    </div>
                    <span className={`font-bold ${priceType === 'variable' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}>بالوزن/الكمية</span>
                    {priceType === 'variable' && <div className="absolute top-2 right-2 text-purple-500"><Icons.Check className="w-5 h-5 fill-current" /></div>}
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <div className="flex-1">
                    <label className="text-xs text-gray-400 font-bold mb-1 block">السعر</label>
                    <div className="flex items-end gap-2">
                        <input 
                            type="number" 
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0"
                            className="text-4xl font-bold bg-transparent outline-none w-full dark:text-white placeholder-gray-200"
                        />
                        <span className="text-sm text-gray-400 font-bold mb-2">جنية</span>
                    </div>
                </div>
                <div className="w-[1px] h-12 bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1">
                    <label className="text-xs text-gray-400 font-bold mb-1 block">الوحدة</label>
                    <input 
                        type="text" 
                        value={unitName}
                        onChange={(e) => setUnitName(e.target.value)}
                        placeholder={priceType === 'fixed' ? 'قطعة' : 'كيلو'}
                        className="text-xl font-bold bg-transparent outline-none w-full dark:text-white text-gray-600"
                    />
                </div>
            </div>
        </div>

        {/* Submit */}
        <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !name || !price || images.length === 0}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 mb-8"
        >
            {isSubmitting ? <Icons.Loading className="w-6 h-6 animate-spin mx-auto" /> : 'نشر المنتج في المطعم'}
        </button>

      </div>
    </div>
  );
};