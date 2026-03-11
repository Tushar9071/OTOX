import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function Index() {
  const { isAuthenticated, userType } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (userType === "driver") {
    return <Redirect href="/(driver)/home" />;
  }

  return <Redirect href="/(customer)/home" />;
}
