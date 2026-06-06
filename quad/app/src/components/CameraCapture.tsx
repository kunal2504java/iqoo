import { useState, useRef, type ChangeEvent } from "react";
import { Camera as CameraIcon, Image as ImageIcon, X } from "lucide-react";
import { capturePhoto, pickImage, fileToCaptured, type CapturedImage } from "../hooks/useCamera";

interface Props {
  onCapture: (img: CapturedImage) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState<CapturedImage | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCamera = async () => {
    const img = await capturePhoto();
    if (img) {
      setPreview(img.dataUrl);
      setPending(img);
    } else {
      // Trigger fallback file input
      fileRef.current?.click();
    }
  };

  const handlePick = async () => {
    const img = await pickImage();
    if (img) {
      setPreview(img.dataUrl);
      setPending(img);
    } else {
      fileRef.current?.click();
    }
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = fileToCaptured(file);
    setPreview(img.dataUrl);
    setPending(img);
  };

  const confirm = () => {
    if (pending) onCapture(pending);
  };

  if (preview) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative aspect-[3/4] w-full overflow-hidden border border-hairline">
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          <button
            onClick={() => { setPreview(null); setPending(null); }}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center bg-canvas/80 text-ink"
            aria-label="Clear"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost flex-1" onClick={() => { setPreview(null); setPending(null); }}>Retake</button>
          <button className="btn btn-fill flex-1" onClick={confirm}>Use this</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button className="btn btn-fill h-14 gap-2" onClick={handleCamera}>
        <CameraIcon size={20} />
        Take a photo
      </button>
      <button className="btn btn-ghost h-14 gap-2" onClick={handlePick}>
        <ImageIcon size={20} />
        Pick from gallery
      </button>
      <button className="btn btn-ghost h-10 gap-2" onClick={onCancel}>
        <X size={18} />
        Cancel
      </button>
    </div>
  );
}
