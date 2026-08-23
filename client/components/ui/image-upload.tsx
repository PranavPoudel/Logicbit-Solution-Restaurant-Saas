// components/ui/image-upload.tsx
"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadMedia } from "@/lib/api/media";

interface ImageUploadProps {
  restaurantId: string;
  value?: string;
  onChange: (url: string, mediaId?: string) => void;
  onRemove?: () => void;
  className?: string;
  label?: string;
}

const MAX_SIZE_MB = 5;

export function ImageUpload({
  restaurantId,
  value,
  onChange,
  onRemove,
  className = "w-full h-40",
  label = "Upload image",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError("Image must be under " + MAX_SIZE_MB + "MB.");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadMedia(file, restaurantId);
      const url = result?.url ?? URL.createObjectURL(file);
      onChange(url, result?.id);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className={"relative rounded-xl overflow-hidden group " + className}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs font-medium bg-white text-neutral-800 px-3 py-1.5 rounded-md"
            >
              Replace
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="w-7 h-7 rounded-full bg-white text-red-600 flex items-center justify-center"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          disabled={isUploading}
          className={
            "flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-colors " +
            className +
            " " +
            (isDragging
              ? "border-[#E3A008] bg-[#E3A008]/5"
              : "border-neutral-200 hover:border-neutral-300 bg-neutral-50")
          }
        >
          {isUploading ? (
            <Loader2 size={20} className="text-neutral-400 animate-spin" />
          ) : (
            <>
              <ImagePlus size={20} className="text-neutral-400" />
              <span className="text-xs text-neutral-500">{label}</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}