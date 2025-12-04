"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ExpandableButtonProps {
  label: string;
  onClick?: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
}

export function ExpandableButton({
  label,
  onClick,
  icon: Icon = Plus,
  disabled = false,
  className = "",
}: ExpandableButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative flex items-center cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      onClick={() => !disabled && onClick?.()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center overflow-hidden">
        <span
          className={`text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-all duration-300 ease-out ${
            isHovered
              ? "max-w-[120px] opacity-100 mr-2 text-amber-600"
              : "max-w-0 opacity-0 text-stone-500"
          }`}
        >
          {label}
        </span>
      </div>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
          isHovered
            ? "bg-amber-100 rotate-90"
            : "bg-stone-100"
        }`}
      >
        <Icon
          size={14}
          className={`transition-colors ${
            isHovered ? "text-amber-600" : "text-stone-500"
          }`}
        />
      </div>
    </div>
  );
}

