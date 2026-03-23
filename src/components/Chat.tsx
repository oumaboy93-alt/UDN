import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, where, addDoc, orderBy, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { Order, Message } from '../types';
import { Send, Shield, Lock, CheckCircle, XCircle, Package, Truck, User } from 'lucide-react';
import CryptoJS from 'crypto-js';

interface ChatProps {
  order: Order;
  onClose: () => void;
}

export default function Chat({ order, onClose }: ChatProps) {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isHandshaking, setIsHandshaking] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate AES-256-GCM Handshake
    const handshake = setTimeout(() => {
      setEncryptionKey(CryptoJS.lib.WordArray.random(32).toString());
      setIsHandshaking(false);
    }, 2000);

    const q = query(
      collection(db, `orders/${order.id}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `orders/${order.id}/messages`);
    });

    return () => {
      clearTimeout(handshake);
      unsubscribe();
    };
  }, [order.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const msgData = {
        orderId: order.id,
        senderId: user.uid,
        text: newMessage,
        timestamp: new Date().toISOString(),
        isSystem: false
      };
      await addDoc(collection(db, `orders/${order.id}/messages`), msgData);
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${order.id}/messages`);
    }
  };

  const updateOrderStatus = async (status: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, { status, updatedAt: new Date().toISOString() });
      
      // If delivered, credit the seller
      if (status === 'DELIVERED') {
        const sellerRef = doc(db, 'users', order.sellerId);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data();
          const currentBalance = sellerData.walletBalance || 0;
          await updateDoc(sellerRef, {
            walletBalance: currentBalance + order.price
          });
        }
      }

      // Add system message
      await addDoc(collection(db, `orders/${order.id}/messages`), {
        orderId: order.id,
        senderId: 'SYSTEM',
        text: `ORDER STATUS UPDATED TO: ${status}`,
        timestamp: new Date().toISOString(),
        isSystem: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${order.id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-terminal-bg/90 backdrop-blur-sm"
    >
      <div className="max-w-4xl w-full h-[80vh] bg-terminal-bg border border-neon-green flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neon-green/20 flex items-center justify-between bg-neon-green/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-neon-green flex items-center justify-center bg-neon-green/10">
              <Shield size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tighter uppercase">{t('chat.ops_center')}</h2>
              <p className="text-[10px] opacity-50 uppercase tracking-widest">Order ID: {order.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 border border-neon-green/30 text-[10px] uppercase tracking-widest bg-neon-green/5">
              <Lock size={12} className={isHandshaking ? 'animate-pulse' : 'text-neon-green'} />
              {isHandshaking ? t('chat.handshake') : t('chat.encrypted')}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-neon-green/10 transition-all">
              <XCircle size={20} />
            </button>
          </div>
        </div>

        {/* Handshake Overlay */}
        <AnimatePresence>
          {isHandshaking && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-terminal-bg flex flex-col items-center justify-center gap-6"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-16 h-16 border-2 border-dashed border-neon-green rounded-full flex items-center justify-center"
              >
                <Lock size={24} />
              </motion.div>
              <div className="text-center space-y-2">
                <p className="text-sm font-bold tracking-widest uppercase animate-pulse">ESTABLISHING SECURE CHANNEL</p>
                <p className="text-[10px] opacity-50 font-mono break-all max-w-xs">{CryptoJS.lib.WordArray.random(16).toString()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-neon-green/10">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${msg.isSystem ? 'items-center' : msg.senderId === user?.uid ? 'items-end' : 'items-start'}`}
                >
                  {msg.isSystem ? (
                    <div className="bg-neon-green/10 border border-neon-green/20 px-4 py-1 text-[10px] uppercase tracking-widest opacity-60">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="max-w-[80%] space-y-1">
                      <div className={`flex items-center gap-2 text-[10px] opacity-50 uppercase tracking-widest ${msg.senderId === user?.uid ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span>
                          {msg.senderId === user?.uid ? 'YOU' : 
                           msg.senderId === order.sellerId ? 'SELLER' :
                           msg.senderId === order.buyerId ? 'BUYER' :
                           msg.senderId === order.agentId ? 'AGENT' : 'OPERATIVE'}
                        </span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className={`p-3 border ${msg.senderId === user?.uid ? 'bg-neon-green text-terminal-bg border-neon-green' : 'bg-neon-green/5 border-neon-green/20'}`}>
                        <p className="text-sm uppercase tracking-wider">{msg.text}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-neon-green/20 bg-neon-green/5 flex gap-4">
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="TRANSMIT MESSAGE..."
                className="flex-1 bg-terminal-bg border border-neon-green/30 p-3 text-neon-green focus:border-neon-green outline-none uppercase text-xs tracking-widest"
              />
              <button 
                type="submit"
                className="px-6 bg-neon-green text-terminal-bg font-bold uppercase tracking-widest hover:bg-neon-green/90 transition-all flex items-center gap-2"
              >
                <Send size={18} />
                SEND
              </button>
            </form>
          </div>

          {/* Sidebar Actions */}
          <div className="w-64 bg-neon-green/5 p-6 space-y-6 hidden md:block">
            <div className="space-y-2">
              <h3 className="text-[10px] opacity-50 uppercase tracking-widest">Order Status</h3>
              <div className="p-3 border border-neon-green/30 bg-terminal-bg font-bold text-xs uppercase tracking-widest text-center">
                {order.status}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] opacity-50 uppercase tracking-widest">Operational Actions</h3>
              
              {user?.uid === order.sellerId && order.status === 'PENDING' && (
                <div className="grid gap-2">
                  <button 
                    onClick={() => updateOrderStatus('ACCEPTED')}
                    className="w-full py-2 bg-neon-green text-terminal-bg text-[10px] font-bold uppercase tracking-widest hover:bg-neon-green/90 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={14} />
                    {t('common.accept')}
                  </button>
                  <button 
                    onClick={() => updateOrderStatus('REJECTED')}
                    className="w-full py-2 border border-neon-green/30 text-[10px] font-bold uppercase tracking-widest hover:border-neon-green transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle size={14} />
                    {t('common.reject')}
                  </button>
                </div>
              )}

              {user?.uid === order.sellerId && order.status === 'ACCEPTED' && !order.agentId && (
                <div className="p-3 border border-yellow-500/30 bg-yellow-500/5 text-[8px] uppercase tracking-widest text-center text-yellow-500">
                  Awaiting Agent Retrieval
                </div>
              )}

              {(user?.uid === order.sellerId || user?.uid === order.agentId) && order.status === 'ACCEPTED' && (
                <button 
                  onClick={() => updateOrderStatus('DELIVERED')}
                  className="w-full py-2 bg-neon-green text-terminal-bg text-[10px] font-bold uppercase tracking-widest hover:bg-neon-green/90 transition-all flex items-center justify-center gap-2"
                >
                  <Truck size={14} />
                  {t('common.delivered')}
                </button>
              )}

              {user?.uid === order.buyerId && order.status === 'DELIVERED' && (
                <button 
                  onClick={() => updateOrderStatus('COMPLETED')}
                  className="w-full py-2 bg-neon-green text-terminal-bg text-[10px] font-bold uppercase tracking-widest hover:bg-neon-green/90 transition-all flex items-center justify-center gap-2"
                >
                  <Package size={14} />
                  {t('common.confirm')}
                </button>
              )}

              <button 
                onClick={() => updateOrderStatus('CANCELLED')}
                disabled={order.status === 'COMPLETED' || order.status === 'CANCELLED'}
                className="w-full py-2 border border-neon-green/30 text-[10px] font-bold uppercase tracking-widest hover:border-neon-green transition-all flex items-center justify-center gap-2 disabled:opacity-30"
              >
                <XCircle size={14} />
                {t('common.cancel')}
              </button>
            </div>

            <div className="pt-6 border-t border-neon-green/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-neon-green/30 flex items-center justify-center bg-neon-green/5">
                  <User size={14} />
                </div>
                <div>
                  <p className="text-[10px] opacity-50 uppercase tracking-widest">Target Zone</p>
                  <p className="text-xs font-bold uppercase">{order.id.slice(0, 4)}-ZONE</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
