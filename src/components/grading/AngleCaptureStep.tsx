import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, RotateCcw, CheckCircle } from 'lucide-react';

const VIDEO_CONSTRAINTS = { width: 640, height: 480, facingMode: "environment" };

const ANGLE_GUIDES: Record<string, { label: string; instruction: string; icon: string }> = {
  front: { label: "Front", instruction: "Show the front face of the product", icon: "📸" },
  back: { label: "Back", instruction: "Flip the item — show the back panel", icon: "🔄" },
  left: { label: "Left Side", instruction: "Show the left side profile", icon: "◀️" },
  right: { label: "Right Side", instruction: "Show the right side profile", icon: "▶️" },
};

interface AngleCaptureStepProps {
  angle: 'front' | 'back' | 'left' | 'right';
  stepNumber: number;
  totalSteps: number;
  existingPreview?: string;
  onCaptured: (dataUrl: string) => void;
  onBack: () => void;
}

export function AngleCaptureStep({ angle, stepNumber, totalSteps, existingPreview, onCaptured, onBack }: AngleCaptureStepProps) {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const guide = ANGLE_GUIDES[angle];

  // Capture and immediately advance to next step
  const handleCapture = useCallback(() => {
    const img = webcamRef.current?.getScreenshot('image/jpeg');
    if (!img) { setError("Could not capture. Check camera access."); return; }
    setError(null);
    // Immediately pass to parent — parent will advance to next angle
    onCaptured(img);
  }, [onCaptured]);

  // File upload and immediately advance
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) { setError("File too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      onCaptured(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [onCaptured]);

  // If we already have a preview from a previous capture, show it briefly with option to retake
  if (existingPreview) {
    return (
      <div className="min-h-[calc(100vh-150px)] bg-[#0F1111] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-between mb-2">
            <button onClick={onBack} className="text-[#CCC] text-sm hover:text-white">← Back</button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#888]">Step {stepNumber}/{totalSteps}</span>
              <div className="flex gap-1">{Array.from({ length: totalSteps }, (_, i) => (<div key={i} className={`w-6 h-1.5 rounded-full ${i < stepNumber ? 'bg-[#FF9900]' : 'bg-gray-700'}`} />))}</div>
            </div>
          </div>
          <div className="text-center">
            <span className="text-2xl">{guide.icon}</span>
            <h2 className="text-lg font-bold mt-1">{guide.label} ✓</h2>
          </div>
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border-2 border-[#007600]">
            <img src={existingPreview} alt={angle} className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 bg-[#007600] text-white rounded-full p-1"><CheckCircle className="w-4 h-4" /></div>
          </div>
          <button onClick={() => onCaptured(existingPreview)} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3 rounded-full text-sm">
            Keep & Continue →
          </button>
          <button onClick={onBack} className="w-full bg-white/10 hover:bg-white/15 text-white font-medium py-2.5 rounded-full text-xs border border-white/20 flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" /> Retake this angle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-150px)] bg-[#0F1111] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Progress */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={onBack} className="text-[#CCC] text-sm hover:text-white">← Back</button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#888]">Step {stepNumber}/{totalSteps}</span>
            <div className="flex gap-1">{Array.from({ length: totalSteps }, (_, i) => (<div key={i} className={`w-6 h-1.5 rounded-full ${i < stepNumber ? 'bg-[#FF9900]' : 'bg-gray-700'}`} />))}</div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <span className="text-3xl">{guide.icon}</span>
          <h2 className="text-lg font-bold mt-2">Capture {guide.label}</h2>
          <p className="text-sm text-[#CCC] mt-1">{guide.instruction}</p>
        </div>

        {/* Camera */}
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border-2 border-dashed border-[#FF9900]/40 bg-black/50">
          <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" screenshotQuality={0.7} videoConstraints={VIDEO_CONSTRAINTS} className="w-full h-full object-cover" mirrored />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-52 h-40 border border-white/20 flex flex-col justify-between p-1">
              <div className="flex justify-between w-full">
                <div className="w-4 h-4 border-t-2 border-l-2 border-[#FF9900]" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-[#FF9900]" />
              </div>
              <div className="flex justify-between w-full">
                <div className="w-4 h-4 border-b-2 border-l-2 border-[#FF9900]" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-[#FF9900]" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 left-0 w-full text-center text-[11px] text-white/80 font-medium bg-black/40 py-1">
            {guide.instruction} — tap Capture when ready
          </div>
        </div>

        {error && <p className="text-[#CC0C39] text-xs text-center">{error}</p>}

        {/* Capture button — immediately advances on click */}
        <button onClick={handleCapture} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3.5 rounded-full flex items-center justify-center gap-2 text-sm shadow-lg">
          <Camera className="w-5 h-5" /> Capture {guide.label} →
        </button>
        
        <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white/10 hover:bg-white/15 text-white font-medium py-2.5 rounded-full flex items-center justify-center gap-2 text-xs border border-white/20">
          <Upload className="w-4 h-4" /> Or upload from gallery
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
      </div>
    </div>
  );
}
