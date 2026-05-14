import { Request, Response } from "express";
import Product from "../../../models/Product";
import Category from "../../../models/Category";
import SubCategory from "../../../models/SubCategory";
import Seller from "../../../models/Seller";
import Shop from "../../../models/Shop";
import HeaderCategory from "../../../models/HeaderCategory";
import HomeSection from "../../../models/HomeSection";
import BestsellerCard from "../../../models/BestsellerCard";
import LowestPricesProduct from "../../../models/LowestPricesProduct";
import PromoStrip from "../../../models/PromoStrip";
import mongoose from "mongoose";
// import { cache } from "../../../utils/cache";
import { findSellersWithinRange } from "../../../utils/locationHelper";

// Helper function to fetch data for a home section based on its configuration
async function fetchSectionData(
  section: any,
  headerCategoryFound?: any
): Promise<any[]> {
  try {
    const { categories, subCategories, displayType, limit } = section;

    if (displayType === "subcategories" || displayType === "categories") {
      // If we are viewing a Header Category page (like Fashion), override the section to ONLY show top-level categories! E.g. no subcategories!
      if (headerCategoryFound) {
        const dynamicCats = await Category.find({
          headerCategoryId: headerCategoryFound._id,
          status: "Active",
          parentId: null
        }).select("name image slug order").sort({ order: 1 }).limit(100).lean();

        return dynamicCats.map((c: any) => {
          const cSlug = c.slug || c._id.toString();
          return {
            id: c._id.toString(),
            categoryId: cSlug,
            name: c.name,
            image: c.image || "",
            slug: cSlug,
            type: "category"
          };
        });
      }

      let results: any[] = [];
      let existingIds: string[] = [];
      let existingSlugs: string[] = [];

      // 1. If displayType === "categories" and specific categories selected
      if (displayType === "categories" && categories && categories.length > 0) {
        const categoryIds = categories.map((cat: any) => cat._id || cat);
        const fetchedCategories = await Category.find({
          _id: { $in: categoryIds },
          status: "Active",
        })
          .select("name image slug order")
          .sort({ order: 1 })
          .limit(100)
          .lean();

        fetchedCategories.forEach((c: any) => {
          const cSlug = c.slug || c._id.toString();
          existingIds.push(c._id.toString());
          existingSlugs.push(cSlug.toLowerCase());
          results.push({
            id: c._id.toString(),
            categoryId: cSlug,
            name: c.name,
            image: c.image || "",
            slug: cSlug,
            type: "category",
          });
        });
      }

      // 2. If displayType === "subcategories"
      if (displayType === "subcategories") {
        let subcategoryQuery: any = {};
        let specificIds: string[] = [];
        let parentCategoryIds: string[] = [];

        if (subCategories && subCategories.length > 0) {
          specificIds = subCategories
            .map((sub: any) => (sub ? (sub._id || sub).toString() : null))
            .filter((id: any) => id);

          if (specificIds.length > 0) {
            subcategoryQuery._id = { $in: specificIds };
          }
        }

        if (specificIds.length === 0 && categories && categories.length > 0) {
          parentCategoryIds = categories
            .map((cat: any) => (cat ? (cat._id || cat).toString() : null))
            .filter((id: any) => id);

          if (parentCategoryIds.length > 0) {
            subcategoryQuery.category = { $in: parentCategoryIds };
          }
        }

        if (Object.keys(subcategoryQuery).length > 0) {
          const subcategories = await SubCategory.find(subcategoryQuery)
            .select("name image order category slug")
            .sort({ order: 1 })
            .limit(100)
            .lean();

          subcategories.forEach((sub: any) => {
            const sSlug = (sub as any).slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            if (!existingIds.includes(sub._id.toString())) {
              existingIds.push(sub._id.toString());
              existingSlugs.push(sSlug.toLowerCase());
              results.push({
                id: sub._id.toString(),
                subcategoryId: sub._id.toString(),
                categoryId: sub.category?.toString() || "",
                name: sub.name,
                image: sub.image || "",
                slug: sSlug,
                type: "subcategory",
              });
            }
          });
        }

        if (specificIds.length > 0) {
          const missingIds = specificIds.filter(id => !existingIds.includes(id));
          if (missingIds.length > 0) {
            const foundCategories = await Category.find({ _id: { $in: missingIds }, status: "Active" })
              .select("name image slug order")
              .lean();

            foundCategories.forEach((c: any) => {
              const cSlug = c.slug || c._id.toString();
              existingIds.push(c._id.toString());
              existingSlugs.push(cSlug.toLowerCase());
              results.push({
                id: c._id.toString(),
                categoryId: cSlug,
                name: c.name,
                image: c.image || "",
                slug: cSlug,
                type: "category",
              });
            });
          }
        } else if (parentCategoryIds.length > 0) {
          const childCategories = await Category.find({
            parentId: { $in: parentCategoryIds },
            status: "Active"
          })
            .select("name image slug parentId order")
            .sort({ order: 1 })
            .limit(100)
            .lean();

          childCategories.forEach((c: any) => {
            const cSlug = c.slug || c._id.toString();
            if (!existingIds.includes(c._id.toString())) {
              existingIds.push(c._id.toString());
              existingSlugs.push(cSlug.toLowerCase());
              results.push({
                id: c._id.toString(),
                categoryId: cSlug,
                name: c.name,
                image: c.image || "",
                slug: cSlug,
                type: "category",
              });
            }
          });
        }
      }

      // CRITICAL DYNAMIC BEHAVIOR: Always fetch all active top-level Categories under that header category so admin additions appear instantly!
      const targetHeaderId = section.targetHeaderCategory;
      if (targetHeaderId) {
        const dynamicCats = await Category.find({
          headerCategoryId: targetHeaderId,
          status: "Active",
          parentId: null
        }).select("name image slug order").sort({ order: 1 }).limit(100).lean();

        dynamicCats.forEach((c: any) => {
          const cSlug = c.slug || c._id.toString();
          if (!existingIds.includes(c._id.toString()) && !existingSlugs.includes(cSlug.toLowerCase())) {
            existingIds.push(c._id.toString());
            existingSlugs.push(cSlug.toLowerCase());
            results.push({
              id: c._id.toString(),
              categoryId: cSlug,
              name: c.name,
              image: c.image || "",
              slug: cSlug,
              type: "category"
            });
          }
        });
      }

      return results;
    }
    // If displayType is "products", fetch products
    if (displayType === "products") {
      const query: any = {
        status: "Active",
        publish: true,
        // Exclude shop-by-store-only products from home sections
        $or: [
          { isShopByStoreOnly: { $ne: true } },
          { isShopByStoreOnly: { $exists: false } },
        ],
      };

      // We fetch these irrespective of location radius to show preview images on home page
      // Location validation still happens at cart/order level
      // Filter by approved sellers only
      const approvedSellers = await Seller.find({ status: "Approved" }).select("_id");
      if (approvedSellers.length > 0) {
        query.seller = { $in: approvedSellers.map((s) => s._id) };
      } else {
        return []; // No approved sellers means no products for this section
      }

      if (categories && categories.length > 0) {
        const categoryIds = categories
          .map((cat: any) => (cat ? cat._id || cat : null))
          .filter((id: any) => id);

        if (categoryIds.length > 0) {
          query.category = { $in: categoryIds };
        }
      }

      if (subCategories && subCategories.length > 0) {
        const subCategoryIds = subCategories
          .map((sub: any) => (sub ? sub._id || sub : null))
          .filter((id: any) => id);

        if (subCategoryIds.length > 0) {
          query.subcategory = { $in: subCategoryIds };
        }
      }

      // If no categories or subcategories are specified, but section has a target header category, filter by it
      if (!query.category && !query.subcategory && section.targetHeaderCategory) {
        query.headerCategoryId = section.targetHeaderCategory;
        console.log(`[fetchSectionData] Filtering by targetHeaderCategory: ${section.targetHeaderCategory} for section: ${section.title}`);
      }

      const products = await Product.find(query)
        .sort({ createdAt: -1 }) // Show newest items first
        .limit(limit || 8)
        .select("productName mainImage price mrp discount rating reviewsCount pack seller")
        .lean();

      return products.map((p: any) => {
        // Check if the product's seller is within range - Forced to true as per user request
        const isAvailable = true;

        return {
          id: p._id.toString(),
          productId: p._id.toString(),
          name: p.productName,
          productName: p.productName,
          image: p.mainImage,
          mainImage: p.mainImage,
          price: p.price,
          discount:
            p.discount ||
            (p.mrp && p.price
              ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
              : 0),
          productImages: p.mainImage ? [p.mainImage] : [],
          rating: p.rating || 0,
          reviewsCount: p.reviewsCount || 0,
          reviews: p.reviewsCount || 0,
          pack: p.pack || "",
          type: "product",
          isAvailable,
          seller: p.seller,
        };
      });
    }

    // If displayType is "banners", return the banners from the section itself
    if (displayType === "banners") {
      return section.bannerData || [];
    }

    return [];
  } catch (error) {
    console.error("Error fetching section data:", error);
    return [];
  }
}

// Get Home Page Content
export const getHomeContent = async (req: Request, res: Response) => {
  const { headerCategorySlug, latitude, longitude } = req.query; // Get header category slug and location from query params

  try {
    // Find sellers within user's location range
    const userLat = latitude ? parseFloat(latitude as string) : null;
    const userLng = longitude ? parseFloat(longitude as string) : null;

    let nearbySellerIds: mongoose.Types.ObjectId[] = [];
    if (userLat !== null && userLng !== null) {
      nearbySellerIds = await findSellersWithinRange(userLat, userLng);
    }
    
    // Fallback: If no nearby sellers are found (or no coordinates provided), fallback to all approved sellers so products are ALWAYS shown
    if (nearbySellerIds.length === 0) {
      const sellers = await Seller.find({ status: "Approved" }).select("_id");
      nearbySellerIds = sellers.map(s => s._id as mongoose.Types.ObjectId);
    }

    // 1. Featured / Bestsellers - Filter by header category if provided
    const bestsellerQuery: any = { isActive: true };
    if (headerCategorySlug && headerCategorySlug !== "all") {
      const headerCategory = await HeaderCategory.findOne({
        slug: (headerCategorySlug as string).toLowerCase().trim(),
        status: "Published",
      }).select("_id");
      
      if (headerCategory) {
        bestsellerQuery.headerCategoryId = headerCategory._id;
      } else {
        // Fallback: check if it's a regular category slug
        const cat = await Category.findOne({ 
          slug: (headerCategorySlug as string).toLowerCase().trim(),
          status: "Active" 
        }).select("_id");
        if (cat) bestsellerQuery.category = cat._id;
      }
    }

    const bestsellerCards = await BestsellerCard.find(bestsellerQuery)
      .populate("category", "name slug image")
      .sort({ order: 1 })
      .limit(6)
      .lean();

    // For each bestseller card, get 4 products from the associated category
    const bestsellers = await Promise.all(
      bestsellerCards.map(async (card: any) => {
        const categoryId = card.category?._id || card.category;
        if (!categoryId) return null;

        const productQuery: any = {
          category: categoryId,
          status: "Active",
          publish: true,
          seller: { $in: nearbySellerIds }
        };

        const categoryProducts = await Product.find(productQuery)
          .select("productName mainImage galleryImages")
          .sort({ createdAt: -1 })
          .limit(4)
          .lean();

        const productImages: string[] = [];
        categoryProducts.forEach((product: any) => {
          if (productImages.length < 4 && product.mainImage) {
            productImages.push(product.mainImage);
          }
        });

        if (productImages.length < 4) {
          categoryProducts.forEach((product: any) => {
            if (
              productImages.length < 4 &&
              product.galleryImages &&
              product.galleryImages.length > 0
            ) {
              productImages.push(product.galleryImages[0]);
            }
          });
        }

        while (productImages.length < 4 && productImages[0]) {
          productImages.push(productImages[0]);
        }

        return {
          id: card._id.toString(),
          categoryId: categoryId.toString(),
          name: card.name,
          productImages: productImages.slice(0, 4),
          productCount: categoryProducts.length,
        };
      })
    ).then(results => results.filter(Boolean));

    // 2. Lowest Prices Products - Admin-selected products
    const lowestPricesProductsQuery: any = {
      isActive: true,
    };

    const lowestPricesProducts = await LowestPricesProduct.find(
      lowestPricesProductsQuery
    )
      .populate({
        path: "product",
        select:
          "productName mainImage price mrp discount status publish category subcategory seller",
        match: {
          status: "Active",
          publish: true,
          seller: { $in: nearbySellerIds }
        },
      })
      .sort({ order: 1 })
      .lean();

    const validLowestPricesProducts = lowestPricesProducts
      .filter((item: any) => item.product !== null)
      .map((item: any) => {
        const product = item.product;
        const isAvailable = true;

        return {
          id: product._id.toString(),
          _id: product._id.toString(),
          productName: product.productName,
          name: product.productName,
          mainImage: product.mainImage,
          imageUrl: product.mainImage,
          price: product.price,
          mrp: product.mrp || product.price,
          discount: product.discount || (product.mrp && product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0),
          categoryId: product.category?.toString() || "",
          subcategory: product.subcategory?.toString() || "",
          status: product.status,
          publish: product.publish,
          isAvailable,
          seller: product.seller,
        };
      });

    // 3. Categories for Tiles
    const categoriesRootQuery: any = {
      status: "Active",
      parentId: null,
    };
    const categories = await Category.find(categoriesRootQuery)
      .select("name image icon color slug")
      .sort({ order: 1 });

    // 4. Shop By Store
    const shopDocuments = await Shop.find({ isActive: true })
      .populate("category", "name slug")
      .sort({ order: 1, createdAt: -1 })
      .limit(8)
      .lean();

    const shops = await Promise.all(
      shopDocuments.map(async (shop: any) => {
        let productImages: string[] = [];
        if (shop.products && shop.products.length > 0) {
          const shopProducts = await Product.find({
            _id: { $in: shop.products.slice(0, 4) },
            status: "Active",
            publish: true,
          })
            .select("mainImage")
            .lean();
          productImages = shopProducts.map((p: any) => p.mainImage).filter(Boolean);
        }

        // Check if shop is open
        let isOpen = true;
        if (shop.openingTime && shop.closingTime) {
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          isOpen = currentTime >= shop.openingTime && currentTime <= shop.closingTime;
        }

        return {
          id: shop.storeId || shop._id.toString(),
          name: shop.name,
          image: shop.image,
          productImages,
          slug: shop.storeId || shop._id.toString(),
          category: shop.category,
          productIds: shop.products?.map((p: any) => p.toString()) || [],
          bgColor: shop.bgColor || "bg-neutral-50",
          isOpen,
          openingTime: shop.openingTime,
          closingTime: shop.closingTime
        };
      })
    );

    // 5. Trending
    const trending = (await Category.find({ status: "Active" }).limit(5)).map((c) => ({
      id: c._id,
      name: c.name,
      image: c.image || "",
      type: "category",
    }));

    // 6. Cooking Ideas
    const foodProducts = await Product.find({ status: "Active", publish: true })
      .limit(3)
      .select("productName mainImage");

    const cookingIdeas = foodProducts.map((p) => ({
      id: p._id,
      title: p.productName,
      image: p.mainImage,
      productId: p._id,
    }));

    // 8. Promo Cards - Strict Filtering by Header Category
    let promoCards: any[] = [];
    if (headerCategorySlug && headerCategorySlug !== "all") {
      const headerCategory = await HeaderCategory.findOne({
        slug: (headerCategorySlug as string).toLowerCase().trim(),
        status: "Published",
      }).lean();

      let targetHeaderId = headerCategory ? headerCategory._id : null;

      const promoCardQuery: any = {
        status: "Active",
        parentId: null,
      };

      if (targetHeaderId) {
        promoCardQuery.headerCategoryId = targetHeaderId;
      } else {
        promoCardQuery.slug = (headerCategorySlug as string).toLowerCase().trim();
      }

      const categoriesWithHeaderCategory = await Category.find(promoCardQuery)
        .populate("headerCategoryId", "name status")
        .sort({ order: 1 })
        .limit(100)
        .lean();

      const combinedCategories = categoriesWithHeaderCategory.map(c => ({
        _id: c._id,
        name: c.name,
        slug: c.slug || c._id.toString(),
        isSub: false
      }));

      // Deduplicate by slug/id
      const seenPromoSlugs = new Set<string>();
      const uniqueCombined = combinedCategories.filter(item => {
        const key = item.slug.toLowerCase();
        if (seenPromoSlugs.has(key)) return false;
        seenPromoSlugs.add(key);
        return true;
      });

      promoCards = await Promise.all(
        uniqueCombined.map(async (item: any) => {
          let subcategoryImages: string[] = [];
          if (item.isSub) {
            subcategoryImages = item.image ? [item.image] : [];
          } else {
            const childCategories = await Category.find({
              parentId: item._id,
              status: "Active",
            })
              .select("name image _id")
              .sort({ order: 1 })
              .limit(4)
              .lean();
            subcategoryImages = childCategories.map((child: any) => child.image).filter(Boolean).slice(0, 4);
          }

          return {
            id: item._id.toString(),
            badge: "Up to 55% OFF",
            title: item.name,
            categoryId: item._id.toString(),
            slug: item.slug,
            bgColor: "bg-yellow-50",
            subcategoryImages,
          };
        })
      );
    }

    // 9. Dynamic Home Sections
    let homeSectionQuery: any = { isActive: true };
    let fallbackCategoryProducts: any[] = [];
    let isRegularCategory = false;
    let headerCategoryFound: any = null;

    if (headerCategorySlug && headerCategorySlug !== "all") {
      headerCategoryFound = await HeaderCategory.findOne({
        slug: (headerCategorySlug as string).toLowerCase().trim(),
        status: "Published",
      }).select("_id name");

      if (headerCategoryFound) {
        homeSectionQuery.pageLocation = "Header Category Page";
        homeSectionQuery.targetHeaderCategory = headerCategoryFound._id;
      } else {
        const regularCategory = await Category.findOne({
          slug: (headerCategorySlug as string).toLowerCase().trim(),
          status: "Active"
        }).select("_id name");

        if (regularCategory) {
          isRegularCategory = true;
          const prodQuery: any = { category: regularCategory._id, status: "Active", publish: true };
          const rawProducts = await Product.find(prodQuery).sort({ createdAt: -1 }).limit(20).lean();

          fallbackCategoryProducts = rawProducts.map((p: any) => ({
            id: p._id.toString(),
            productId: p._id.toString(),
            name: p.productName,
            productName: p.productName,
            image: p.mainImage,
            mainImage: p.mainImage,
            price: p.price,
            discount: p.discount || (p.mrp && p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0),
            rating: p.rating || 0,
            isAvailable: true,
            seller: p.seller,
          }));
          homeSectionQuery = { _id: { $exists: false } };
        } else {
          homeSectionQuery = { _id: { $exists: false } };
        }
      }
    } else {
      homeSectionQuery.pageLocation = "Home Page";
    }

    const homeSections = await HomeSection.find(homeSectionQuery)
      .populate("categories", "name slug image")
      .populate("subCategories", "name")
      .sort({ order: 1 })
      .lean();

    const dynamicSections = await Promise.all(
      homeSections.map(async (section: any) => {
        const sectionData = await fetchSectionData(section, headerCategoryFound);
        return {
          id: section._id.toString(),
          title: section.title,
          slug: section.slug,
          displayType: section.displayType,
          bannerData: section.displayType === "banners" ? section.bannerData : undefined,
          columns: section.columns,
          data: sectionData,
        };
      })
    );

    // Dynamic fallback for Header Category if no sections found
    if (headerCategoryFound && dynamicSections.length === 0) {
      console.log(`[getHomeContent] No sections for headerCategory: ${headerCategorySlug}, fetching products directly.`);
      
      // Find all categories linked to this header category
      const categoriesInHeader = await Category.find({ 
        headerCategoryId: headerCategoryFound._id,
        status: "Active",
        parentId: null
      }).select("_id name image slug order").sort({ order: 1 }).lean();
      
      const categoryIds = categoriesInHeader.map(c => c._id);

      const fallbackTiles: any[] = [];
      categoriesInHeader.forEach(c => {
        const cSlug = c.slug || c._id.toString();
        fallbackTiles.push({
          id: c._id.toString(),
          categoryId: cSlug,
          name: c.name,
          image: c.image || "",
          slug: cSlug,
          type: "category"
        });
      });

      if (fallbackTiles.length > 0) {
        dynamicSections.push({
          id: "header-category-tiles",
          title: `Explore Categories`,
          slug: "header-category-tiles",
          displayType: "subcategories",
          bannerData: undefined,
          columns: 4,
          data: fallbackTiles
        });
      }
      
      const prodQuery: any = { 
        $or: [
          { headerCategoryId: headerCategoryFound._id },
          { category: { $in: categoryIds } }
        ],
        status: "Active", 
        publish: true
      };
      
      const rawProducts = await Product.find(prodQuery).sort({ createdAt: -1 }).limit(40).lean();
      
      if (rawProducts.length > 0) {
        dynamicSections.push({
          id: "header-category-products",
          title: `Discover ${headerCategoryFound.name}`,
          slug: "header-category-products",
          displayType: "products",
          bannerData: undefined,
          columns: 4,
          data: rawProducts.map((p: any) => ({
            id: p._id.toString(),
            productId: p._id.toString(),
            name: p.productName,
            productName: p.productName,
            image: p.mainImage,
            mainImage: p.mainImage,
            price: p.price,
            discount: p.discount || (p.mrp && p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0),
            rating: p.rating || 0,
            isAvailable: true,
            seller: p.seller,
          })),
        });
      }
    }

    if (isRegularCategory && fallbackCategoryProducts.length > 0) {
      dynamicSections.push({
        id: "category-products",
        title: `Explore ${headerCategorySlug}`,
        slug: "category-products",
        displayType: "products",
        bannerData: undefined,
        columns: 4,
        data: fallbackCategoryProducts,
      });
    }

    // 10. PromoStrip
    const promoStripDoc = await PromoStrip.findOne({
      headerCategorySlug: (headerCategorySlug as string || "all").toLowerCase().trim(),
      isActive: true,
    })
      .populate("categoryCards.categoryId", "name slug image")
      .populate({
        path: "featuredProducts",
        match: {
          status: "Active",
          publish: true,
          seller: { $in: nearbySellerIds }
        }
      })
      .sort({ order: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        bestsellers,
        lowestPrices: validLowestPricesProducts,
        categories,
        homeSections: dynamicSections,
        shops,
        promoCards: promoCards.length > 0 ? promoCards : [],
        promoStrip: promoStripDoc || null,
        trending,
        cookingIdeas,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching home content",
      error: error.message,
    });
  }
};

// Get Products for a specific "Store" (Campaign/Collection)
// Fetch products based on store configuration from database
export const getStoreProducts = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { latitude, longitude } = req.query; // User location for filtering
    let query: any = {
      status: "Active",
      publish: true,
    };

    console.log(`[getStoreProducts] Looking for shop with storeId: ${storeId}`);

    // Build shop query - only include _id if storeId is a valid ObjectId
    const shopQuery: any = { isActive: true };
    if (mongoose.Types.ObjectId.isValid(storeId)) {
      shopQuery.$or = [
        { storeId: storeId.toLowerCase() },
        { _id: new mongoose.Types.ObjectId(storeId) }
      ];
    } else {
      shopQuery.storeId = storeId.toLowerCase();
    }

    // Find the shop by storeId or _id
    const shop = await Shop.findOne(shopQuery)
      .populate("category", "_id name slug image")
      .populate("subCategory", "_id name")
      .lean();

    console.log(`[getStoreProducts] Shop found:`, shop ? { name: shop.name, productsCount: shop.products?.length || 0, category: shop.category, image: shop.image } : 'NOT FOUND');

    let shopData: any = null;
    let isSellerStore = false;

    if (shop) {
      shopData = {
        name: shop.name,
        image: shop.image,
        description: shop.description || '',
        category: shop.category,
      };

      // Convert products array to ObjectIds if needed
      // When using .lean(), products array contains ObjectIds directly
      let productIds: mongoose.Types.ObjectId[] = [];
      if (shop.products && shop.products.length > 0) {
        productIds = shop.products.map((p: any) => {
          // Handle different formats: ObjectId, string, or object with _id
          if (mongoose.Types.ObjectId.isValid(p)) {
            return typeof p === 'string' ? new mongoose.Types.ObjectId(p) : p;
          }
          return p._id ? (typeof p._id === 'string' ? new mongoose.Types.ObjectId(p._id) : p._id) : p;
        }).filter(Boolean);
      }

      console.log(`[getStoreProducts] Shop has ${productIds.length} products assigned`);

      // Get shop ID for filtering
      const shopId = (shop as any)._id;

      // If shop has specific products assigned, use those
      if (productIds.length > 0) {
        query = {
          status: "Active",
          publish: true,
          _id: { $in: productIds }
        };
        console.log(`[getStoreProducts] Filtering by assigned product IDs: ${productIds.length} products`);
      }
      // Otherwise, filter by shopId and category/subcategory
      else {
        const orConditions: any[] = [{ shopId: shopId }];
        if (shop.category) {
          const categoryId = (shop.category as any)._id || (shop.category as any);
          if (shop.subCategory) {
            const subCategoryId = (shop.subCategory as any)._id || (shop.subCategory as any);
            orConditions.push({ category: categoryId, subcategory: subCategoryId });
          } else {
            orConditions.push({ category: categoryId });
          }
        }

        query = {
          status: "Active",
          publish: true,
          $or: orConditions
        };
        console.log(`[getStoreProducts] Filtering by shopId or category`);
      }
    } else {
      // Not a campaign shop. Check if it's a Seller Storefront
      let sellerDoc: any = null;
      if (mongoose.Types.ObjectId.isValid(storeId)) {
        sellerDoc = await Seller.findById(storeId).lean();
      }

      if (!sellerDoc) {
        // Match by slugified storeName
        const sellers = await Seller.find({ status: "Approved" }).lean();
        sellerDoc = sellers.find(s => {
          const slugified = s.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          return slugified === storeId.toLowerCase();
        });
      }

      if (sellerDoc) {
        isSellerStore = true;
        console.log(`[getStoreProducts] Found seller store: ${sellerDoc.storeName}`);

        // Fetch categories dynamically for this seller's products
        const sellerProductCats = await Product.distinct("category", {
          status: "Active",
          publish: true,
          $or: [
            { seller: sellerDoc._id },
            { sellerId: sellerDoc._id }
          ]
        });
        const sellerCategories = await Category.find({
          _id: { $in: sellerProductCats },
          status: "Active"
        }).select("name slug image icon").lean();

        // Check if any product of this seller is Quick Commerce eligible
        const hasQuickProducts = await Product.exists({
          status: "Active",
          publish: true,
          isQuickEligible: true,
          $or: [
            { seller: sellerDoc._id },
            { sellerId: sellerDoc._id }
          ]
        });

        const banners = sellerDoc.storeBanner ? [sellerDoc.storeBanner] : [];
        if (sellerDoc.logo && banners.length === 0) {
          banners.push(sellerDoc.logo);
        }
        // Fallback banner if empty
        if (banners.length === 0) {
          banners.push("https://res.cloudinary.com/dummyimage/600x400/000/fff&text=Welcome+To+Store");
        }

        shopData = {
          name: sellerDoc.storeName,
          image: sellerDoc.storeBanner || sellerDoc.logo || '',
          description: sellerDoc.storeDescription || 'Premier seller storefront',
          rating: (sellerDoc as any).rating || 4.8, // Elite default storefront rating
          city: sellerDoc.city || '',
          deliveryType: hasQuickProducts ? 'Same-City Quick Delivery' : 'Standard Shipping',
          isQuickEligible: !!hasQuickProducts,
          isSellerStore: true,
          sellerId: sellerDoc._id.toString(),
          banners,
          storeCategories: sellerCategories
        };

        // For direct seller store, show all approved/published products belonging to this seller
        query = {
          status: "Active",
          publish: true,
          $or: [
            { seller: sellerDoc._id },
            { sellerId: sellerDoc._id }
          ]
        };
      } else {
        // Fallback: try to match by category name (legacy support)
        const categoryId = await getCategoryIdByName(storeId);
        if (categoryId) {
          query.category = categoryId;
          // Try to get category details for shop data
          const category = await Category.findById(categoryId).select("name slug image").lean();
          if (category) {
            shopData = {
              name: category.name,
              image: category.image || '',
              description: '',
              category: category,
            };
          }
        } else {
          // No matching shop, seller, or category found
          return res.status(200).json({
            success: true,
            data: [],
            shop: null,
            message: "Store not found"
          });
        }
      }
    }

    // Location-based filtering: Only show products from sellers within user's range
    const userLat = latitude ? parseFloat(latitude as string) : null;
    const userLng = longitude ? parseFloat(longitude as string) : null;

    console.log(`[getStoreProducts] User location: lat=${userLat}, lng=${userLng}`);

    if (isSellerStore) {
      // Bound to a single explicit seller storefront, skip nearby seller checks
      console.log(`[getStoreProducts] Seller storefront loaded directly.`);
    } else if (userLat && userLng && !isNaN(userLat) && !isNaN(userLng)) {
      const nearbySellerIds = await findSellersWithinRange(userLat, userLng);
      console.log(`[getStoreProducts] Found ${nearbySellerIds.length} sellers within range`);

      const approvedSellers = await Seller.find({ status: "Approved" }).select("_id");
      const approvedIds = approvedSellers.map(s => s._id.toString());
      
      let validSellers = nearbySellerIds.filter(id => approvedIds.includes(id.toString()));
      
      if (validSellers.length === 0) {
        console.log(`[getStoreProducts] No sellers found within local range of customer. Falling back to show all approved sellers.`);
        validSellers = approvedSellers.map(s => s._id);
      }
      
      query.seller = { $in: validSellers };
    } else {
      // If no location provided, still show all products (but only from approved sellers)
      console.log(`[getStoreProducts] No location provided, showing all matching products from approved sellers`);
      const approvedSellers = await Seller.find({ status: "Approved" }).select("_id");
      query.seller = { $in: approvedSellers.map(s => s._id) };
    }

    console.log(`[getStoreProducts] Final query:`, JSON.stringify(query, null, 2));

    const products = await Product.find(query)
      .populate("category", "name icon image")
      .populate("subcategory", "name")
      .populate("brand", "name")
      .populate("seller", "storeName")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean({ virtuals: true });

    const total = await Product.countDocuments(query);

    console.log(`[getStoreProducts] Found ${total} products matching query, returning ${products.length}`);

    return res.status(200).json({
      success: true,
      data: products.map(p => ({ ...p, isAvailable: true })),
      shop: shopData,
      pagination: {
        page: 1,
        limit: 50,
        total,
        pages: Math.ceil(total / 50),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching store products",
      error: error.message,
    });
  }
};

// Helper
async function getCategoryIdByName(name: string) {
  try {
    const category = await Category.findOne({
      name: { $regex: new RegExp(name, "i") },
      status: "Active"
    }).select("_id");
    return category ? category._id : null;
  } catch (error) {
    console.error("Error finding category by name:", error);
    return null;
  }
}

/**
 * Check if service is available at the given location
 */
export const checkServiceability = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
        isServiceAvailable: false
      });
    }

    const userLat = parseFloat(latitude as string);
    const userLng = parseFloat(longitude as string);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
        isServiceAvailable: false
      });
    }

    const nearbySellerIds = await findSellersWithinRange(userLat, userLng);

    return res.status(200).json({
      success: true,
      isServiceAvailable: nearbySellerIds.length > 0,
      nearbySellersCount: nearbySellerIds.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error checking serviceability",
      error: error.message,
      isServiceAvailable: false
    });
  }
};
