import type { BrandProfile } from "../types";

export const defaultBrandProfile: BrandProfile = {
  brandName: "PawLux Co.",
  brandUrl: "https://pawluxco.com",
  brandDescription:
    "We design premium, vet-informed dog products that prioritize durability, comfort, and modern aesthetics. From orthopedic beds to enrichment toys, every product is crafted with high-quality, non-toxic materials for dogs and the humans who share their space.",
  brandVoice: "Warm, confident, knowledgeable, and playful.",
  targetAudience:
    "Millennial and Gen-Z dog owners aged 25–40 who treat their dogs as family, invest in quality over quantity, care about product safety and sustainability, and prefer products that look good in their home.",
  usps: [
    "Vet-consulted designs built for breed-specific comfort and safety",
    "Premium, non-toxic materials (organic cotton, natural rubber, recycled fabrics)",
    "Aesthetic-forward products that blend into modern home interiors",
  ],
  productCategories: [
    "Orthopedic Dog Beds",
    "Enrichment Toys",
    "Elevated Feeders",
    "Travel Carriers",
  ],
  priceRange: "$35 – $200 per product",
  brandColors: { primary: "#1B2A2F", secondary: "#C8A96E", accent: "#E8DDD3" },
  fonts: { heading: "DM Sans Bold", body: "DM Sans Regular" },
  logoFiles: [],
  exampleAds: [],
  productImages: [],
  videoReferences: [],
  niche: "Premium Dog Accessories & Wellness",
  subNiches: [
    "Dog Comfort & Sleep",
    "Enrichment & Mental Stimulation",
    "Sustainable Pet Products",
  ],
  excludedThemes: [
    "Fear-based messaging about pet health",
    "Guilt-tripping pet owners",
    "Overly clinical/veterinary language",
    "Cheap or discount-focused messaging",
    "Humanizing dogs in an exaggerated or infantilizing way",
  ],
};

export function normalizeBrandProfile(profile?: Partial<BrandProfile> | null): BrandProfile {
  return {
    ...defaultBrandProfile,
    ...profile,
    brandColors: {
      ...defaultBrandProfile.brandColors,
      ...profile?.brandColors,
    },
    fonts: {
      ...defaultBrandProfile.fonts,
      ...profile?.fonts,
    },
    logoFiles: profile?.logoFiles ?? defaultBrandProfile.logoFiles,
    exampleAds: profile?.exampleAds ?? defaultBrandProfile.exampleAds,
    productImages: profile?.productImages ?? defaultBrandProfile.productImages,
    videoReferences: profile?.videoReferences ?? defaultBrandProfile.videoReferences,
    usps: profile?.usps ?? defaultBrandProfile.usps,
    productCategories: profile?.productCategories ?? defaultBrandProfile.productCategories,
    subNiches: profile?.subNiches ?? defaultBrandProfile.subNiches,
    excludedThemes: profile?.excludedThemes ?? defaultBrandProfile.excludedThemes,
  };
}
