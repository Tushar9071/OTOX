import { Elysia, t } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { calculateFare, getDistanceAndDuration } from "../../services/fareCalculationService";
import { rideMatchingService } from "../../services/rideMatchingService";
import env from "../../config/env";

export const mapsRoutes = new Elysia({ prefix: "/maps" })
  .use(authMiddleware)

  .get(
    "/geocode",
    async ({ query, set }) => {
      const { address } = query;
      if (!address) {
        set.status = 400;
        return { success: false, error: "Address is required" };
      }

      if (env.GOOGLE_MAPS_API_KEY) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(env.GOOGLE_MAPS_API_KEY)}&region=in`;
        const res = await fetch(url);
        const data = await res.json() as any;

        if (data.results?.length > 0) {
          const location = data.results[0].geometry.location;
          return {
            success: true,
            data: {
              latitude: location.lat,
              longitude: location.lng,
              formattedAddress: data.results[0].formatted_address,
            },
          };
        }
      }

      return { success: false, error: "Geocoding not available" };
    }
  )

  .get(
    "/reverse",
    async ({ query, set }) => {
      const lat = Number(query.lat);
      const lng = Number(query.lng);

      if (!lat || !lng) {
        set.status = 400;
        return { success: false, error: "lat and lng are required" };
      }

      if (env.GOOGLE_MAPS_API_KEY) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${encodeURIComponent(env.GOOGLE_MAPS_API_KEY)}`;
        const res = await fetch(url);
        const data = await res.json() as any;

        if (data.results?.length > 0) {
          return {
            success: true,
            data: {
              address: data.results[0].formatted_address,
              placeId: data.results[0].place_id,
            },
          };
        }
      }

      return { success: false, error: "Reverse geocoding not available" };
    }
  )

  .get(
    "/estimate",
    async ({ query }) => {
      const pickupLat = Number(query.pickupLat);
      const pickupLng = Number(query.pickupLng);
      const dropLat = Number(query.dropLat);
      const dropLng = Number(query.dropLng);

      const { distanceKm, durationMinutes } = await getDistanceAndDuration(
        pickupLat, pickupLng, dropLat, dropLng
      );

      const fare = await calculateFare(distanceKm, durationMinutes);
      return { success: true, data: fare };
    }
  )

  .get(
    "/nearby-drivers",
    async ({ query }) => {
      const lat = Number(query.lat);
      const lng = Number(query.lng);
      const radius = Number(query.radius) || 3;

      const drivers = await rideMatchingService.findNearbyDrivers(lat, lng, radius);

      return {
        success: true,
        data: drivers.map((d) => ({
          id: d.id,
          name: d.user.name,
          latitude: d.currentLatitude,
          longitude: d.currentLongitude,
          rating: d.rating,
          vehicle: d.vehicle,
          distanceKm: d.distanceFromPickup,
        })),
      };
    }
  );
