import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { I18nProvider, useI18n } from './lib/i18n';
import TerminalBoot from './components/TerminalBoot';
import Onboarding from './components/Onboarding';
import Marketplace from './components/Marketplace';
import SellerDashboard from './components/SellerDashboard';
import AgentDashboard from './components/AgentDashboard';
import Chat from './components/Chat';
import { collection, query, where, onSnapshot, orderBy, or } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Order } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, MessageSquare, Shield, Globe, User, ShieldCheck, LayoutDashboard, ShoppingBag, Wallet, Bell } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, login, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [bootComplete, setBootComplete] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showOpsCenter, setShowOpsCenter] = useState(false);
  const [activeTab, setActiveTab] = useState<'MARKET' | 'DASHBOARD'>('MARKET');

  useEffect(() => {
    if (!user) return;

    // Fetch orders where user is buyer, seller, or agent
    const q = query(
      collection(db, 'orders'),
      or(
        where('buyerId', '==', user.uid),
        where('sellerId', '==', user.uid),
        where('agentId', '==', user.uid)
      ),
      orderBy('updatedAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsub();
  }, [user]);

  if (!bootComplete) {
    return <TerminalBoot onComplete={() => setBootComplete(true)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-bg flex items-center justify-center">
        <motion.div 
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="text-neon-green font-mono text-sm tracking-widest uppercase"
        >
          AUTHENTICATING...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-terminal-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#00FF41 1px, transparent 1px), linear-gradient(90deg, #00FF41 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md w-full text-center space-y-8 relative z-10"
        >
          <div className="space-y-2">
            <h1 className="text-6xl font-bold tracking-tighter glitch hover:animate-glitch uppercase">UDN</h1>
            <p className="text-xs tracking-[0.5em] opacity-50 uppercase">Unified Drop Network</p>
          </div>

          <div className="p-8 border border-neon-green/30 bg-terminal-bg/50 backdrop-blur-md space-y-6">
            <p className="text-sm uppercase tracking-widest leading-relaxed opacity-80">
              SECURE ACCESS REQUIRED. AUTHORIZED PERSONNEL ONLY.
            </p>
            <button 
              onClick={login}
              className="w-full py-4 bg-neon-green text-terminal-bg font-bold uppercase tracking-widest hover:bg-neon-green/90 transition-all flex items-center justify-center gap-3"
            >
              <LogIn size={20} />
              {t('auth.login')}
            </button>
          </div>

          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setLang(lang === 'EN' ? 'BN' : 'EN')}
              className="text-[10px] uppercase tracking-widest border border-neon-green/20 px-3 py-1 hover:border-neon-green transition-all flex items-center gap-2"
            >
              <Globe size={12} />
              {lang === 'EN' ? 'বাংলা' : 'ENGLISH'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-terminal-bg text-neon-green font-mono selection:bg-neon-green selection:text-terminal-bg">
      {/* Header Navigation */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-terminal-bg/80 backdrop-blur-md border-b border-neon-green/20 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tighter uppercase leading-none">UDN</span>
            <span className="text-[8px] tracking-[0.3em] opacity-50 uppercase">Unified Drop Network</span>
          </div>
          
          <nav className="flex gap-4">
            <button 
              onClick={() => setActiveTab('MARKET')}
              className={`px-4 py-1 text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'MARKET' ? 'bg-neon-green text-terminal-bg font-bold' : 'hover:bg-neon-green/10'}`}
            >
              <ShoppingBag size={14} />
              Market
            </button>
            {(profile.role === 'SELLER' || profile.role === 'AGENT' || profile.role === 'admin') && (
              <button 
                onClick={() => setActiveTab('DASHBOARD')}
                className={`px-4 py-1 text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'DASHBOARD' ? 'bg-neon-green text-terminal-bg font-bold' : 'hover:bg-neon-green/10'}`}
              >
                <LayoutDashboard size={14} />
                {profile.role === 'SELLER' ? 'Seller HQ' : 'Agent Terminal'}
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[8px] opacity-50 uppercase tracking-widest leading-none mb-1">Authenticated As</p>
            <p className="text-xs font-bold uppercase leading-none">{profile.codename}</p>
          </div>
          
          {/* Wallet Balance */}
          <div className="flex items-center gap-3 px-4 py-2 bg-neon-green/10 border border-neon-green/20 rounded-none">
            <Wallet size={16} className="text-neon-green" />
            <div className="flex flex-col">
              <span className="text-[8px] opacity-50 uppercase tracking-widest leading-none">Balance</span>
              <span className="text-sm font-bold text-neon-green leading-none">${profile.walletBalance?.toLocaleString() || '0'}</span>
            </div>
          </div>

          <div className="w-10 h-10 border border-neon-green flex items-center justify-center bg-neon-green/10">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      <div className="pt-20 pb-24">
        {activeTab === 'MARKET' ? (
          <Marketplace />
        ) : (
          profile.role === 'SELLER' ? <SellerDashboard /> : <AgentDashboard />
        )}
      </div>

      {/* Floating Ops Center Toggle */}
      <div className="fixed bottom-6 right-6 z-[150] flex flex-col items-end gap-3">
        <AnimatePresence>
          {showOpsCenter && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="mb-4 w-80 max-h-96 bg-terminal-bg border border-neon-green shadow-[0_0_30px_rgba(0,255,65,0.2)] flex flex-col"
            >
              <div className="p-3 border-b border-neon-green/20 bg-neon-green/5 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest">Active Operations</span>
                <span className="text-[10px] opacity-50">{orders.length} ACTIVE</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {orders.length === 0 ? (
                  <div className="p-8 text-center opacity-30 text-[10px] uppercase tracking-widest">No Active Drops</div>
                ) : (
                  orders.map(order => (
                    <button 
                      key={order.id}
                      onClick={() => setActiveOrder(order)}
                      className="w-full p-3 border border-neon-green/20 hover:border-neon-green/60 bg-neon-green/5 text-left transition-all group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[120px]">
                          {order.id.slice(0, 8)}
                        </span>
                        <span className={`text-[8px] px-1 border ${order.status === 'PENDING' ? 'border-yellow-500 text-yellow-500' : 'border-neon-green text-neon-green'}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 opacity-60">
                        <User size={10} />
                        <span className="text-[8px] uppercase tracking-widest">
                          {order.buyerId === user.uid ? 'SELLER: ' + order.sellerId.slice(0, 6) : 'BUYER: ' + order.buyerId.slice(0, 6)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <button 
            onClick={() => setLang(lang === 'EN' ? 'BN' : 'EN')}
            className="w-12 h-12 border border-neon-green/30 bg-terminal-bg backdrop-blur-md flex items-center justify-center hover:border-neon-green transition-all"
          >
            <Globe size={20} />
          </button>
          <button 
            onClick={() => setShowOpsCenter(!showOpsCenter)}
            className={`w-12 h-12 border flex items-center justify-center transition-all relative ${showOpsCenter ? 'bg-neon-green text-terminal-bg border-neon-green' : 'bg-terminal-bg border-neon-green/30 hover:border-neon-green'}`}
          >
            <MessageSquare size={20} />
            {orders.some(o => o.status === 'PENDING') && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          <button 
            onClick={logout}
            className="w-12 h-12 border border-neon-green/30 bg-terminal-bg backdrop-blur-md flex items-center justify-center hover:border-neon-green transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Active Chat Modal */}
      <AnimatePresence>
        {activeOrder && (
          <Chat order={activeOrder} onClose={() => setActiveOrder(null)} />
        )}
      </AnimatePresence>

      {/* Profile Sidebar (Optional/Minimal) */}
      <div className="fixed top-20 left-6 z-40 hidden lg:block">
        <div className="p-4 border border-neon-green/20 bg-terminal-bg/50 backdrop-blur-md space-y-4 w-48">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-neon-green flex items-center justify-center bg-neon-green/10">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] opacity-50 uppercase tracking-widest">Agent</p>
              <p className="text-xs font-bold uppercase">{profile.codename}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[8px] uppercase tracking-widest opacity-60">
              <span>Rating</span>
              <span>{profile.stats.rating.toFixed(1)} ✓</span>
            </div>
            <div className="flex justify-between text-[8px] uppercase tracking-widest opacity-60">
              <span>Drops</span>
              <span>{profile.stats.drops}</span>
            </div>
            <div className="flex justify-between text-[8px] uppercase tracking-widest opacity-60">
              <span>Zone</span>
              <span>{profile.zone}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </I18nProvider>
  );
}
