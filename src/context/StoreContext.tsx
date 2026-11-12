import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  Banner,
  StoreSettings,
  Language,
  Currency,
} from '../types/store';
import { CURRENCIES } from '../data/initialData';

interface StoreContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  formatPrice: (amountInUSD: number) => string;
  products: Product[];
  categories: Category[];
  banners: Banner[];
  settings: StoreSettings | null;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  recentlyViewed: Product[];
  addRecentlyViewed: (product: Product) => void;
  compareList: string[];
  toggleCompare: (productId: string) => boolean;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
  compareNotice: string | null;
  selectedCategory: string;
  setSelectedCategory: (catSlug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: string;
  setSortOption: (sort: string) => void;
  activeProductModal: Product | null;
  setActiveProductModal: (prod: Product | null) => void;
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  refreshData: () => Promise<void>;
  trackClick: (productId: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shein_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentlyViewed, setRecentlyViewedState] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('shein_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [compareList, setCompareList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shein_compare_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [compareNotice, setCompareNotice] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('newest');
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [adminToken, setAdminTokenState] = useState<string | null>(() => {
    return localStorage.getItem('shein_admin_token') || null;
  });
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync dir and lang on <html> element
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setAdminToken = (token: string | null) => {
    setAdminTokenState(token);
    if (token) {
      localStorage.setItem('shein_admin_token', token);
    } else {
      localStorage.removeItem('shein_admin_token');
    }
  };

  useEffect(() => {
    localStorage.setItem('shein_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('shein_compare_list', JSON.stringify(compareList));
  }, [compareList]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleCompare = (productId: string): boolean => {
    if (compareList.includes(productId)) {
      setCompareList((prev) => prev.filter((id) => id !== productId));
      return false;
    }
    if (compareList.length >= 3) {
      setCompareNotice(
        language === 'ar'
          ? 'يمكنك مقارنة حتى 3 منتجات كحد أقصى'
          : 'You can compare up to 3 products maximum'
      );
      setTimeout(() => setCompareNotice(null), 3500);
      return false;
    }
    setCompareList((prev) => [...prev, productId]);
    return true;
  };

  const removeFromCompare = (productId: string) => {
    setCompareList((prev) => prev.filter((id) => id !== productId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const addRecentlyViewed = (product: Product) => {
    setRecentlyViewedState((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 8);
      localStorage.setItem('shein_recently_viewed', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes, banRes, setRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
        fetch('/api/banners').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
      ]);

      setProducts(prodRes);
      setCategories(catRes);
      setBanners(banRes);
      setSettings(setRes);

      // Deep link resolution if ?product=id is present in URL
      const params = new URLSearchParams(window.location.search);
      const sharedProdId = params.get('product');
      if (sharedProdId && Array.isArray(prodRes)) {
        const target = prodRes.find((p: Product) => p.id === sharedProdId || p.sku === sharedProdId);
        if (target) {
          setActiveProductModal(target);
        }
      }
    } catch (err) {
      console.error('Error loading store data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const formatPrice = (amountInUSD: number): string => {
    const config = CURRENCIES[currency] || CURRENCIES.USD;
    if (currency === 'LBP') {
      const converted = amountInUSD * config.rateToUSD;
      const formattedNum = converted.toLocaleString('en-US', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      });
      return language === 'ar' ? `${formattedNum} ل.ل` : `${formattedNum} LBP`;
    } else {
      const formattedNum = amountInUSD.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      });
      return `$${formattedNum}`;
    }
  };

  const trackClick = async (productId: string) => {
    try {
      await fetch(`/api/products/${productId}/click`, { method: 'POST' });
    } catch (err) {
      console.warn('Failed tracking click:', err);
    }
  };

  // Implement product removal / deletion logic with immediate UI state update
  const deleteProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setCompareList((prev) => prev.filter((id) => id !== productId));
        await refreshData();
      } else {
        throw new Error('Failed on server');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        formatPrice,
        products,
        categories,
        banners,
        settings,
        wishlist,
        toggleWishlist,
        recentlyViewed,
        addRecentlyViewed,
        compareList,
        toggleCompare,
        removeFromCompare,
        clearCompare,
        isCompareOpen,
        setIsCompareOpen,
        compareNotice,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        sortOption,
        setSortOption,
        activeProductModal,
        setActiveProductModal,
        adminToken,
        setAdminToken,
        isAdminOpen,
        setIsAdminOpen,
        refreshData,
        trackClick,
        deleteProduct,
        isLoading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
