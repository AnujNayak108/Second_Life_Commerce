import { useState } from 'react';
import { ShieldCheck, CheckCircle, Edit3 } from 'lucide-react';

interface IdentityConfirmStepProps {
  productName: string;
  productIcon?: string;
  productCategory?: string;
  onConfirm: (confirmed: boolean, overrideNote?: string) => void;
  onBack: () => void;
}

export function IdentityConfirmStep({ productName, productIcon, productCategory, onConfirm, onBack }: IdentityConfirmStepProps) {
  const [showOverride, setShowOverride] = useState(false);
  const [overrideNote, setOverrideNote] = useState('');

  return (
    <div className="max-w-lg mx-auto p-4 mt-6">
      <button onClick={onBack} className="text-[#007185] hover:text-[#C7511F] text-sm hover:underline mb-4 inline-block">← Back to orders</button>
      
      <div className="bg-white border border-[#D5D9D9] rounded-lg overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-[#232F3E] p-5 text-white text-center">
          <ShieldCheck className="w-8 h-8 text-[#FF9900] mx-auto mb-2" />
          <h2 className="text-lg font-bold">Product Identity Verification</h2>
          <p className="text-sm text-[#CCC] mt-1">Step 1 of 6 — Confirm what you're selling</p>
        </div>

        <div className="p-5 space-y-5">
          {/* Product card */}
          <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded-lg p-4 flex items-center gap-4">
            <div className="w-16 h-16 bg-white border border-[#D5D9D9] rounded-lg flex items-center justify-center text-3xl shrink-0">
              {productIcon || '📦'}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0F1111] leading-snug">{productName}</h3>
              {productCategory && (
                <span className="text-[10px] bg-[#F0F2F2] border border-[#D5D9D9] text-[#565959] font-medium px-2 py-0.5 rounded mt-1 inline-block">
                  {productCategory}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-[#565959]">
            Is the item you're about to scan the same product shown above?
          </p>

          {/* Override input */}
          {showOverride && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0F1111]">Describe the correct product:</label>
              <textarea
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="E.g., 'It's actually a Sony WH-1000XM4 (older model)'"
                className="w-full border border-[#D5D9D9] rounded p-3 text-sm outline-none focus:border-[#FF9900] resize-none h-16"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            {!showOverride ? (
              <>
                <button onClick={() => onConfirm(true)} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] flex items-center justify-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-[#007600]" /> Yes, this is correct
                </button>
                <button onClick={() => setShowOverride(true)} className="w-full bg-[#F0F2F2] hover:bg-[#E3E6E6] text-[#0F1111] font-medium py-2.5 rounded-full border border-[#D5D9D9] flex items-center justify-center gap-2 text-sm">
                  <Edit3 className="w-4 h-4" /> No, let me describe it
                </button>
              </>
            ) : (
              <button onClick={() => onConfirm(false, overrideNote)} disabled={!overrideNote.trim()} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] disabled:bg-[#F0F2F2] disabled:text-[#999] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] disabled:border-[#D5D9D9] text-sm">
                Continue with correction
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
