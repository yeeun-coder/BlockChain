import React, { useState } from 'react';
import { Heart, Calendar, MessageSquare, Plus } from 'lucide-react';

export default function SupporterWall({ tips }) {
  const [visibleCount, setVisibleCount] = useState(5); // Default to showing 5 tips

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const gradients = [
    'from-purple-600 to-indigo-600',
    'from-pink-600 to-rose-600',
    'from-emerald-600 to-teal-600',
    'from-blue-600 to-cyan-600',
    'from-amber-600 to-orange-600',
  ];

  const getGradientForAddress = (addr) => {
    if (!addr) return gradients[0];
    const num = parseInt(addr.substring(addr.length - 4), 16) || 0;
    return gradients[num % gradients.length];
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  // Sort tips by timestamp (newest first)
  const sortedTips = [...tips].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  const displayedTips = sortedTips.slice(0, visibleCount);

  return (
    <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-xl border border-slate-700/50 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400">
            <Heart className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white m-0">Supporter Wall</h2>
        </div>

        {tips.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-500 text-sm">No support tips received yet.</p>
            <p className="text-slate-600 text-xs mt-1">Be the first to show support!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedTips.map((tip, idx) => {
              const gradient = getGradientForAddress(tip.sender);
              const formattedDate = new Date(Number(tip.timestamp) * 1000).toLocaleString();

              return (
                <div 
                  key={idx} 
                  className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 transition-all duration-200 text-left"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar Icon */}
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center shrink-0 shadow-md`}>
                      <span className="text-xs font-bold text-white uppercase">{tip.name.charAt(0)}</span>
                    </div>

                    {/* Supporter details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="font-bold text-slate-200 text-sm sm:text-base mr-2">{tip.name}</span>
                          <span className="text-[10px] sm:text-xs text-slate-500 font-mono">({truncateAddress(tip.sender)})</span>
                        </div>
                        <div className="inline-flex items-center bg-purple-500/10 text-purple-400 text-xs font-bold px-2.5 py-1 rounded-full w-fit">
                          {tip.amount} ETH
                        </div>
                      </div>

                      {/* Message and Timestamp */}
                      <p className="text-sm text-slate-300 mt-2 flex items-start gap-1.5 break-words m-0">
                        <MessageSquare className="w-4 h-4 shrink-0 text-indigo-400/70 mt-0.5" />
                        <span>{tip.message}</span>
                      </p>
                      
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {tips.length > visibleCount && (
        <button
          onClick={handleLoadMore}
          className="mt-6 w-full flex items-center justify-center gap-1.5 py-3 border border-slate-700/60 hover:border-slate-500 hover:bg-slate-900/40 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Load More Supporters</span>
        </button>
      )}
    </div>
  );
}
