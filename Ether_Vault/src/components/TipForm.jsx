import React, { useState } from 'react';
import { Send, Coffee, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function TipForm({ onSubmitTip, isWalletConnected, error, successMsg, clearStatus }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('0.005'); // Default preset
  const [customAmount, setCustomAmount] = useState('');
  const [txState, setTxState] = useState('idle'); // idle, checking, pending, success, error

  const presets = ['0.001', '0.005', '0.01'];

  const handlePresetSelect = (val) => {
    setAmount(val);
    setCustomAmount('');
    clearStatus();
    if (txState === 'success' || txState === 'error') {
      setTxState('idle');
    }
  };

  const handleCustomChange = (e) => {
    setCustomAmount(e.target.value);
    setAmount('');
    clearStatus();
    if (txState === 'success' || txState === 'error') {
      setTxState('idle');
    }
  };

  const currentAmount = amount || customAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isWalletConnected) return;
    if (!currentAmount || parseFloat(currentAmount) <= 0) return;

    setTxState('checking');
    clearStatus();

    try {
      // Trigger contract tip
      await onSubmitTip(name, message, currentAmount, (state) => {
        // Callback to update states: 'pending' (waiting block confirmation), 'success', 'error'
        setTxState(state);
      });
      // Clear fields on success
      setMessage('');
      setName('');
    } catch (err) {
      setTxState('error');
    }
  };

  return (
    <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-xl border border-slate-700/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-400">
          <Coffee className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-white m-0">Send a Support Tip</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        {/* Preset Amounts */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
            Select Amount (ETH)
          </label>
          <div className="grid grid-cols-4 gap-3">
            {presets.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handlePresetSelect(val)}
                className={`py-2.5 rounded-xl font-bold transition-all duration-200 border text-xs sm:text-sm ${
                  amount === val
                    ? 'bg-purple-600 border-purple-500 text-white shadow-glow'
                    : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                {val} ETH
              </button>
            ))}
            <input
              type="number"
              step="any"
              placeholder="Custom"
              value={customAmount}
              onChange={handleCustomChange}
              className={`py-2 px-3 rounded-xl bg-slate-900/60 border text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-center ${
                customAmount ? 'border-purple-500 ring-1 ring-purple-500/55' : 'border-slate-700/60 focus:border-slate-500'
              }`}
            />
          </div>
        </div>

        {/* Display Name Input */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Display Name
          </label>
          <input
            type="text"
            maxLength={50}
            placeholder="Anonymous (Optional)"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearStatus();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
          />
        </div>

        {/* Message Textarea */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider m-0">
              Support Message
            </label>
            <span className={`text-[10px] font-bold ${message.length > 250 ? 'text-rose-400' : 'text-slate-400'}`}>
              {message.length} / 280
            </span>
          </div>
          <textarea
            maxLength={280}
            rows={4}
            placeholder="Leave a friendly message to support the creator!"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              clearStatus();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 resize-none"
          />
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="flex gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs md:text-sm">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex gap-2 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs md:text-sm shadow-glow-green">
            <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isWalletConnected || txState === 'checking' || txState === 'pending' || !currentAmount}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:border-transparent text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-purple-600/10 cursor-pointer"
        >
          {txState === 'checking' && (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Awaiting Wallet Approval...</span>
            </>
          )}
          {txState === 'pending' && (
            <>
              <Loader className="w-4 h-4 animate-spin text-purple-400" />
              <span>Confirming on Blockchain...</span>
            </>
          )}
          {txState !== 'checking' && txState !== 'pending' && (
            <>
              <Send className="w-4 h-4" />
              <span>Send {currentAmount ? `${currentAmount} ETH ` : ''}Support</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
