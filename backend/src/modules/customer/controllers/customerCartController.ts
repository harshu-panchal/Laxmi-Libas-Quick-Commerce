
import { Request, Response } from 'express';
import Cart from '../../../models/Cart';
import CartItem from '../../../models/CartItem';
import Product from '../../../models/Product';
// import { findSellersWithinRange } from '../../../utils/locationHelper';
import AppSettings from '../../../models/AppSettings';
import { calculateCustomerDeliveryFee } from '../../../services/deliveryFeeService';
import { calculateDistance } from '../../../utils/locationHelper';

// Helper to calculate item price matching frontend logic
const calculateItemPrice = (product: any, variation?: string) => {
    // If variation is provided, look for it in product.variations
    if (variation && product.variations && product.variations.length > 0) {
        const targetVar = variation?.toString().toLowerCase().trim();
        const variant = product.variations.find((v: any) => {
            const vId = v._id?.toString();
            const vTitle = v.title?.toString().toLowerCase().trim();
            const vValue = v.value?.toString().toLowerCase().trim();
            const vName = v.name?.toString().toLowerCase().trim();
            
            return vId === variation?.toString() || 
                   vTitle === targetVar || 
                   vValue === targetVar || 
                   vName === targetVar;
        });

        if (variant) {
            // Priority: Variant Discount Price -> Variant Base Price
            const finalPrice = variant.discPrice && variant.discPrice > 0
                ? variant.discPrice
                : (variant.price || 0);
            
            console.log(`[DEBUG Variant Price] Product: ${product.productName}, Match: ${variation}, VariantPrice: ${variant.price}, VariantDisc: ${variant.discPrice}, Final: ${finalPrice}`);
            return finalPrice;
        }
    }

    // Priority: Product Discount Price -> Product Base Price
    let finalPrice = product.discPrice && product.discPrice > 0
        ? product.discPrice
        : (product.price || 0);

    console.log(`[DEBUG Base Price] Product: ${product.productName}, Price: ${product.price}, DiscPrice: ${product.discPrice}, Final: ${finalPrice}`);
    return finalPrice;
};

// Helper to calculate cart total
const calculateCartTotal = async (cartId: any) => {
    const items = await CartItem.find({ cart: cartId }).populate({
        path: 'product',
        select: 'price discPrice variations seller status publish productName'
    });

    let total = 0;
    for (const item of items) {
        const product = item.product as any;
        if (product && product.status === 'Active' && product.publish) {
            // Always available as location filtering is removed
            const isAvailable = true;
            if (isAvailable) {
                const price = calculateItemPrice(product, item.variation);
                total += price * item.quantity;
            }
        }
    }
    return total;
};

// Helper to calculate delivery fee (admin settings — single charge per order)
const calculateDeliveryStuff = async (total: number, items: any[], userLat: number | null, userLng: number | null) => {
    try {
        return await calculateCustomerDeliveryFee(total, items, userLat, userLng);
    } catch (err) {
        console.error('Error calculating delivery stuff:', err);
        const settings = await AppSettings.getSettings();
        return {
            estimatedDeliveryFee: settings.deliveryCharges || 0,
            platformFee: settings.platformFee || 0,
            freeDeliveryThreshold: settings.freeDeliveryThreshold || 0,
        };
    }
};

// Get current user's cart
export const getCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { latitude, longitude } = req.query;

        // Parse location
        const userLat = (latitude !== undefined && latitude !== null) ? parseFloat(latitude as string) : null;
        const userLng = (longitude !== undefined && longitude !== null) ? parseFloat(longitude as string) : null;

        let cart = await Cart.findOne({ customer: userId }).populate({
            path: 'items',
            populate: {
                path: 'product',
                select: 'productName price mainImage stock pack mrp variations category seller status publish discPrice type deliveryType',
                populate: {
                    path: 'seller',
                    select: 'city storeName location serviceRadiusKm latitude longitude'
                }
            }
        });

        if (!cart) {
            cart = await Cart.create({ customer: userId, items: [], total: 0 });
            return res.status(200).json({ success: true, data: cart });
        }

        // Filter items based on location availability and update total
        const filteredItems = [];
        let total = 0;

        for (const item of (cart.items as any)) {
            const product = item.product;
            if (product && product.status === 'Active' && product.publish) {
                let isAvailable = true;
                const seller = product.seller;

                if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng) && seller) {
                    let sLat: number | null = null;
                    let sLng: number | null = null;

                    if (
                        seller.location?.coordinates &&
                        Array.isArray(seller.location.coordinates) &&
                        seller.location.coordinates.length === 2 &&
                        (seller.location.coordinates[0] !== 0 || seller.location.coordinates[1] !== 0)
                    ) {
                        sLng = Number(seller.location.coordinates[0]);
                        sLat = Number(seller.location.coordinates[1]);
                    } else if (seller.latitude && seller.longitude) {
                        const parsedLat = parseFloat(seller.latitude);
                        const parsedLng = parseFloat(seller.longitude);
                        if (!isNaN(parsedLat) && !isNaN(parsedLng) && (parsedLat !== 0 || parsedLng !== 0)) {
                            sLat = parsedLat;
                            sLng = parsedLng;
                        }
                    }

                    if (sLat !== null && sLng !== null) {
                        const dist = calculateDistance(userLat, userLng, sLat, sLng);
                        const radius = (typeof seller.serviceRadiusKm === 'number' && seller.serviceRadiusKm > 0)
                            ? seller.serviceRadiusKm
                            : 10;
                        if ((product.type === 'quick' || item.selectedDeliveryType === 'quick') && dist > radius) {
                            isAvailable = false;
                        }
                    }
                }

                item.isAvailable = isAvailable;
                filteredItems.push(item);
                if (isAvailable) {
                    const price = calculateItemPrice(product, item.variation);
                    total += price * item.quantity;
                    console.log(`[DEBUG CartLoop] Item: ${product.productName}, Variant: ${item.variation}, Price: ${price}, Qty: ${item.quantity}, RunningTotal: ${total}`);
                }
            }
        }

        // Update cart total in DB if it changed
        if (cart.total !== total) {
            cart.total = total;
            await cart.save();
        }

        // Calculate fees
        const fees = await calculateDeliveryStuff(total, filteredItems, userLat, userLng);

        return res.status(200).json({
            success: true,
            data: {
                ...cart.toObject(),
                items: filteredItems,
                total,
                ...fees
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
};

// Add item to cart
export const addToCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { productId, quantity = 1, variation, selectedDeliveryType = "quick", selectedVariant } = req.body;
        const { latitude, longitude } = req.query;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        // Parse location
        const userLat = (latitude !== undefined && latitude !== null) ? parseFloat(latitude as string) : null;
        const userLng = (longitude !== undefined && longitude !== null) ? parseFloat(longitude as string) : null;

        // Verify product exists
        const product = await Product.findOne({ _id: productId, status: 'Active', publish: true }).populate('seller');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
        }

        // Check if seller's shop is open
        const seller = product.seller as any;
        if (seller && seller.isShopOpen === false) {
            return res.status(400).json({
                success: false,
                message: 'Seller is not available at this moment'
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({ customer: userId });
        if (!cart) {
            cart = await Cart.create({ customer: userId, items: [], total: 0 });
        } else {
            // Check existing cart items to ensure single-vendor ordering
            const existingCartItems = await CartItem.find({ cart: cart._id }).populate('product');
            if (existingCartItems.length > 0) {
                const firstItemProduct = existingCartItems[0].product as any;
                if (firstItemProduct && firstItemProduct.seller && product.seller) {
                    const existingSellerId = firstItemProduct.seller._id ? firstItemProduct.seller._id.toString() : firstItemProduct.seller.toString();
                    const newSellerId = product.seller._id ? product.seller._id.toString() : product.seller.toString();
                    if (existingSellerId !== newSellerId) {
                        return res.status(400).json({
                            success: false,
                            message: 'You can only order from a single vendor at a time. Please complete or clear your current order to purchase from this vendor.',
                            errorCode: 'DIFFERENT_SELLER'
                        });
                    }
                }
            }
        }

        // Check if item already exists in cart with SAME delivery type
        let cartItem = await CartItem.findOne({
            cart: cart._id,
            product: productId,
            variation: variation || null,
            selectedDeliveryType
        });

        if (cartItem) {
            // Update quantity
            cartItem.quantity += quantity;
            // Also update selectedVariant if it was missing
            if (!cartItem.selectedVariant && selectedVariant) {
                cartItem.selectedVariant = selectedVariant;
            }
            await cartItem.save();
        } else {
            // Create new cart item
            cartItem = await CartItem.create({
                cart: cart._id,
                product: productId,
                quantity,
                variation,
                selectedVariant,
                selectedDeliveryType
            });
            cart.items.push(cartItem._id as any);
        }

        // Update total
        cart.total = await calculateCartTotal(cart._id);
        await cart.save();

        // Return updated cart
        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items',
            populate: {
                path: 'product',
                select: 'productName price mainImage stock pack mrp variations category seller status publish discPrice type deliveryType'
            }
        });

        const filteredItems = (updatedCart?.items as any[] || []).filter(item => {
            const prod = item.product;
            return !!prod;
        });

        // Calculate fees
        const fees = await calculateDeliveryStuff(cart.total, filteredItems, userLat, userLng);

        return res.status(200).json({
            success: true,
            message: 'Item added to cart',
            data: {
                ...updatedCart?.toObject(),
                items: filteredItems,
                total: cart.total,
                ...fees
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Error adding to cart',
            error: error.message
        });
    }
};

// Update item quantity
export const updateCartItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { itemId } = req.params;
        const { quantity } = req.body;
        const { latitude, longitude } = req.query;

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        // Parse location
        const userLat = (latitude !== undefined && latitude !== null) ? parseFloat(latitude as string) : null;
        const userLng = (longitude !== undefined && longitude !== null) ? parseFloat(longitude as string) : null;

        const cart = await Cart.findOne({ customer: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const cartItem = await CartItem.findOne({ _id: itemId, cart: cart._id }).populate('product');
        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        // Calculate total
        cart.total = await calculateCartTotal(cart._id);
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items',
            populate: {
                path: 'product',
                select: 'productName price mainImage stock pack mrp variations category seller status publish discPrice type deliveryType',
                populate: {
                    path: 'seller',
                    select: 'city storeName location'
                }
            }
        });

        const filteredItems = (updatedCart?.items as any[] || []).filter(item => {
            const prod = item.product;
            return !!prod;
        });

        // Calculate fees
        const fees = await calculateDeliveryStuff(cart.total, filteredItems, userLat, userLng);

        return res.status(200).json({
            success: true,
            message: 'Cart updated',
            data: {
                ...updatedCart?.toObject(),
                items: filteredItems,
                total: cart.total,
                ...fees
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Error updating cart item',
            error: error.message
        });
    }
};

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { itemId } = req.params;
        const { latitude, longitude } = req.query;

        // Parse location
        const userLat = (latitude !== undefined && latitude !== null) ? parseFloat(latitude as string) : null;
        const userLng = (longitude !== undefined && longitude !== null) ? parseFloat(longitude as string) : null;

        const cart = await Cart.findOne({ customer: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        await CartItem.findOneAndDelete({ _id: itemId, cart: cart._id });

        // Remove from cart array
        cart.items = cart.items.filter(id => id.toString() !== itemId);

        // Calculate total
        cart.total = await calculateCartTotal(cart._id);
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items',
            populate: {
                path: 'product',
                select: 'productName price mainImage stock pack mrp variations category seller status publish discPrice type deliveryType',
                populate: {
                    path: 'seller',
                    select: 'city storeName location'
                }
            }
        });

        const filteredItems = (updatedCart?.items as any[] || []).filter(item => {
            const prod = item.product;
            return !!prod;
        });

        // Calculate fees
        const fees = await calculateDeliveryStuff(cart.total, filteredItems, userLat, userLng);

        return res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            data: {
                ...updatedCart?.toObject(),
                items: filteredItems,
                total: cart.total,
                ...fees
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Error removing from cart',
            error: error.message
        });
    }
};

// Clear cart
export const clearCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const cart = await Cart.findOne({ customer: userId });

        if (cart) {
            await CartItem.deleteMany({ cart: cart._id });
            cart.items = [];
            cart.total = 0;
            await cart.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Cart cleared',
            data: { items: [], total: 0 }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
};
