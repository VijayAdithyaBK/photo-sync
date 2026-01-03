import React, { useState } from 'react';
import { AppMode } from './types';
import Receiver from './components/Receiver';
import Sender from './components/Sender';
import { Monitor, Smartphone, ChevronLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SELECTION);

  const renderSelection = () => (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-cream">
      {/* Memphis Geometric Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
         {/* Top Right Circles */}
         <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border-4 border-retro-green opacity-20"></div>
         <div className="absolute top-10 right-10 w-8 h-8 rounded-full bg-retro-red"></div>
         
         {/* Bottom Left Triangle area */}
         <div className="absolute bottom-0 left-0">
             <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 200L100 100L200 200H0Z" fill="#C84C4C" fillOpacity="0.1"/>
                <path d="M-50 200L50 100L150 200H-50Z" stroke="#2D2D2D" strokeWidth="2" strokeOpacity="0.1"/>
             </svg>
         </div>

         {/* Middle Zig Zag */}
         <div className="absolute top-1/3 left-[-50px]">
             <svg width="100" height="300" viewBox="0 0 100 300" fill="none">
                 <path d="M0 0L50 25L0 50L50 75L0 100" stroke="#4F7859" strokeWidth="4" fill="none" opacity="0.2"/>
             </svg>
         </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 max-w-xl mx-auto w-full">
        
        {/* Typographic Hero */}
        <div className="w-full mb-12 relative">
            <div className="absolute -left-4 -top-4">
                <div className="w-12 h-12">
                   <svg viewBox="0 0 100 100" className="animate-spin-slow w-full h-full text-retro-red fill-current">
                      <path d="M50 0L61 35H98L68 57L79 91L50 70L21 91L32 57L2 35H39L50 0Z" />
                   </svg>
                </div>
            </div>
            
            <h1 className="font-serif text-7xl md:text-8xl text-retro-dark leading-[0.85] tracking-tight relative z-10">
                Photo<br/>
                <span className="text-retro-red underline decoration-retro-green decoration-4 underline-offset-4">Sync</span>
            </h1>
            
            <div className="mt-6 flex items-center gap-4">
                <div className="h-px bg-retro-dark flex-1"></div>
                <p className="font-sans font-bold text-sm uppercase tracking-widest text-retro-dark">Secure Local Transfer</p>
                <div className="h-px bg-retro-dark flex-1"></div>
            </div>
        </div>

        {/* Card Options */}
        <div className="w-full grid gap-6">
            <motion.button
                whileHover={{ y: -4, boxShadow: "6px 6px 0px 0px #2D2D2D" }}
                whileTap={{ y: 0, boxShadow: "0px 0px 0px 0px #2D2D2D" }}
                onClick={() => setMode(AppMode.SENDER)}
                className="w-full bg-white border-2 border-retro-dark rounded-2xl p-6 flex items-center justify-between shadow-retro transition-all group relative overflow-hidden"
            >
                <div className="relative z-10 text-left">
                    <span className="block font-sans font-bold text-xs uppercase tracking-wider text-retro-red mb-1">Upload Mode</span>
                    <h2 className="font-serif text-3xl text-retro-dark">Send Files</h2>
                </div>
                <div className="w-14 h-14 bg-retro-red rounded-full flex items-center justify-center border-2 border-retro-dark text-white group-hover:scale-110 transition-transform z-10">
                    <Smartphone className="w-7 h-7" strokeWidth={2} />
                </div>
                {/* Decorative Pattern inside card */}
                <div className="absolute right-0 bottom-0 opacity-10">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="80" cy="80" r="40" stroke="currentColor" strokeWidth="20" />
                    </svg>
                </div>
            </motion.button>

            <motion.button
                whileHover={{ y: -4, boxShadow: "6px 6px 0px 0px #2D2D2D" }}
                whileTap={{ y: 0, boxShadow: "0px 0px 0px 0px #2D2D2D" }}
                onClick={() => setMode(AppMode.RECEIVER)}
                className="w-full bg-retro-green border-2 border-retro-dark rounded-2xl p-6 flex items-center justify-between shadow-retro transition-all group relative overflow-hidden"
            >
                <div className="relative z-10 text-left">
                    <span className="block font-sans font-bold text-xs uppercase tracking-wider text-cream mb-1">Download Mode</span>
                    <h2 className="font-serif text-3xl text-white">Receive</h2>
                </div>
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border-2 border-retro-dark text-retro-dark group-hover:scale-110 transition-transform z-10">
                    <Monitor className="w-7 h-7" strokeWidth={2} />
                </div>
                 {/* Decorative Pattern inside card */}
                 <div className="absolute right-0 bottom-0 opacity-10 text-white">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        <rect x="40" y="40" width="100" height="100" transform="rotate(45 40 40)" fill="currentColor"/>
                    </svg>
                </div>
            </motion.button>
        </div>

      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] w-full font-sans bg-cream overflow-hidden">
      <AnimatePresence mode="wait">
        {mode === AppMode.SELECTION && (
          <motion.div 
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            {renderSelection()}
          </motion.div>
        )}
        
        {mode !== AppMode.SELECTION && (
          <motion.div 
            key="app-interface"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-cream sm:p-4"
          >
            <div className="w-full h-full sm:max-w-md sm:h-[90vh] sm:border-2 sm:border-retro-dark sm:rounded-3xl sm:shadow-retro bg-cream flex flex-col overflow-hidden relative">
                
                {/* Global Header for Modes */}
                <div className="flex-none h-16 border-b-2 border-retro-dark bg-white flex items-center justify-between px-4 z-20">
                     <button 
                        onClick={() => setMode(AppMode.SELECTION)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors border-2 border-transparent hover:border-retro-dark"
                     >
                        <ChevronLeft className="w-6 h-6 text-retro-dark" />
                     </button>
                     <span className="font-serif text-xl text-retro-dark">
                         {mode === AppMode.SENDER ? 'Sender' : 'Receiver'}
                     </span>
                     <div className="w-10"></div>
                </div>

                <div className="flex-1 overflow-hidden relative bg-cream">
                    {mode === AppMode.RECEIVER && <Receiver />}
                    {mode === AppMode.SENDER && <Sender />}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;