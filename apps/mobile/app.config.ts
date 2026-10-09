import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "ReLaax",
  slug: "relaax",
  scheme: "relaax",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    bundleIdentifier: "com.relaax.app",
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription: "ReLaax uses the camera to record recruiting clips you choose to film.",
      NSLocationWhenInUseUsageDescription: "ReLaax uses your location only while you use Eat Out, to find restaurants nearby.",
      NSMicrophoneUsageDescription: "ReLaax records audio with your recruiting clips.",
    },
  },
  android: {
    package: "com.relaax.app",
    permissions: ["CAMERA", "RECORD_AUDIO", "ACCESS_FINE_LOCATION"],
  },
  plugins: ["expo-router", "expo-camera", "expo-location", "expo-secure-store"],
  experiments: { typedRoutes: true },
  extra: { eas: { projectId: "" } },
};
export default config;
