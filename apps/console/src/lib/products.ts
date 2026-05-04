export type DiscountTier = {
  minQty: number;
  discountPct: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  origin: string;
  price: number;
  unit: string;
  stock: number;
  harvestYear: number;
  description: string;
  certifications: string[];
  discountTiers: DiscountTier[];
  seller: string;
  farm: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "P001",
    slug: "assam-orthodox-black-tea",
    name: "Assam Orthodox Black Tea",
    category: "Tea",
    origin: "Assam, India",
    price: 320,
    unit: "kg",
    stock: 500,
    harvestYear: 2025,
    description:
      "Full-bodied, malty Assam orthodox black tea sourced directly from second-flush harvest. FSSAI certified, suitable for bulk blending or retail packaging.",
    certifications: ["FSSAI", "ISO 22000", "Rainforest Alliance"],
    discountTiers: [
      { minQty: 10, discountPct: 5 },
      { minQty: 50, discountPct: 10 },
      { minQty: 100, discountPct: 15 },
    ],
    seller: "Brahmaputra Estates",
    farm: "Upper Brahmaputra Gardens",
  },
  {
    id: "P002",
    slug: "darjeeling-first-flush",
    name: "Darjeeling First Flush",
    category: "Tea",
    origin: "Darjeeling, WB",
    price: 890,
    unit: "kg",
    stock: 200,
    harvestYear: 2025,
    description:
      "Premium first flush Darjeeling with characteristic muscatel notes and golden liquor. Hand-plucked from high-altitude gardens above 2000m.",
    certifications: ["GI Tag", "Organic India", "FSSAI"],
    discountTiers: [
      { minQty: 5, discountPct: 4 },
      { minQty: 20, discountPct: 8 },
      { minQty: 50, discountPct: 12 },
    ],
    seller: "Himalayan Tea Co.",
    farm: "Makaibari Estate",
  },
  {
    id: "P003",
    slug: "green-coffee-beans-robusta",
    name: "Green Coffee Beans – Robusta",
    category: "Coffee",
    origin: "Coorg, Karnataka",
    price: 185,
    unit: "kg",
    stock: 1000,
    harvestYear: 2024,
    description:
      "Sun-dried Robusta green coffee beans from Coorg's shade-grown plantations. Strong cup profile with low acidity, ideal for espresso blends.",
    certifications: ["UTZ Certified", "Rainforest Alliance"],
    discountTiers: [
      { minQty: 20, discountPct: 5 },
      { minQty: 100, discountPct: 10 },
      { minQty: 500, discountPct: 18 },
    ],
    seller: "Coorg Coffee Growers",
    farm: "Kodagu Estate",
  },
  {
    id: "P004",
    slug: "turmeric-fingers-organic",
    name: "Turmeric Fingers (Organic)",
    category: "Spices",
    origin: "Erode, Tamil Nadu",
    price: 145,
    unit: "kg",
    stock: 800,
    harvestYear: 2024,
    description:
      "High-curcumin Erode turmeric fingers, naturally dried and free of additives. Curcumin content >4%. Ideal for export and Ayurvedic formulations.",
    certifications: ["India Organic", "USDA Organic", "FSSAI"],
    discountTiers: [
      { minQty: 25, discountPct: 6 },
      { minQty: 100, discountPct: 12 },
      { minQty: 500, discountPct: 20 },
    ],
    seller: "Tamil Nadu Organics",
    farm: "Erode Turmeric Farms",
  },
  {
    id: "P005",
    slug: "nilgiri-blue-mountain-tea",
    name: "Nilgiri Blue Mountain Tea",
    category: "Tea",
    origin: "Nilgiris, TN",
    price: 540,
    unit: "kg",
    stock: 150,
    harvestYear: 2025,
    description:
      "Bright and brisk Nilgiri tea with a floral aroma and smooth finish. Winter frost harvest, ideal for iced tea blending or standalone brewing.",
    certifications: ["GI Tag", "FSSAI"],
    discountTiers: [
      { minQty: 10, discountPct: 5 },
      { minQty: 30, discountPct: 10 },
      { minQty: 75, discountPct: 14 },
    ],
    seller: "Blue Mountain Estates",
    farm: "Ooty Tea Gardens",
  },
  {
    id: "P006",
    slug: "arabica-coffee-washed-process",
    name: "Arabica Coffee – Washed Process",
    category: "Coffee",
    origin: "Chikmagalur, Karnataka",
    price: 420,
    unit: "kg",
    stock: 300,
    harvestYear: 2024,
    description:
      "Single-origin washed Arabica from Chikmagalur. Bright acidity with stone fruit and citrus notes. Specialty grade, 84+ SCA score.",
    certifications: ["Fair Trade", "Rainforest Alliance", "FSSAI"],
    discountTiers: [
      { minQty: 10, discountPct: 5 },
      { minQty: 50, discountPct: 10 },
      { minQty: 200, discountPct: 16 },
    ],
    seller: "Karnataka Specialty Coffee",
    farm: "Chikmagalur Estate",
  },
  {
    id: "P007",
    slug: "black-pepper-malabar",
    name: "Black Pepper – Malabar",
    category: "Spices",
    origin: "Wayanad, Kerala",
    price: 580,
    unit: "kg",
    stock: 400,
    harvestYear: 2024,
    description:
      "Bold, pungent Malabar black pepper with high piperine content. Sundried and machine-cleaned to 98% purity. Preferred by food manufacturers.",
    certifications: ["FSSAI", "APEDA", "Spice Board India"],
    discountTiers: [
      { minQty: 10, discountPct: 4 },
      { minQty: 50, discountPct: 9 },
      { minQty: 200, discountPct: 15 },
    ],
    seller: "Malabar Spice Traders",
    farm: "Wayanad Pepper Estate",
  },
  {
    id: "P008",
    slug: "green-cardamom-grade-a",
    name: "Green Cardamom – Grade A",
    category: "Spices",
    origin: "Munnar, Kerala",
    price: 2200,
    unit: "kg",
    stock: 120,
    harvestYear: 2024,
    description:
      "Premium Grade A green cardamom with bold size and high volatile oil content. Harvested from high-altitude Munnar plantations above 1500m.",
    certifications: ["Spice Board India", "FSSAI", "AGMARK"],
    discountTiers: [
      { minQty: 5, discountPct: 3 },
      { minQty: 20, discountPct: 7 },
      { minQty: 50, discountPct: 12 },
    ],
    seller: "Munnar Cardamom Co.",
    farm: "High Range Estates",
  },
];

export function getDiscountForQty(tiers: DiscountTier[], qty: number): number {
  return tiers.reduce(
    (best, tier) => (qty >= tier.minQty && tier.discountPct > best ? tier.discountPct : best),
    0
  );
}
