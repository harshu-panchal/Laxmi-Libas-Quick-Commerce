import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../../services/api/config';

interface DiscountRule {
    _id: string;
    minQty: number;
    discountPercent: number;
    categoryId?: { _id: string; name: string };
    sellerId?: { _id: string; shopName: string; name: string };
    productId?: { _id: string; name: string };
    isActive: boolean;
    createdAt: string;
}

interface Category {
    _id: string;
    name: string;
}

interface Seller {
    _id: string;
    shopName: string;
    name: string;
}

interface Product {
    _id: string;
    name: string;
}

export default function AdminDiscountRules() {
    const [rules, setRules] = useState<DiscountRule[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<DiscountRule | null>(null);

    const [formData, setFormData] = useState({
        minQty: '',
        discountPercent: '',
        ruleType: 'global',
        categoryId: '',
        sellerId: '',
        productId: '',
    });

    useEffect(() => {
        fetchRules();
        fetchCategories();
        fetchSellers();
        fetchProducts();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await api.get('/admin/discounts');
            setRules(response.data.data || []);
        } catch (error) {
            console.error('Error fetching discount rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/admin/categories');
            setCategories(response.data.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchSellers = async () => {
        try {
            const response = await api.get('/admin/sellers');
            setSellers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching sellers:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/admin/products');
            setProducts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload: any = {
            minQty: parseInt(formData.minQty),
            discountPercent: parseFloat(formData.discountPercent),
        };

        if (formData.ruleType === 'category') {
            payload.categoryId = formData.categoryId;
        } else if (formData.ruleType === 'seller') {
            payload.sellerId = formData.sellerId;
        } else if (formData.ruleType === 'product') {
            payload.productId = formData.productId;
        }

        try {
            if (editingRule) {
                await api.put(`/admin/discounts/${editingRule._id}`, payload);
            } else {
                await api.post('/admin/discounts', payload);
            }
            fetchRules();
            resetForm();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving discount rule:', error);
            alert('Failed to save discount rule');
        }
    };

    const handleEdit = (rule: DiscountRule) => {
        setEditingRule(rule);
        setFormData({
            minQty: rule.minQty.toString(),
            discountPercent: rule.discountPercent.toString(),
            ruleType: rule.productId ? 'product' : rule.sellerId ? 'seller' : rule.categoryId ? 'category' : 'global',
            categoryId: rule.categoryId?._id || '',
            sellerId: rule.sellerId?._id || '',
            productId: rule.productId?._id || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this discount rule?')) return;

        try {
            await api.delete(`/admin/discounts/${id}`);
            fetchRules();
        } catch (error) {
            console.error('Error deleting discount rule:', error);
            alert('Failed to delete discount rule');
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            await api.patch(`/admin/discounts/${id}/status`);
            fetchRules();
        } catch (error) {
            console.error('Error toggling discount rule status:', error);
            alert('Failed to toggle discount rule status');
        }
    };

    const resetForm = () => {
        setFormData({
            minQty: '',
            discountPercent: '',
            ruleType: 'global',
            categoryId: '',
            sellerId: '',
            productId: '',
        });
        setEditingRule(null);
    };

    const getRuleScope = (rule: DiscountRule) => {
        if (rule.productId) return `Product: ${rule.productId.name}`;
        if (rule.sellerId) return `Seller: ${rule.sellerId.shopName || rule.sellerId.name}`;
        if (rule.categoryId) return `Category: ${rule.categoryId.name}`;
        return 'Global';
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Discount Rules</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
                >
                    <Plus size={20} />
                    Add Discount Rule
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Qty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount %</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scope</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rules.map((rule) => (
                                <tr key={rule._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.minQty}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.discountPercent}%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getRuleScope(rule)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${rule.isActive ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {rule.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(rule._id)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                {rule.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                            </button>
                                            <button onClick={() => handleEdit(rule)} className="text-indigo-600 hover:text-indigo-900">
                                                <Edit2 size={20} />
                                            </button>
                                            <button onClick={() => handleDelete(rule._id)} className="text-red-600 hover:text-red-900">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingRule ? 'Edit' : 'Add'} Discount Rule</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Quantity</label>
                                <input
                                    type="number"
                                    value={formData.minQty}
                                    onChange={(e) => setFormData({ ...formData, minQty: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percent</label>
                                <input
                                    type="number"
                                    value={formData.discountPercent}
                                    onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                    min="0"
                                    max="100"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
                                <select
                                    value={formData.ruleType}
                                    onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="global">Global</option>
                                    <option value="category">Category</option>
                                    <option value="seller">Seller</option>
                                    <option value="product">Product</option>
                                </select>
                            </div>

                            {formData.ruleType === 'category' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.ruleType === 'seller' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Seller</label>
                                    <select
                                        value={formData.sellerId}
                                        onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    >
                                        <option value="">Select Seller</option>
                                        {sellers.map((seller) => (
                                            <option key={seller._id} value={seller._id}>
                                                {seller.shopName || seller.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.ruleType === 'product' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                                    <select
                                        value={formData.productId}
                                        onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    >
                                        <option value="">Select Product</option>
                                        {products.map((product) => (
                                            <option key={product._id} value={product._id}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                                    {editingRule ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
