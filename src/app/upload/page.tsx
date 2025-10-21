"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import confetti from "canvas-confetti";

export default function ImageUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");
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
    setProcessingStage("Uploading your menu...");

    try {
      // Step 1: Upload the image
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        alert(`Upload failed: ${uploadData.error}`);
        return;
      }

      setUploadedUrl(uploadData.url);
      setUploading(false);

      // Step 2: Process the menu with AI
      setProcessing(true);
      setProcessingStage("Reading your menu...");

      // Convert public URL to local file path for processing
      const localPath = `public${uploadData.url}`;

      const processResponse = await fetch("/api/processMenu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          localFilePath: localPath,
        }),
      });

      const menuData = await processResponse.json();

      // Log the response from processMenu API
      console.log('processMenu API Response:', menuData);
      console.log('Menu items extracted:', menuData.length ? `${menuData.length} items` : 'No items');

      if (!processResponse.ok) {
        alert(`Menu processing failed: ${menuData.error}`);
        setProcessing(false);
        return;
      }

      // Check if menu items array is empty
      if (!menuData || !Array.isArray(menuData) || menuData.length === 0) {
        alert('We couldn\'t find any menu items in your image. Please make sure the image contains a clear menu and try again.');
        setProcessing(false);
        setUploading(false);
        return;
      }

      // Store menu items in localStorage for the quiz
      localStorage.setItem('menuItems', JSON.stringify(menuData));
      console.log('Menu items stored in localStorage');

      setProcessingStage("Creating your personalized questions...");

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Success - show confetti and navigate
      setProcessing(false);
      triggerConfettiAndNavigate();

    } catch (error) {
      console.error("Upload/processing error:", error);
      alert("Something went wrong!");
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className={`min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

      {/* Sign Out button */}
      <SignOutButton redirectUrl="/">
        <button className="absolute top-8 left-8 text-white/60 hover:text-white transition-colors z-20">
          ← Sign Out
        </button>
      </SignOutButton>

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
          {preview && !processing && (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading || processing}
              className="w-full bg-white text-black hover:bg-white/90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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

          {/* Processing Animation */}
          {processing && (
            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  {/* Animated circles */}
                  <div className="w-24 h-24 relative">
                    <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-4 border-transparent border-t-green-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-white font-semibold text-xl mb-2">
                    {processingStage}
                  </p>
                  <p className="text-white/60 text-sm">
                    This will only take a moment
                  </p>
                </div>

                {/* Progress dots */}
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
