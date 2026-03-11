import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const VARIANTS = {
  primary: { bg: "#F97316", text: "#fff", border: "transparent" },
  secondary: { bg: "#111827", text: "#fff", border: "transparent" },
  danger: { bg: "#EF4444", text: "#fff", border: "transparent" },
  outline: { bg: "transparent", text: "#F97316", border: "#F97316" },
};

export default function Button({ title, onPress, variant = "primary", loading, disabled, style, textStyle }: ButtonProps) {
  const colors = VARIANTS[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: disabled ? "#D1D5DB" : colors.bg,
          paddingVertical: 16, borderRadius: 12, alignItems: "center" as const,
          borderWidth: variant === "outline" ? 2 : 0,
          borderColor: colors.border,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={[{ color: disabled ? "#6B7280" : colors.text, fontSize: 16, fontWeight: "bold" as const }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
