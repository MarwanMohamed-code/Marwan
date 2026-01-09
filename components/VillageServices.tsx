
import React, { useState, useMemo, useRef } from 'react';
import { Icons } from './Icons';
import { useSettings } from '../contexts/SettingsContext';
import { Place, Product } from '../services/villageData';
import { uploadImageToTelegram } from '../services/storageService';

// --- Listing Component ---
interface ServiceListingProps {
  category: string;
  places: Place[];
  onSelectPlace: (placeId: string) => void;
  onBack: () => void;
}

export const ServiceListing: React.FC<ServiceListingProps> = ({ category, places, onSelectPlace, onBack }) => {
  const { t } = useSettings();
  const categoryPlaces = places.filter(p => p.category === category);

  const getTitle = () => {
    switch(category) {
        case 'restaurants': return 'مطاعم القرية';
        case 'shops': return 'المحلات التجارية';
        case 'sweets': return 'الحلويات';
        case 'donations': return 'تبرعات';
        case 'games': return 'الألعاب والترفيه';
        default: return 'الخدمات';
    }
  };

  return (
    <div className="bg-white dark:bg-black min-h-screen animate-slide-up pb-20">
        {/* Header - Transparent Blur */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-30 px-6 py-5 flex items-center gap-5 border-b border-gray-100 dark:border-gray-800">
            <button onClick={onBack} className="p-2.5 -ml-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-90">
                <Icons.Back className="w-6 h-6 dark:text-white" />
            </button>
            <h1 className="text-2xl font-black dark:text-white tracking-tight">{getTitle()}</h1>
        </div>

        {/* List - Cinematic Cards */}
        <div className="p-5 space-y-6 max-w-2xl mx-auto">
            {categoryPlaces.length === 0 ? (
                <div className="text-center py-32 opacity-30">
                    <Icons.Store className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg font-bold">قريباً في الرقة الغربية..</p>
                </div>
            ) : (
                categoryPlaces.map(place => (
                    <div 
                        key={place.id} 
                        onClick={() => onSelectPlace(place.id)}
                        className="relative h-64 rounded-[2.5rem] overflow-hidden shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer group active:scale-95"
                    >
                        {/* High Quality Background Image */}
                        <img 
                            src={place.coverUrl} 
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            alt={place.name} 
                        />
                        
                        {/* Multi-layered Gradients for readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-40" />

                        {/* Content Overlay */}
                        <div className="absolute inset-0 p-8 flex flex-col justify-end">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="bg-yellow-400 text-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                                    <Icons.Activity className="w-3 h-3 fill-current" />
                                    {place.rating}
                                </div>
                                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">
                                    Open Now
                                </span>
                            </div>
                            <h3 className="text-3xl font-black text-white mb-2 drop-shadow-xl tracking-tight leading-none">{place.name}</h3>
                            <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                                <Icons.MapPin className="w-4 h-4 text-orange-500" />
                                <span>الرقة الغربية، مركز العياط</span>
                            </div>
                        </div>

                        {/* Hover Decoration */}
                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                                 <Icons.ChevronRight className="w-6 h-6" />
                             </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

// --- Added missing interfaces for PlaceDetail and ProductDetail ---
interface PlaceDetailProps {
  placeId: string;
  places: Place[];
  onBack: () => void;
  onSelectProduct: (productId: string) => void;
  onAddProductClick: () => void;
  onUpdatePlace: (id: string, data: Partial<Place>) => void;
}

interface ProductDetailProps {
  productId: string;
  places: Place[];
  onBack: () => void;
}

// --- Detail Component ---
export const PlaceDetail: React.FC<PlaceDetailProps> = ({ placeId, places, onBack, onSelectProduct, onAddProductClick, onUpdatePlace }) => {
    const place = places.find(p => p.id === placeId);
    const [isOwner, setIsOwner] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useSettings();

    if (!place) return <div className="h-screen flex items-center justify-center dark:text-white">المكان غير موجود</div>;

    const handlePinSubmit = () => {
        if (pin === place.pin) {
            setIsOwner(true);
            setShowPinModal(false);
            showToast("تم تفعيل وضع المالك بنجاح", "success");
            setPin('');
        } else {
            showToast("الرمز غير صحيح", "error");
            setPin('');
        }
    };

    return (
        <div className="bg-white dark:bg-black min-h-screen animate-slide-up pb-10">
             {/* Header Hero Section */}
             <div className="relative h-[45vh] w-full overflow-hidden group">
                <img src={place.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-black/20 to-transparent" />
                
                {/* Back Button Floating */}
                <button onClick={onBack} className="absolute top-6 left-6 bg-black/30 backdrop-blur-xl p-3 rounded-full text-white hover:bg-black/50 transition-all z-10 border border-white/10 active:scale-90">
                    <Icons.Back className="w-6 h-6" />
                </button>
                
                {/* Owner Control */}
                <div className="absolute top-6 right-6 z-10">
                     {isOwner ? (
                         <div className="bg-green-500/90 backdrop-blur-xl text-white px-5 py-2 rounded-full text-xs font-black shadow-2xl border border-green-400/50 animate-pop-in">
                             ADMIN MODE
                         </div>
                     ) : (
                        <button 
                            onClick={() => setShowPinModal(true)}
                            className="bg-black/30 hover:bg-black/50 p-3 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-xl border border-white/10"
                        >
                            <Icons.Lock className="w-5 h-5" />
                        </button>
                     )}
                </div>

                {/* Edit Cover Action Overlay */}
                {isOwner && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="bg-white text-black px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-3 shadow-2xl active:scale-95 transition-transform"
                         >
                             {isUploading ? <Icons.Loading className="w-5 h-5 animate-spin"/> : <Icons.Camera className="w-5 h-5" />}
                             <span>تحديث الغلاف</span>
                         </button>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                             if (e.target.files?.[0]) {
                                 setIsUploading(true);
                                 try {
                                     const url = await uploadImageToTelegram(e.target.files[0]);
                                     onUpdatePlace(place.id, { coverUrl: url });
                                     showToast("تم التحديث بنجاح", "success");
                                 } catch (e) { showToast("فشل التحميل", "error"); }
                                 finally { setIsUploading(false); }
                             }
                         }} />
                    </div>
                )}

                <div className="absolute bottom-0 right-0 p-8 w-full">
                    <div className="flex items-end justify-between">
                        <div className="mb-4">
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-2 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] tracking-tighter">
                                {place.name}
                            </h1>
                            <div className="flex items-center gap-3 text-white/90 text-sm font-bold">
                                <span className="bg-orange-600 text-white px-3 py-1 rounded-lg shadow-lg">MÁA'OULAT</span>
                                <span className="opacity-80">الرقة الغربية</span>
                            </div>
                        </div>
                        <button className="bg-blue-600 text-white p-5 rounded-[1.5rem] shadow-2xl active:scale-90 transition-transform hover:bg-blue-700 mb-2 border border-blue-400/30">
                             <Icons.Phone className="w-7 h-7" />
                        </button>
                    </div>
                </div>
             </div>

             {/* Content Area */}
             <div className="px-6 pt-10 pb-20 max-w-4xl mx-auto">
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                <Icons.Utensils className="w-6 h-6 text-orange-500" />
                            </div>
                            قائمة الأسعار
                        </h2>
                        {isOwner && (
                            <button 
                                onClick={onAddProductClick}
                                className="bg-blue-600 text-white text-sm font-black px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 active:scale-95"
                            >
                                + إضافة صنف
                            </button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {place.products.map(product => (
                            <div 
                                key={product.id} 
                                onClick={() => onSelectProduct(product.id)}
                                className="flex gap-4 p-3 rounded-[2rem] bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-800 hover:border-orange-500/30 hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer group active:scale-[0.98]"
                            >
                                <div className="w-28 h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 shadow-inner">
                                    <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                                </div>
                                <div className="flex flex-col justify-between flex-1 py-1">
                                    <div>
                                        <h3 className="font-black dark:text-white text-lg tracking-tight leading-tight mb-1">{product.name}</h3>
                                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                            {product.description || 'لم يتم إضافة وصف للمنتج..'}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="text-orange-600 dark:text-orange-400 font-black">
                                            {product.unitPrice} <span className="text-[10px] opacity-60">ج.م / {product.unitName}</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-400 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all shadow-sm">
                                            <Icons.Plus className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden">
                    <Icons.Phone className="absolute -top-4 -left-4 w-24 h-24 text-white/10 rotate-12" />
                    <p className="text-blue-100 font-bold mb-2 uppercase tracking-widest text-xs opacity-70">للطلبات المباشرة</p>
                    <div className="text-3xl font-black text-white tracking-widest">{place.phone}</div>
                </div>
             </div>

             {/* PIN Modal */}
             {showPinModal && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-pop-in p-6">
                     <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] w-full max-w-sm shadow-2xl border border-white/5 dark:border-gray-800">
                         <div className="text-center mb-8">
                             <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-black shadow-xl">
                                 <Icons.Lock className="w-8 h-8 text-blue-500" />
                             </div>
                             <h3 className="text-2xl font-black dark:text-white tracking-tight">الدخول للمالك</h3>
                             <p className="text-sm text-gray-500">أدخل الرمز السري للتحكم في المنيو</p>
                         </div>
                         <input 
                            type="password" 
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full text-center text-4xl font-black tracking-[1em] bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-3xl p-5 mb-6 outline-none focus:border-blue-500 dark:text-white shadow-inner transition-all"
                            placeholder="****"
                            autoFocus
                         />
                         <div className="flex gap-4">
                             <button onClick={() => setShowPinModal(false)} className="flex-1 py-4 text-gray-500 font-black bg-gray-100 dark:bg-gray-800 rounded-2xl">إلغاء</button>
                             <button onClick={handlePinSubmit} className="flex-1 py-4 text-white font-black bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/30 active:scale-95 transition-transform">دخول</button>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
};

// --- Product Detail & Overhauled Smart Calculator ---
export const ProductDetail: React.FC<ProductDetailProps> = ({ productId, places, onBack }) => {
    let product: Product | undefined;
    places.forEach(place => {
        const p = place.products.find(prod => prod.id === productId);
        if (p) product = p;
    });

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [weightInput, setWeightInput] = useState('');
    const [parsedWeight, setParsedWeight] = useState<number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!product) return <div className="h-screen flex items-center justify-center dark:text-white">الصنف غير موجود</div>;

    // --- NEW ROBUST ARABIC PARSING ENGINE ---
    const parseSmartInput = (input: string) => {
        setWeightInput(input);
        setErrorMsg(null);
        
        const clean = input.trim().toLowerCase()
            .replace(/أ/g, 'ا')
            .replace(/إ/g, 'ا')
            .replace(/ة/g, 'ه');

        if (!clean) { setParsedWeight(null); return; }

        // Mappings for common terms
        const valuesMap: Record<string, number> = {
            'كيلو': 1,
            'نص': 0.5,
            'نصف': 0.5,
            'ربع': 0.25,
            'تمن': 0.125,
            'ثمن': 0.125,
            'تلت': 0.333,
            'ثلث': 0.333,
        };

        // Split by separators for addition (و, زائد, +) or subtraction (الا, ناقص, -)
        // Order of detection matters: "الا" has higher priority than "و"
        let total = 0;
        let hasOperation = false;

        // Helper to extract numeric or word value from a string part
        const getVal = (part: string): number => {
            part = part.trim();
            if (!part) return 0;
            
            // Check words first
            for (const [key, val] of Object.entries(valuesMap)) {
                if (part === key) return val;
            }

            // Check if it's "2 كيلو" or similar
            if (part.includes('كيلو')) {
                const num = parseFloat(part.replace('كيلو', '').trim());
                return isNaN(num) ? 1 : num;
            }

            // Check standard fraction 1/4
            if (part.includes('/')) {
                const [n, d] = part.split('/');
                const nv = parseFloat(n), dv = parseFloat(d);
                if (!isNaN(nv) && !isNaN(dv) && dv !== 0) return nv / dv;
            }

            // Check standard number
            const floatVal = parseFloat(part);
            return isNaN(floatVal) ? 0 : floatVal;
        };

        // Advanced Logic: Identify the Base and the Modifier
        let parts: string[] = [];
        let modifier: 'add' | 'sub' | null = null;

        if (clean.includes(' الا ') || clean.includes('الا ') || clean.includes(' ناقص ')) {
            const sep = clean.includes('الا') ? 'الا' : 'ناقص';
            const split = clean.split(sep);
            const base = getVal(split[0] || 'كيلو'); // "كيلو الا ربع" -> base is 1
            const sub = getVal(split[1]);
            total = base - sub;
            hasOperation = true;
        } else if (clean.includes(' و ') || clean.includes('و') || clean.includes(' زائد ')) {
            // Complex splitting for "2 كيلو وربع"
            // We need to be careful with 'و' because it might be inside a word, 
            // but in Egyptian dialect 'و' is usually a separator for fractions.
            const sep = clean.includes(' زائد ') ? ' زائد ' : 'و';
            
            // Special case: "كيلو وربع" -> split by 'و' gives ['كيلو', 'ربع']
            // Special case: "2 كيلو وربع" -> split by 'و' gives ['2 كيلو ', 'ربع']
            const split = clean.split(new RegExp(`\\s?${sep}\\s?`)).filter(s => s.trim() !== '');
            
            if (split.length > 1) {
                const base = getVal(split[0]);
                const add = getVal(split[1]);
                total = base + add;
                hasOperation = true;
            } else {
                total = getVal(clean);
                hasOperation = total > 0;
            }
        } else {
            total = getVal(clean);
            hasOperation = total > 0;
        }

        if (hasOperation && total > 0) {
            setParsedWeight(total);
        } else if (clean.length > 0) {
            setParsedWeight(null);
            setErrorMsg("لم افهم الكمية.. جرب 'كيلو وربع' أو 'كيلو الا ربع'");
        }
    };

    const totalPrice = product.priceType === 'fixed' 
        ? product.unitPrice * quantity 
        : (parsedWeight ? product.unitPrice * parsedWeight : 0);

    return (
        <div className="bg-white dark:bg-black min-h-screen animate-slide-up flex flex-col">
            {/* Gallery Section */}
            <div className="relative h-[45vh] bg-black">
                 <img src={product.images[currentImageIndex]} className="w-full h-full object-cover opacity-80" alt={product.name} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
                 <button onClick={onBack} className="absolute top-6 left-6 bg-black/40 backdrop-blur-xl p-3 rounded-full text-white border border-white/10"><Icons.Back className="w-6 h-6" /></button>
                 
                 {product.images.length > 1 && (
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2.5">
                        {product.images.map((_, idx) => (
                            <div key={idx} onClick={() => setCurrentImageIndex(idx)} className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === currentImageIndex ? 'bg-orange-500 w-8' : 'bg-white/40 w-4'}`} />
                        ))}
                    </div>
                 )}
            </div>

            {/* Premium Content Body */}
            <div className="flex-1 p-8 rounded-t-[3.5rem] -mt-12 bg-white dark:bg-black relative z-10 border-t border-gray-100 dark:border-gray-800 shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                    <div className="max-w-[70%]">
                        <h1 className="text-3xl font-black dark:text-white mb-3 tracking-tighter leading-tight">{product.name}</h1>
                        <p className="text-gray-500 text-sm leading-relaxed">{product.description}</p>
                    </div>
                    <div className="text-end bg-gray-50 dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none mb-1">{product.unitPrice} <span className="text-[10px] text-gray-400 font-bold uppercase">L.E</span></div>
                        <div className="text-[10px] text-gray-400 font-black tracking-widest uppercase">لكل {product.unitName}</div>
                    </div>
                </div>

                <div className="space-y-8">
                    <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
                        <Icons.Scale className="w-6 h-6 text-blue-500" />
                        حساب الطلب الذكي
                    </h3>

                    <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-inner">
                        {product.priceType === 'fixed' ? (
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-black dark:text-gray-300">العدد</span>
                                <div className="flex items-center gap-6 bg-white dark:bg-black rounded-2xl p-2.5 shadow-xl border border-gray-100 dark:border-gray-800">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-2xl dark:text-white active:scale-75 transition-transform">-</button>
                                    <span className="text-3xl font-black w-10 text-center dark:text-white">{quantity}</span>
                                    <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl active:scale-75 transition-transform shadow-lg shadow-blue-500/20">+</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-2">اكتب الكمية (مثال: كيلو الا ربع، 2 كيلو ونص)</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={weightInput}
                                        onChange={(e) => parseSmartInput(e.target.value)}
                                        placeholder={`مثال: كيلو وربع ${product.unitName}..`}
                                        className="w-full p-6 rounded-[1.5rem] border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-black text-2xl outline-none focus:border-blue-600 dark:text-white text-center font-black shadow-sm transition-all"
                                    />
                                    {parsedWeight && (
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-green-500 font-black text-sm bg-green-500/10 px-4 py-2 rounded-xl animate-pop-in">
                                            {parsedWeight.toFixed(3)} {product.unitName}
                                        </div>
                                    )}
                                </div>
                                {errorMsg && <p className="text-red-500 text-xs mt-4 font-bold text-center animate-pulse">{errorMsg}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modern Fixed Bottom Summary */}
            <div className="p-6 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-20px_40px_rgba(0,0,0,0.05)] dark:shadow-none">
                <div className="flex justify-between items-center mb-6 px-4">
                    <div className="flex flex-col">
                         <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">إجمالي السعر</span>
                         <span className="text-4xl font-black dark:text-white">{totalPrice.toFixed(0)} <span className="text-sm opacity-30">L.E</span></span>
                    </div>
                    <div className="bg-orange-500/10 text-orange-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter">
                         {parsedWeight || quantity} {product.unitName}
                    </div>
                </div>
                <button className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-transform flex items-center justify-center gap-4">
                    <Icons.ShoppingBag className="w-7 h-7" />
                    تأكيد الإضافة للطلب
                </button>
            </div>
        </div>
    );
};
