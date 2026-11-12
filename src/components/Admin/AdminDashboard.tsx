import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Category, Banner, StoreSettings, SheinImportPreview } from '../../types/store';
import {
  X,
  LayoutDashboard,
  Sparkles,
  Package,
  Image as ImageIcon,
  Link2,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Eye,
  TrendingUp,
  MousePointer,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const {
    adminToken,
    setAdminToken,
    language,
    settings,
    products,
    categories,
    banners,
    refreshData,
    formatPrice,
    deleteProduct,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'importer' | 'products' | 'banners' | 'marketing' | 'settings'
  >('analytics');

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // SHEIN Importer States
  const [sheinUrl, setSheinUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [importPreview, setImportPreview] = useState<SheinImportPreview | null>(null);
  const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editing Product Modal State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Deleting Product State & Custom Confirmation Modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Admin Products State (includes unpublished)
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [loadingAdminProducts, setLoadingAdminProducts] = useState(false);

  // Store Settings Form State
  const [settingsForm, setSettingsForm] = useState<Partial<StoreSettings>>({});
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fetchAdminProducts = async () => {
    setLoadingAdminProducts(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setAdminProducts(data);
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoadingAdminProducts(false);
    }
  };

  // Load analytics or admin products when tab opens
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'analytics') {
        fetchAnalytics();
      } else if (activeTab === 'products') {
        fetchAdminProducts();
      }
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
    }
  }, [settings]);

  if (!isOpen || !adminToken) return null;

  // Handle Automated SHEIN Link Import
  const handleSheinImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheinUrl.trim()) return;
    setImporting(true);
    setImportMsg(null);
    setImportPreview(null);

    try {
      const res = await fetch('/api/import/shein', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheinUrl }),
      });
      const data = await res.json();

      if (data.success && data.preview) {
        setImportPreview(data.preview);
        setImportMsg({
          type: 'success',
          text:
            language === 'ar'
              ? 'تم جلب بيانات المنتج بنجاح من SHEIN! يمكنك معاينتها وتعديلها أدناه قبل النشر.'
              : 'SHEIN Product details fetched successfully! Review and edit below before publishing.',
        });
      } else {
        setImportMsg({
          type: 'error',
          text: data.error || (language === 'ar' ? 'فشل جلب الرابط' : 'Failed to parse link'),
        });
      }
    } catch (err) {
      setImportMsg({
        type: 'error',
        text: language === 'ar' ? 'حدث خطأ أثناء جلب بيانات SHEIN' : 'Error importing link',
      });
    } finally {
      setImporting(false);
    }
  };

  // Publish Previewed Product
  const handlePublishImportedProduct = async () => {
    if (!importPreview || isPublishing) return;
    setIsPublishing(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...importPreview,
          isFeatured: true,
          isPublished: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.product) {
        setAdminProducts((prev) => [data.product, ...prev]);
        await refreshData();
        setImportPreview(null);
        setSheinUrl('');
        setImportMsg({
          type: 'success',
          text:
            language === 'ar'
              ? '✓ تم حفظ ونشر المنتج بنجاح في متجرك والكتالوج!'
              : '✓ Product published successfully to your store catalog!',
        });
        setTimeout(() => {
          setActiveTab('products');
        }, 600);
      } else {
        throw new Error(data.error || 'Failed to save product');
      }
    } catch (err: any) {
      console.error('Error publishing product:', err);
      setImportMsg({
        type: 'error',
        text:
          language === 'ar'
            ? 'حدث خطأ أثناء حفظ ونشر المنتج، يرجى المحاولة مرة أخرى.'
            : 'Error publishing product, please try again.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Delete Product Handler via Modal
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setAdminProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      await refreshData();
      setDeleteFeedback({
        type: 'success',
        message: language === 'ar' ? 'تم حذف المنتج من الكتالوج بنجاح!' : 'Product deleted successfully from catalog!',
      });
      setTimeout(() => setDeleteFeedback(null), 3500);
      setProductToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteFeedback({
        type: 'error',
        message: language === 'ar' ? 'حدث خطأ أثناء محاولة الحذف، يرجى المحاولة مرة أخرى.' : 'Error deleting product, please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Featured / Published state
  const handleToggleProductState = async (product: Product, field: 'isFeatured' | 'isPublished') => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [field]: !product[field],
        }),
      });
      const data = await res.json();
      if (data.success && data.product) {
        setAdminProducts((prev) => prev.map((p) => (p.id === product.id ? data.product : p)));
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Edit Product Modal
  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const isNew = !editingProduct.id;
      const url = isNew ? '/api/products' : `/api/products/${editingProduct.id}`;
      const method = isNew ? 'POST' : 'PUT';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });

      setEditingProduct(null);
      refreshData();
    } catch (err) {
      alert('Error saving product');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      setSettingsSaved(true);
      refreshData();
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      alert('Error saving settings');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-6xl h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Top Navigation Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400 text-black flex items-center justify-center font-black text-lg">
              S
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {language === 'ar' ? 'لوحة تحكم المتجر الإدارية' : 'SHEIN Affiliate Admin Dashboard'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ar' ? 'إدارة المنتجات، روابط العمولة، الإحصائيات، والإعدادات' : 'Manage products, affiliate links, analytics & theme'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAdminToken(null);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Sidebar & Content Split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Sidebar Menu */}
          <div className="w-full md:w-64 bg-slate-900/95 text-slate-300 border-e border-slate-800 p-4 flex flex-row md:flex-col gap-1 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-amber-400 text-black'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{language === 'ar' ? 'الإحصائيات والتقارير' : 'Analytics & Clicks'}</span>
            </button>

            <button
              onClick={() => setActiveTab('importer')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'importer'
                  ? 'bg-amber-400 text-black'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{language === 'ar' ? 'مستورد رابط SHEIN' : 'SHEIN Link Importer'}</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-amber-400 text-black'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{language === 'ar' ? 'إدارة المنتجات' : 'Products Manager'} ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('marketing')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'marketing'
                  ? 'bg-amber-400 text-black'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>{language === 'ar' ? 'معرف العمولة Affiliate' : 'Affiliate Tracking'}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-amber-400 text-black'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{language === 'ar' ? 'إعدادات المتجر وSEO' : 'Settings & SEO'}</span>
            </button>
          </div>

          {/* Main Content Viewport */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            
            {/* 1. ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {language === 'ar' ? 'تقرير أداء النقرات والمشاهدات' : 'Affiliate Performance Summary'}
                  </h3>
                  <button
                    onClick={fetchAnalytics}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                    <span>{language === 'ar' ? 'تحديث البيانات' : 'Refresh'}</span>
                  </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-semibold">{language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}</span>
                      <h4 className="text-2xl font-black text-slate-900">{analyticsData?.totalProducts || products.length}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <MousePointer className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-semibold">{language === 'ar' ? 'إجمالي نقرات العمولة' : 'Total Affiliate Clicks'}</span>
                      <h4 className="text-2xl font-black text-slate-900">{analyticsData?.totalClicks || 0}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Eye className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-semibold">{language === 'ar' ? 'إجمالي مشاهدات الصفحات' : 'Total Product Views'}</span>
                      <h4 className="text-2xl font-black text-slate-900">{analyticsData?.totalViews || 0}</h4>
                    </div>
                  </div>
                </div>

                {/* Top Clicked Products */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                  <h4 className="text-sm font-extrabold text-slate-900 mb-4">
                    {language === 'ar' ? 'المنتجات الأكثر تحويلاً لنقرات العمولة' : 'Top Clicked Affiliate Products'}
                  </h4>
                  {analyticsData?.topClickedProducts && analyticsData.topClickedProducts.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {analyticsData.topClickedProducts.map((p: any, idx: number) => (
                        <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-800 line-clamp-1 max-w-md">{p.title}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-500 font-mono">{p.views} مشاهدة</span>
                            <span className="font-extrabold text-red-600 bg-red-50 px-2.5 py-1 rounded font-mono">
                              {p.clicks} نقرة
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-4">{language === 'ar' ? 'لا توجد نقرات مسجلة بعد.' : 'No click data recorded yet.'}</p>
                  )}
                </div>
              </div>
            )}

            {/* 2. AUTOMATED SHEIN LINK IMPORTER */}
            {activeTab === 'importer' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                    {language === 'ar' ? 'إضافة منتج تلقائياً بواسطة رابط SHEIN' : 'Auto Import Product via SHEIN Link'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'ar'
                      ? 'ضع رابط أي منتج من SHEIN ليتم استخراج الصور والأوصاف والأسعار والمقاسات تلقائياً عبر الذكاء الاصطناعي مع إمكانية التعديل.'
                      : 'Paste any SHEIN product URL to parse images, title, description, price, and specs automatically using Gemini AI.'}
                  </p>
                </div>

                {/* URL Input Form */}
                <form onSubmit={handleSheinImport} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={sheinUrl}
                      onChange={(e) => setSheinUrl(e.target.value)}
                      placeholder={
                        language === 'ar'
                          ? 'الصق رابط منتج SHEIN أو رابط shein.top أو رسالة المشاركة من التطبيق...'
                          : 'Paste SHEIN link, shein.top short link, or app share message...'
                      }
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-black"
                      required
                    />
                    <button
                      type="submit"
                      disabled={importing}
                      className="px-6 py-3 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>
                        {importing
                          ? language === 'ar'
                            ? 'جاري جلب البيانات والتجهيز...'
                            : 'Fetching & Extracting...'
                          : language === 'ar'
                          ? 'جلب بيانات SHEIN'
                          : 'Fetch Product Data'}
                      </span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {language === 'ar'
                      ? 'يدعم جميع الروابط المباشرة (ar.shein.com)، الروابط المختصرة (shein.top)، ورسائل المشاركة المنسوخة من تطبيق شي إن للجوال.'
                      : 'Supports full SHEIN links (ar.shein.com), short links (shein.top), and mobile app share texts.'}
                  </p>

                  {importMsg && (
                    <div
                      className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                        importMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {importMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                      <span>{importMsg.text}</span>
                    </div>
                  )}
                </form>

                {/* Import Live Preview */}
                {importPreview && (
                  <div className="bg-white p-6 rounded-xl border-2 border-amber-400 shadow-md flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h4 className="text-sm font-black text-slate-900">
                          {language === 'ar' ? 'معاينة البيانات المستخرجة قبل النشر' : 'Imported Product Metadata Preview'}
                        </h4>
                      </div>
                      <button
                        onClick={handlePublishImportedProduct}
                        disabled={isPublishing}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {isPublishing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>{language === 'ar' ? 'جارٍ النشر...' : 'Publishing...'}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>{language === 'ar' ? 'تأكيد ونشر المنتج في المتجر' : 'Publish Product Now'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-3">
                        <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'الصورة الرئيسية المستخرجة:' : 'Extracted Main Image:'}</label>
                        <div className="aspect-3/4 w-full bg-slate-100 rounded-lg overflow-hidden border">
                          <img src={importPreview.mainImage} alt="preview" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600">{language === 'ar' ? 'رابط الصورة (يمكنك تغييره إن أردت):' : 'Image URL (editable):'}</label>
                          <input
                            type="text"
                            value={importPreview.mainImage}
                            onChange={(e) => setImportPreview({ ...importPreview, mainImage: e.target.value, images: [e.target.value] })}
                            className="w-full bg-slate-50 border p-2 rounded text-xs mt-1 font-mono text-slate-600"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'عنوان المنتج بالعربية:' : 'Arabic Title:'}</label>
                          <input
                            type="text"
                            value={importPreview.titleAr}
                            onChange={(e) => setImportPreview({ ...importPreview, titleAr: e.target.value })}
                            className="w-full bg-slate-50 border p-2 rounded text-xs mt-1 font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'عنوان المنتج بالإنجليزية:' : 'English Title:'}</label>
                          <input
                            type="text"
                            value={importPreview.titleEn}
                            onChange={(e) => setImportPreview({ ...importPreview, titleEn: e.target.value })}
                            className="w-full bg-slate-50 border p-2 rounded text-xs mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'السعر ($):' : 'Price ($):'}</label>
                            <input
                              type="number"
                              value={importPreview.price}
                              onChange={(e) => setImportPreview({ ...importPreview, price: Number(e.target.value) })}
                              className="w-full bg-slate-50 border p-2 rounded text-xs mt-1 font-bold text-red-600"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'السعر السابق ($):' : 'Original Price ($):'}</label>
                            <input
                              type="number"
                              value={importPreview.originalPrice || ''}
                              onChange={(e) => setImportPreview({ ...importPreview, originalPrice: Number(e.target.value) })}
                              className="w-full bg-slate-50 border p-2 rounded text-xs mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'التصنيف المناسب:' : 'Category:'}</label>
                            <select
                              value={importPreview.categorySlug}
                              onChange={(e) => setImportPreview({ ...importPreview, categorySlug: e.target.value })}
                              className="w-full bg-slate-50 border p-2 rounded text-xs mt-1 font-bold"
                            >
                              <option value="women-dresses">{language === 'ar' ? 'فساتين نسائية' : 'Women Dresses'}</option>
                              <option value="men-streetwear">{language === 'ar' ? 'ملابس رجالية' : 'Men Clothing'}</option>
                              <option value="tops-jackets">{language === 'ar' ? 'بلوزات وجاكيتات' : 'Tops & Jackets'}</option>
                              <option value="shoes-footwear">{language === 'ar' ? 'أحذية وصنادل' : 'Shoes & Footwear'}</option>
                              <option value="bags-accessories">{language === 'ar' ? 'حقائب وإكسسوارات' : 'Bags & Accessories'}</option>
                              <option value="beauty-makeup">{language === 'ar' ? 'تجميل وعناية' : 'Beauty & Care'}</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'رمز SKU المستخرج:' : 'Extracted SKU:'}</label>
                            <input
                              type="text"
                              value={importPreview.sku || ''}
                              onChange={(e) => setImportPreview({ ...importPreview, sku: e.target.value })}
                              className="w-full bg-slate-50 border p-2 rounded text-xs mt-1 font-mono text-slate-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'رابط العمولة المولد:' : 'Generated Affiliate URL:'}</label>
                          <input
                            type="text"
                            value={importPreview.affiliateUrl}
                            onChange={(e) => setImportPreview({ ...importPreview, affiliateUrl: e.target.value })}
                            className="w-full bg-slate-50 border p-2 rounded text-xs mt-1 font-mono text-slate-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. PRODUCTS MANAGEMENT TAB */}
            {activeTab === 'products' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {language === 'ar' ? 'إدارة كتالوج المنتجات' : 'Products Manager'} ({adminProducts.length})
                  </h3>
                  <button
                    onClick={() =>
                      setEditingProduct({
                        titleAr: 'منتج جديد',
                        titleEn: 'New Product',
                        price: 99,
                        mainImage: '/src/assets/images/category_women_dresses_1794426499182.jpg',
                        images: ['/src/assets/images/category_women_dresses_1794426499182.jpg'],
                        categorySlug: 'women-dresses',
                        colors: ['#000000', '#FFFFFF'],
                        sizes: ['S', 'M', 'L'],
                        affiliateUrl: 'https://shein.com',
                        originalSheinUrl: 'https://shein.com',
                        isFeatured: true,
                        isPublished: true,
                      })
                    }
                    className="px-4 py-2 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{language === 'ar' ? 'إضافة منتج يدوي' : 'Add Manual Product'}</span>
                  </button>
                </div>

                {/* Delete / Action Feedback Banner */}
                {deleteFeedback && (
                  <div
                    className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                      deleteFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {deleteFeedback.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{deleteFeedback.message}</span>
                  </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">{language === 'ar' ? 'المنتج' : 'Product'}</th>
                          <th className="p-3">{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                          <th className="p-3">{language === 'ar' ? 'السعر' : 'Price'}</th>
                          <th className="p-3">{language === 'ar' ? 'النقرات' : 'Clicks'}</th>
                          <th className="p-3">{language === 'ar' ? 'مميز' : 'Featured'}</th>
                          <th className="p-3">{language === 'ar' ? 'منشور' : 'Published'}</th>
                          <th className="p-3 text-end">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {adminProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-3 flex items-center gap-3">
                              <img src={p.mainImage} alt="img" className="w-10 h-12 object-cover rounded bg-slate-200" />
                              <div>
                                <span className="font-bold text-slate-900 block line-clamp-1 max-w-xs">{p.titleAr || p.titleEn}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-600 font-semibold">{p.categorySlug}</td>
                            <td className="p-3 font-black text-red-600">{formatPrice(p.price)}</td>
                            <td className="p-3 font-mono text-slate-700">{p.clicksCount || 0}</td>
                            <td className="p-3">
                              <button
                                onClick={() => handleToggleProductState(p, 'isFeatured')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                  p.isFeatured ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {p.isFeatured ? 'نعم' : 'لا'}
                              </button>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleToggleProductState(p, 'isPublished')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                  p.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {p.isPublished ? 'منشور' : 'مسودة'}
                              </button>
                            </td>
                            <td className="p-3 text-end">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingProduct(p)}
                                  className="p-1.5 text-slate-600 hover:text-black hover:bg-slate-200 rounded cursor-pointer transition-colors"
                                  title={language === 'ar' ? 'تعديل المنتج' : 'Edit Product'}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setProductToDelete(p)}
                                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer transition-colors border border-red-200 bg-red-50/50"
                                  title={language === 'ar' ? 'حذف هذا المنتج' : 'Delete Product'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. MARKETING & AFFILIATE TAB */}
            {activeTab === 'marketing' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                    {language === 'ar' ? 'إدارة معرف العمولة Global Affiliate ID' : 'Affiliate Tracking ID Configuration'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'ar'
                      ? 'يتم إلحاق هذا المعرف تلقائياً بجميع روابط SHEIN في المتجر لضمان احتساب أرباحك وعمولاتك.'
                      : 'This ID is automatically attached to all product links on the store to secure your commission.'}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4 max-w-xl">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'معرف العمولة الخاص بك (Affiliate Tracking ID):' : 'Default Affiliate Tracking ID:'}</label>
                    <input
                      type="text"
                      value={settingsForm.defaultAffiliateId || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, defaultAffiliateId: e.target.value })}
                      placeholder="e.g. SHEIN_PARTNER_992"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono font-bold"
                    />
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer w-fit"
                  >
                    {language === 'ar' ? 'حفظ معرف العمولة' : 'Save Tracking ID'}
                  </button>
                </div>
              </div>
            )}

            {/* 5. SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                    {language === 'ar' ? 'إعدادات الهوية وSEO' : 'Store Settings & SEO'}
                  </h3>
                </div>

                <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4">
                  {settingsSaved && (
                    <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg border border-emerald-200 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{language === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!'}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'اسم المتجر (بالعربية):' : 'Store Name (Arabic):'}</label>
                      <input
                        type="text"
                        value={settingsForm.storeNameAr || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeNameAr: e.target.value })}
                        className="w-full bg-slate-50 border p-2.5 rounded text-xs mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'اسم المتجر (بالإنجليزية):' : 'Store Name (English):'}</label>
                      <input
                        type="text"
                        value={settingsForm.storeNameEn || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeNameEn: e.target.value })}
                        className="w-full bg-slate-50 border p-2.5 rounded text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'عنوان SEO للصفحة الرئيسية:' : 'SEO Meta Title:'}</label>
                    <input
                      type="text"
                      value={settingsForm.seoMetaTitleAr || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, seoMetaTitleAr: e.target.value })}
                      className="w-full bg-slate-50 border p-2.5 rounded text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'وصف SEO للمتجر:' : 'SEO Meta Description:'}</label>
                    <textarea
                      value={settingsForm.seoMetaDescriptionAr || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, seoMetaDescriptionAr: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-50 border p-2.5 rounded text-xs mt-1"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer w-fit"
                  >
                    {language === 'ar' ? 'حفظ كافة الإعدادات' : 'Save All Settings'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Product Sub-Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleSaveProductEdit} className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base">
                {editingProduct.id ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h3>
              <button type="button" onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">العنوان بالعربية</label>
                <input
                  type="text"
                  value={editingProduct.titleAr || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, titleAr: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">العنوان بالإنجليزية</label>
                <input
                  type="text"
                  value={editingProduct.titleEn || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, titleEn: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">{language === 'ar' ? 'السعر ($)' : 'Price ($)'}</label>
                <input
                  type="number"
                  value={editingProduct.price || 0}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="w-full border p-2 rounded mt-1 font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">{language === 'ar' ? 'السعر الأصلي ($ إن وجد)' : 'Original Price ($ if any)'}</label>
                <input
                  type="number"
                  value={editingProduct.originalPrice || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                  className="w-full border p-2 rounded mt-1"
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold text-slate-700">رابط الصورة الرئيسية</label>
                <input
                  type="text"
                  value={editingProduct.mainImage || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, mainImage: e.target.value, images: [e.target.value] })}
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold text-slate-700">رابط العمولة Affiliate URL</label>
                <input
                  type="text"
                  value={editingProduct.affiliateUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, affiliateUrl: e.target.value })}
                  className="w-full border p-2 rounded mt-1 font-mono text-slate-600"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 text-xs font-bold text-slate-600">
                إلغاء
              </button>
              <button type="submit" className="px-5 py-2 bg-black text-white text-xs font-bold rounded">
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal (Custom in-UI confirmation that avoids window.confirm issues) */}
      {productToDelete && (
        <div className="fixed inset-0 z-70 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-5 text-start animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  {language === 'ar' ? 'تأكيد حذف المنتج' : 'Confirm Product Deletion'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === 'ar'
                    ? 'هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً من المتجر؟ لا يمكن التراجع عن هذا الإجراء.'
                    : 'Are you sure you want to permanently delete this product? This action cannot be undone.'}
                </p>
              </div>
            </div>

            {/* Product summary card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <img
                src={productToDelete.mainImage}
                alt=""
                className="w-12 h-14 object-cover rounded bg-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {productToDelete.titleAr || productToDelete.titleEn}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {productToDelete.sku}
                  </span>
                  <span className="text-xs font-black text-red-600">
                    {formatPrice(productToDelete.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'ar' ? 'جارٍ الحذف...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'نعم، حذف المنتج' : 'Yes, Delete Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
