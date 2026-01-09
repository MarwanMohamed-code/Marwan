
import { Icons } from '../components/Icons';

export type PriceType = 'fixed' | 'variable'; // fixed = per unit (piece), variable = per weight (kg)

export interface Product {
  id: string;
  name: string;
  unitPrice: number; // Base price (e.g., price per item OR price per KG)
  unitName: string; // "رغيف", "كانز", "كيلو"
  priceType: PriceType;
  images: string[];
  description?: string;
}

export interface Place {
  id: string;
  name: string;
  category: 'restaurants' | 'shops' | 'donations' | 'sweets' | 'games';
  coverUrl: string;
  logoUrl: string;
  rating: number;
  phone?: string;
  pin: string; // Secret PIN for the owner
  products: Product[];
}

export const VILLAGE_SERVICES = [
  { id: 'restaurants', name: 'المطاعم', icon: Icons.Utensils, color: 'bg-orange-500' },
  { id: 'shops', name: 'المحلات', icon: Icons.ShoppingBag, color: 'bg-blue-500' },
  { id: 'sweets', name: 'الحلويات', icon: Icons.Cookie, color: 'bg-pink-500' },
  { id: 'donations', name: 'التبرعات', icon: Icons.Gift, color: 'bg-green-500' },
  { id: 'games', name: 'الألعاب', icon: Icons.Game, color: 'bg-indigo-500' },
];

export const PLACES_DATA: Place[] = [
  // --- Restaurants ---
  {
    id: 'diwan',
    name: 'مطعم الديوان',
    category: 'restaurants',
    rating: 4.8,
    phone: '01000000001',
    pin: '123', // Unified PIN
    coverUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1000&auto=format&fit=crop',
    logoUrl: 'https://ui-avatars.com/api/?name=Diwan&background=orange&color=fff',
    products: [
      { 
        id: 'p_kofta', 
        name: 'كفتة بلدي (مشوي)', 
        unitPrice: 450, 
        unitName: 'كيلو', 
        priceType: 'variable',
        images: [
            'https://images.unsplash.com/photo-1529193591176-1dae03804411?w=800',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'
        ],
        description: 'كفتة ضاني صافي مفرومة ومتبلة بخلطة الديوان السرية، تقدم مع الطحينة والسلطة.'
      },
      { 
        id: 'p_chicken', 
        name: 'فراخ شيش (على الفحم)', 
        unitPrice: 220, 
        unitName: 'فرخة', 
        priceType: 'variable', // Allows entering "half", "1.5", etc.
        images: [
            'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800',
            'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800'
        ],
        description: 'فراخ متبلة ومشوية على الفحم، تقدم مع الأرز والعيش.'
      },
      { 
        id: 'p_hawawshi', 
        name: 'حواوشي اسكندراني', 
        unitPrice: 65, 
        unitName: 'رغيف', 
        priceType: 'fixed',
        images: [
            'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800'
        ],
        description: 'رغيف حواوشي مليان لحمة بلدي وفلفل ألوان، مخبوز في الفرن البلدي.'
      },
       { 
        id: 'p_pepsi', 
        name: 'بيبسي كانز', 
        unitPrice: 15, 
        unitName: 'علبة', 
        priceType: 'fixed',
        images: [
            'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800'
        ],
        description: 'مشروب غازي بارد منعش.'
      },
    ]
  },
  {
    id: 'prince',
    name: 'مطعم البرنس',
    category: 'restaurants',
    rating: 4.5,
    phone: '01000000002',
    pin: '123', // Unified PIN
    coverUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000',
    logoUrl: 'https://ui-avatars.com/api/?name=Prince&background=red&color=fff',
    products: [
        { id: 'p3', name: 'كبدة اسكندراني', unitPrice: 60, unitName: 'ساندوتش', priceType: 'fixed', images: ['https://images.unsplash.com/photo-1606419420761-4f2af8910d12?w=500'] },
        { id: 'p_tarb', name: 'طرب ضاني', unitPrice: 500, unitName: 'كيلو', priceType: 'variable', images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=500'] },
    ]
  },
  {
    id: 'rafat',
    name: 'مطعم رأفت',
    category: 'restaurants',
    rating: 4.7,
    phone: '01000000003',
    pin: '123', // Unified PIN
    coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000',
    logoUrl: 'https://ui-avatars.com/api/?name=Rafat&background=blue&color=fff',
    products: [
        { id: 'p4', name: 'سمك بوري مشوي', unitPrice: 180, unitName: 'كيلو', priceType: 'variable', images: ['https://images.unsplash.com/photo-1519708227418-e8fa30205171?w=500'] },
    ]
  },
  {
    id: 'primo',
    name: 'البريمو',
    category: 'restaurants',
    rating: 4.9,
    phone: '01000000004',
    pin: '123', // Unified PIN
    coverUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000',
    logoUrl: 'https://ui-avatars.com/api/?name=Primo&background=yellow&color=000',
    products: [
        { id: 'p5', name: 'بيتزا مشكل جبن', unitPrice: 90, unitName: 'قطعة', priceType: 'fixed', images: ['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500'] },
    ]
  },
  // --- Sweets ---
  {
    id: 'basma',
    name: 'حلويات بسمة',
    category: 'sweets',
    rating: 4.9,
    phone: '01000000006',
    pin: '123', // Unified PIN
    coverUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=1000',
    logoUrl: 'https://ui-avatars.com/api/?name=Basma&background=pink&color=fff',
    products: [
        { id: 's1', name: 'تورتة شوكولاتة', unitPrice: 200, unitName: 'قطعة', priceType: 'fixed', images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500'] },
        { id: 's2', name: 'طبق جاتوه مشكل', unitPrice: 150, unitName: 'طبق', priceType: 'fixed', images: ['https://images.unsplash.com/photo-1557308536-ee471ef2c39a?w=500'] },
    ]
  },
  {
    id: 'zalabia',
    name: 'حلويات الزلابية',
    category: 'sweets',
    rating: 4.5,
    phone: '01000000007',
    pin: '123', // Unified PIN
    coverUrl: 'https://images.unsplash.com/photo-1621236378699-8597faf6a176?q=80&w=1000',
    logoUrl: 'https://ui-avatars.com/api/?name=Zalabia&background=yellow&color=000',
    products: [
        { id: 's3', name: 'زلابية بالسكر', unitPrice: 40, unitName: 'طبق', priceType: 'fixed', images: ['https://images.unsplash.com/photo-1598214886806-c87b84b7078b?w=500'] },
    ]
  },
  {
    id: 'moallem',
    name: 'حلويات المعلم',
    category: 'sweets',
    rating: 4.7,
    phone: '01000000008',
    pin: '123', // Unified PIN
    coverUrl: 'https://images.unsplash.com/photo-1612203985729-70726954388c?q=80&w=1000',
    logoUrl: 'https://ui-avatars.com/api/?name=Moallem&background=purple&color=fff',
    products: [
        { id: 's5', name: 'كنافة بالمانجو', unitPrice: 180, unitName: 'صينية', priceType: 'variable', images: ['https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500'] },
    ]
  },
];

// Helper to add product at runtime (Local)
export const addProductToPlace = (placeId: string, product: Product) => {
    const place = PLACES_DATA.find(p => p.id === placeId);
    if (place) {
        place.products.unshift(product);
    }
}
