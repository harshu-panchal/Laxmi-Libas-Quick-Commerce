import mongoose from 'mongoose';
import AppSettings from '../models/AppSettings';
import Seller from '../models/Seller';
import { getRoadDistances } from './mapService';

export interface DeliveryFeeResult {
  estimatedDeliveryFee: number;
  platformFee: number;
  freeDeliveryThreshold: number;
}

function getSellerCoords(seller: {
  location?: { coordinates?: number[] };
  latitude?: string;
  longitude?: string;
}): { lat: number; lng: number } | null {
  const loc = seller.location;
  if (loc?.coordinates && loc.coordinates.length === 2) {
    return { lng: loc.coordinates[0], lat: loc.coordinates[1] };
  }
  if (seller.latitude && seller.longitude) {
    const lat = parseFloat(seller.latitude);
    const lng = parseFloat(seller.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }
  return null;
}

function collectUniqueSellerIds(items: any[]): string[] {
  const ids = new Set<string>();
  for (const item of items) {
    const seller = item.product?.seller;
    if (!seller) continue;
    const id =
      typeof seller === 'object'
        ? (seller._id || seller.id)?.toString()
        : seller.toString();
    if (id) ids.add(id);
  }
  return Array.from(ids);
}

/**
 * Customer delivery fee — always one charge per checkout (admin settings).
 * Fixed mode: uses AppSettings.deliveryCharges exactly once.
 * Distance mode: baseCharge + kmRate from nearest seller (no per-seller stacking, no 500 cap).
 */
export async function calculateCustomerDeliveryFee(
  cartTotal: number,
  items: any[],
  userLat: number | null,
  userLng: number | null
): Promise<DeliveryFeeResult> {
  const settings = await AppSettings.getSettings();
  const platformFee = settings.platformFee || 0;
  const freeDeliveryThreshold = settings.freeDeliveryThreshold || 0;
  const flatFee = settings.deliveryCharges || 0;

  if (freeDeliveryThreshold > 0 && cartTotal >= freeDeliveryThreshold) {
    return { estimatedDeliveryFee: 0, platformFee, freeDeliveryThreshold };
  }

  if (settings.deliveryConfig?.isDistanceBased !== true) {
    return { estimatedDeliveryFee: flatFee, platformFee, freeDeliveryThreshold };
  }

  const config = settings.deliveryConfig;
  const baseCharge = config.baseCharge ?? flatFee;
  const baseDistance = config.baseDistance ?? 0;
  const kmRate = config.kmRate ?? 0;

  const sellerIds = collectUniqueSellerIds(items);
  if (sellerIds.length === 0) {
    return { estimatedDeliveryFee: baseCharge, platformFee, freeDeliveryThreshold };
  }

  if (userLat == null || userLng == null) {
    return { estimatedDeliveryFee: baseCharge, platformFee, freeDeliveryThreshold };
  }

  const sellers = await Seller.find({
    _id: { $in: sellerIds.map((id) => new mongoose.Types.ObjectId(id)) },
  }).select('location latitude longitude storeName');

  let bestFee: number | null = null;

  for (const seller of sellers) {
    const coords = getSellerCoords(seller);
    if (!coords) continue;

    let fee = baseCharge;

    try {
      const distances = await getRoadDistances(
        [{ lat: coords.lat, lng: coords.lng }],
        { lat: userLat, lng: userLng },
        config.googleMapsKey
      );

      if (distances?.length) {
        const billableDistance = Math.min(50, distances[0]);
        const extraKm = Math.max(0, billableDistance - baseDistance);
        fee = Math.ceil(baseCharge + extraKm * kmRate);
      }
    } catch {
      /* use baseCharge for this seller */
    }

    if (bestFee === null || fee < bestFee) {
      bestFee = fee;
    }
  }

  return {
    estimatedDeliveryFee: bestFee ?? baseCharge,
    platformFee,
    freeDeliveryThreshold,
  };
}
