import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { Screen, H1, Muted, Button } from "@/components/ui";

/** Guided capture. Upload to S3 + Mux is wired in the media service in Phase 3; this records locally. */
export default function Capture() {
  const { clipType } = useLocalSearchParams<{ clipType: string }>();
  const [perm, request] = useCameraPermissions();
  const [recording, setRecording] = useState(false);
  const [uri, setUri] = useState<string | null>(null);
  const cam = useRef<CameraView>(null);

  if (!perm?.granted) return <Screen><H1>Camera</H1><Muted>ReLaax needs the camera to film your clip.</Muted><View className="mt-4"><Button label="Allow camera" onPress={request} /></View></Screen>;

  return (
    <View className="flex-1 bg-ink">
      <CameraView ref={cam} style={{ flex: 1 }} mode="video" facing="back">
        <View className="absolute top-14 left-5 right-5 bg-ink/60 rounded-xl p-3"><Text className="text-chalk font-semibold">{clipType?.replace("_", " ")}</Text><Text className="text-chalk/80 text-sm">Landscape, whole play in frame, 10 to 20 s.</Text></View>
      </CameraView>
      <View className="absolute bottom-10 left-5 right-5">
        {uri ? <Button label="Saved. Back to Recruit" onPress={() => router.back()} /> : (
          <Button variant={recording ? "danger" : "primary"} label={recording ? "Stop" : "Record"} onPress={async () => {
            if (recording) { cam.current?.stopRecording(); return; }
            setRecording(true);
            const v = await cam.current?.recordAsync({ maxDuration: 20 });
            setRecording(false); setUri(v?.uri ?? null);
          }} />
        )}
      </View>
    </View>
  );
}
