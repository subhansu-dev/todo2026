import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  UploadCloud,
  X,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  SwitchCamera,
} from 'lucide-react';

interface TaskPhotoAttachmentProps {
  imageUrl?: string;
  imageSource?: 'upload' | 'camera' | 'gemini';
  onPhotoChange: (url: string | undefined, source?: 'upload' | 'camera') => void;
}

export const TaskPhotoAttachment: React.FC<TaskPhotoAttachmentProps> = ({
  imageUrl,
  imageSource = 'upload',
  onPhotoChange,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to optimize and resize images so localStorage doesn't overflow
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 1400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onPhotoChange(compressedDataUrl, 'upload');
        }
      };
      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
    // Reset file input value so re-selecting same file triggers change
    if (e.target) {
      e.target.value = '';
    }
  };

  // Drag and Drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Start camera stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);
    setIsCameraActive(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or device.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.error('Camera initialization error:', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to access camera. Please verify camera permissions in your browser.';
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture frame from live video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      onPhotoChange(capturedDataUrl, 'camera');
    }

    stopCamera();
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Cleanup camera stream when unmounted
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div id="task-photo-attachment-container" className="space-y-2 mt-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
          <span>Task Photo (File or Camera)</span>
        </label>
        <span className="text-[11px] text-stone-400">Optional attachment</span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id="task-photo-file-input"
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Camera Live Viewfinder when camera is active */}
      {isCameraActive ? (
        <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 p-2 animate-in zoom-in-95 duration-200">
          <div className="relative aspect-video max-h-60 w-full overflow-hidden rounded-xl bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Viewfinder corner guides */}
            <div className="absolute inset-4 pointer-events-none border border-white/30 rounded-lg flex items-center justify-center">
              <span className="text-white/60 text-xs font-mono bg-black/40 px-2 py-0.5 rounded">
                Align subject
              </span>
            </div>
          </div>

          {/* Camera controls toolbar */}
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <button
              type="button"
              onClick={toggleFacingMode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors"
              title="Switch Front/Back Camera"
            >
              <SwitchCamera className="w-4 h-4" />
              <span className="hidden sm:inline">Flip</span>
            </button>

            {/* Shutter capture button */}
            <button
              type="button"
              id="btn-capture-photo-shutter"
              onClick={capturePhoto}
              className="w-12 h-12 rounded-full border-4 border-white bg-rose-600 hover:bg-rose-500 shadow-lg flex items-center justify-center transition-transform active:scale-95"
              title="Capture Photo"
            >
              <div className="w-4 h-4 rounded-full bg-white" />
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      ) : imageUrl ? (
        /* Attached Photo Preview */
        <div className="relative rounded-xl border border-stone-200 bg-stone-50 p-2.5 flex items-center gap-3">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-stone-300 bg-stone-200 shrink-0">
            <img
              src={imageUrl}
              alt="Attached to task"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900 truncate">
                Photo Attached
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 uppercase">
                {imageSource === 'camera' ? 'Camera Capture' : 'Uploaded File'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              This photo will be displayed directly on your task card.
            </p>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                Change File
              </button>
              <span className="text-stone-300">•</span>
              <button
                type="button"
                onClick={() => startCamera()}
                className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 flex items-center gap-1 hover:underline"
              >
                <Camera className="w-3 h-3" />
                Retake with Camera
              </button>
            </div>
          </div>

          <button
            type="button"
            id="btn-remove-task-photo"
            onClick={() => onPhotoChange(undefined)}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-200/60 rounded-lg transition-colors shrink-0"
            title="Remove Photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Action buttons & Drag-and-drop zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-stone-300 bg-stone-50/60 hover:bg-stone-50'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            {/* File Upload Button */}
            <button
              type="button"
              id="btn-upload-photo-file"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl shadow-2xs transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
              <span>Choose from Files</span>
            </button>

            <span className="text-xs text-stone-400 font-medium">or</span>

            {/* Camera Capture Button */}
            <button
              type="button"
              id="btn-open-camera-capture"
              onClick={() => startCamera()}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl shadow-2xs transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>Take Photo with Camera</span>
            </button>
          </div>

          <p className="text-[11px] text-stone-400 mt-2">
            Drag & drop an image here, or snap a photo directly with your device camera.
          </p>

          {cameraError && (
            <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
