import React from 'react';
import { Wallet, LogOut, ShieldAlert, Cpu } from 'lucide-react';

export default function Header({ account, balance, network, isCorrectNetwork, connectWallet, disconnectWallet }) {
  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg rounded-2xl mb-8">
      {/* Brand Logo & Info */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-2.5 rounded-xl shadow-glow animate-float">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div className="text-left">
          <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 m-0 tracking-tight">
            Ether<span className="text-purple-400">Vault</span>
          </h1>
          <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold m-0">Web3 Support Platform</p>
        </div>
      </div>

      {/* Connection and Network Status */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4 justify-center">
        {/* Network Badge */}
        {network && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            isCorrectNetwork 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
          }`}>
            {!isCorrectNetwork && <ShieldAlert className="w-3.5 h-3.5" />}
            <span>Network: {network}</span>
          </div>
        )}

        {/* Connect Button or Account Info */}
        {account ? (
          <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-xl overflow-hidden shadow-md">
            <div className="px-3.5 py-2 text-xs md:text-sm font-medium text-slate-300 border-r border-slate-700/60">
              <span className="hidden sm:inline text-slate-400 font-normal mr-1">Balance:</span>
              <span className="text-purple-400 font-bold">{parseFloat(balance).toFixed(4)} ETH</span>
            </div>
            <div className="px-3.5 py-2 text-xs md:text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow shadow-emerald-500 animate-pulse-slow"></span>
              {truncateAddress(account)}
            </div>
            <button
              onClick={disconnectWallet}
              className="p-2 py-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200"
              title="Disconnect Wallet"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/20 hover:shadow-purple-500/35 transition-all duration-300 transform active:scale-95"
          >
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
}
