import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Check,
  Download,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { Task } from '../types';

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTask: Task | null;
  onApplyImageToTask: (taskId: string, imageUrl: string, prompt: string, imageSize: '1K' | '2K' | '4K') => void;
}

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
  isOpen,
  onClose,
  targetTask,
  onApplyImageToTask,
}) => {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '3:4'>('16:9');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (targetTask) {
      setPrompt(
        targetTask.imagePrompt ||
          `Modern aesthetic illustration representing ${targetTask.title}, clean minimal composition, soft lighting, 4k detail`
      );
      if (targetTask.imageUrl) {
        setGeneratedImage(targetTask.imageUrl);
        if (targetTask.imageSize) {
          setImageSize(targetTask.imageSize);
        }
      } else {
        setGeneratedImage(null);
      }
    } else {
      setPrompt('A tranquil minimalist desk with a journal, warm morning light, productivity workspace, highly detailed');
      setGeneratedImage(null);
    }
    setError(null);
    setApplied(false);
  }, [targetTask, isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for the image.');
      return;
    }

    setLoading(true);
    setError(null);
    setApplied(false);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageSize,
          aspectRatio,
          model: 'gemini-3-pro-image-preview',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        throw new Error('No image was returned from the server.');
      }
    } catch (err: unknown) {
      console.error('Image generation error:', err);
      const msg = err instanceof Error ? err.message : 'An error occurred during image generation.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (targetTask && generatedImage) {
      onApplyImageToTask(targetTask.id, generatedImage, prompt, imageSize);
      setApplied(true);
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `task-visual-${imageSize.toLowerCase()}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stylePresets = [
    'Minimalist 3D Render',
    'Warm Cinematic Photography',
    'Studio Watercolor Painting',
    'Clean Vector Isometric',
    'Cozy Lo-Fi Aesthetic',
  ];

  return (
    <div
      id="image-gen-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        id="image-gen-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Generate High-Resolution Task Visual
              </h3>
              <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                <span>Model:</span>
                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-semibold rounded text-[10px] border border-indigo-200">
                  gemini-3-pro-image-preview
                </span>
              </p>
            </div>
          </div>
          <button
            id="btn-close-image-gen"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {targetTask && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <span className="text-stone-500 font-medium">Target Task:</span>{' '}
                <span className="font-semibold text-stone-900 truncate">{targetTask.title}</span>
              </div>
              <span className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded-md font-medium shrink-0">
                {targetTask.priority} priority
              </span>
            </div>
          )}

          {/* Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="image-prompt-input" className="text-xs font-semibold text-stone-700">
                Visual Concept Prompt *
              </label>
              <span className="text-[11px] text-stone-400">Describe the scene or metaphor</span>
            </div>
            <textarea
              id="image-prompt-input"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A serene mountain path with glowing sunrise, symbol of endurance, digital art style..."
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all resize-none"
            />

            {/* Inspiration presets */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[11px] text-stone-400 font-medium mr-1">Add Style:</span>
              {stylePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPrompt((prev) => `${prev.trim()}, ${preset.toLowerCase()}`)}
                  className="px-2 py-1 text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md transition-colors"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Required Affordance: Image Size Selector (1K, 2K, 4K) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">
                Image Resolution (Size) *
              </label>
              <span className="text-[11px] text-indigo-700 font-medium">
                High-Resolution Pro Rendering
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5" id="image-size-selector">
              {(['1K', '2K', '4K'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  id={`btn-size-${size}`}
                  onClick={() => setImageSize(size)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    imageSize === size
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{size}</span>
                    {imageSize === size && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {size === '1K' && 'Standard HD (1024px)'}
                    {size === '2K' && 'Quad HD (2048px)'}
                    {size === '4K' && 'Ultra High-Res (4096px)'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['16:9', '1:1', '4:3', '3:4'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    aspectRatio === ratio
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Generation Failed</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Generated Image Preview Area */}
          {loading ? (
            <div className="py-12 px-4 rounded-xl border border-stone-200 bg-stone-50 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-stone-800">
                Rendering {imageSize} Artwork...
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm">
                Generating high-fidelity visual with gemini-3-pro-image-preview. This will take a few seconds.
              </p>
            </div>
          ) : generatedImage ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  Generated Result ({imageSize} Resolution)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-stone-200 shadow-sm bg-stone-900 flex items-center justify-center max-h-[300px]">
                <img
                  src={generatedImage}
                  alt={prompt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain max-h-[300px]"
                />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white font-mono text-[10px] rounded backdrop-blur-xs">
                  {imageSize} • {aspectRatio}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-stone-50/50">
          <div className="text-xs text-stone-500">
            {imageSize === '4K' ? '⚡ 4K Ultra detail requested' : `${imageSize} resolution selected`}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-200 rounded-xl transition-colors"
            >
              Close
            </button>

            {generatedImage && targetTask && (
              <button
                type="button"
                id="btn-apply-image-to-task"
                onClick={handleApply}
                disabled={applied}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {applied ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{applied ? 'Artwork Applied!' : 'Attach to Task'}</span>
              </button>
            )}

            <button
              id="btn-generate-image-submit"
              type="button"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  {generatedImage ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{generatedImage ? `Regenerate (${imageSize})` : `Generate (${imageSize})`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
