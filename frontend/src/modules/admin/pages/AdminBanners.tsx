
import { useState, useEffect } from 'react';
import { getAdminBanners, createBanner, updateBanner, deleteBanner, Banner } from '../../../services/api/bannerService';
import { useToast } from '../../../context/ToastContext';

export default function AdminBanners() {
    const { showToast } = useToast();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [formData, setFormData] = useState<Partial<Banner>>({
        imageUrl: '',
        title: '',
        link: '',
        order: 0,
        isActive: true,
        pageLocation: 'Home Page'
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const response = await getAdminBanners();
            if (response.success) {
                setBanners(response.data);
            }
        } catch (error) {
            showToast('Failed to fetch banners', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBanner) {
                await updateBanner(editingBanner._id, formData);
                showToast('Banner updated', 'success');
            } else {
                await createBanner(formData);
                showToast('Banner created', 'success');
            }
            setShowModal(false);
            setEditingBanner(null);
            setFormData({ imageUrl: '', title: '', link: '', order: 0, isActive: true, pageLocation: 'Home Page' });
            fetchBanners();
        } catch (error) {
            showToast('Operation failed', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this banner?')) return;
        try {
            await deleteBanner(id);
            showToast('Deleted', 'success');
            fetchBanners();
        } catch (error) {
            showToast('Delete failed', 'error');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Banners</h1>
                <button
                    onClick={() => {
                        setEditingBanner(null);
                        setFormData({ imageUrl: '', title: '', link: '', order: 0, isActive: true, pageLocation: 'Home Page' });
                        setShowModal(true);
                    }}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
                >
                    Add New Banner
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banners.map((banner) => (
                        <div key={banner._id} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                            <img src={banner.imageUrl} alt={banner.title} className="w-full h-40 object-cover" />
                            <div className="p-4">
                                <h3 className="font-bold mb-1">{banner.title || 'Untitled Banner'}</h3>
                                <p className="text-sm text-neutral-500 mb-2">Order: {banner.order} | {banner.isActive ? 'Active' : 'Inactive'}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingBanner(banner);
                                            setFormData(banner);
                                            setShowModal(true);
                                        }}
                                        className="text-blue-600 text-sm font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner._id)}
                                        className="text-red-600 text-sm font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingBanner ? 'Edit Banner' : 'Add Banner'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Image URL</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Title (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Link URL (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="/category/fashion"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1">Display Order</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                <div className="flex-1 flex items-center mt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium">Active</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-neutral-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                                >
                                    {editingBanner ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
