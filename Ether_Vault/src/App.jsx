import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractConfig from './config/contract.json';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TipForm from './components/TipForm';
import SupporterWall from './components/SupporterWall';
import OwnerPanel from './components/OwnerPanel';
import { Cpu, Heart, Code } from 'lucide-react';

// Pre-loaded seed data for demo purposes
const MOCK_TIPS = [
  {
    sender: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    amount: '0.01500',
    name: 'Satoshi_Nakamoto',
    message: 'A masterpiece! Love the clean glassmorphic Web3 layout. Keep building the future!',
    timestamp: Math.floor(Date.now() / 1000) - 7200 // 2 hours ago
  },
  {
    sender: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    amount: '0.00500',
    name: 'Vitalik.eth',
    message: 'Very smooth transacting states. Verified code looks extremely clean and reentrancy safe.',
    timestamp: Math.floor(Date.now() / 1000) - 18000 // 5 hours ago
  },
  {
    sender: '0x15d34AAf54a67C6430491902775076C2854b117b',
    amount: '0.01000',
    name: 'AdaLovelace',
    message: 'Stunning premium design. The micro-animations make the support wall feel so alive!',
    timestamp: Math.floor(Date.now() / 1000) - 43200 // 12 hours ago
  },
  {
    sender: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    amount: '0.00200',
    name: 'Anonymous',
    message: 'Just sent a coffee! Awesome project.',
    timestamp: Math.floor(Date.now() / 1000) - 86400 // 24 hours ago
  }
];

// Sum of mock tip values (0.015 + 0.005 + 0.010 + 0.002 = 0.032)
const MOCK_TOTAL_ETH = 0.032;

export default function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  
  const [contractOwner, setContractOwner] = useState(null);
  const [contractBalance, setContractBalance] = useState('0');
  const [totalEth, setTotalEth] = useState(MOCK_TOTAL_ETH.toString());
  const [totalSupporters, setTotalSupporters] = useState(MOCK_TIPS.length);
  const [tips, setTips] = useState(MOCK_TIPS);
  
  // Notification states
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [ownerError, setOwnerError] = useState('');
  const [ownerSuccess, setOwnerSuccess] = useState('');

  // Target Chain IDs: Sepolia (11155111) and Hardhat Localhost (31337)
  const SUPPORTED_CHAINS = [11155111n, 31337n];
  const CHAIN_NAMES = {
    11155111n: 'Sepolia Testnet',
    31337n: 'Hardhat Localhost',
    1n: 'Ethereum Mainnet'
  };

  const getReadOnlyProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    // Public Fallback RPC
    return new ethers.JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");
  };

  const getReadOnlyContract = () => {
    const provider = getReadOnlyProvider();
    return new ethers.Contract(contractConfig.address, contractConfig.abi, provider);
  };

  const getSignerContract = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error("MetaMask is not installed.");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractConfig.address, contractConfig.abi, signer);
  };

  const loadContractData = useCallback(async () => {
    try {
      const contract = getReadOnlyContract();
      const provider = getReadOnlyProvider();

      // Fetch owner address
      const owner = await contract.owner();
      setContractOwner(owner);

      // Fetch tip stats
      const count = await contract.getTipCount();
      const blockchainCount = Number(count);

      const totalDeposited = await contract.totalDeposited();
      const blockchainEth = ethers.formatEther(totalDeposited);

      // Fetch contract balance
      const contractBalVal = await provider.getBalance(contractConfig.address);
      setContractBalance(ethers.formatEther(contractBalVal));

      // Fetch tips list from contract
      const allTips = await contract.getTotalTips();
      const formattedTips = allTips.map(t => ({
        sender: t.sender,
        amount: ethers.formatEther(t.amount),
        message: t.message,
        name: t.name,
        timestamp: Number(t.timestamp)
      }));

      // Combine mock data and blockchain data (preventing duplicates)
      setTips(() => {
        const combined = [...MOCK_TIPS];
        formattedTips.forEach(tip => {
          if (!combined.some(t => t.sender.toLowerCase() === tip.sender.toLowerCase() && t.timestamp === tip.timestamp)) {
            combined.push(tip);
          }
        });
        return combined;
      });

      // Sum mock totals with blockchain totals
      setTotalSupporters(MOCK_TIPS.length + blockchainCount);
      setTotalEth((MOCK_TOTAL_ETH + parseFloat(blockchainEth)).toString());

    } catch (err) {
      console.warn("Failed to load contract details, using demo fallback data:", err);
      // Fallback is already initialized in state variables, so do nothing here
    }
  }, []);

  // Set up event listeners for real-time updates
  useEffect(() => {
    loadContractData();

    let contract;
    const setupListener = async () => {
      try {
        contract = getReadOnlyContract();
        
        contract.on("NewTip", (sender, amount, name, message, timestamp) => {
          const newTip = {
            sender,
            amount: ethers.formatEther(amount),
            name,
            message,
            timestamp: Number(timestamp)
          };

          setTips(prev => {
            // Check for duplicates
            if (prev.some(t => t.sender === sender && t.timestamp === newTip.timestamp && t.message === message)) {
              return prev;
            }
            return [...prev, newTip];
          });

          // Increment totals in UI instantly
          setTotalSupporters(prev => prev + 1);
          setTotalEth(prev => (parseFloat(prev) + parseFloat(newTip.amount)).toString());
          
          // Refresh contract balance
          getReadOnlyProvider().getBalance(contractConfig.address).then(bal => {
            setContractBalance(ethers.formatEther(bal));
          });
        });
      } catch (err) {
        console.error("Failed to setup contract event listener:", err);
      }
    };

    setupListener();

    return () => {
      if (contract) {
        contract.removeAllListeners("NewTip");
      }
    };
  }, [loadContractData]);

  // Handle wallet connection
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setFormError("Web3 provider not detected. Please install MetaMask extension to proceed.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      setAccount(userAddress);
      
      const balanceVal = await provider.getBalance(userAddress);
      setBalance(ethers.formatEther(balanceVal));

      const networkVal = await provider.getNetwork();
      const chainId = networkVal.chainId;
      
      setNetwork(CHAIN_NAMES[chainId] || `Chain ${chainId}`);
      setIsCorrectNetwork(SUPPORTED_CHAINS.includes(chainId));

      setFormError('');
      loadContractData();
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setFormError("Wallet connection request rejected or failed.");
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setBalance('0');
    setNetwork(null);
    setIsCorrectNetwork(true);
    setFormError('');
    setFormSuccess('');
    setOwnerError('');
    setOwnerSuccess('');
  };

  // Subscribe to EIP-1193 changes (accounts/chain)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balanceVal = await provider.getBalance(accounts[0]);
          setBalance(ethers.formatEther(balanceVal));
        } else {
          disconnectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // Submit Tip Transaction
  const handleSubmitTip = async (name, message, ethAmount, onStateChange) => {
    if (!account) {
      setFormError("Please connect your Web3 wallet first.");
      onStateChange('error');
      return;
    }

    if (!isCorrectNetwork) {
      setFormError("Unsupported Network. Please connect to Sepolia Testnet or Hardhat Localhost.");
      onStateChange('error');
      return;
    }

    try {
      const contract = await getSignerContract();
      const tx = await contract.tip(name, message, {
        value: ethers.parseEther(ethAmount)
      });
      
      onStateChange('pending');
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        onStateChange('success');
        setFormSuccess("Thank you! Your tip transaction was successful and is now written to the blockchain.");
        
        // Append user's tip to feed instantly for real-time visual response
        const newTipObj = {
          sender: account,
          amount: ethAmount,
          name: name || 'Anonymous',
          message: message,
          timestamp: Math.floor(Date.now() / 1000)
        };

        setTips(prev => [newTipObj, ...prev]);
        setTotalSupporters(prev => prev + 1);
        setTotalEth(prev => (parseFloat(prev) + parseFloat(ethAmount)).toString());

        loadContractData();
        
        // Update connected wallet balance
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balanceVal = await provider.getBalance(account);
        setBalance(ethers.formatEther(balanceVal));
      } else {
        onStateChange('error');
        setFormError("Transaction confirmed but failed execution on-chain.");
      }
    } catch (err) {
      console.error("Tipping transaction error:", err);
      onStateChange('error');
      
      if (err.code === 4001 || (err.message && err.message.includes("rejected"))) {
        setFormError("Transaction request was rejected in your wallet.");
      } else if (err.message && err.message.includes("insufficient funds")) {
        setFormError("Insufficient funds in your account to complete this transaction.");
      } else {
        setFormError(err.reason || err.message || "Transaction failed.");
      }
      throw err;
    }
  };

  // Withdraw Vault Funds Transaction
  const handleWithdraw = async (onStateChange) => {
    if (!account) return;
    if (!isCorrectNetwork) {
      setOwnerError("Unsupported Network. Connect to the correct network to withdraw.");
      onStateChange('error');
      return;
    }

    try {
      const contract = await getSignerContract();
      const tx = await contract.withdraw();
      
      onStateChange('pending');
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        onStateChange('success');
        setOwnerSuccess("Vault funds successfully withdrawn to your owner address!");
        
        loadContractData();
        
        // Update connected wallet balance
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balanceVal = await provider.getBalance(account);
        setBalance(ethers.formatEther(balanceVal));
      } else {
        onStateChange('error');
        setOwnerError("Withdrawal transaction failed on-chain.");
      }
    } catch (err) {
      console.error("Withdrawal transaction error:", err);
      onStateChange('error');
      
      if (err.code === 4001 || (err.message && err.message.includes("rejected"))) {
        setOwnerError("Withdrawal request rejected by user.");
      } else {
        setOwnerError(err.reason || err.message || "Withdrawal failed.");
      }
      throw err;
    }
  };

  const clearStatus = () => {
    setFormError('');
    setFormSuccess('');
    setOwnerError('');
    setOwnerSuccess('');
  };

  const isOwnerConnected = account && contractOwner && account.toLowerCase() === contractOwner.toLowerCase();

  return (
    <div className="min-h-screen bg-radial-gradient py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Header 
          account={account} 
          balance={balance} 
          network={network} 
          isCorrectNetwork={isCorrectNetwork} 
          connectWallet={connectWallet} 
          disconnectWallet={disconnectWallet} 
        />

        {/* Dashboard Analytics */}
        <Dashboard 
          totalEth={totalEth} 
          totalSupporters={totalSupporters} 
          ownerAddress={contractOwner || '0x40284F4571a6ae4497dee3CFb41Ec11196e68D4F'} 
        />

        {/* Main Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form & Info */}
          <div className="lg:col-span-5 space-y-6">
            <TipForm 
              onSubmitTip={handleSubmitTip}
              isWalletConnected={!!account}
              error={formError}
              successMsg={formSuccess}
              clearStatus={clearStatus}
            />

            {/* Platform Information Banner */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 text-left">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-purple-400" />
                About EtherVault
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-0">
                EtherVault is a fully decentralized creator support dashboard. Every contribution, supporter name, and encouragement message is recorded permanently and transparently on the blockchain.
              </p>
            </div>
          </div>

          {/* Right Column: Supporter Feed */}
          <div className="lg:col-span-7 h-full">
            <SupporterWall tips={tips} />
          </div>
        </div>

        {/* Conditional Owner Withdraw Panel */}
        {isOwnerConnected && (
          <OwnerPanel 
            contractBalance={contractBalance}
            onWithdraw={handleWithdraw}
            error={ownerError}
            successMsg={ownerSuccess}
            clearStatus={clearStatus}
          />
        )}

        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-slate-900 text-center text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
            <span>EtherVault Project - Built with Ethers.js & Solidity</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 hover:text-slate-400 transition-colors duration-150">
              <Code className="w-3.5 h-3.5" />
              <span>Smart Contract Deployed</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
