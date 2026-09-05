import mongoose from "mongoose";
import Seller from "../models/Seller";

/**
 * Helper function to calculate distance between two coordinates (Haversine formula)
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find sellers whose service radius covers the user's location
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @returns Array of seller IDs within range
 */
export async function findSellersWithinRange(
  userLat: number,
  userLng: number
): Promise<mongoose.Types.ObjectId[]> {
  if (userLat === null || userLng === null || isNaN(userLat) || isNaN(userLng)) {
    return [];
  }

  // Validate coordinates
  if (userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
    return [];
  }

  try {
    // Fetch all approved sellers
    const sellers = await Seller.find({
      status: "Approved",
    }).select("_id location latitude longitude serviceRadiusKm");

    const matchedSellerIds: mongoose.Types.ObjectId[] = [];

    for (const seller of sellers) {
      let sLat: number | null = null;
      let sLng: number | null = null;

      // Prioritize GeoJSON location field
      if (
        seller.location &&
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

      // Skip seller if coordinates are missing or invalid
      if (
        sLat === null ||
        sLng === null ||
        isNaN(sLat) ||
        isNaN(sLng) ||
        sLat < -90 ||
        sLat > 90 ||
        sLng < -180 ||
        sLng > 180
      ) {
        continue;
      }

      const distance = calculateDistance(userLat, userLng, sLat, sLng);
      const radiusKm =
        typeof seller.serviceRadiusKm === "number" && seller.serviceRadiusKm > 0
          ? seller.serviceRadiusKm
          : 10;

      if (distance <= radiusKm) {
        matchedSellerIds.push(seller._id as mongoose.Types.ObjectId);
      }
    }

    return matchedSellerIds;
  } catch (error) {
    console.error("Error finding sellers within range:", error);
    return [];
  }
}
