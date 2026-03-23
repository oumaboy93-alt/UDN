import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, where, updateDoc, doc, orderBy, addDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { Order, Drop } from '../types';
import { Shield, MapPin, Package, CheckCircle, Truck, Clock, User, Navigation } from 'lucide-react';

export default function AgentDashboard() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const [availableTasks, setAvailableTasks] = useState<Order[]>([]);
  const [myTasks, setMyTasks] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Available tasks: Orders that are ACCEPTED but have no agentId yet
    const availableQuery = query(
      collection(db, 'orders'), 
      where('status', '==', 'ACCEPTED'),
      where('agentId', '==', null)
    );
    
    // My tasks: Orders where I am the agent
    const myTasksQuery = query(
      collection(db, 'orders'),
      where('agentId', '==', user.uid)
    );

    const unsubAvailable = onSnapshot(availableQuery, (snapshot) => {
      setAvailableTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const unsubMyTasks = onSnapshot(myTasksQuery, (snapshot) => {
      setMyTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    return () => {
      unsubAvailable();
      unsubMyTasks();
    };
  }, [user]);

  const claimTask = async (orderId: string) => {
    if (!user) return;
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        agentId: user.uid,
        updatedAt: new Date().toISOString()
      });
      
      // Add system message to order chat
      await addDoc(collection(db, `orders/${orderId}/messages`), {
        orderId,
        senderId: 'SYSTEM',
        text: `AGENT ${profile?.codename} HAS CLAIMED RETRIEVAL TASK.`,
        timestamp: new Date().toISOString(),
        isSystem: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateStatus = async (orderId: string, status: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status,
        updatedAt: new Date().toISOString()
      });

      // If delivered, credit the agent their fee (10% of order price)
      if (status === 'DELIVERED') {
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          const orderData = orderSnap.data() as Order;
          const agentRef = doc(db, 'users', user!.uid);
          const agentSnap = await getDoc(agentRef);
          if (agentSnap.exists()) {
            const agentData = agentSnap.data();
            const currentBalance = agentData.walletBalance || 0;
            const fee = orderData.price * 0.1;
            await updateDoc(agentRef, {
              walletBalance: currentBalance + fee
            });
          }
        }
      }

      // Add system message
      await addDoc(collection(db, `orders/${orderId}/messages`), {
        orderId,
        senderId: 'SYSTEM',
        text: `AGENT UPDATED STATUS TO: ${status}`,
        timestamp: new Date().toISOString(),
        isSystem: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tighter uppercase">Agent Terminal</h1>
        <p className="text-xs opacity-50 tracking-widest uppercase">Field retrieval and secure delivery operations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Tasks */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Navigation size={16} />
            Available Retrieval Tasks ({availableTasks.length})
          </h2>
          <div className="space-y-4">
            {availableTasks.map(order => (
              <div key={order.id} className="border border-neon-green/20 bg-neon-green/5 p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold uppercase tracking-tight">Retrieval: {order.id.slice(0, 8)}</h3>
                    <p className="text-[10px] opacity-50 uppercase">Seller: {order.sellerId.slice(0, 6)} | Buyer: {order.buyerId.slice(0, 6)}</p>
                  </div>
                  <div className="text-neon-green font-bold">${(order.price * 0.1).toFixed(2)} Fee</div>
                </div>
                <button 
                  onClick={() => claimTask(order.id)}
                  className="w-full py-2 bg-neon-green text-terminal-bg font-bold uppercase tracking-widest hover:bg-neon-green/90 transition-all"
                >
                  Claim Retrieval
                </button>
              </div>
            ))}
            {availableTasks.length === 0 && !loading && (
              <div className="border border-dashed border-neon-green/20 p-12 text-center opacity-30 uppercase text-xs tracking-widest">
                No active retrieval signals detected.
              </div>
            )}
          </div>
        </div>

        {/* My Active Tasks */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Shield size={16} />
            My Active Operations ({myTasks.length})
          </h2>
          <div className="space-y-4">
            {myTasks.map(order => (
              <div key={order.id} className="border border-neon-green/40 bg-neon-green/10 p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold uppercase tracking-tight">Operation: {order.id.slice(0, 8)}</h3>
                    <span className={`text-[8px] px-1 border border-neon-green text-neon-green uppercase`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {order.status === 'ACCEPTED' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'DELIVERED')}
                      className="col-span-2 py-2 bg-neon-green text-terminal-bg font-bold uppercase tracking-widest hover:bg-neon-green/90 transition-all flex items-center justify-center gap-2"
                    >
                      <Truck size={14} />
                      Mark Delivered
                    </button>
                  )}
                  {order.status === 'DELIVERED' && (
                    <div className="col-span-2 py-2 border border-neon-green/30 text-center text-[10px] uppercase tracking-widest opacity-60">
                      Awaiting Buyer Confirmation
                    </div>
                  )}
                </div>
              </div>
            ))}
            {myTasks.length === 0 && (
              <div className="border border-dashed border-neon-green/20 p-12 text-center opacity-30 uppercase text-xs tracking-widest">
                No active operations. Claim a task to begin.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
