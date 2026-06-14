import { ShieldCheck, Camera, Wrench } from 'lucide-react';

interface ScoreAxis {
  label: string;
  score: number;
  icon: any;
  color: string;
  detail?: string;
}

interface ScoreBreakdownCardProps {
  overall: number;
  identityScore: number;
  identityStatus: string;
  completenessScore: number;
  cosmeticScore: number;
  worstSeverity: string;
  findingsCount: number;
}

export function ScoreBreakdownCard({ overall, identityScore, identityStatus, completenessScore, cosmeticScore, worstSeverity, findingsCount }: ScoreBreakdownCardProps) {
  const axes: ScoreAxis[] = [
    { label: "Identity Match", score: identityScore, icon: ShieldCheck, color: identityStatus === "match" ? "bg-[#007600]" : identityStatus === "uncertain" ? "bg-[#FF9900]" : "bg-[#CC0C39]", detail: identityStatus === "match" ? "Product verified ✓" : "Needs review" },
    { label: "Photo Coverage", score: completenessScore, icon: Camera, color: "bg-[#007185]", detail: "4/4 angles captured" },
    { label: "Cosmetic Condition", score: cosmeticScore, icon: Wrench, color: cosmeticScore >= 70 ? "bg-[#007600]" : cosmeticScore >= 40 ? "bg-[#FF9900]" : "bg-[#CC0C39]", detail: findingsCount > 0 ? `${findingsCount} issue${findingsCount > 1 ? 's' : ''} (${worstSeverity})` : "No damage detected" },
  ];

  return (
    <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded-lg p-4 space-y-3">
      {/* Overall score */}
      <div className="flex items-center justify-between border-b border-[#D5D9D9] pb-3">
        <div>
          <div className="text-[10px] text-[#565959] uppercase font-semibold">Multi-Axis Health Score</div>
          <div className="text-2xl font-black text-[#0F1111] mt-0.5">{overall}<span className="text-sm text-[#565959] font-normal">/100</span></div>
        </div>
        <div className="w-14 h-14 relative">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#E5E7EB" strokeWidth="5" />
            <circle cx="28" cy="28" r="24" fill="none" stroke={overall >= 85 ? '#007600' : overall >= 65 ? '#FF9900' : '#CC0C39'} strokeWidth="5" strokeDasharray={`${(overall / 100) * 150.8} 150.8`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{overall}%</span>
        </div>
      </div>

      {/* Axis breakdown */}
      {axes.map((axis) => {
        const Icon = axis.icon;
        return (
          <div key={axis.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-[#565959]" />
                <span className="text-xs font-semibold text-[#0F1111]">{axis.label}</span>
              </div>
              <span className="text-xs font-bold text-[#0F1111]">{axis.score}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all duration-700 ${axis.color}`} style={{ width: `${axis.score}%` }} />
            </div>
            {axis.detail && <p className="text-[9px] text-[#565959]">{axis.detail}</p>}
          </div>
        );
      })}
    </div>
  );
}
