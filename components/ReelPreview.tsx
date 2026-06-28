"use client";

import { useState } from "react";

export default function ReelPreview({
  hookType,
  voice,
  script,
  pacing,
  status,
}: {
  hookType: string;
  voice: string;
  script: string;
  pacing: string;
  status: "winning" | "running" | "killed";
}) {
  const [expanded, setExpanded] = useState(false);

  const gradients: Record<string, string> = {
    "pain-point": "from-red-500/80 to-orange-600/80",
    "statistic": "from-blue-500/80 to-cyan-600/80",
    "question": "from-purple-500/80 to-pink-600/80",
    "contrarian": "from-amber-500/80 to-yellow-600/80",
  };
  const bg = gradients[hookType] ?? "from-gray-500/80 to-gray-600/80";

  const pacingSpeed = pacing === "fast" ? "2s" : pacing === "slow" ? "6s" : "4s";

  return (
    <div
      className={`relative w-full aspect-[9/16] rounded-[14px] mb-3 overflow-hidden cursor-pointer group ${
        status === "killed" ? "grayscale opacity-60" : ""
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Animated gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${bg}`}
        style={{
          animation: `reelShimmer ${pacingSpeed} ease-in-out infinite alternate`,
        }}
      />

      {/* Scan line effect */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
        }}
      />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
        {/* Top: hook type + voice */}
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
            {hookType}
          </span>
          <span className="rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium">
            {voice}
          </span>
        </div>

        {/* Center: play icon */}
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <polygon points="6,3 17,10 6,17" />
            </svg>
          </div>
        </div>

        {/* Bottom: script preview */}
        <div>
          <p className={`text-[11px] leading-relaxed text-white/90 ${expanded ? "" : "line-clamp-3"}`}>
            &ldquo;{script}&rdquo;
          </p>
          <p className="text-[9px] text-white/50 mt-2 uppercase tracking-wider">
            {pacing} pacing
          </p>
        </div>
      </div>
    </div>
  );
}
