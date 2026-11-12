export type Language = 'ar' | 'en';

export type Currency = 'USD' | 'LBP';

export interface CurrencyConfig {
  code: Currency;
  symbolAr: string;
  symbolEn: string;
  rateToUSD: number; // base currency is USD
}

export interface Product {
  id: string;
  sku: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number; // in USD
  originalPrice?: number; // in USD
  discountPercent?: number;
  mainImage: string;
  images: string[];
  categorySlug: string;
  colors: string[];
  sizes: string[];
  affiliateUrl: string;
  originalSheinUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  viewsCount: number;
  clicksCount: number;
  rating: number;
  reviewCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  image?: string;
  iconName?: string;
  order: number;
}

export interface Banner {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  image: string;
  linkUrl: string;
  ctaTextAr: string;
  ctaTextEn: string;
  isActive: boolean;
  order: number;
}

export interface StoreSettings {
  storeNameAr: string;
  storeNameEn: string;
  storeTaglineAr: string;
  storeTaglineEn: string;
  logoUrl?: string;
  primaryColor: string;
  defaultAffiliateId: string;
  currency: Currency;
  language: Language;
  promoBarTextAr: string;
  promoBarTextEn: string;
  seoMetaTitleAr: string;
  seoMetaTitleEn: string;
  seoMetaDescriptionAr: string;
  seoMetaDescriptionEn: string;
  affiliateNoticeAr: string;
  affiliateNoticeEn: string;
  adminPasswordHash?: string; // For verification
  contactEmail: string;
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    snapchat?: string;
    twitter?: string;
  };
}

export interface ClickAnalytics {
  id: string;
  productId: string;
  productTitle: string;
  timestamp: string;
  userIp?: string;
  referrer?: string;
}

export interface ViewAnalytics {
  productId: string;
  views: number;
  lastViewed: string;
}

export interface SheinImportPreview {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  mainImage: string;
  images: string[];
  categorySlug: string;
  colors: string[];
  sizes: string[];
  originalSheinUrl: string;
  affiliateUrl: string;
  sku: string;
}
