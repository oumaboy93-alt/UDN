import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { DISTRICTS, DHAKA_ZONES } from '../constants';
import { Role } from '../types';
import { Shield, User, Briefcase, MapPin, CheckCircle } from 'lucide-react';

export default function Onboarding() {
  const { updateProfile } = useAuth();
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>('AGENT');
  const [district, setDistrict] = useState('Dhaka');
  const [zone, setZone] = useState('Gulshan');
  const [codename, setCodename] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCodename = () => {
    setIsGenerating(true);
    const prefixes = ['GHOST', 'CIPHER', 'SHADOW', 'NEURAL', 'VOID', 'SPECTRE', 'WRAITH', 'BLADE'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNumber = Math.floor(Math.random() * 99).toString().padStart(2, '0');
    
    setTimeout(() => {
      setCodename(`${randomPrefix}-${randomNumber}`);
      setIsGenerating(false);
    }, 1500);
  };

  const handleComplete = async () => {
    await updateProfile({
      role,
      district,
      zone,
      codename,
      isVerified: true,
      walletBalance: 1000, // Initial balance for new users
      stats: {
        drops: 0,
        rating: 5.0,
        joinedAt: new Date().toISOString()
      }
    });
  };

  const roles = [
    { id: 'AGENT', label: 'Agent', icon: Shield, desc: 'Field operative for drop retrieval.' },
    { id: 'OPERATOR', label: 'Operator', icon: User, desc: 'Intelligence and logistics support.' },
    { id: 'SELLER', label: 'Seller', icon: Briefcase, desc: 'Supplier of tactical assets.' }
  ];

  return (
    <div className="min-h-screen bg-terminal-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-neon-green/30 bg-terminal-bg/80 backdrop-blur-xl p-8 rounded-none shadow-[0_0_30px_rgba(0,255,65,0.1)]">
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 mx-1 ${step >= i ? 'bg-neon-green' : 'bg-neon-green/20'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold tracking-tighter uppercase">{t('onboarding.role_selection')}</h2>
              <div className="grid gap-4">
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id as Role)}
                    className={`p-4 border text-left transition-all ${role === r.id ? 'bg-neon-green text-terminal-bg border-neon-green' : 'border-neon-green/30 hover:border-neon-green/60'}`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <r.icon size={18} />
                      <span className="font-bold uppercase tracking-widest">{r.label}</span>
                    </div>
                    <p className={`text-xs ${role === r.id ? 'text-terminal-bg/80' : 'text-neon-green/60'}`}>{r.desc}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-neon-green text-terminal-bg font-bold uppercase tracking-widest hover:bg-neon-green/90 transition-all"
              >
                {t('common.next')}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold tracking-tighter uppercase">{t('onboarding.zone_assignment')}</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase opacity-50 tracking-widest">District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-terminal-bg border border-neon-green/30 p-3 text-neon-green focus:border-neon-green outline-none"
                  >
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {district === 'Dhaka' && (
                  <div className="space-y-2">
                    <label className="text-xs uppercase opacity-50 tracking-widest">Zone</label>
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="w-full bg-terminal-bg border border-neon-green/30 p-3 text-neon-green focus:border-neon-green outline-none"
                    >
                      {DHAKA_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-neon-green/30 font-bold uppercase tracking-widest hover:border-neon-green transition-all"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-neon-green text-terminal-bg font-bold uppercase tracking-widest hover:bg-neon-green/90 transition-all"
                >
                  {t('common.next')}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold tracking-tighter uppercase">{t('onboarding.codename_generation')}</h2>
              <div className="p-12 border border-dashed border-neon-green/30 flex flex-col items-center justify-center gap-4">
                {isGenerating ? (
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 0.1 }}
                    className="text-4xl font-bold tracking-widest text-neon-green/50"
                  >
                    SCRAMBLING...
                  </motion.div>
                ) : codename ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-bold tracking-widest flex flex-col items-center gap-2"
                  >
                    <span className="text-neon-green">{codename}</span>
                    <CheckCircle className="text-neon-green" size={24} />
                  </motion.div>
                ) : (
                  <button
                    onClick={generateCodename}
                    className="p-4 border border-neon-green text-neon-green hover:bg-neon-green hover:text-terminal-bg transition-all uppercase font-bold tracking-widest"
                  >
                    GENERATE CODENAME
                  </button>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-neon-green/30 font-bold uppercase tracking-widest hover:border-neon-green transition-all"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!codename}
                  className="flex-1 py-3 bg-neon-green text-terminal-bg font-bold uppercase tracking-widest hover:bg-neon-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('boot.ready')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
