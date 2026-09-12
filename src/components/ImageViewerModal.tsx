import React from 'react';
import { Download, Sparkles, X } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  prompt?: string;
  size?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  prompt,
  size,
}) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `task-artwork-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="image-viewer-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-800 bg-stone-900/90 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold">
              {prompt ? 'Gemini High-Resolution Visual' : 'Task Photo Attachment'}
            </span>
            {size && (
              <span className="px-2 py-0.5 bg-stone-800 text-stone-300 rounded font-mono text-xs border border-stone-700">
                {size}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Image</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-hidden bg-black/50">
          <img
            src={imageUrl}
            alt={prompt || 'Task Visual'}
            referrerPolicy="no-referrer"
            className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md"
          />
        </div>

        {prompt && (
          <div className="p-4 border-t border-stone-800 bg-stone-900/90 text-xs text-stone-300">
            <span className="font-semibold text-stone-400">Prompt:</span> {prompt}
          </div>
        )}
      </div>
    </div>
  );
};
