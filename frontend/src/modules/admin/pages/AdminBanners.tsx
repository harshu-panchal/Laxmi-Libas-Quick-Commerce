import { useState, useEffect } from "react";
import {
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  Banner,
} from "../../../services/api/bannerService";
import { useToast } from "../../../context/ToastContext";
import { uploadImage } from "../../../services/api/uploadService";

export default function AdminBanners() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<Partial<Banner>>({
    imageUrl: "",
    title: "",
    link: "",
    order: 0,
    isActive: true,
    pageLocation: "Home Page",
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
      showToast("Failed to fetch banners", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadImage(file, "banners");
      setFormData((prev) => ({ ...prev, imageUrl: result.secureUrl }));
      showToast("Image uploaded successfully", "success");
    } catch (error) {
      showToast("Image upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      showToast("Please upload an image", "error");
      return;
    }

    try {
      if (editingBanner) {
        await updateBanner(editingBanner._id, formData);
        showToast("Banner updated", "success");
      } else {
        await createBanner(formData);
        showToast("Banner created", "success");
      }
      setShowModal(false);
      setEditingBanner(null);
      setFormData({
        imageUrl: "",
        title: "",
        link: "",
        order: 0,
        isActive: true,
        pageLocation: "Home Page",
      });
      fetchBanners();
    } catch (error) {
      showToast("Operation failed", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await deleteBanner(id);
      showToast("Deleted", "success");
      fetchBanners();
    } catch (error) {
      showToast("Delete failed", "error");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Banners</h1>
        <button
          onClick={() => {
            setEditingBanner(null);
            setFormData({
              imageUrl: "",
              title: "",
              link: "",
              order: 0,
              isActive: true,
              pageLocation: "Home Page",
            });
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
            <div
              key={banner._id}
              className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden"
            >
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold mb-1">
                  {banner.title || "Untitled Banner"}
                </h3>
                <p className="text-sm text-neutral-500 mb-2">
                  Order: {banner.order} |{" "}
                  {banner.isActive ? "Active" : "Inactive"}
                </p>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingBanner ? "Edit Banner" : "Add Banner"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6L18 18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Banner Image
                </label>
                <div className="space-y-2">
                  {formData.imageUrl && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-neutral-200">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, imageUrl: "" })
                        }
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 6L6 18M6 6L18 18" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-center w-full">
                    <label
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-neutral-500">
                              Uploading...
                            </p>
                          </div>
                        ) : (
                          <>
                            <svg
                              className="w-8 h-8 mb-4 text-neutral-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            <p className="mb-2 text-sm text-neutral-500">
                              <span className="font-semibold">
                                Click to upload
                              </span>
                            </p>
                            <p className="text-xs text-neutral-400">
                              PNG, JPG or WEBP (Max 2MB)
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg text-sm"
                    placeholder="Or paste image URL here..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g. Summer Sale"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Page Location
                </label>
                <select
                  value={formData.pageLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, pageLocation: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="Home Page">Home Page</option>
                  <option value="Category Page">Category Page</option>
                  <option value="Product Detail">Product Detail</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Link URL (Optional)
                </label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                  placeholder="/category/fashion"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div className="flex-1 flex items-center mt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className={`flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors ${uploading ? "opacity-50" : ""}`}
                >
                  {editingBanner ? "Update Banner" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
