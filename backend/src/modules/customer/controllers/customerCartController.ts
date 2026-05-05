
import { Request, Response } from 'express';
import Cart from '../../../models/Cart';
import CartItem from '../../../models/CartItem';
import Product from '../../../models/Product';
// import { findSellersWithinRange } from '../../../utils/locationHelper';
import mongoose from 'mongoose';
import AppSettings from '../../../models/AppSettings';
import { getRoadDistances } from '../../../services/mapService';
import Seller from '../../../models/Seller';

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

// Helper to calculate delivery fee
const calculateDeliveryStuff = async (total: number, items: any[], userLat: number | null, userLng: number | null) => {
    let estimatedDeliveryFee = 0;
    let platformFee = 0;
    let freeDeliveryThreshold = 0;

    try {
        const settings = await AppSettings.getSettings();
        platformFee = settings.platformFee || 0;
        freeDeliveryThreshold = settings.freeDeliveryThreshold || 0;

        // Check free delivery threshold
        if (freeDeliveryThreshold > 0 && total >= freeDeliveryThreshold) {
            estimatedDeliveryFee = 0;
        } else if (settings) {
            // If distance based is enabled
            if (settings.deliveryConfig?.isDistanceBased === true) {
                const config = settings.deliveryConfig;
                // Default to base charge to ensure we don't accidentally give free delivery
                estimatedDeliveryFee = config.baseCharge || 0;

                if (userLat !== null && userLng !== null) {
                    // Get all sellers involved in the cart
                    const sellerIds = new Set<string>();
                    items.forEach((item: any) => {
                        const seller = item.product?.seller;
                        if (seller) {
                            const id = typeof seller === 'object' ? (seller._id || seller.id) : seller;
                            if (id) sellerIds.add(id.toString());
                        }
                    });

                    if (sellerIds.size > 0) {
                        const uniqueSellerIds = Array.from(sellerIds)
                            .filter(id => mongoose.Types.ObjectId.isValid(id))
                            .map(id => new mongoose.Types.ObjectId(id));
                        
                        if (uniqueSellerIds.length === 0) {
                            return { estimatedDeliveryFee, platformFee, freeDeliveryThreshold };
                        }
                        
                        const sellers = await Seller.find({ _id: { $in: uniqueSellerIds } }).select('location latitude longitude');

                        const sellerLocations: { lat: number; lng: number }[] = [];
                        sellers.forEach((seller: any) => {
                            let lat, lng;
                            // Safe check for location coordinates
                            const loc = (seller as any).location;
                            if (loc && loc.coordinates && loc.coordinates.length === 2) {
                                lng = loc.coordinates[0];
                                lat = loc.coordinates[1];
                            } else if ((seller as any).latitude && (seller as any).longitude) {
                                lat = parseFloat((seller as any).latitude);
                                lng = parseFloat((seller as any).longitude);
                            }
                            if (lat && lng) sellerLocations.push({ lat, lng });
                        });

                        if (sellerLocations.length > 0) {
                            const distances = await getRoadDistances(
                                sellerLocations,
                                { lat: userLat, lng: userLng },
                                config.googleMapsKey
                            );

                            if (distances && distances.length > 0) {
                                const maxDistance = Math.max(...distances);
                                // Limit distance based calculation to a reasonable range (e.g. 50km)
                                // If they are further, they probably shouldn't be ordering, but we'll cap it
                                const billableDistance = Math.min(50, maxDistance);
                                const extraKm = Math.max(0, billableDistance - config.baseDistance);
                                let calculatedFee = Math.ceil(config.baseCharge + (extraKm * config.kmRate));
                                
                                // Absolute maximum cap for delivery fee to prevent crazy values
                                const MAX_DELIVERY_FEE = 250; 
                                estimatedDeliveryFee = Math.min(MAX_DELIVERY_FEE, calculatedFee);
                                
                                console.log(`[Delivery] Distance: ${maxDistance.toFixed(2)}km, Billable: ${billableDistance}km, Fee: ${calculatedFee}, Capped: ${estimatedDeliveryFee}`);
                            }
                        }
                    }
                }
            } else {
                // Fixed charge
                estimatedDeliveryFee = settings.deliveryCharges || 0;
            }
        }
    } catch (err) {
        console.error("Error calculating delivery stuff:", err);
    }
    return {
        estimatedDeliveryFee,
        platformFee,
        freeDeliveryThreshold
    };
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
                select: 'productName price mainImage stock pack mrp variations category seller status publish discPrice',
                populate: {
                    path: 'seller',
                    select: 'city storeName location'
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
                // Location filtering disabled - all active products are available
                const isAvailable = true;
                if (isAvailable) {
                    filteredItems.push(item);
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
                select: 'productName price mainImage stock pack mrp variations category seller status publish discPrice'
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
                select: 'productName price mainImage stock pack mrp variations category seller status publish discPrice',
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
                select: 'productName price mainImage stock pack mrp variations category seller status publish discPrice',
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
