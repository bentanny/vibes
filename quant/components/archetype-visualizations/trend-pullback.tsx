"use client";

import React from "react";

export function TrendPullbackVisualization() {
  return (
    <div className="w-full bg-stone-50 rounded-xl border border-stone-100/50 p-8 mb-8 relative overflow-hidden flex flex-col items-center">
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
          Logic Visualization
        </span>
      </div>

      {/* Schematic SVG */}
      <svg
        viewBox="0 0 400 160"
        className="w-full max-w-lg h-40 overflow-visible z-10"
      >
        {/* Grid Lines */}
        <g stroke="#e5e7eb" strokeWidth="1">
          <line x1="0" y1="40" x2="400" y2="40" strokeDasharray="4 4" />
          <line x1="0" y1="80" x2="400" y2="80" strokeDasharray="4 4" />
          <line x1="0" y1="120" x2="400" y2="120" strokeDasharray="4 4" />
        </g>

        {/* Primary Trend (Dashed guide) */}
        <line
          x1="50"
          y1="140"
          x2="350"
          y2="20"
          stroke="#d6d3d1"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* Price Action Path */}
        <path
          d="M 50 140 
             C 80 120, 100 110, 130 90 
             S 150 70, 170 100 
             C 180 115, 190 115, 210 80
             S 300 40, 350 20"
          fill="none"
          stroke="#57534e"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pullback/Entry Highlight */}
        <g className="animate-[pulse_3s_ease-in-out_infinite]">
          <circle
            cx="178"
            cy="105"
            r="20"
            fill="rgba(245, 158, 11, 0.1)"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <circle cx="178" cy="105" r="4" fill="#f59e0b" />
        </g>

        {/* Annotations */}
        <text
          x="90"
          y="85"
          className="text-[10px] fill-stone-400 font-sans font-medium uppercase tracking-wide"
        >
          Impulse
        </text>
        <text
          x="178"
          y="145"
          textAnchor="middle"
          className="text-[10px] fill-amber-600 font-bold font-sans uppercase tracking-wide"
        >
          Correction Entry
        </text>
        <line
          x1="178"
          y1="125"
          x2="178"
          y2="135"
          stroke="#f59e0b"
          strokeWidth="1"
        />

        <text
          x="280"
          y="45"
          className="text-[10px] fill-stone-400 font-sans font-medium uppercase tracking-wide"
        >
          Continuation
        </text>
      </svg>

      {/* Background Gradient for Depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
