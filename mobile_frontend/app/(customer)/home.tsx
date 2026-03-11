import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocationStore } from "@/stores/locationStore";
import { useRideStore } from "@/stores/rideStore";
import { locationTracker } from "@/services/locationTracker";
import api from "@/services/api";

const { width } = Dimensions.get("window");

export default function CustomerHomeScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { currentLocation, pickupLocation, dropLocation, pickupAddress, dropAddress, setPickupLocation, setDropLocation } = useLocationStore();
  const { activeRide, estimatedFare, isBooking, getEstimate, bookRide } = useRideStore();
  const [step, setStep] = useState<"idle" | "pickup" | "drop" | "confirm" | "searching" | "active">("idle");
  const [fareData, setFareData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  useEffect(() => {
    (async () => {
      const loc = await locationTracker.getCurrentLocation();
      useLocationStore.getState().setCurrentLocation(loc);
      // Reverse geocode for pickup
      try {
        const res = await api.get(`/maps/reverse?lat=${loc.latitude}&lng=${loc.longitude}`);
        setPickupLocation(loc, res.data.data?.address || "Current Location");
      } catch {
        setPickupLocation(loc, "Current Location");
      }
    })();
  }, []);

  useEffect(() => {
    if (activeRide) {
      if (activeRide.status === "SEARCHING") setStep("searching");
      else setStep("active");
    }
  }, [activeRide]);

  const handleGetEstimate = async () => {
    if (!pickupLocation || !dropLocation) return;
    try {
      const estimate = await getEstimate(pickupLocation, dropLocation);
      setFareData(estimate);
      setStep("confirm");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to get estimate");
    }
  };

  const handleBook = async () => {
    if (!pickupLocation || !dropLocation) return;
    try {
      await bookRide({
        pickupLat: pickupLocation.latitude,
        pickupLng: pickupLocation.longitude,
        dropLat: dropLocation.latitude,
        dropLng: dropLocation.longitude,
        pickupAddress,
        dropAddress,
        paymentMethod,
      });
      setStep("searching");
    } catch (err: any) {
      Alert.alert("Booking Failed", err.response?.data?.error || "Failed to book ride");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation?.latitude || 18.5204,
          longitude: currentLocation?.longitude || 73.8567,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {pickupLocation && (
          <Marker coordinate={pickupLocation} title="Pickup">
            <View style={{ backgroundColor: "#10B981", padding: 6, borderRadius: 20 }}>
              <Ionicons name="location" size={16} color="#fff" />
            </View>
          </Marker>
        )}
        {dropLocation && (
          <Marker coordinate={dropLocation} title="Drop">
            <View style={{ backgroundColor: "#EF4444", padding: 6, borderRadius: 20 }}>
              <Ionicons name="flag" size={16} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Bottom Sheet */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 }}>
        {step === "idle" && (
          <View>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#111827", marginBottom: 16 }}>Where to?</Text>
            <TouchableOpacity
              onPress={() => setStep("drop")}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <Ionicons name="search" size={20} color="#6B7280" />
              <Text style={{ marginLeft: 12, fontSize: 15, color: "#6B7280" }}>Search your destination</Text>
            </TouchableOpacity>

            {/* Saved Places */}
            <View style={{ flexDirection: "row", marginTop: 16, gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF7ED", borderRadius: 12, padding: 12 }}>
                <Ionicons name="home" size={20} color="#F97316" />
                <Text style={{ fontSize: 13, fontWeight: "500", color: "#111827" }}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EFF6FF", borderRadius: 12, padding: 12 }}>
                <Ionicons name="briefcase" size={20} color="#3B82F6" />
                <Text style={{ fontSize: 13, fontWeight: "500", color: "#111827" }}>Work</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === "drop" && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 }}>Set Drop Location</Text>
            <TouchableOpacity
              onPress={() => {
                // In a real app, use a place picker or search
                const dropLoc = {
                  latitude: (currentLocation?.latitude || 18.5204) + 0.02,
                  longitude: (currentLocation?.longitude || 73.8567) + 0.015,
                };
                setDropLocation(dropLoc, "Destination Point");
                handleGetEstimate();
              }}
              style={{ backgroundColor: "#F97316", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Confirm Drop Location</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "confirm" && fareData && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 }}>Confirm Ride</Text>

            {/* Route Summary */}
            <View style={{ backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <View style={{ width: 8, height: 8, backgroundColor: "#10B981", borderRadius: 4 }} />
                <Text style={{ fontSize: 13, color: "#374151", flex: 1 }} numberOfLines={1}>{pickupAddress}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 8, height: 8, backgroundColor: "#EF4444", borderRadius: 4 }} />
                <Text style={{ fontSize: 13, color: "#374151", flex: 1 }} numberOfLines={1}>{dropAddress}</Text>
              </View>
            </View>

            {/* Fare */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFF7ED", borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 13, color: "#6B7280" }}>Estimated Fare</Text>
                <Text style={{ fontSize: 24, fontWeight: "bold", color: "#F97316" }}>₹{fareData.total}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 12, color: "#6B7280" }}>{fareData.distance?.toFixed(1)} km</Text>
                <Text style={{ fontSize: 12, color: "#6B7280" }}>{fareData.duration} min</Text>
              </View>
            </View>

            {/* Payment Method */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {["CASH", "WALLET"].map((method) => (
                <TouchableOpacity
                  key={method}
                  onPress={() => setPaymentMethod(method)}
                  style={{
                    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                    paddingVertical: 12, borderRadius: 10,
                    borderWidth: 2,
                    borderColor: paymentMethod === method ? "#F97316" : "#E5E7EB",
                    backgroundColor: paymentMethod === method ? "#FFF7ED" : "#fff",
                  }}
                >
                  <Ionicons name={method === "CASH" ? "cash" : "wallet"} size={18} color={paymentMethod === method ? "#F97316" : "#6B7280"} />
                  <Text style={{ fontSize: 14, fontWeight: "600", color: paymentMethod === method ? "#F97316" : "#6B7280" }}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleBook}
              disabled={isBooking}
              style={{ backgroundColor: "#F97316", paddingVertical: 16, borderRadius: 12, alignItems: "center" }}
            >
              {isBooking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>Book Auto Rickshaw</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === "searching" && (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <ActivityIndicator size="large" color="#F97316" />
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827", marginTop: 16 }}>Finding your ride...</Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>Searching for nearby drivers</Text>
            <TouchableOpacity
              onPress={() => {
                if (activeRide) {
                  useRideStore.getState().cancelRide(activeRide.id);
                }
                setStep("idle");
              }}
              style={{ marginTop: 20, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 10, borderWidth: 1, borderColor: "#EF4444" }}
            >
              <Text style={{ color: "#EF4444", fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "active" && activeRide && (
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 12, color: "#6B7280" }}>Status</Text>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: "#F97316" }}>{activeRide.status.replace("_", " ")}</Text>
              </View>
              {activeRide.otp && (
                <View style={{ backgroundColor: "#FFF7ED", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>OTP</Text>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: "#F97316", letterSpacing: 4 }}>{activeRide.otp}</Text>
                </View>
              )}
            </View>

            {activeRide.driver && (
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <View style={{ width: 48, height: 48, backgroundColor: "#F97316", borderRadius: 24, justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                  <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>{activeRide.driver.name?.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#111827" }}>{activeRide.driver.name}</Text>
                  <Text style={{ fontSize: 13, color: "#6B7280" }}>{activeRide.driver.vehicle?.registrationNumber}</Text>
                </View>
                <TouchableOpacity style={{ backgroundColor: "#10B981", padding: 10, borderRadius: 20 }}>
                  <Ionicons name="call" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {activeRide.status === "COMPLETED" && (
              <View style={{ alignItems: "center", paddingVertical: 8 }}>
                <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827" }}>
                  ₹{activeRide.finalFare || activeRide.estimatedFare}
                </Text>
                <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 12 }}>Ride completed!</Text>
                <TouchableOpacity
                  onPress={() => {
                    useRideStore.getState().clearActiveRide();
                    useLocationStore.getState().clearLocations();
                    setStep("idle");
                  }}
                  style={{ backgroundColor: "#F97316", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
