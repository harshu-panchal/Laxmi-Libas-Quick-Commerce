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
  Image as ImageIcon
} from 'lucide-react';

export default function AdminAppSettings() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'invoice' | 'social'>('general');
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
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
