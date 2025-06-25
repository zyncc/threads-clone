"use client";

import { AlertCircleIcon, ImageUpIcon, Loader2, XIcon } from "lucide-react";

import { useFileUpload } from "@/hooks/use-file-upload";
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from "./ui/cropper";
import { Button } from "./ui/button";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Area = { x: number; y: number; width: number; height: number };

export default function Component() {
  const maxSizeMB = 5;
  const maxSize = maxSizeMB * 1024 * 1024; // 5MB default
  const [cropData, setCropData] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept: "image/*",
    maxSize,
  });

  const previewUrl = files[0]?.preview || null;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        {/* Drop area */}
        {files.length == 0 && (
          <div
            role="button"
            onClick={openFileDialog}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-dragging={isDragging || undefined}
            className="border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none has-[input:focus]:ring-[3px]"
          >
            <input
              {...getInputProps()}
              className="sr-only"
              aria-label="Upload file"
            />
            {previewUrl ? (
              <div className="absolute inset-0">
                <img
                  src={previewUrl}
                  alt={files[0]?.file?.name || "Uploaded image"}
                  className="size-full object-cover"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
                <div
                  className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                  aria-hidden="true"
                >
                  <ImageUpIcon className="size-4 opacity-60" />
                </div>
                <p className="mb-1.5 text-sm font-medium">
                  Drop your image here or click to browse
                </p>
                <p className="text-muted-foreground text-xs">
                  Max size: {maxSizeMB}MB
                </p>
              </div>
            )}
          </div>
        )}
        {files.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <Cropper
              onCropChange={setCropData}
              className="h-80"
              image={files[0].preview!}
            >
              <CropperDescription />
              <CropperImage />
              <CropperCropArea className="rounded-full" />
            </Cropper>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setOpen(false)}
                disabled={loading}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  const formData = new FormData();
                  formData.append("avatar", files[0].file as File);
                  formData.append("crop", JSON.stringify(cropData));
                  const getAvatar = await fetch("/api/user/avatar", {
                    method: "POST",
                    body: formData,
                  });
                  const url = await getAvatar.text();
                  authClient.updateUser({
                    image: url,
                    fetchOptions: {
                      onSuccess: () => {
                        setLoading(false);
                        setOpen(false);
                        router.refresh();
                        toast.success("Avatar updated successfully");
                      },
                    },
                  });
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Save
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        )}
        {previewUrl && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
              onClick={() => removeFile(files[0]?.id)}
              aria-label="Remove image"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          className="text-destructive flex items-center gap-1 text-xs"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  );
}
