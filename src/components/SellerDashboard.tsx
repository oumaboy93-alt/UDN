import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { Drop, DropCategory, Order } from '../types';
import { CATEGORIES } from '../constants';
import { Plus, Package, DollarSign, MapPin, Trash2, Edit2, CheckCircle, XCircle, Clock, Activity, Zap, Cpu, Shirt, FileText, HardDrive } from 'lucide-react';

const categoryIcons: Record<DropCategory, any> = {
  TECHWEAR: Zap,
  ELECTRONICS: Cpu,
  STREETWEAR: Shirt,
  INTELLIGENCE: FileText,
  HARDWARE: HardDrive,
  MEDICAL: Activity
};

export default function SellerDashboard() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDrop, setEditingDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newDrop, setNewDrop] = useState<Partial<Drop>>({
    title: '',
    description: '',
    category: 'TECHWEAR',
    price: 0,
    quantity: 1,
    maxQuantity: 1,
    coordinates: [23.8103, 90.4125],
    zone: profile?.zone || 'Gulshan',
    district: profile?.district || 'Dhaka',
    status: 'ACTIVE',
    imageUrl: 'https://picsum.photos/seed/drop/400/300'
  });

  useEffect(() => {
    if (!user) return;

    const dropsQuery = query(collection(db, 'drops'), where('sellerId', '==', user.uid));
    const unsubDrops = onSnapshot(dropsQuery, (snapshot) => {
      setDrops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Drop)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'drops'));

    const ordersQuery = query(collection(db, 'orders'), where('sellerId', '==', user.uid), orderBy('updatedAt', 'desc'));
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    return () => {
      unsubDrops();
      unsubOrders();
    };
  }, [user]);

  const handleAddDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      if (editingDrop) {
        const dropRef = doc(db, 'drops', editingDrop.id);
        await updateDoc(dropRef, {
          ...newDrop,
          updatedAt: new Date().toISOString()
        });
        setEditingDrop(null);
      } else {
        const dropData = {
          ...newDrop,
          sellerId: user.uid,
          sellerCodename: profile.codename,
          expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'drops'), dropData);
      }
      setShowAddModal(false);
      setNewDrop({
        title: '',
        description: '',
        category: 'TECHWEAR',
        price: 0,
        quantity: 1,
        maxQuantity: 1,
        coordinates: [23.8103, 90.4125],
        zone: profile.zone,
        district: profile.district,
        status: 'ACTIVE',
        imageUrl: 'https://picsum.photos/seed/drop/400/300'
      });
    } catch (error) {
      handleFirestoreError(error, editingDrop ? OperationType.UPDATE : OperationType.CREATE, 'drops');
    }
  };

  const handleEditClick = (drop: Drop) => {
    setEditingDrop(drop);
    setNewDrop(drop);
    setShowAddModal(true);
  };

  const handleDeleteDrop = async (id: string) => {
    if (!confirm('Are you sure you want to delete this drop?')) return;
    try {
      await deleteDoc(doc(db, 'drops', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `drops/${id}`);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter uppercase">Seller HQ</h1>
          <p className="text-xs opacity-50 tracking-widest uppercase">Manage your tactical assets and distribution</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-neon-green text-terminal-bg px-6 py-2 font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-neon-green/90 transition-all"
        >
          <Plus size={18} />
          Deploy New Drop
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Drops */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Package size={16} />
            Active Inventory ({drops.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drops.map(drop => (
              <div key={drop.id} className="border border-neon-green/20 bg-neon-green/5 p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold uppercase tracking-tight">{drop.title}</h3>
                    <p className="text-[10px] opacity-50 uppercase">{drop.category} | {drop.zone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditClick(drop)}
                      className="p-1 hover:text-neon-green transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteDrop(drop.id)} 
                      className="p-1 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-xl font-bold text-neon-green">${drop.price}</div>
                  <div className="text-[10px] uppercase tracking-widest opacity-80">
                    Qty: {drop.quantity}/{drop.maxQuantity}
                  </div>
                </div>
                <div className="h-1 bg-neon-green/10">
                  <div className="h-full bg-neon-green" style={{ width: `${(drop.quantity / drop.maxQuantity) * 100}%` }} />
                </div>
              </div>
            ))}
            {drops.length === 0 && !loading && (
              <div className="col-span-2 border border-dashed border-neon-green/20 p-12 text-center opacity-30 uppercase text-xs tracking-widest">
                No drops deployed. Start distribution.
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <DollarSign size={16} />
            Recent Transactions
          </h2>
          <div className="space-y-2">
            {orders.map(order => (
              <div key={order.id} className="border border-neon-green/10 bg-terminal-bg p-3 text-[10px] uppercase tracking-widest space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-50">ID: {order.id.slice(0, 8)}</span>
                  <span className={`px-1 border ${order.status === 'PENDING' ? 'border-yellow-500 text-yellow-500' : 'border-neon-green text-neon-green'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Buyer: {order.buyerId.slice(0, 6)}</span>
                  <span className="text-neon-green">${order.price}</span>
                </div>
                <div className="text-[8px] opacity-40">
                  {new Date(order.updatedAt).toLocaleString()}
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="border border-dashed border-neon-green/20 p-8 text-center opacity-30 uppercase text-[10px] tracking-widest">
                Waiting for market activity...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Drop Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-terminal-bg/90 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-xl w-full bg-terminal-bg border border-neon-green p-8 space-y-6"
            >
              <h2 className="text-2xl font-bold tracking-tighter uppercase">{editingDrop ? 'Modify Asset' : 'Deploy New Asset'}</h2>
              <form onSubmit={handleAddDrop} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase opacity-50 tracking-widest">Title</label>
                    <input 
                      required
                      type="text"
                      value={newDrop.title}
                      onChange={e => setNewDrop({...newDrop, title: e.target.value})}
                      className="w-full bg-neon-green/5 border border-neon-green/20 p-2 text-xs outline-none focus:border-neon-green"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase opacity-50 tracking-widest">Category</label>
                    <select 
                      value={newDrop.category}
                      onChange={e => setNewDrop({...newDrop, category: e.target.value as DropCategory})}
                      className="w-full bg-neon-green/5 border border-neon-green/20 p-2 text-xs outline-none focus:border-neon-green"
                    >
                      {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">Description</label>
                  <textarea 
                    required
                    value={newDrop.description}
                    onChange={e => setNewDrop({...newDrop, description: e.target.value})}
                    className="w-full bg-neon-green/5 border border-neon-green/20 p-2 text-xs outline-none focus:border-neon-green h-20"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase opacity-50 tracking-widest">Price ($)</label>
                    <input 
                      required
                      type="number"
                      value={newDrop.price}
                      onChange={e => setNewDrop({...newDrop, price: Number(e.target.value)})}
                      className="w-full bg-neon-green/5 border border-neon-green/20 p-2 text-xs outline-none focus:border-neon-green"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase opacity-50 tracking-widest">Quantity</label>
                    <input 
                      required
                      type="number"
                      value={newDrop.quantity}
                      onChange={e => setNewDrop({...newDrop, quantity: Number(e.target.value), maxQuantity: Number(e.target.value)})}
                      className="w-full bg-neon-green/5 border border-neon-green/20 p-2 text-xs outline-none focus:border-neon-green"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase opacity-50 tracking-widest">Zone</label>
                    <input 
                      required
                      type="text"
                      value={newDrop.zone}
                      onChange={e => setNewDrop({...newDrop, zone: e.target.value})}
                      className="w-full bg-neon-green/5 border border-neon-green/20 p-2 text-xs outline-none focus:border-neon-green"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingDrop(null);
                    }}
                    className="flex-1 py-2 border border-neon-green/30 font-bold uppercase tracking-widest hover:border-neon-green transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 bg-neon-green text-terminal-bg font-bold uppercase tracking-widest hover:bg-neon-green/90 transition-all"
                  >
                    {editingDrop ? 'Confirm Modification' : 'Initiate Deployment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
