import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { uploadImage, uploadImages, uploadVideo } from "../../../services/api/uploadService";

import {
  validateImageFile,
  createImagePreview,
} from "../../../utils/imageUpload";
import {
  createProduct,
  updateProduct,
  getProductById,
  getShops,
  ProductVariation,
  Shop,
} from "../../../services/api/productService";
import {
  getCategories,
  getSubcategories,
  getSubSubCategories,
  Category,
  SubCategory,
  SubSubCategory,
} from "../../../services/api/categoryService";
import { getActiveTaxes, Tax } from "../../../services/api/taxService";
import { getBrands, Brand } from "../../../services/api/brandService";
import {
  getHeaderCategoriesPublic,
  HeaderCategory,
} from "../../../services/api/headerCategoryService";
import { useAuth } from "../../../context/AuthContext";

import DynamicCategoryFields from "../components/DynamicCategoryFields";
import GoogleMapPicker from "../../../components/common/GoogleMapPicker";

export default function SellerAddProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const isSuperSeller = user?.mobile === "9111966732";
  const sellerCatId = user?.category || user?.categoryId || (user?.categories && user?.categories[0]);
  const [categoryName, setCategoryName] = useState<string>("");


  const [formData, setFormData] = useState({
    productName: "",
    headerCategory: "",
    category: "",
    subcategory: "",
    subSubCategory: "",
    publish: "No",
    popular: "No",
    dealOfDay: "No",
    brand: "",
    tags: "",
    smallDescription: "",
    seoTitle: "",
    seoKeywords: "",
    seoImageAlt: "",
    seoDescription: "",
    price: "0",
    discPrice: "0",
    stock: "0",
    variationType: "",
    manufacturer: "",
    madeIn: "",
    tax: "",
    isReturnable: "No",
    maxReturnDays: "",
    fssaiLicNo: "",
    totalAllowedQuantity: "10",
    mainImageUrl: "",
    galleryImageUrls: [] as string[],
    productVideoUrl: "",
    isShopByStoreOnly: "No",

    shopId: "",
    // Category Specific Fields
    brandName: "",
    size: "",
    color: "",
    fabric: "",
    material: "",
    gender: "",
    quantityInsidePack: "",
    expiryDate: "",
    dishName: "",
    prepTime: "",
    ingredients: "",
    skinType: "",
    modelName: "",
    specifications: "",
    warranty: "",
    ageGroup: "",
    weight: "",
    frameType: "",
    lensType: "",
    power: "",
    rentAmount: "",
    securityDeposit: "",
    bhk: "",
    furnishingStatus: "",
    areaSize: "",
    contactNumber: "",
    vehicleModel: "",
    partNumber: "",
    serviceName: "",
    experience: "",
    availability: "",
    colorGroupId: "",
    // Hybrid Delivery Flow
    deliveryType: "quick",
    availablePincodes: "",
    latitude: "",
    longitude: "",
    radius: "40",
    shopAddress: "",
  });

  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>("");
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>(
    []
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

  const [uploadError, setUploadError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<SubSubCategory[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>(
    []
  );
  const [shops, setShops] = useState<Shop[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>([]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use Promise.allSettled to ensure one failing API doesn't break all others
        const results = await Promise.allSettled([
          getCategories(),
          getActiveTaxes(),
          getBrands(),
          getHeaderCategoriesPublic(),
          getShops(),
        ]);

        // Handle categories
        if (results[0].status === "fulfilled" && results[0].value.success) {
          const allCats = results[0].value.data;
          setCategories(allCats);
          // Auto-fill logic moved to separate useEffect for better reactivity with user profile
        }

        // Handle taxes
        if (results[1].status === "fulfilled" && results[1].value.success) {
          setTaxes(results[1].value.data);
        }

        // Handle brands
        if (results[2].status === "fulfilled" && results[2].value.success) {
          setBrands(results[2].value.data);
        }

        // Handle header categories
        if (results[3].status === "fulfilled") {
          const resultValue = results[3].value;
          // Robust check for both direct array and wrapped API response
          const headerCatRes = (resultValue as any).data || resultValue;
          
          if (headerCatRes && Array.isArray(headerCatRes)) {
            // Filter only Published header categories
            const published = headerCatRes.filter(
              (hc: HeaderCategory) => hc.status === "Published"
            );
            setHeaderCategories(published);
          }
        }

        // Handle shops (optional - for Shop By Store feature)
        if (results[4].status === "fulfilled" && results[4].value.success) {
          setShops(results[4].value.data);
        } else if (results[4].status === "rejected") {
          // Shops API failed - this is non-critical, log and continue
          console.warn("Failed to fetch shops (Shop By Store feature may be unavailable):", (results[4] as any).reason?.message || "Unknown error");
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await getProductById(id);
          if (response.success && response.data) {
            const product = response.data;
            setFormData({
              productName: product.productName,
              headerCategory:
                (product.headerCategoryId as any)?._id ||
                (product as any).headerCategoryId ||
                "",
              category:
                (product.category as any)?._id || product.categoryId || "",
              subcategory:
                (product.subcategory as any)?._id ||
                product.subcategoryId ||
                "",
              subSubCategory:
                (product.subSubCategory as any)?._id ||
                (product as any).subSubCategoryId ||
                "",
              publish: product.publish ? "Yes" : "No",
              popular: product.popular ? "Yes" : "No",
              dealOfDay: product.dealOfDay ? "Yes" : "No",
              brand: (product.brand as any)?._id || product.brandId || "",
              tags: product.tags.join(", "),
              smallDescription: product.smallDescription || "",
              seoTitle: product.seoTitle || "",
              seoKeywords: product.seoKeywords || "",
              seoImageAlt: product.seoImageAlt || "",
              seoDescription: product.seoDescription || "",
              price: product.price?.toString() || "0",
              discPrice: product.discPrice?.toString() || "0",
              stock: product.stock?.toString() || "0",
              variationType: product.variationType || "",
              manufacturer: product.manufacturer || "",
              madeIn: product.madeIn || "",
              tax: (product.tax as any)?._id || product.taxId || "",
              isReturnable: product.isReturnable ? "Yes" : "No",
              maxReturnDays: product.maxReturnDays?.toString() || "",
              fssaiLicNo: product.fssaiLicNo || "",
              totalAllowedQuantity:
                product.totalAllowedQuantity?.toString() || "10",
              mainImageUrl: product.mainImageUrl || product.mainImage || "",
              galleryImageUrls: product.galleryImageUrls || [],
              isShopByStoreOnly: (product as any).isShopByStoreOnly ? "Yes" : "No",
              shopId: (product as any).shopId?._id || (product as any).shopId || "",
              // Category Specific Fields
              brandName: product.brandName || "",
              size: product.size || "",
              color: product.color || "",
              fabric: product.fabric || "",
              material: product.material || "",
              gender: product.gender || "",
              quantityInsidePack: product.quantityInsidePack || "",
              expiryDate: product.expiryDate?.toString() || "",
              dishName: product.dishName || "",
              prepTime: product.prepTime || "",
              ingredients: product.ingredients || "",
              skinType: product.skinType || "",
              modelName: product.modelName || "",
              specifications: product.specifications || "",
              warranty: product.warranty || "",
              ageGroup: product.ageGroup || "",
              weight: product.weight || "",
              frameType: product.frameType || "",
              lensType: product.lensType || "",
              power: product.power || "",
              rentAmount: product.rentAmount?.toString() || "",
              securityDeposit: product.securityDeposit?.toString() || "",
              bhk: product.bhk || "",
              furnishingStatus: product.furnishingStatus || "",
              areaSize: product.areaSize || "",
              contactNumber: product.contactNumber || "",
              vehicleModel: product.vehicleModel || "",
              partNumber: product.partNumber || "",
              serviceName: product.serviceName || "",
              experience: product.experience || "",
              availability: product.availability || "",
              productVideoUrl: (product as any).productVideoUrl || "",
              colorGroupId: product.colorGroupId || "",
              deliveryType: (product as any).type || "quick",
              availablePincodes: (product as any).availablePincodes?.join(", ") || "",
              latitude: (product as any).latitude?.toString() || "",
              longitude: (product as any).longitude?.toString() || "",
              radius: (product as any).radius?.toString() || "40",
              shopAddress: (product as any).shopAddress || "",
            });
            if (product.category) {
              setCategoryName((product.category as any).name || "");
            }
            if (product.mainImageUrl || product.mainImage) {
              setMainImagePreview(
                product.mainImageUrl || product.mainImage || ""
              );
            }
            if (product.galleryImageUrls) {
              setGalleryImagePreviews(product.galleryImageUrls);
            }
            if ((product as any).productVideoUrl) {
              setVideoPreview((product as any).productVideoUrl);
              setFormData(prev => ({ ...prev, productVideoUrl: (product as any).productVideoUrl }));
            }
            if (product.variations) {
              setVariations(product.variations);
            }
          }
        } catch (err) {
          console.error("Error fetching product:", err);
          setUploadError("Failed to fetch product details");
        }
      };
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    const fetchSubs = async () => {
      if (formData.category) {
        try {
          const res = await getSubcategories(formData.category);
          if (res.success) setSubcategories(res.data);
        } catch (err) {
          console.error("Error fetching subcategories:", err);
        }
      } else {
        setSubcategories([]);
        // Clear subcategory selection when category is cleared
        setFormData((prev) => ({ ...prev, subcategory: "" }));
      }
    };
    // Only fetch if category changed and user is interacting (or initial load)
    // For edit mode, we want to load subcategories for the selected category
    if (formData.category) {
      fetchSubs();
    }
  }, [formData.category]);

  useEffect(() => {
    const fetchSubSubs = async () => {
      if (formData.subcategory) {
        try {
          const res = await getSubSubCategories(formData.subcategory);
          if (res.success) setSubSubCategories(res.data);
        } catch (err) {
          console.error("Error fetching sub-subcategories:", err);
        }
      } else {
        setSubSubCategories([]);
        setFormData((prev) => ({ ...prev, subSubCategory: "" }));
      }
    };
    if (formData.subcategory) {
      fetchSubSubs();
    }
  }, [formData.subcategory]);

  const getCategoryType = (name: string) => {
    const n = name.toLowerCase();
    if (
      n.includes("service") ||
      n.includes("electrician") ||
      n.includes("plumber") ||
      n.includes("carpenter") ||
      n.includes("beautician") ||
      n.includes("salon") ||
      n.includes("laundry")
    )
      return "service";
    if (n.includes("room") || n.includes("rent")) return "rental";
    return "product";
  };

  const categoryType = getCategoryType(categoryName);
  const isProduce = categoryName.toLowerCase().includes("fruit") || categoryName.toLowerCase().includes("vegetable");

  // Auto-sync header category when category changes
  useEffect(() => {
    if (formData.category) {
      const selectedCat = categories.find((cat: any) => (cat._id || cat.id) === formData.category);
      if (selectedCat) {
        setCategoryName(selectedCat.name);
        const headerId = (typeof selectedCat.headerCategoryId === 'string' ? selectedCat.headerCategoryId : selectedCat.headerCategoryId?._id)?.toString();
        if (headerId && formData.headerCategory !== headerId) {
          setFormData(prev => ({ ...prev, headerCategory: headerId }));
        }
      }
    }
  }, [formData.category, categories]);

  // Handle category and subcategory changes when header category changes
  useEffect(() => {
    if (formData.headerCategory) {
      // 1. Check if current category belongs to selected header
      const currentCategory = categories.find(
        (cat: any) => (cat._id || cat.id) === formData.category
      );

      const headerId = formData.headerCategory;
      const availableCats = categories.filter((cat: any) => {
        const catHeaderId = (typeof cat.headerCategoryId === 'string' ? cat.headerCategoryId : cat.headerCategoryId?._id)?.toString();
        return catHeaderId === headerId;
      });

      if (currentCategory) {
        const catHeaderId = (typeof currentCategory.headerCategoryId === "string"
          ? currentCategory.headerCategoryId
          : currentCategory.headerCategoryId?._id)?.toString();

        // If current category doesn't belong to selected header category, clear it
        if (catHeaderId !== headerId) {
          // IMPORTANT: If there's only ONE category in the new header, auto-select it instead of clearing
          if (availableCats.length === 1) {
            const cat = availableCats[0];
            const catId = (cat._id || cat.id)?.toString();
            setFormData((prev) => ({
              ...prev,
              category: catId,
              subcategory: "",
              subSubCategory: "",
            }));
            setCategoryName(cat.name);
          } else {
            setFormData((prev) => ({
              ...prev,
              category: "",
              subcategory: "",
              subSubCategory: "",
            }));
            setCategoryName("");
            setSubcategories([]);
            setSubSubCategories([]);
          }
        }
      } else {
        // No category selected yet - auto-select if only one available
        if (availableCats.length === 1) {
          const cat = availableCats[0];
          const catId = (cat._id || cat.id)?.toString();
          setFormData((prev) => ({
            ...prev,
            category: catId,
          }));
          setCategoryName(cat.name);
        }
      }
    } else {
      // Header category cleared - clear category and subcategory
      setFormData((prev) => ({
        ...prev,
        category: "",
        subcategory: "",
        subSubCategory: "",
      }));
      setCategoryName("");
      setSubcategories([]);
      setSubSubCategories([]);
    }
  }, [formData.headerCategory, categories]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMainImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || "Invalid image file");
      return;
    }

    setMainImageFile(file);
    setUploadError("");

    try {
      const preview = await createImagePreview(file);
      setMainImagePreview(preview);
    } catch (error) {
      setUploadError("Failed to create image preview");
    }
  };

  const handleGalleryImagesChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files
    const invalidFiles = files.filter((file) => !validateImageFile(file).valid);
    if (invalidFiles.length > 0) {
      setUploadError(
        "Some files are invalid. Please check file types and sizes."
      );
      return;
    }

    // Append new files to existing state
    setGalleryImageFiles((prev) => [...prev, ...files]);
    setUploadError("");

    try {
      const newPreviews = await Promise.all(
        files.map((file) => createImagePreview(file))
      );
      setGalleryImagePreviews((prev) => [...prev, ...newPreviews]);
    } catch (error) {
      setUploadError("Failed to create image previews");
    }

    // Reset file input value to allow selecting the same file again if needed
    e.target.value = "";
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImageFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/x-matroska"];
    if (!allowedVideoTypes.includes(file.type)) {
      setUploadError("Invalid video type. Allowed: MP4, MOV, AVI, WEBM, MKV");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setUploadError("Video file too large. Maximum size is 100MB.");
      return;
    }
    setVideoFile(file);
    setUploadError("");
    const objectUrl = URL.createObjectURL(file);
    setVideoPreview(objectUrl);
    e.target.value = "";
  };

  const removeVideo = () => {
    if (videoPreview && videoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview("");
    setFormData(prev => ({ ...prev, productVideoUrl: "" }));
  };

  const addVariation = () => {
    setVariations([
      ...variations,
      {
        title: "",
        price: parseFloat(formData.price) || 0,
        discPrice: parseFloat(formData.discPrice) || 0,
        stock: parseInt(formData.stock) || 0,
        status: "Available",
        sku: "",
      },
    ]);
  };

  const removeVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const handleVariationChange = (
    index: number,
    field: keyof ProductVariation,
    value: any
  ) => {
    const updatedVariations = [...variations];
    updatedVariations[index] = { ...updatedVariations[index], [field]: value };
    setVariations(updatedVariations);
  };




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");

    // Basic validation
    if (!formData.productName.trim()) {
      setUploadError("Please enter a product name.");
      return;
    }

    // Only validate categories if NOT shop by store only
    if (formData.isShopByStoreOnly !== "Yes") {
      if (!formData.headerCategory) {
        setUploadError("Please select a header category.");
        return;
      }
      if (!formData.category) {
        setUploadError("Please select a category.");
        return;
      }
    }

    // Delivery Type Validation
    if (formData.deliveryType === "quick" || formData.deliveryType === "both") {
      if (!formData.latitude || !formData.longitude) {
        setUploadError("Latitude and Longitude are required for Quick Commerce delivery.");
        return;
      }
    }
    
    if (formData.deliveryType === "ecommerce" || formData.deliveryType === "both") {
      if (!formData.availablePincodes.trim()) {
        setUploadError("Please provide at least one serviceable pincode for Ecommerce delivery.");
        return;
      }
    }

    setUploading(true);

    try {
      // Keep local copies so we don't rely on async state updates before submit
      let mainImageUrl = formData.mainImageUrl;
      let galleryImageUrls = [...formData.galleryImageUrls];

      // Upload main image if provided
      if (mainImageFile) {
        const mainImageResult = await uploadImage(
          mainImageFile,
          "laxmart/products"
        );
        mainImageUrl = mainImageResult.secureUrl;
        setFormData((prev) => ({
          ...prev,
          mainImageUrl,
        }));
      }

      // Upload gallery images if provided
      if (galleryImageFiles.length > 0) {
        const galleryResults = await uploadImages(
          galleryImageFiles,
          "laxmart/products/gallery"
        );
        galleryImageUrls = galleryResults.map((result) => result.secureUrl);
        setFormData((prev) => ({ ...prev, galleryImageUrls }));
      }

      // Upload product video if provided
      let productVideoUrl = formData.productVideoUrl;
      if (videoFile) {
        setVideoUploadProgress(10);
        const videoResult = await uploadVideo(videoFile, "laxmart/products/videos");
        productVideoUrl = videoResult.secureUrl;
        setVideoUploadProgress(100);
        setFormData((prev) => ({ ...prev, productVideoUrl }));
      }



      // Prepare product data for API
      const tagsArray = formData.tags
        ? formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
        : [];

      const productData = {
        productName: formData.productName,
        headerCategoryId: formData.headerCategory || undefined,
        categoryId: formData.category || undefined,
        subcategoryId: formData.subcategory || undefined,
        subSubCategoryId: formData.subSubCategory || undefined,
        brandId: formData.brand || undefined,
        publish: formData.publish === "Yes",
        popular: formData.popular === "Yes",
        dealOfDay: formData.dealOfDay === "Yes",
        seoTitle: formData.seoTitle || undefined,
        seoKeywords: formData.seoKeywords || undefined,
        seoImageAlt: formData.seoImageAlt || undefined,
        seoDescription: formData.seoDescription || undefined,
        smallDescription: formData.smallDescription || undefined,
        tags: tagsArray,
        manufacturer: formData.manufacturer || undefined,
        madeIn: formData.madeIn || undefined,
        taxId: formData.tax || undefined,
        isReturnable: formData.isReturnable === "Yes",
        maxReturnDays: formData.maxReturnDays
          ? parseInt(formData.maxReturnDays)
          : undefined,
        totalAllowedQuantity: parseInt(formData.totalAllowedQuantity || "10"),
        fssaiLicNo: formData.fssaiLicNo || undefined,
        mainImageUrl: mainImageUrl || undefined,
        galleryImageUrls,
        price: parseFloat(formData.price || "0"),
        discPrice: parseFloat(formData.discPrice || "0"),
        stock: parseInt(formData.stock || "0"),
        isShopByStoreOnly: formData.isShopByStoreOnly === "Yes",
        shopId: formData.isShopByStoreOnly === "Yes" && formData.shopId ? formData.shopId : undefined,
        productVideoUrl: productVideoUrl || undefined,
        variations: variations,
        variationType: formData.variationType || undefined,

        // Category Specific Fields
        brandName: formData.brandName || undefined,
        size: formData.size || undefined,
        color: formData.color || undefined,
        fabric: formData.fabric || undefined,
        material: formData.material || undefined,
        gender: formData.gender || undefined,
        quantityInsidePack: formData.quantityInsidePack || undefined,
        expiryDate: formData.expiryDate || undefined,
        dishName: formData.dishName || undefined,
        prepTime: formData.prepTime || undefined,
        ingredients: formData.ingredients || undefined,
        skinType: formData.skinType || undefined,
        modelName: formData.modelName || undefined,
        specifications: formData.specifications || undefined,
        warranty: formData.warranty || undefined,
        ageGroup: formData.ageGroup || undefined,
        weight: formData.weight || undefined,
        frameType: formData.frameType || undefined,
        lensType: formData.lensType || undefined,
        power: formData.power || undefined,
        rentAmount: formData.rentAmount ? parseFloat(formData.rentAmount) : undefined,
        securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : undefined,
        bhk: formData.bhk || undefined,
        furnishingStatus: formData.furnishingStatus || undefined,
        areaSize: formData.areaSize || undefined,
        contactNumber: formData.contactNumber || undefined,
        vehicleModel: formData.vehicleModel || undefined,
        partNumber: formData.partNumber || undefined,
        serviceName: formData.serviceName || undefined,
        experience: formData.experience || undefined,
        availability: formData.availability || undefined,
        colorGroupId: formData.colorGroupId || undefined,

        // Hybrid Delivery Configuration
        type: formData.deliveryType || "quick",
        availablePincodes: formData.availablePincodes 
          ? formData.availablePincodes.split(",").map(p => p.trim()).filter(Boolean) 
          : [],
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        radius: formData.radius ? parseFloat(formData.radius) : undefined,
        shopAddress: formData.shopAddress || undefined,
      };

      // Create or Update product via API
      let response;
      if (id) {
        response = await updateProduct(id as string, productData);
      } else {
        response = await createProduct(productData);
      }

      if (response.success) {
        setSuccessMessage(
          id ? "Product updated successfully!" : "Product added successfully!"
        );
        setTimeout(() => {
          // Reset form or navigate
          if (!id) {
            setFormData({
              productName: "",
              headerCategory: "",
              category: "",
              subcategory: "",
              subSubCategory: "",
              publish: "No",
              popular: "No",
              dealOfDay: "No",
              brand: "",
              tags: "",
              smallDescription: "",
              seoTitle: "",
              seoKeywords: "",
              seoImageAlt: "",
              seoDescription: "",
              price: "0",
              discPrice: "0",
              stock: "0",
              variationType: "",
              manufacturer: "",
              madeIn: "",
              tax: "",
              isReturnable: "No",
              maxReturnDays: "",
              fssaiLicNo: "",
              totalAllowedQuantity: "10",
              mainImageUrl: "",
              galleryImageUrls: [],
              productVideoUrl: "",
              isShopByStoreOnly: "No",

              shopId: "",
              // Category Specific Fields
              brandName: "",
              size: "",
              color: "",
              fabric: "",
              material: "",
              gender: "",
              quantityInsidePack: "",
              expiryDate: "",
              dishName: "",
              prepTime: "",
              ingredients: "",
              skinType: "",
              modelName: "",
              specifications: "",
              warranty: "",
              ageGroup: "",
              weight: "",
              frameType: "",
              lensType: "",
              power: "",
              rentAmount: "",
              securityDeposit: "",
              bhk: "",
              furnishingStatus: "",
              areaSize: "",
              contactNumber: "",
              vehicleModel: "",
              partNumber: "",
              serviceName: "",
              experience: "",
              availability: "",
              colorGroupId: "",
            });
            setVariations([]);
            setMainImageFile(null);
            setMainImagePreview("");
            setGalleryImageFiles([]);
            setGalleryImagePreviews([]);
            removeVideo();

          }
          setSuccessMessage("");
          // Navigate to product list
          navigate("/seller/product/list");
        }, 1500);
      } else {
        setUploadError(response.message || "Failed to create product");
      }
    } catch (error: any) {
      setUploadError(
        error.response?.data?.message ||
        error.message ||
        "Failed to upload images. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main Content */}
      <div className="flex-1">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {uploadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span className="font-medium">{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Section */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
              <h2 className="text-lg font-semibold">Product</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    placeholder="Enter Product Name"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Header Category{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="headerCategory"
                    value={formData.headerCategory}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white">
                    <option value="">Select Header Category</option>
                    {headerCategories.map((headerCat) => (
                        <option key={headerCat._id || (headerCat as any).id} value={headerCat._id || (headerCat as any).id}>
                          {headerCat.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-teal-600 mt-1 italic font-medium">
                    Select the business header for your product
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Category
                    {!formData.headerCategory && (
                      <span className="text-xs text-neutral-500 ml-1">
                        (Select header category first)
                      </span>
                    )}
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white">
                    <option value="">Select Category</option>
                    {categories
                      .filter(cat => {
                        if (!formData.headerCategory) return true;
                        const catHeaderId = (typeof cat.headerCategoryId === 'string' ? cat.headerCategoryId : cat.headerCategoryId?._id)?.toString().trim();
                        return catHeaderId === formData.headerCategory.toString().trim();
                      })
                      .map((cat: any) => (
                        <option
                          key={cat._id || cat.id}
                          value={cat._id || cat.id}>
                          {cat.name === 'Room Rent' ? 'Rent' : cat.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-teal-600 mt-1 italic font-medium">
                    Select any category for your product
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select SubCategory
                    {!formData.category && (
                      <span className="text-xs text-neutral-500 ml-1">
                        (Select category first)
                      </span>
                    )}
                  </label>
                  <select
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleChange}
                    disabled={!formData.category}
                    className={`w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${!formData.category
                      ? "bg-neutral-100 cursor-not-allowed text-neutral-500"
                      : "bg-white"
                      }`}>
                    <option value="">
                      {formData.category
                        ? "Select Subcategory"
                        : "Select Category First"}
                    </option>
                    {subcategories.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.subcategoryName || (sub as any).name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Removed Sub-SubCategory as requested */}
              </div>

              {categoryType === "product" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-100 pt-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Product Publish Or Unpublish?
                    </label>
                    <select
                      name="publish"
                      value={formData.publish}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white">
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  {/* Hidden Popular/Deal of the day for Sellers as they are admin features */}
                  {/* Brand is now handled in DynamicCategoryFields per category for better relevance */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Select Tags
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      placeholder="Select or create tags"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <p className="text-xs text-red-500 mt-1">
                      This will help for search
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic Category Fields */}
              {categoryName && (
                <div className="mt-6 pt-6 border-t border-neutral-100">
                  <h3 className="text-sm font-semibold text-teal-600 mb-4 uppercase tracking-wider">
                    {categoryName} Details
                  </h3>
                  <DynamicCategoryFields
                    categoryName={categoryName}
                    subcategoryName={(() => {
                      const selectedSub = subcategories.find(s => s._id === formData.subcategory);
                      return selectedSub ? (selectedSub.subcategoryName || (selectedSub as any).name || "") : "";
                    })()}
                    formData={formData}
                    handleChange={handleChange}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Product Small Description
                </label>
                <textarea
                  name="smallDescription"
                  value={formData.smallDescription}
                  onChange={handleChange}
                  placeholder="Enter Product Small Description"
                  rows={4}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                />
              </div>
            </div>
          </div>


          {/* Price & Stock Section */}
          {categoryType === "product" && (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
                <h2 className="text-lg font-semibold">Price & Stock</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Base Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="100"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Base Discounted Price (₹)
                    </label>
                    <input
                      type="number"
                      name="discPrice"
                      value={formData.discPrice}
                      onChange={handleChange}
                      placeholder="80"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Base Stock
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="50"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Variations Section */}
                <div className="mt-8 pt-6 border-t border-neutral-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold text-teal-700 flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                      </svg>
                      Product Variations
                    </h3>
                    <div className="text-xs text-neutral-500 italic">
                      Add variations like Size, Color, or Weight
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Variation Type
                      </label>
                      <input
                        type="text"
                        name="variationType"
                        value={formData.variationType}
                        onChange={handleChange}
                        placeholder="e.g., Size, Color, Pack Size, Weight"
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Color Group ID <span className="text-xs text-teal-600 font-normal ml-1">(Link colors together)</span>
                      </label>
                      <input
                        type="text"
                        name="colorGroupId"
                        value={formData.colorGroupId}
                        onChange={handleChange}
                        placeholder="e.g., iPhone-15-Pro-Colors"
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <p className="text-[10px] text-neutral-500 mt-1">
                        Use the same ID for different color products to show them in one selection.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {variations.length > 0 ? (
                      variations.map((variation, index) => (
                        <div key={index} className="p-4 border border-neutral-200 rounded-xl bg-neutral-50/50 relative group hover:border-teal-200 transition-colors">
                          <button
                            type="button"
                            onClick={() => removeVariation(index)}
                            className="absolute -top-2 -right-2 bg-white text-red-500 hover:text-red-700 w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center shadow-sm hover:shadow transition-all z-10"
                            title="Remove variation"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="lg:col-span-1">
                              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Variant Name</label>
                              <input
                                type="text"
                                value={variation.title}
                                onChange={(e) => handleVariationChange(index, "title", e.target.value)}
                                placeholder="XL / Red / 1kg"
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none text-sm bg-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Price (₹)</label>
                              <input
                                type="number"
                                value={variation.price}
                                onChange={(e) => handleVariationChange(index, "price", parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none text-sm bg-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Disc. Price (₹)</label>
                              <input
                                type="number"
                                value={variation.discPrice}
                                onChange={(e) => handleVariationChange(index, "discPrice", parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none text-sm bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Stock</label>
                              <input
                                type="number"
                                value={variation.stock}
                                onChange={(e) => handleVariationChange(index, "stock", parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none text-sm bg-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">SKU</label>
                              <input
                                type="text"
                                value={variation.sku}
                                onChange={(e) => handleVariationChange(index, "sku", e.target.value)}
                                placeholder="Optional"
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none text-sm bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/30">
                        <p className="text-sm text-neutral-500">No variations added yet.</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={addVariation}
                      className="w-full py-3 mt-2 border-2 border-dashed border-teal-200 text-teal-600 rounded-xl hover:bg-teal-50 hover:border-teal-400 transition-all font-semibold flex items-center justify-center gap-2 group"
                    >
                      <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </div>
                      Add Product Variation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center bg-teal-50 p-4 rounded-lg border border-teal-100">
            <div>
              <h3 className="text-sm font-semibold text-teal-900">Advanced Configuration</h3>
              <p className="text-xs text-teal-700">SEO, Marketing, and Regulatory details</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-4 py-2 bg-white border border-teal-200 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-medium text-sm shadow-sm"
            >
              {showAdvanced ? "Hide Advanced Content" : "Show Advanced Content"}
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-6">
              {categoryType === "product" && !isProduce && (
                <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                  <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
                    <h2 className="text-lg font-semibold">SEO Details</h2>
                  </div>
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">SEO Title</label>
                        <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} placeholder="Enter SEO Title" className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">SEO Keywords</label>
                        <input type="text" name="seoKeywords" value={formData.seoKeywords} onChange={handleChange} placeholder="Enter SEO Keywords" className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">SEO Description</label>
                      <textarea name="seoDescription" value={formData.seoDescription} onChange={handleChange} placeholder="Enter SEO Description" rows={3} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                    </div>
                  </div>
                </div>
              )}

              {categoryType === "product" && (
                <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                  <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
                    <h2 className="text-lg font-semibold">Regulatory & Logistics</h2>
                  </div>
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {!isProduce && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Manufacturer</label>
                            <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Made In</label>
                            <input type="text" name="madeIn" value={formData.madeIn} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Tax Rate (%)</label>
                        <select name="tax" value={formData.tax} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white">
                          <option value="">Select Tax</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Max Qty per Order</label>
                        <input type="number" name="totalAllowedQuantity" value={formData.totalAllowedQuantity} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
                      </div>
                    </div>

                    {(categoryName.toLowerCase().includes('food') || categoryName.toLowerCase().includes('grocery')) && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">FSSAI License Number</label>
                        <input type="text" name="fssaiLicNo" value={formData.fssaiLicNo} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg" placeholder="14-digit FSSAI No." />
                      </div>
                    )}

                    {/* Delivery Configuration Section */}
                    <div className="mt-8 pt-6 border-t border-neutral-100">
                      <h3 className="text-md font-semibold text-teal-700 mb-4 flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="15" height="13"></rect>
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                          <circle cx="5.5" cy="18.5" r="2.5"></circle>
                          <circle cx="18.5" cy="18.5" r="2.5"></circle>
                        </svg>
                        Delivery Configuration
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Delivery Type <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {["quick", "ecommerce", "both"].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, deliveryType: t }))}
                                className={`py-3 px-4 rounded-xl border-2 transition-all font-medium capitalize ${
                                  formData.deliveryType === t
                                    ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
                                    : "border-neutral-200 text-neutral-500 hover:border-neutral-300 bg-white"
                                }`}
                              >
                                {t === "both" ? "Hybrid (Both)" : t}
                              </button>
                            ))}
                          </div>
                        </div>

                        {(formData.deliveryType === "quick" || formData.deliveryType === "both") && (
                          <div className="md:col-span-2 p-4 bg-orange-50 border border-orange-100 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3">
                              <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Quick Commerce Active</div>
                            </div>
                            <h4 className="text-sm font-semibold text-orange-800 mb-4 flex items-center gap-2">
                               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                               Select Shop Location & Radius
                            </h4>
                            
                            <div className="mb-4">
                              <GoogleMapPicker 
                                initialLat={formData.latitude ? parseFloat(formData.latitude) : undefined}
                                initialLng={formData.longitude ? parseFloat(formData.longitude) : undefined}
                                initialRadius={formData.radius ? parseInt(formData.radius) : 10}
                                onLocationChange={(lat, lng, address) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    latitude: lat.toString(),
                                    longitude: lng.toString(),
                                    shopAddress: address
                                  }));
                                }}
                                onRadiusChange={(radius) => {
                                  setFormData(prev => ({ ...prev, radius: radius.toString() }));
                                }}
                              />
                            </div>
                            
                            {formData.shopAddress && (
                              <div className="mt-3 bg-white p-3 rounded-lg border border-orange-200 text-sm text-neutral-700">
                                <span className="font-bold text-orange-600 block text-xs uppercase mb-1">Detected Address:</span>
                                {formData.shopAddress}
                              </div>
                            )}
                            
                            <p className="mt-3 text-[10px] text-orange-700 italic">
                              * Customers within this radius will see your products for 10-minute delivery.
                            </p>
                          </div>
                        )}

                        {(formData.deliveryType === "ecommerce" || formData.deliveryType === "both") && (
                          <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <h4 className="text-sm font-semibold text-blue-800 mb-2">Ecommerce (National) Reach</h4>
                            <div>
                              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Serviceable Pincodes</label>
                              <textarea
                                name="availablePincodes"
                                value={formData.availablePincodes}
                                onChange={handleChange}
                                placeholder="302001, 302015, 110001 (separate with commas)"
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm h-20 resize-none"
                              />
                              <p className="mt-1 text-[10px] text-blue-700 italic">
                                * Enter all pincodes where national courier delivery is available for this product.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Images Section */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
              <h2 className="text-lg font-semibold">Add Images</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {uploadError}
                </div>
              )}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {successMessage}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Product Main Image <span className="text-red-500">*</span>
                </label>
                <label className="block border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors cursor-pointer">
                  {mainImagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={mainImagePreview}
                        alt="Main product preview"
                        className="max-h-48 mx-auto rounded-lg object-cover"
                      />
                      <p className="text-sm text-neutral-600">
                        {mainImageFile?.name}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setMainImageFile(null);
                          setMainImagePreview("");
                        }}
                        className="text-sm text-red-600 hover:text-red-700">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mx-auto mb-2 text-neutral-400">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <p className="text-sm text-neutral-600 font-medium">
                        Upload Main Image
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Max 5MB, JPG/PNG/WEBP
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Product Gallery Images (Optional)
                </label>
                <div className="block border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center bg-white">
                  {galleryImagePreviews.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {galleryImagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(index)}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 shadow-md transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                              title="Remove image">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        ))}
                        {/* Visual "Add More" Placeholder - Acts as Label for Input */}
                        <label
                          htmlFor="gallery-image-upload"
                          className="w-full h-32 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center text-neutral-400 hover:text-teal-600 hover:border-teal-500 hover:bg-teal-50 transition-all bg-neutral-50 cursor-pointer">
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mb-1">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                          <span className="text-xs font-semibold">Add Image</span>
                        </label>
                      </div>
                      <p className="text-sm text-neutral-600">
                        {galleryImageFiles.length} image(s) selected
                      </p>
                    </div>
                  ) : (
                    <label
                      htmlFor="gallery-image-upload"
                      className="cursor-pointer block w-full h-full">
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mx-auto mb-2 text-neutral-400">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <p className="text-sm text-neutral-600 font-medium">
                          Upload Other Product Images Here
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Max 5MB per image, up to 10 images
                        </p>
                      </div>
                    </label>
                  )}
                  <input
                    id="gallery-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryImagesChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Video Upload Section - Enabled for all categories */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="bg-teal-600 text-white px-4 sm:px-6 py-3 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                <h2 className="text-lg font-semibold">Product Video (Optional)</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Upload a short product demo video (MP4, MOV, AVI, WEBM, MKV) up to <strong>100MB</strong>. Videos help customers make better purchase decisions.
                  </p>
                </div>
                {videoPreview ? (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border border-neutral-200 bg-black">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full max-h-72 object-contain"
                        preload="metadata"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-neutral-600">
                        {videoFile ? (
                          <span>{videoFile.name} &ndash; {(videoFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                        ) : (
                          <span className="text-teal-700 font-medium">Existing video</span>
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                          <path d="M10 11v6"></path>
                          <path d="M14 11v6"></path>
                        </svg>
                        Remove Video
                      </button>
                    </div>
                    {videoFile && videoUploadProgress > 0 && videoUploadProgress < 100 && (
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${videoUploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-teal-500 hover:bg-teal-50 transition-colors cursor-pointer group">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
                          <polygon points="23 7 16 12 23 17 23 7"></polygon>
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-700 group-hover:text-teal-700 transition-colors">Click to upload a product video</p>
                        <p className="text-xs text-neutral-500 mt-1">MP4, MOV, AVI, WEBM, MKV &bull; Max 100MB</p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska"
                      onChange={handleVideoChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
              <h2 className="text-lg font-semibold">Shop by Store</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> If you select "Show in Shop by Store only", this product will only be visible in the Shop by Store section and will not appear on category pages, home page, or any other pages.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Show in Shop by Store only?
                  </label>
                  <select
                    name="isShopByStoreOnly"
                    value={formData.isShopByStoreOnly}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                {formData.isShopByStoreOnly === "Yes" && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Select Store <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="shopId"
                      value={formData.shopId}
                      onChange={handleChange}
                      required={formData.isShopByStoreOnly === "Yes"}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white">
                      <option value="">Select Store</option>
                      {shops.map((shop) => (
                        <option key={shop._id} value={shop._id}>
                          {shop.name}
                        </option>
                      ))}
                    </select>
                    {shops.length === 0 && (
                      <p className="text-xs text-neutral-500 mt-1">
                        No active stores available. Please contact admin to create stores.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pb-6">
            <button
              type="submit"
              disabled={uploading}
              className={`px-8 py-3 rounded-lg font-medium text-lg transition-colors shadow-sm ${uploading
                ? "bg-neutral-400 cursor-not-allowed text-white"
                : "bg-teal-600 hover:bg-teal-700 text-white"
                }`}>
              {uploading
                ? "Processing..."
                : id
                  ? "Update Product"
                  : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

