import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { Drop, DropCategory } from '../types';
import { CATEGORIES, DEMO_DROPS } from '../constants';
import { Grid, Map as MapIcon, Filter, Search, Zap, Cpu, Shirt, FileText, HardDrive, ShoppingCart, MapPin, Clock, User } from 'lucide-react';

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
  HARDWARE: HardDrive
};

export default function Marketplace() {
  const { user, profile } = useAuth();
  const { t, lang } = useI18n();
  const [view, setView] = useState<'GRID' | 'MAP'>('GRID');
  const [drops, setDrops] = useState<Drop[]>([]);
  const [filter, setFilter] = useState<DropCategory | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);

  useEffect(() => {
    // Use demo drops if no real drops exist yet
    setDrops(DEMO_DROPS as Drop[]);

    const q = query(collection(db, 'drops'), where('status', '==', 'ACTIVE'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realDrops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Drop));
      if (realDrops.length > 0) {
        setDrops(realDrops);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredDrops = drops.filter(d => 
    (filter === 'ALL' || d.category === filter) &&
    (d.title.toLowerCase().includes(search.toLowerCase()) || d.zone.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSecureDrop = async (drop: Drop) => {
    if (!user) return;
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
      alert('Order initiated. Redirecting to Ops Center...');
    } catch (error) {
      console.error('Order failed:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-terminal-bg text-neon-green overflow-hidden">
      {/* Header */}
      <header className="border-b border-neon-green/20 p-4 flex items-center justify-between bg-terminal-bg/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tighter glitch hover:animate-glitch uppercase">{t('market.the_scan')}</h1>
          <div className="flex bg-neon-green/10 p-1 border border-neon-green/20">
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

        <div className="flex items-center gap-4 flex-1 max-w-xl mx-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
            <input 
              type="text"
              placeholder="SEARCH FREQUENCIES..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neon-green/5 border border-neon-green/20 py-2 pl-10 pr-4 outline-none focus:border-neon-green transition-all uppercase text-xs tracking-widest"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] opacity-50 uppercase tracking-widest">Operator</p>
            <p className="text-sm font-bold tracking-tighter">{profile?.codename}</p>
          </div>
          <div className="w-10 h-10 border border-neon-green flex items-center justify-center bg-neon-green/10">
            <User size={20} />
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="border-b border-neon-green/10 p-2 flex gap-2 overflow-x-auto custom-scrollbar bg-terminal-bg/30">
        <button 
          onClick={() => setFilter('ALL')}
          className={`px-4 py-1 text-[10px] uppercase tracking-widest border transition-all whitespace-nowrap ${filter === 'ALL' ? 'bg-neon-green text-terminal-bg border-neon-green' : 'border-neon-green/20 hover:border-neon-green/50'}`}
        >
          ALL_CHANNELS
        </button>
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setFilter(cat.id as DropCategory)}
            className={`px-4 py-1 text-[10px] uppercase tracking-widest border transition-all flex items-center gap-2 whitespace-nowrap ${filter === cat.id ? 'bg-neon-green text-terminal-bg border-neon-green' : 'border-neon-green/20 hover:border-neon-green/50'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === 'GRID' ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 custom-scrollbar"
            >
              {filteredDrops.map(drop => (
                <motion.div 
                  key={drop.id}
                  layoutId={drop.id}
                  onClick={() => setSelectedDrop(drop)}
                  className="border border-neon-green/20 bg-neon-green/5 hover:bg-neon-green/10 transition-all cursor-pointer group flex flex-col"
                >
                  <div className="relative aspect-[4/3] overflow-hidden border-b border-neon-green/20">
                    <img src={drop.imageUrl} alt={drop.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-500 grayscale hover:grayscale-0" referrerPolicy="no-referrer" />
                    <div className="absolute top-2 right-2 bg-terminal-bg/80 backdrop-blur-md border border-neon-green/30 px-2 py-1 text-[10px] tracking-widest uppercase">
                      {drop.category}
                    </div>
                    {drop.status === 'SOLD_OUT' && (
                      <div className="absolute inset-0 bg-terminal-bg/60 flex items-center justify-center">
                        <span className="text-2xl font-bold tracking-[0.5em] -rotate-12 border-4 border-neon-green p-2 uppercase">{t('market.sold_out')}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold tracking-tighter uppercase text-lg leading-tight">{drop.title}</h3>
                      <span className="text-neon-green font-bold">${drop.price}</span>
                    </div>
                    <p className="text-xs opacity-60 line-clamp-2 mb-4 uppercase tracking-wider leading-relaxed">{drop.description}</p>
                    <div className="mt-auto pt-4 border-t border-neon-green/10 flex justify-between items-center text-[10px] tracking-widest uppercase opacity-80">
                      <div className="flex items-center gap-1">
                        <MapPin size={10} />
                        {drop.zone}, {drop.district}
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={10} />
                        {drop.sellerCodename}
                      </div>
                    </div>
                  </div>
                  <div className="h-1 bg-neon-green/20">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(drop.quantity / drop.maxQuantity) * 100}%` }}
                      className="h-full bg-neon-green"
                    />
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
                    
                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => setSelectedDrop(null)}
                        className="flex-1 py-3 border border-neon-green/30 font-bold uppercase tracking-widest hover:border-neon-green transition-all"
                      >
                        {t('common.back')}
                      </button>
                      <button 
                        onClick={() => handleSecureDrop(selectedDrop)}
                        disabled={selectedDrop.status === 'SOLD_OUT'}
                        className="flex-1 py-3 bg-neon-green text-terminal-bg font-bold uppercase tracking-widest hover:bg-neon-green/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <ShoppingCart size={18} />
                        {t('market.secure_drop')}
                      </button>
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
      </main>
    </div>
  );
}
