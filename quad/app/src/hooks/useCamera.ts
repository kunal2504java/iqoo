// Camera hook using Capacitor Camera plugin (or a file input fallback for web dev)
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export interface CapturedImage {
  blob: Blob;
  dataUrl: string;
  filename: string;
}

export async function capturePhoto(): Promise<CapturedImage | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    if (!photo.dataUrl) return null;
    const blob = dataURLtoBlob(photo.dataUrl);
    const filename = `scan_${Date.now()}.jpg`;
    return { blob, dataUrl: photo.dataUrl, filename };
  } catch (e) {
    // Fallback for web / permission denied: return null so caller can use file input
    console.warn("Camera failed:", e);
    return null;
  }
}

export async function pickImage(): Promise<CapturedImage | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    });
    if (!photo.dataUrl) return null;
    const blob = dataURLtoBlob(photo.dataUrl);
    const filename = `pick_${Date.now()}.jpg`;
    return { blob, dataUrl: photo.dataUrl, filename };
  } catch (e) {
    console.warn("Photo picker failed:", e);
    return null;
  }
}

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

export function fileToCaptured(file: File): CapturedImage {
  const dataUrl = URL.createObjectURL(file);
  return { blob: file, dataUrl, filename: file.name };
}
