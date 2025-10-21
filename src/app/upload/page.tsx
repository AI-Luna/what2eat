"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

export default function ImageUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setUploadedUrl(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerConfettiAndNavigate = () => {
    // Create a single large burst of green confetti from the bottom
    const count = 200;
    const defaults = {
      origin: { y: 1 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
      shapes: ['circle', 'square'],
      scalar: 2.5, // Makes particles larger
      gravity: 0.8,
      decay: 0.9,
      startVelocity: 60,
      ticks: 400
    };

    // Fire confetti from bottom left
    confetti({
      ...defaults,
      particleCount: count / 2,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 1 }
    });

    // Fire confetti from bottom right
    confetti({
      ...defaults,
      particleCount: count / 2,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 1 }
    });

    // Start fade out after 1.5 seconds
    setTimeout(() => {
      setFadeOut(true);
    }, 1500);

    // Navigate after 2.5 seconds (after fade out)
    setTimeout(() => {
      router.push('/quiz');
    }, 2500);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadedUrl(data.url);
        // Trigger confetti and navigation
        triggerConfettiAndNavigate();
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

      {/* Back to home link */}
      <Link
        href="/"
        className="absolute top-8 left-8 text-white/60 hover:text-white transition-colors z-20"
      >
        ← Back to Home
      </Link>

      <div className="max-w-3xl w-full relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            Upload Your Menu
          </h1>
          <p className="text-xl text-white/60">
            Share your restaurant menu and let AI help you decide
          </p>
        </div>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              isDragging
                ? "border-white bg-white/10 scale-105"
                : preview
                ? "border-white/30 bg-white/5"
                : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />

            {!preview ? (
              <label
                htmlFor="file-upload"
                className="cursor-pointer block"
              >
                <div className="space-y-4">
                  <div className="mx-auto w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-white/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl text-white font-medium mb-2">
                      Drop your image here, or click to browse
                    </p>
                    <p className="text-white/40 text-sm">
                      Supports: JPG, PNG, GIF
                    </p>
                  </div>
                </div>
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative group">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-full h-auto max-h-96 mx-auto rounded-xl shadow-2xl"
                  />
                  <label
                    htmlFor="file-upload"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl flex items-center justify-center"
                  >
                    <span className="text-white font-medium">Click to change image</span>
                  </label>
                </div>
                <p className="text-white/60 text-sm">{selectedFile?.name}</p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {preview && (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-white text-black hover:bg-white/90 transition-all transform hover:scale-105"
              size="lg"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Uploading...
                </span>
              ) : (
                "Upload Image"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
