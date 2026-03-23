import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { Drop, DropCategory } from '../types';
import { CATEGORIES, DEMO_DROPS } from '../constants';
import { Grid, Map as MapIcon, Filter, Search, Zap, Cpu, Shirt, FileText, HardDrive, ShoppingCart, MapPin, Clock, User, Activity, Heart, Star, ChevronRight, Shield } from 'lucide-react';

// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const categoryIcons: Record<DropCategory, any> = {
  TECHWEAR: Zap,
  ELECTRONICS: Cpu,
  STREETWEAR: Shirt,
  INTELLIGENCE: FileText,
  HARDWARE: HardDrive,
  MEDICAL: Activity
};

export default function Marketplace() {
  const { user, profile, updateProfile } = useAuth();
  const { t, lang } = useI18n();
  const [view, setView] = useState<'GRID' | 'MAP'>('GRID');
  const [drops, setDrops] = useState<Drop[]>([]);
  const [filter, setFilter] = useState<DropCategory | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);

  const toggleFavorite = async (dropId: string) => {
    if (!profile) return;
    const favorites = profile.favorites || [];
    const newFavorites = favorites.includes(dropId) 
      ? favorites.filter(id => id !== dropId)
      : [...favorites, dropId];
    
    await updateProfile({ favorites: newFavorites });
  };

  useEffect(() => {
    // Use demo drops if no real drops exist yet
    setDrops(DEMO_DROPS as Drop[]);

    const q = query(collection(db, 'drops'), where('status', '==', 'ACTIVE'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realDrops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Drop));
      if (realDrops.length > 0) {
        setDrops(realDrops);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'drops');
    });

    return () => unsubscribe();
  }, []);

  const filteredDrops = drops.filter(d => 
    (filter === 'ALL' || d.category === filter) &&
    (d.title.toLowerCase().includes(search.toLowerCase()) || d.zone.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSecureDrop = async (drop: Drop) => {
    if (!user || !profile) return;
    
    // Check balance again just in case
    if (profile.walletBalance !== undefined && profile.walletBalance < drop.price) {
      return;
    }

    try {
      const orderData = {
        dropId: drop.id,
        buyerId: user.uid,
        sellerId: drop.sellerId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        price: drop.price
      };
      
      await addDoc(collection(db, 'orders'), orderData);
      
      // Deduct balance
      if (profile.walletBalance !== undefined) {
        await updateProfile({
          walletBalance: profile.walletBalance - drop.price
        });
      }

      setSelectedDrop(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  return (
    <div className="flex bg-terminal-bg text-neon-green h-[calc(100vh-80px)] overflow-hidden">
      {/* Sidebar Filters */}
      <aside className="w-64 border-r border-neon-green/20 bg-terminal-bg/50 backdrop-blur-md p-6 hidden lg:flex flex-col gap-8">
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
            <Filter size={12} />
            Sector Filters
          </h3>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => setFilter('ALL')}
              className={`w-full text-left px-4 py-2 text-xs uppercase tracking-widest transition-all flex justify-between items-center group ${filter === 'ALL' ? 'bg-neon-green text-terminal-bg font-bold' : 'hover:bg-neon-green/10'}`}
            >
              All Channels
              <ChevronRight size={12} className={filter === 'ALL' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setFilter(cat.id as DropCategory)}
                className={`w-full text-left px-4 py-2 text-xs uppercase tracking-widest transition-all flex justify-between items-center group ${filter === cat.id ? 'bg-neon-green text-terminal-bg font-bold' : 'hover:bg-neon-green/10'}`}
              >
                {cat.label}
                <ChevronRight size={12} className={filter === cat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
            <MapPin size={12} />
            Active Zones
          </h3>
          <div className="p-4 border border-neon-green/10 bg-neon-green/5 space-y-2">
            <div className="flex justify-between text-[10px] uppercase tracking-widest">
              <span className="opacity-60">Gulshan</span>
              <span className="text-neon-green">Active</span>
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-widest">
              <span className="opacity-60">Banani</span>
              <span className="text-neon-green">Active</span>
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-widest">
              <span className="opacity-60">Uttara</span>
              <span className="text-neon-green">Active</span>
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border border-neon-green/20 bg-neon-green/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 border border-neon-green flex items-center justify-center">
              <Shield size={16} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Security Status</span>
          </div>
          <p className="text-[8px] opacity-50 uppercase leading-relaxed">
            All transmissions are encrypted via AES-256-GCM. End-to-end verification active.
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sub-Header / Search */}
        <div className="border-b border-neon-green/10 p-4 flex items-center justify-between bg-terminal-bg/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
            <input 
              type="text"
              placeholder="SEARCH FREQUENCIES..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neon-green/5 border border-neon-green/20 py-2 pl-10 pr-4 outline-none focus:border-neon-green transition-all uppercase text-xs tracking-widest"
            />
          </div>

          <div className="flex bg-neon-green/10 p-1 border border-neon-green/20 ml-4">
            <button 
              onClick={() => setView('GRID')}
              className={`p-2 transition-all ${view === 'GRID' ? 'bg-neon-green text-terminal-bg' : 'hover:bg-neon-green/20'}`}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setView('MAP')}
              className={`p-2 transition-all ${view === 'MAP' ? 'bg-neon-green text-terminal-bg' : 'hover:bg-neon-green/20'}`}
            >
              <MapIcon size={18} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {view === 'GRID' ? (
              <motion.div 
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 custom-scrollbar"
              >
                {filteredDrops.map(drop => (
                  <motion.div 
                    key={drop.id}
                    layoutId={drop.id}
                    className="border border-neon-green/20 bg-neon-green/5 hover:bg-neon-green/10 transition-all group flex flex-col relative"
                  >
                    {/* Favorite Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(drop.id);
                      }}
                      className={`absolute top-4 right-4 z-10 p-2 border transition-all ${profile?.favorites?.includes(drop.id) ? 'bg-neon-green text-terminal-bg border-neon-green' : 'bg-terminal-bg/50 border-neon-green/30 hover:border-neon-green'}`}
                    >
                      <Heart size={14} fill={profile?.favorites?.includes(drop.id) ? 'currentColor' : 'none'} />
                    </button>

                    <div onClick={() => setSelectedDrop(drop)} className="cursor-pointer flex flex-col h-full">
                      <div className="relative aspect-[16/9] overflow-hidden border-b border-neon-green/20">
                        <img src={drop.imageUrl} alt={drop.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-500 grayscale hover:grayscale-0" referrerPolicy="no-referrer" />
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-terminal-bg to-transparent" />
                        <div className="absolute bottom-2 left-3 flex items-center gap-2">
                          <span className="bg-neon-green text-terminal-bg px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest">
                            {drop.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold tracking-tighter uppercase text-xl leading-none group-hover:text-white transition-colors">{drop.title}</h3>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-neon-green leading-none">${drop.price}</span>
                          </div>
                        </div>
                        
                        <p className="text-xs opacity-60 line-clamp-2 mb-6 uppercase tracking-wider leading-relaxed flex-1">{drop.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neon-green/10">
                          <div className="flex items-center gap-2 opacity-80">
                            <div className="w-6 h-6 border border-neon-green/30 flex items-center justify-center bg-neon-green/5">
                              <MapPin size={10} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] opacity-50 uppercase tracking-widest leading-none">Zone</span>
                              <span className="text-[10px] font-bold uppercase leading-none">{drop.zone}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-80">
                            <div className="w-6 h-6 border border-neon-green/30 flex items-center justify-center bg-neon-green/5">
                              <User size={10} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] opacity-50 uppercase tracking-widest leading-none">Seller</span>
                              <span className="text-[10px] font-bold uppercase leading-none">{drop.sellerCodename}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="h-1 bg-neon-green/10">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(drop.quantity / drop.maxQuantity) * 100}%` }}
                          className="h-full bg-neon-green shadow-[0_0_10px_rgba(0,255,65,0.5)]"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full"
              >
                <MapContainer center={[23.8103, 90.4125]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {filteredDrops.map(drop => (
                    <Marker key={drop.id} position={drop.coordinates}>
                      <Popup className="custom-popup">
                        <div className="bg-terminal-bg text-neon-green p-2 font-mono border border-neon-green">
                          <h4 className="font-bold uppercase mb-1">{drop.title}</h4>
                          <p className="text-[10px] mb-2">${drop.price} | {drop.zone}</p>
                          <button 
                            onClick={() => setSelectedDrop(drop)}
                            className="w-full py-1 bg-neon-green text-terminal-bg text-[10px] font-bold uppercase"
                          >
                            VIEW INTELLIGENCE
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Drop Detail Modal */}
        <AnimatePresence>
          {selectedDrop && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-terminal-bg/90 backdrop-blur-sm"
              onClick={() => setSelectedDrop(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-4xl w-full bg-terminal-bg border border-neon-green p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00FF41 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                
                <div className="space-y-6 relative">
                  <div className="aspect-video border border-neon-green/30 overflow-hidden">
                    <img src={selectedDrop.imageUrl} alt={selectedDrop.title} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-neon-green/20 p-3 bg-neon-green/5">
                      <p className="text-[10px] opacity-50 uppercase tracking-widest mb-1">Coordinates</p>
                      <p className="text-xs font-bold">{selectedDrop.coordinates[0].toFixed(4)}, {selectedDrop.coordinates[1].toFixed(4)}</p>
                    </div>
                    <div className="border border-neon-green/20 p-3 bg-neon-green/5">
                      <p className="text-[10px] opacity-50 uppercase tracking-widest mb-1">Expiration</p>
                      <p className="text-xs font-bold flex items-center gap-2">
                        <Clock size={12} />
                        {new Date(selectedDrop.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col relative">
                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-3xl font-bold tracking-tighter uppercase leading-none">{selectedDrop.title}</h2>
                      <span className="text-2xl font-bold text-neon-green">${selectedDrop.price}</span>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <span className="px-2 py-0.5 border border-neon-green/50 text-[10px] uppercase tracking-widest">{selectedDrop.category}</span>
                      <span className="px-2 py-0.5 border border-neon-green/50 text-[10px] uppercase tracking-widest">{selectedDrop.status}</span>
                    </div>
                    <p className="text-sm opacity-70 uppercase tracking-wider leading-relaxed">{selectedDrop.description}</p>
                  </div>

                  <div className="space-y-4 mt-auto">
                    <div className="flex justify-between items-end text-[10px] uppercase tracking-widest">
                      <span>Inventory Status</span>
                      <span>{selectedDrop.quantity} / {selectedDrop.maxQuantity} Units</span>
                    </div>
                    <div className="h-2 bg-neon-green/10 border border-neon-green/20">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(selectedDrop.quantity / selectedDrop.maxQuantity) * 100}%` }}
                        className="h-full bg-neon-green shadow-[0_0_10px_rgba(0,255,65,0.5)]"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-4 pt-4">
                      {profile?.walletBalance !== undefined && profile.walletBalance < selectedDrop.price && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] uppercase tracking-widest text-center">
                          Insufficient Credits. Required: ${selectedDrop.price} | Available: ${profile.walletBalance}
                        </div>
                      )}
                      
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setSelectedDrop(null)}
                          className="flex-1 py-3 border border-neon-green/30 font-bold uppercase tracking-widest hover:border-neon-green transition-all"
                        >
                          {t('common.back')}
                        </button>
                        <button 
                          onClick={() => handleSecureDrop(selectedDrop)}
                          disabled={selectedDrop.status === 'SOLD_OUT' || (profile?.walletBalance !== undefined && profile.walletBalance < selectedDrop.price)}
                          className="flex-1 py-3 bg-neon-green text-terminal-bg font-bold uppercase tracking-widest hover:bg-neon-green/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <ShoppingCart size={18} />
                          {selectedDrop.status === 'SOLD_OUT' ? t('market.sold_out') : t('market.secure_drop')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button 
                  onClick={() => setSelectedDrop(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-neon-green/10 transition-all"
                >
                  <Search size={20} className="rotate-45" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
