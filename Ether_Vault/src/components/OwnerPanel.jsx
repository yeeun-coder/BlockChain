import React, { useState } from 'react';
import { Landmark, ArrowUpRight, Loader, AlertTriangle, CheckCircle } from 'lucide-react';

export default function OwnerPanel({ contractBalance, onWithdraw, error, successMsg, clearStatus }) {
  const [txState, setTxState] = useState('idle'); // idle, checking, pending, success, error

  const handleWithdraw = async () => {
    if (parseFloat(contractBalance) <= 0) return;
    setTxState('checking');
    clearStatus();

    try {
      await onWithdraw((state) => {
        setTxState(state);
      });
    } catch (err) {
      setTxState('error');
    }
  };

  return (
    <div className="glass-panel p-6 md:p-8 rounded-3xl border border-purple-500/20 shadow-xl mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white m-0">Creator Admin Panel</h2>
              <span className="text-[10px] bg-purple-500/15 text-purple-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">
                Vault Owner Access
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-2 m-0">
            You are connected as the contract owner. You can withdraw the accumulated support funds from the vault.
          </p>
        </div>

        <div className="w-full sm:w-auto shrink-0 flex flex-col items-start sm:items-end gap-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Available Vault Balance
          </span>
          <span className="text-3xl font-extrabold text-white text-glow">
            {parseFloat(contractBalance).toFixed(5)} <span className="text-purple-400 text-lg font-bold">ETH</span>
          </span>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs md:text-sm mt-5 text-left">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex gap-2 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs md:text-sm mt-5 text-left shadow-glow-green">
          <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleWithdraw}
          disabled={parseFloat(contractBalance) <= 0 || txState === 'checking' || txState === 'pending'}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:border-transparent text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-emerald-600/10 cursor-pointer"
        >
          {txState === 'checking' && (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Awaiting Approval...</span>
            </>
          )}
          {txState === 'pending' && (
            <>
              <Loader className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Withdrawing Funds...</span>
            </>
          )}
          {txState !== 'checking' && txState !== 'pending' && (
            <>
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw Vault Funds</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
