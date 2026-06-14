import { CheckCircle, RotateCcw, Sparkles } from 'lucide-react';

interface ReviewCapturesStepProps {
  captures: Record<string, string>; // angle → dataUrl
  videoRecorded: boolean;
  onRetake: (angle: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const ANGLE_LABELS: Record<string, string> = { front: "Front", back: "Back", left: "Left", right: "Right" };

export function ReviewCapturesStep({ captures, videoRecorded, onRetake, onSubmit, onBack }: ReviewCapturesStepProps) {
  const allCaptured = ["front", "back", "left", "right"].every(a => captures[a]);

  return (
    <div className="max-w-lg mx-auto p-4 mt-4">
      <button onClick={onBack} className="text-[#007185] hover:text-[#C7511F] text-sm hover:underline mb-4 inline-block">← Back</button>
      
      <div className="bg-white border border-[#D5D9D9] rounded-lg overflow-hidden shadow-sm">
        <div className="bg-[#E7F4E4] border-b border-[#C3E6C0] p-4 text-center">
          <CheckCircle className="w-6 h-6 text-[#007600] mx-auto mb-1" />
          <h2 className="text-base font-bold text-[#0F1111]">Review Your Photos</h2>
          <p className="text-xs text-[#565959] mt-0.5">All 4 angles captured. Check quality before AI analysis.</p>
        </div>

        <div className="p-4">
          {/* 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {(["front", "back", "left", "right"] as const).map(angle => (
              <div key={angle} className="relative group">
                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-[#D5D9D9] bg-[#F7F8F8]">
                  {captures[angle] ? (
                    <img src={captures[angle]} alt={angle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#D5D9D9] text-2xl">?</div>
                  )}
                </div>
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  {ANGLE_LABELS[angle]}
                </div>
                <button
                  onClick={() => onRetake(angle)}
                  className="absolute top-1 right-1 bg-white/90 hover:bg-white text-[#0F1111] p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Video indicator */}
          {videoRecorded && (
            <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-2 flex items-center gap-2 mb-4">
              <span className="text-lg">🎬</span>
              <span className="text-xs text-[#565959] font-medium">Walkaround video recorded</span>
              <CheckCircle className="w-3.5 h-3.5 text-[#007600] ml-auto" />
            </div>
          )}

          {/* Submit CTA */}
          <button
            onClick={onSubmit}
            disabled={!allCaptured}
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] disabled:bg-[#F0F2F2] disabled:text-[#999] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] disabled:border-[#D5D9D9] flex items-center justify-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4" /> Analyze with AI ({Object.keys(captures).length}/4 photos)
          </button>
          <p className="text-[10px] text-[#565959] text-center mt-2">
            Multi-angle AI analysis using AWS Rekognition
          </p>
        </div>
      </div>
    </div>
  );
}
