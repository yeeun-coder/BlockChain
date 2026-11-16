import React from 'react';
import { Landmark, Users, User, ExternalLink } from 'lucide-react';

export default function Dashboard({ totalEth, totalSupporters, ownerAddress }) {
  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total ETH Vaulted Card */}
      <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex items-center gap-5">
        <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl text-purple-400">
          <Landmark className="w-6 h-6" />
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider m-0">Total ETH Vaulted</p>
          <p className="text-2xl md:text-3xl font-extrabold text-white mt-1 text-glow">
            {parseFloat(totalEth).toFixed(5)} <span className="text-purple-400 text-lg font-bold">ETH</span>
          </p>
        </div>
      </div>

      {/* Total Supporters Card */}
      <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex items-center gap-5">
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-indigo-400">
          <Users className="w-6 h-6" />
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider m-0">Total Supporters</p>
          <p className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            {totalSupporters}
          </p>
        </div>
      </div>

      {/* Contract Owner Card */}
      <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex items-center gap-5">
        <div className="bg-pink-500/10 border border-pink-500/20 p-4 rounded-xl text-pink-400">
          <User className="w-6 h-6" />
        </div>
        <div className="text-left overflow-hidden w-full">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider m-0">Vault Owner</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-sm md:text-base font-bold text-slate-200 truncate">
              {ownerAddress ? truncateAddress(ownerAddress) : 'Fetching...'}
            </span>
            {ownerAddress && (
              <a
                href={`https://sepolia.etherscan.io/address/${ownerAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors duration-150"
                title="View on Etherscan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
