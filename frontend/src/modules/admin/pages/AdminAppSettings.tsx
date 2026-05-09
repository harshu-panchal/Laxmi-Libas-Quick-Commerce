import { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { getAppSettings, updateAppSettings, AppSettings } from '../../../services/api/admin/adminSettingsService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Share2, 
  Globe, 
  Save,
  Loader2,
  Building,
  Image as ImageIcon,
  Palette,
  ShieldAlert,
  Sliders,
  Check
} from 'lucide-react';

export default function AdminAppSettings() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'invoice' | 'social' | 'theme' | 'access' | 'features' | 'buttons' | 'forms'>('general');
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // Form States
    const [formData, setFormData] = useState<Partial<AppSettings>>({
        appName: 'LaxMart',
        contactEmail: '',
        contactPhone: '',
        supportEmail: '',
        supportPhone: '',
        companyAddress: '',
        companyCity: '',
        companyState: '',
        companyPincode: '',
        companyCountry: 'India',
        invoicePrefix: 'INV',
        invoiceTagline: 'Fast Delivery E-Commerce Platform',
        invoiceFooter: 'Thank you for your business!',
        gstNumber: '',
        socialLinks: {
            facebook: '',
            instagram: '',
            twitter: '',
            whatsapp: ''
        },
        themeSettings: {
            primaryColor: '#0d9488',
            secondaryColor: '#f59e0b',
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            fontFamily: 'Outfit',
            enableGlassmorphism: true,
            cardStyle: 'shadow'
        },
        roleAccessConfig: {
            hotelModuleAllowedRoles: ['Super Admin', 'Admin', 'hotel'],
            busModuleAllowedRoles: ['Super Admin', 'Admin', 'bus'],
            deliveryModuleAllowedRoles: ['Super Admin', 'Admin', 'delivery', 'Delivery'],
            sellerModuleAllowedRoles: ['Super Admin', 'Admin', 'seller', 'Seller']
        },
        dynamicUIControls: {
            showHotelSection: true,
            showBusSection: true,
            showGrocerySection: true,
            showBestsellers: true,
            showPromoStrip: true,
            customFooterText: '© 2026 Laxmart. All Rights Reserved.',
            primaryButtonLabel: 'Explore Now',
            checkoutFieldsRequirement: 'Standard'
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await getAppSettings();
            if (response && response.success && response.data) {
                setSettings(response.data);
                setFormData(response.data);
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to fetch settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof AppSettings | string, value: any) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof AppSettings] as any),
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await updateAppSettings(formData);
            if (response.success) {
                showToast('Application settings updated successfully');
                setSettings(response.data);
            } else {
                showToast('Failed to update settings', 'error');
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Error updating settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'General Info', icon: Globe },
        { id: 'contact', label: 'Contact & Address', icon: MapPin },
        { id: 'invoice', label: 'Invoice Settings', icon: FileText },
        { id: 'social', label: 'Social Links', icon: Share2 },
        { id: 'theme', label: 'Theme & Colors', icon: Palette },
        { id: 'access', label: 'Module Access', icon: ShieldAlert },
        { id: 'features', label: 'Dynamic Features', icon: Sliders },
        { id: 'buttons', label: 'Dynamic Buttons', icon: Settings },
        { id: 'forms', label: 'Dynamic Forms', icon: FileText },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20">
                <Loader2 className="w-10 h-10 text-primary-dark animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="w-7 h-7 text-primary-dark" />
                        Application Settings
                    </h1>
                    <p className="text-gray-500 mt-1">Manage global configuration, contact info and invoice branding.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:w-auto px-6 py-2.5 bg-primary-dark text-white rounded-xl font-bold hover:bg-yellow-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-200 active:scale-95 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save All Changes
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-6 py-4 text-sm font-bold transition-all border-l-4 ${
                                    activeTab === tab.id 
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-500' 
                                    : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700'
                                }`}
                            >
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-yellow-600' : 'text-gray-400'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8"
                        >
                            {activeTab === 'general' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Globe className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">General Branding</h2>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Application Name</label>
                                            <input
                                                type="text"
                                                value={formData.appName}
                                                onChange={(e) => handleInputChange('appName', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                placeholder="e.g. LaxMart"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">App Logo URL</label>
                                                <div className="flex gap-4">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={formData.appLogo || ''}
                                                            onChange={(e) => handleInputChange('appLogo', e.target.value)}
                                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                    {formData.appLogo && (
                                                        <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex-shrink-0">
                                                            <img src={formData.appLogo} alt="Logo" className="w-full h-full object-contain" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Favicon URL</label>
                                                <div className="flex gap-4">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={formData.appFavicon || ''}
                                                            onChange={(e) => handleInputChange('appFavicon', e.target.value)}
                                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                    {formData.appFavicon && (
                                                        <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex-shrink-0">
                                                            <img src={formData.appFavicon} alt="Favicon" className="w-full h-full object-contain" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'contact' && (
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                                <Mail className="w-6 h-6" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900">Contact Channels</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Primary Email</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="email"
                                                        value={formData.contactEmail}
                                                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Primary Phone</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={formData.contactPhone}
                                                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Support Email</label>
                                                <input
                                                    type="email"
                                                    value={formData.supportEmail || ''}
                                                    onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Support Phone</label>
                                                <input
                                                    type="text"
                                                    value={formData.supportPhone || ''}
                                                    onChange={(e) => handleInputChange('supportPhone', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                                <Building className="w-6 h-6" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900">Headquarters Address</h2>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Full Address</label>
                                                <textarea
                                                    rows={3}
                                                    value={formData.companyAddress || ''}
                                                    onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none resize-none"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="col-span-1 md:col-span-2">
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                                                    <input
                                                        type="text"
                                                        value={formData.companyCity || ''}
                                                        onChange={(e) => handleInputChange('companyCity', e.target.value)}
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                                                    <input
                                                        type="text"
                                                        value={formData.companyState || ''}
                                                        onChange={(e) => handleInputChange('companyState', e.target.value)}
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Pincode</label>
                                                    <input
                                                        type="text"
                                                        value={formData.companyPincode || ''}
                                                        onChange={(e) => handleInputChange('companyPincode', e.target.value)}
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'invoice' && (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">Invoice Branding</h2>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Invoice Prefix</label>
                                            <input
                                                type="text"
                                                value={formData.invoicePrefix || ''}
                                                onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none font-mono"
                                                placeholder="e.g. INV"
                                            />
                                            <p className="mt-2 text-xs text-gray-500">Example: {formData.invoicePrefix}-2024-001</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">GST Number (Optional)</label>
                                            <input
                                                type="text"
                                                value={formData.gstNumber || ''}
                                                onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none font-mono"
                                                placeholder="22AAAAA0000A1Z5"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Invoice Tagline</label>
                                            <input
                                                type="text"
                                                value={formData.invoiceTagline || ''}
                                                onChange={(e) => handleInputChange('invoiceTagline', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                placeholder="Fast Delivery E-Commerce Platform"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Invoice Footer Message</label>
                                            <textarea
                                                rows={2}
                                                value={formData.invoiceFooter || ''}
                                                onChange={(e) => handleInputChange('invoiceFooter', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none resize-none"
                                                placeholder="Thank you for your business!"
                                            />
                                        </div>
                                    </div>

                                    {/* Preview Box */}
                                    <div className="mt-8 p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                                        <span className="text-[10px] font-black uppercase text-gray-400 mb-4 block tracking-widest">Live Invoice Header Preview</span>
                                        <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-100">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-900">{formData.appName}</h3>
                                                    <p className="text-xs text-gray-500 mt-1 font-medium">{formData.invoiceTagline}</p>
                                                    {formData.gstNumber && <p className="text-[10px] text-blue-600 font-bold mt-2">GSTIN: {formData.gstNumber}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Invoice No</p>
                                                    <p className="text-sm font-black text-gray-900">#{formData.invoicePrefix}-0001</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'social' && (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                                            <Share2 className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">Social Connect</h2>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Facebook Page URL</label>
                                            <input
                                                type="text"
                                                value={formData.socialLinks?.facebook || ''}
                                                onChange={(e) => handleInputChange('socialLinks.facebook', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                placeholder="https://facebook.com/..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Instagram Profile URL</label>
                                            <input
                                                type="text"
                                                value={formData.socialLinks?.instagram || ''}
                                                onChange={(e) => handleInputChange('socialLinks.instagram', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                placeholder="https://instagram.com/..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Twitter Profile URL</label>
                                            <input
                                                type="text"
                                                value={formData.socialLinks?.twitter || ''}
                                                onChange={(e) => handleInputChange('socialLinks.twitter', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                placeholder="https://twitter.com/..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp Business Number</label>
                                            <input
                                                type="text"
                                                value={formData.socialLinks?.whatsapp || ''}
                                                onChange={(e) => handleInputChange('socialLinks.whatsapp', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                placeholder="919999999999"
                                            />
                                            <p className="mt-1 text-xs text-gray-400">Include country code without + (e.g. 91...)</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'theme' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                                            <Palette className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Dynamic UI Theme & Styles</h2>
                                            <p className="text-xs text-gray-500">Configure global colors, presets, glassmorphism, and visual templates.</p>
                                        </div>
                                    </div>

                                    {/* Preset Color Themes */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Pre-curated Premium Presets</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { name: "Teal Elegance (Default)", primary: "#0d9488", secondary: "#f59e0b" },
                                                { name: "Royal Purple", primary: "#7c3aed", secondary: "#ec4899" },
                                                { name: "Sunset Crimson", primary: "#dc2626", secondary: "#f97316" },
                                                { name: "Midnight Premium", primary: "#1e293b", secondary: "#10b981" }
                                            ].map((preset, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        handleInputChange('themeSettings.primaryColor', preset.primary);
                                                        handleInputChange('themeSettings.secondaryColor', preset.secondary);
                                                        showToast(`${preset.name} applied to form! Click Save to publish.`, 'success');
                                                    }}
                                                    className="p-3 border border-neutral-200 rounded-xl hover:border-teal-500 transition-all text-left flex flex-col gap-2 bg-white hover:shadow-md cursor-pointer"
                                                >
                                                    <span className="text-xs font-black text-neutral-800 leading-none">{preset.name}</span>
                                                    <div className="flex gap-1.5 mt-1">
                                                        <span className="w-5 h-5 rounded-full block border shadow-inner" style={{ backgroundColor: preset.primary }} />
                                                        <span className="w-5 h-5 rounded-full block border shadow-inner" style={{ backgroundColor: preset.secondary }} />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Advanced Colors */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Primary Color Hex</label>
                                            <div className="flex gap-3 items-center">
                                                <input
                                                    type="color"
                                                    value={formData.themeSettings?.primaryColor || '#0d9488'}
                                                    onChange={(e) => handleInputChange('themeSettings.primaryColor', e.target.value)}
                                                    className="w-12 h-12 rounded-xl border border-neutral-200 cursor-pointer p-1"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.themeSettings?.primaryColor || ''}
                                                    onChange={(e) => handleInputChange('themeSettings.primaryColor', e.target.value)}
                                                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-yellow-500 focus:bg-white outline-none transition-all"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Secondary Color Hex</label>
                                            <div className="flex gap-3 items-center">
                                                <input
                                                    type="color"
                                                    value={formData.themeSettings?.secondaryColor || '#f59e0b'}
                                                    onChange={(e) => handleInputChange('themeSettings.secondaryColor', e.target.value)}
                                                    className="w-12 h-12 rounded-xl border border-neutral-200 cursor-pointer p-1"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.themeSettings?.secondaryColor || ''}
                                                    onChange={(e) => handleInputChange('themeSettings.secondaryColor', e.target.value)}
                                                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-yellow-500 focus:bg-white outline-none transition-all"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Font Family Typography</label>
                                            <select
                                                value={formData.themeSettings?.fontFamily || 'Outfit'}
                                                onChange={(e) => handleInputChange('themeSettings.fontFamily', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                            >
                                                <option value="Outfit">Outfit (Premium, Modern)</option>
                                                <option value="Inter">Inter (Sleek, Dynamic)</option>
                                                <option value="Roboto">Roboto (Clean, Classic)</option>
                                                <option value="Montserrat">Montserrat (Bold, Elegant)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">App Card Layout Template</label>
                                            <select
                                                value={formData.themeSettings?.cardStyle || 'shadow'}
                                                onChange={(e) => handleInputChange('themeSettings.cardStyle', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                            >
                                                <option value="shadow">Shadow (Soft Lift, Beautiful)</option>
                                                <option value="bordered">Bordered (Minimalist outline)</option>
                                                <option value="flat">Flat (Retro modern clean)</option>
                                                <option value="glass">Glass (Aero Frosted effect)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Glassmorphic Toggles */}
                                    <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 flex justify-between items-center">
                                        <div>
                                            <h4 className="text-sm font-bold text-teal-800">Frosted Glassmorphism Effect</h4>
                                            <p className="text-xs text-teal-600">Apply real-time blur and backdrop filters to dashboards and navigation screens.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.themeSettings?.enableGlassmorphism || false}
                                                onChange={(e) => handleInputChange('themeSettings.enableGlassmorphism', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                        </label>
                                    </div>

                                    {/* Preview Sandbox */}
                                    <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                                        <span className="text-[10px] font-black uppercase text-gray-400 mb-4 block tracking-widest">Real-time Layout Component Preview</span>
                                        <div className="p-6 rounded-2xl border transition-all" style={{ 
                                            backgroundColor: formData.themeSettings?.backgroundColor || '#ffffff',
                                            borderColor: formData.themeSettings?.cardStyle === 'bordered' ? '#e5e7eb' : 'transparent',
                                            boxShadow: formData.themeSettings?.cardStyle === 'shadow' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                                            backdropFilter: formData.themeSettings?.enableGlassmorphism ? 'blur(8px)' : 'none',
                                            fontFamily: formData.themeSettings?.fontFamily || 'Outfit'
                                        }}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-lg font-black" style={{ color: formData.themeSettings?.textColor || '#1f2937' }}>Laxmart Super Dashboard</h4>
                                                    <p className="text-xs text-neutral-400">Live rendered style preview module</p>
                                                </div>
                                                <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-widest text-white shadow-sm" style={{ backgroundColor: formData.themeSettings?.primaryColor }}>Active UI</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl text-white transition-all hover:scale-105" style={{ backgroundColor: formData.themeSettings?.primaryColor }}>Primary Action</button>
                                                <button className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl text-white transition-all hover:scale-105" style={{ backgroundColor: formData.themeSettings?.secondaryColor }}>Secondary Action</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'access' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                                            <ShieldAlert className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Module Access & Authorization Controls (RBAC)</h2>
                                            <p className="text-xs text-gray-500">Fully authorize which roles can view or manage particular application modules.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {[
                                            { label: "Hotel Management Module Access Roles", field: "roleAccessConfig.hotelModuleAllowedRoles", defaultRoles: ["Super Admin", "Admin", "hotel"] },
                                            { label: "Transport (Bus) Module Access Roles", field: "roleAccessConfig.busModuleAllowedRoles", defaultRoles: ["Super Admin", "Admin", "bus"] },
                                            { label: "Delivery App Module Access Roles", field: "roleAccessConfig.deliveryModuleAllowedRoles", defaultRoles: ["Super Admin", "Admin", "delivery", "Delivery"] },
                                            { label: "Seller Partner Module Access Roles", field: "roleAccessConfig.sellerModuleAllowedRoles", defaultRoles: ["Super Admin", "Admin", "seller", "Seller"] }
                                        ].map((moduleDef, idx) => {
                                            const currentRoles: string[] = (formData.roleAccessConfig as any)?.[moduleDef.field.split('.')[1]] || moduleDef.defaultRoles;
                                            return (
                                                <div key={idx} className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-sm space-y-4">
                                                    <h3 className="text-sm font-black text-neutral-800 tracking-tight">{moduleDef.label}</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {["Super Admin", "Admin", "Sub Admin", "hotel", "bus", "seller", "Seller", "delivery", "Delivery", "Customer"].map((role) => {
                                                            const isSelected = currentRoles.includes(role);
                                                            return (
                                                                <button
                                                                    key={role}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const nextRoles = isSelected
                                                                            ? currentRoles.filter(r => r !== role)
                                                                            : [...currentRoles, role];
                                                                        handleInputChange(moduleDef.field, nextRoles);
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                                                                        isSelected 
                                                                        ? 'bg-red-50 border-red-500 text-red-700 font-extrabold' 
                                                                        : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                                                                    }`}
                                                                >
                                                                    {isSelected && <Check size={14} className="text-red-700" />}
                                                                    {role}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'features' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                            <Sliders className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Dynamic Home Page & Features Toggle</h2>
                                            <p className="text-xs text-gray-500">Configure visible home sections, customized labels, footer text and parameters.</p>
                                        </div>
                                    </div>

                                    {/* Toggle controls */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { title: "Hotel Search & Booking", desc: "Enable hotel booking flow for travel customers", field: "dynamicUIControls.showHotelSection" },
                                            { title: "Bus Booking Section", desc: "Enable dynamic bus selection flow on store", field: "dynamicUIControls.showBusSection" },
                                            { title: "Grocery In Minutes Store", desc: "Enable grocery ordering on the store app", field: "dynamicUIControls.showGrocerySection" },
                                            { title: "Bestseller Promotion Cards", desc: "Show handpicked bestsellers on the home layout", field: "dynamicUIControls.showBestsellers" },
                                            { title: "Dynamic Promo Strips", desc: "Display administrative promo text strips", field: "dynamicUIControls.showPromoStrip" }
                                        ].map((toggle, idx) => {
                                            const isChecked = (formData.dynamicUIControls as any)?.[toggle.field.split('.')[1]];
                                            return (
                                                <div key={idx} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/60 flex justify-between items-center">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-neutral-800">{toggle.title}</h4>
                                                        <p className="text-xs text-neutral-400 mt-1">{toggle.desc}</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked !== undefined ? isChecked : true}
                                                            onChange={(e) => handleInputChange(toggle.field, e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Text Fields / Button configurations */}
                                    <div className="space-y-6 pt-4 border-t">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Global Primary Button Text</label>
                                                <input
                                                    type="text"
                                                    value={formData.dynamicUIControls?.primaryButtonLabel || 'Explore Now'}
                                                    onChange={(e) => handleInputChange('dynamicUIControls.primaryButtonLabel', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                    placeholder="Explore Now"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Checkout Layout Style</label>
                                                <select
                                                    value={formData.dynamicUIControls?.checkoutFieldsRequirement || 'Standard'}
                                                    onChange={(e) => handleInputChange('dynamicUIControls.checkoutFieldsRequirement', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                                >
                                                    <option value="Standard">Standard (Full verification flow)</option>
                                                    <option value="Compact">Compact (Single-screen express checkout)</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Administrative Footer Tagline & Copywrite</label>
                                                <input
                                                    type="text"
                                                    value={formData.dynamicUIControls?.customFooterText || '© 2026 Laxmart. All Rights Reserved.'}
                                                    onChange={(e) => handleInputChange('dynamicUIControls.customFooterText', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none"
                                                    placeholder="© 2026 Laxmart. All Rights Reserved."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'buttons' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                                            <Settings className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Dynamic Buttons Control System</h2>
                                            <p className="text-xs text-gray-500">Configure label text, toggle visibility, and assign icons to dynamic app buttons globally.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {(formData.dynamicButtons || []).map((btn: any, idx: number) => (
                                            <div key={idx} className="p-6 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                                <div className="flex-1 space-y-2">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-200 text-gray-700">ID: {btn.buttonId}</span>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-500 mb-1">Button Label</label>
                                                            <input
                                                                type="text"
                                                                value={btn.label}
                                                                onChange={(e) => {
                                                                    const updatedButtons = [...(formData.dynamicButtons || [])];
                                                                    updatedButtons[idx] = { ...btn, label: e.target.value };
                                                                    handleInputChange('dynamicButtons', updatedButtons);
                                                                }}
                                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 transition-all outline-none text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-500 mb-1">Button Icon</label>
                                                            <input
                                                                type="text"
                                                                value={btn.icon || ''}
                                                                onChange={(e) => {
                                                                    const updatedButtons = [...(formData.dynamicButtons || [])];
                                                                    updatedButtons[idx] = { ...btn, icon: e.target.value };
                                                                    handleInputChange('dynamicButtons', updatedButtons);
                                                                }}
                                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 transition-all outline-none text-sm"
                                                                placeholder="e.g. Search, Calendar, Heart"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 pt-4 md:pt-0">
                                                    <span className="text-xs font-bold text-gray-500">Visible on App</span>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={btn.visible}
                                                            onChange={(e) => {
                                                                const updatedButtons = [...(formData.dynamicButtons || [])];
                                                                updatedButtons[idx] = { ...btn, visible: e.target.checked };
                                                                handleInputChange('dynamicButtons', updatedButtons);
                                                            }}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'forms' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Dynamic Forms & Validation Schema</h2>
                                            <p className="text-xs text-gray-500">Add/remove fields, customize input placeholders, adjust validation criteria, and show/hide fields on interactive user/partner registration pages dynamically.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {(formData.dynamicForms || []).map((form: any, formIdx: number) => (
                                            <div key={formIdx} className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-sm space-y-4">
                                                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                                    <h3 className="text-sm font-black text-neutral-800 tracking-tight uppercase">Form ID: {form.formId.replace('_', ' ')}</h3>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-600">Schema fields: {form.fields.length}</span>
                                                </div>

                                                <div className="space-y-4">
                                                    {form.fields.map((field: any, fieldIdx: number) => (
                                                        <div key={fieldIdx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col xl:flex-row items-start xl:items-center gap-4">
                                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 w-full">
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Field Slug</label>
                                                                    <input
                                                                        type="text"
                                                                        value={field.fieldId}
                                                                        disabled
                                                                        className="w-full px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs text-gray-500 outline-none font-mono"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Label</label>
                                                                    <input
                                                                        type="text"
                                                                        value={field.label}
                                                                        onChange={(e) => {
                                                                            const updatedForms = JSON.parse(JSON.stringify(formData.dynamicForms || []));
                                                                            updatedForms[formIdx].fields[fieldIdx].label = e.target.value;
                                                                            handleInputChange('dynamicForms', updatedForms);
                                                                        }}
                                                                        className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700 outline-none focus:ring-1 focus:ring-yellow-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Placeholder</label>
                                                                    <input
                                                                        type="text"
                                                                        value={field.placeholder || ''}
                                                                        onChange={(e) => {
                                                                            const updatedForms = JSON.parse(JSON.stringify(formData.dynamicForms || []));
                                                                            updatedForms[formIdx].fields[fieldIdx].placeholder = e.target.value;
                                                                            handleInputChange('dynamicForms', updatedForms);
                                                                        }}
                                                                        className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700 outline-none focus:ring-1 focus:ring-yellow-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Input Type</label>
                                                                    <select
                                                                        value={field.type}
                                                                        onChange={(e) => {
                                                                            const updatedForms = JSON.parse(JSON.stringify(formData.dynamicForms || []));
                                                                            updatedForms[formIdx].fields[fieldIdx].type = e.target.value;
                                                                            handleInputChange('dynamicForms', updatedForms);
                                                                        }}
                                                                        className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700 font-bold outline-none cursor-pointer"
                                                                    >
                                                                        <option value="text">Text Field</option>
                                                                        <option value="number">Numeric Field</option>
                                                                        <option value="email">Email address</option>
                                                                        <option value="tel">Telephone / Phone</option>
                                                                        <option value="checkbox">Checkbox toggle</option>
                                                                        <option value="select">Dropdown selection</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto pt-3 xl:pt-0 border-t xl:border-t-0 border-gray-200">
                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`req-${formIdx}-${fieldIdx}`}
                                                                        checked={field.required}
                                                                        onChange={(e) => {
                                                                            const updatedForms = JSON.parse(JSON.stringify(formData.dynamicForms || []));
                                                                            updatedForms[formIdx].fields[fieldIdx].required = e.target.checked;
                                                                            handleInputChange('dynamicForms', updatedForms);
                                                                        }}
                                                                        className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                                                    />
                                                                    <label htmlFor={`req-${formIdx}-${fieldIdx}`} className="text-xs font-bold text-gray-500 cursor-pointer">Required</label>
                                                                </div>

                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`vis-${formIdx}-${fieldIdx}`}
                                                                        checked={field.visible}
                                                                        onChange={(e) => {
                                                                            const updatedForms = JSON.parse(JSON.stringify(formData.dynamicForms || []));
                                                                            updatedForms[formIdx].fields[fieldIdx].visible = e.target.checked;
                                                                            handleInputChange('dynamicForms', updatedForms);
                                                                        }}
                                                                        className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                                                    />
                                                                    <label htmlFor={`vis-${formIdx}-${fieldIdx}`} className="text-xs font-bold text-gray-500 cursor-pointer">Visible</label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
