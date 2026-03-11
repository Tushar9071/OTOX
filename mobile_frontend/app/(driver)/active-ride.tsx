import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocationStore } from "@/stores/locationStore";
import { useRideStore } from "@/stores/rideStore";

type RidePhase = "HEADING_TO_PICKUP" | "ARRIVED" | "VERIFY_OTP" | "IN_TRIP" | "COMPLETED";

export default function ActiveRideScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { currentLocation } = useLocationStore();
  const { activeRide, clearActiveRide } = useRideStore();
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  const phase: RidePhase | null = (() => {
    if (!activeRide) return null;
    switch (activeRide.status) {
      case "ACCEPTED": return "HEADING_TO_PICKUP";
      case "ARRIVED": return "ARRIVED";
      case "IN_PROGRESS": return "IN_TRIP";
      case "COMPLETED": return "COMPLETED";
      default: return "HEADING_TO_PICKUP";
    }
  })();

  const handleArrivedAtPickup = async () => {
    if (!activeRide) return;
    try {
      await useRideStore.getState().arrivedAtPickup(activeRide.id);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to update status");
    }
  };

  const handleVerifyOtpAndStart = async () => {
    if (!activeRide || otp.length !== 4) return;
    setVerifying(true);
    try {
      await useRideStore.getState().startTrip(activeRide.id, otp);
      setOtp("");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Invalid OTP");
    } finally {
      setVerifying(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!activeRide) return;
    Alert.alert("Complete Trip", "Are you sure you want to end this trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete", onPress: async () => {
          try {
            await useRideStore.getState().completeTrip(activeRide.id);
          } catch (err: any) {
            Alert.alert("Error", err.response?.data?.error || "Failed to complete trip");
          }
        },
      },
    ]);
  };

  if (!activeRide) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" }}>
        <Ionicons name="car-outline" size={64} color="#D1D5DB" />
        <Text style={{ fontSize: 18, color: "#6B7280", marginTop: 12 }}>No active ride</Text>
        <TouchableOpacity
          onPress={() => router.push("/(driver)/home")}
          style={{ marginTop: 20, backgroundColor: "#F97316", paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Go to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        region={{
          latitude: currentLocation?.latitude || 18.5204,
          longitude: currentLocation?.longitude || 73.8567,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
      >
        {activeRide.pickupLat && (
          <Marker coordinate={{ latitude: activeRide.pickupLat, longitude: activeRide.pickupLng }} title="Pickup">
            <View style={{ backgroundColor: "#10B981", padding: 6, borderRadius: 20 }}>
              <Ionicons name="location" size={16} color="#fff" />
            </View>
          </Marker>
        )}
        {activeRide.dropLat && (
          <Marker coordinate={{ latitude: activeRide.dropLat, longitude: activeRide.dropLng }} title="Drop">
            <View style={{ backgroundColor: "#EF4444", padding: 6, borderRadius: 20 }}>
              <Ionicons name="flag" size={16} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Bottom Panel */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 }}>
        {/* Customer Info */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
          <View style={{ width: 44, height: 44, backgroundColor: "#F97316", borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 12 }}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>{activeRide.customer?.name || "Customer"}</Text>
            <Text style={{ fontSize: 13, color: "#6B7280" }}>{activeRide.pickupAddress}</Text>
          </View>
          <TouchableOpacity style={{ backgroundColor: "#10B981", padding: 10, borderRadius: 20 }}>
            <Ionicons name="call" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Route */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" }} />
            <Text style={{ fontSize: 13, color: "#374151", flex: 1 }} numberOfLines={1}>{activeRide.pickupAddress}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" }} />
            <Text style={{ fontSize: 13, color: "#374151", flex: 1 }} numberOfLines={1}>{activeRide.dropAddress}</Text>
          </View>
        </View>

        {/* Fare */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFF7ED", borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: "#6B7280" }}>Estimated Fare</Text>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#F97316" }}>₹{activeRide.estimatedFare}</Text>
        </View>

        {/* Action Button Based on Phase */}
        {phase === "HEADING_TO_PICKUP" && (
          <TouchableOpacity
            onPress={handleArrivedAtPickup}
            style={{ backgroundColor: "#3B82F6", paddingVertical: 16, borderRadius: 12, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>I've Arrived at Pickup</Text>
          </TouchableOpacity>
        )}

        {(phase === "ARRIVED" || phase === "VERIFY_OTP") && (
          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 8, textAlign: "center" }}>
              Enter 4-digit OTP from customer
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <TextInput
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, "").slice(0, 4))}
                placeholder="Enter OTP"
                keyboardType="number-pad"
                maxLength={4}
                style={{
                  flex: 1, backgroundColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                  fontSize: 24, textAlign: "center", fontWeight: "bold", letterSpacing: 12,
                }}
              />
            </View>
            <TouchableOpacity
              onPress={handleVerifyOtpAndStart}
              disabled={otp.length !== 4 || verifying}
              style={{
                backgroundColor: otp.length === 4 ? "#10B981" : "#D1D5DB",
                paddingVertical: 16, borderRadius: 12, alignItems: "center",
              }}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>Start Trip</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {phase === "IN_TRIP" && (
          <TouchableOpacity
            onPress={handleCompleteTrip}
            style={{ backgroundColor: "#EF4444", paddingVertical: 16, borderRadius: 12, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>Complete Trip</Text>
          </TouchableOpacity>
        )}

        {phase === "COMPLETED" && (
          <View style={{ alignItems: "center" }}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#111827", marginTop: 8 }}>Trip Completed</Text>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: "#F97316", marginTop: 4 }}>
              ₹{activeRide.finalFare || activeRide.estimatedFare}
            </Text>
            <TouchableOpacity
              onPress={() => { clearActiveRide(); router.replace("/(driver)/home"); }}
              style={{ marginTop: 16, backgroundColor: "#F97316", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
