import React from "react";
import { TrendingUp, TrendingDown, Twitter } from "lucide-react";

interface NewsCardProps {
  text: string;
  sentiment: 'positive' | 'negative';
}

export const NewsCard: React.FC<NewsCardProps> = ({ text, sentiment }) => {
  return (
    <div className={`
       max-w-[240px] p-3 rounded-xl border backdrop-blur-md shadow-xl flex gap-3
       ${sentiment === 'positive' 
          ? 'bg-emerald-900/60 border-emerald-500/30 text-emerald-100' 
          : 'bg-red-900/60 border-red-500/30 text-red-100'}
    `}>
       <div className={`p-1.5 rounded-full h-fit ${sentiment === 'positive' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
          {sentiment === 'positive' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
       </div>
       <div>
          <div className="flex items-center gap-2 mb-0.5 opacity-70">
             <Twitter size={10} />
             <span className="text-[9px] uppercase tracking-wider">CryptoTwitter • Now</span>
          </div>
          <p className="text-xs font-medium leading-tight">{text}</p>
       </div>
    </div>
  );
};

