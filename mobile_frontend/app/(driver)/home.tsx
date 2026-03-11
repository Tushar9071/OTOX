import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Switch, Alert, Dimensions, Modal, Vibration } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocationStore } from "@/stores/locationStore";
import { useRideStore } from "@/stores/rideStore";
import { locationTracker } from "@/services/locationTracker";
import { socketService } from "@/services/socket";
import api from "@/services/api";

export default function DriverHomeScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { currentLocation, setCurrentLocation } = useLocationStore();
  const { activeRide } = useRideStore();
  const [isOnline, setIsOnline] = useState(false);
  const [incomingRide, setIncomingRide] = useState<any>(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayRides, setTodayRides] = useState(0);

  useEffect(() => {
    (async () => {
      const loc = await locationTracker.getCurrentLocation();
      setCurrentLocation(loc);
    })();
    fetchTodayStats();
  }, []);

  useEffect(() => {
    if (isOnline) {
      locationTracker.startTracking();
      socketService.on("ride:new", handleNewRide);
    } else {
      locationTracker.stopTracking();
    }
    return () => {
      socketService.off("ride:new", handleNewRide);
    };
  }, [isOnline]);

  const fetchTodayStats = async () => {
    try {
      const res = await api.get("/driver/earnings/today");
      setTodayEarnings(res.data.data?.total || 0);
      setTodayRides(res.data.data?.rides || 0);
    } catch {}
  };

  const handleNewRide = (ride: any) => {
    Vibration.vibrate([0, 500, 200, 500]);
    setIncomingRide(ride);
    // Auto-dismiss after 30s
    setTimeout(() => {
      setIncomingRide((prev: any) => (prev?.id === ride.id ? null : prev));
    }, 30000);
  };

  const handleAcceptRide = async () => {
    if (!incomingRide) return;
    try {
      await useRideStore.getState().acceptRide(incomingRide.id);
      setIncomingRide(null);
      router.push("/(driver)/active-ride");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to accept ride");
    }
  };

  const handleRejectRide = async () => {
    if (!incomingRide) return;
    try {
      await useRideStore.getState().rejectRide(incomingRide.id);
    } catch {}
    setIncomingRide(null);
  };

  const toggleOnline = async () => {
    try {
      await api.post("/driver/status", { status: !isOnline ? "ONLINE" : "OFFLINE" });
      setIsOnline(!isOnline);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to update status");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation?.latitude || 18.5204,
          longitude: currentLocation?.longitude || 73.8567,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      />

      {/* Top Card */}
      <SafeAreaView style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <View style={{ marginHorizontal: 16, marginTop: 8, backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 13, color: "#6B7280" }}>Status</Text>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: isOnline ? "#10B981" : "#EF4444" }}>
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={toggleOnline}
              trackColor={{ false: "#E5E7EB", true: "#D1FAE5" }}
              thumbColor={isOnline ? "#10B981" : "#9CA3AF"}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Stats */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: "#FFF7ED", borderRadius: 12, padding: 16, alignItems: "center" }}>
            <Ionicons name="cash-outline" size={24} color="#F97316" />
            <Text style={{ fontSize: 22, fontWeight: "bold", color: "#111827", marginTop: 4 }}>₹{todayEarnings}</Text>
            <Text style={{ fontSize: 12, color: "#6B7280" }}>Today's Earnings</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#EFF6FF", borderRadius: 12, padding: 16, alignItems: "center" }}>
            <Ionicons name="car-outline" size={24} color="#3B82F6" />
            <Text style={{ fontSize: 22, fontWeight: "bold", color: "#111827", marginTop: 4 }}>{todayRides}</Text>
            <Text style={{ fontSize: 12, color: "#6B7280" }}>Today's Rides</Text>
          </View>
        </View>

        {!isOnline && (
          <TouchableOpacity
            onPress={toggleOnline}
            style={{ backgroundColor: "#10B981", marginTop: 16, paddingVertical: 16, borderRadius: 12, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>Go Online</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Incoming Ride Modal */}
      <Modal visible={!!incomingRide} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#111827", textAlign: "center", marginBottom: 16 }}>New Ride Request!</Text>

            {incomingRide && (
              <>
                <View style={{ backgroundColor: "#F9FAFB", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" }} />
                    <Text style={{ fontSize: 14, color: "#374151", flex: 1 }} numberOfLines={1}>
                      {incomingRide.pickupAddress || "Pickup point"}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" }} />
                    <Text style={{ fontSize: 14, color: "#374151", flex: 1 }} numberOfLines={1}>
                      {incomingRide.dropAddress || "Drop point"}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20 }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>Distance</Text>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: "#111827" }}>
                      {incomingRide.distance?.toFixed(1)} km
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>Fare</Text>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: "#F97316" }}>
                      ₹{incomingRide.estimatedFare}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={handleRejectRide}
                    style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: "#EF4444", alignItems: "center" }}
                  >
                    <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: "bold" }}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAcceptRide}
                    style={{ flex: 2, backgroundColor: "#10B981", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
                  >
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>Accept Ride</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
