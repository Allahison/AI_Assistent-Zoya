/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Power, PowerOff, AlertCircle, Globe } from "lucide-react";
import { useLiveSession } from "./hooks/useLiveSession";
import { cn } from "./lib/utils";

export default function App() {
  const { state, error, connect, disconnect, isProcessing, outgoingMessage } = useLiveSession();
  const [isHovered, setIsHovered] = useState(false);

  const isConnected = state !== "disconnected" && state !== "connecting";
  const isConnecting = state === "connecting";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening" || state === "connected";

  const toggleSession = () => {
    if (state === "disconnected") {
      connect();
    } else {
      disconnect();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050505] text-white font-sans overflow-hidden flex flex-col items-center justify-center selection:bg-pink-500/30">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className={cn(
            "absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-1000 opacity-20",
            isSpeaking ? "bg-pink-600" : isListening ? "bg-teal-600" : "bg-blue-900"
          )}
        />
        <div 
          className={cn(
            "absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] transition-all duration-1000 opacity-10",
            isSpeaking ? "bg-purple-600" : isListening ? "bg-blue-600" : "bg-indigo-900"
          )}
        />
      </div>

      {/* Header */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-10">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold tracking-tighter italic flex items-center gap-2"
          >
            ZOYA <span className="text-[10px] not-italic font-mono opacity-40 border border-white/20 px-1.5 py-0.5 rounded">v3.1 LIVE</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="text-[10px] font-mono uppercase tracking-[0.2em] mt-1"
          >
            Neural Interface Active
          </motion.p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              state === "disconnected" ? "bg-red-500" : "bg-green-500"
            )} />
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
              {state}
            </span>
          </div>
          {error && (
            <div className="flex items-center gap-1 text-red-400 text-[10px] font-mono uppercase">
              <AlertCircle size={10} />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Main Interaction Area */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Waveform Visualization (Simulated) */}
        <div className="h-32 flex items-center justify-center gap-1 mb-12">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: isSpeaking 
                  ? [20, 80, 40, 100, 20][(i % 5)] 
                  : isListening 
                    ? [10, 30, 15, 40, 10][(i % 5)]
                    : 4,
                opacity: isConnected ? 1 : 0.2
              }}
              transition={{
                duration: isSpeaking ? 0.4 : 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.05
              }}
              className={cn(
                "w-1 rounded-full transition-colors duration-500",
                isSpeaking ? "bg-pink-500" : isListening ? "bg-teal-400" : "bg-white/20"
              )}
            />
          ))}
        </div>

        {/* Central Button */}
        <div className="relative group">
          {/* Glow Effect */}
          <AnimatePresence>
            {(isHovered || isConnected) && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: isSpeaking ? [1, 1.2, 1] : 1.1, 
                  opacity: isSpeaking ? 0.6 : 0.3 
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "absolute inset-0 rounded-full blur-3xl",
                  isSpeaking ? "bg-pink-500" : isListening ? "bg-teal-500" : "bg-blue-500"
                )}
              />
            )}
          </AnimatePresence>
          
          {/* Processing Indicator - Professional Spinning Ring */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 0.3 }
                }}
                className="absolute -inset-6 border-2 border-dashed border-teal-500/40 rounded-full z-0"
              />
            )}
          </AnimatePresence>

          <motion.button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={toggleSession}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 border-2",
              state === "disconnected" 
                ? "bg-white/5 border-white/10 hover:border-white/30" 
                : isConnecting
                  ? "bg-amber-500/10 border-amber-500/50 animate-pulse"
                  : isSpeaking
                    ? "bg-pink-500/20 border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.3)]"
                    : "bg-teal-500/20 border-teal-500 shadow-[0_0_30px_rgba(20,184,166,0.3)]"
            )}
          >
            {state === "disconnected" ? (
              <Power className="w-10 h-10 text-white/40 group-hover:text-white transition-colors" />
            ) : isConnecting ? (
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Mic className={cn(
                "w-10 h-10 transition-colors",
                isSpeaking ? "text-pink-500" : "text-teal-400"
              )} />
            )}
          </motion.button>

          {/* Status Labels */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center whitespace-nowrap">
            <motion.span 
              key={state}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40"
            >
              {state === "disconnected" ? "Initialize Zoya" : 
               isConnecting ? "Establishing Link" :
               isProcessing ? "Neural Processing" :
               isSpeaking ? "Zoya is speaking" : "Listening to you"}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
        <div className="max-w-[200px]">
          <p className="text-[10px] font-mono text-white/30 leading-relaxed uppercase tracking-wider">
            Voice-only interaction enabled. Zoya is emotionally responsive and witty.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Latency</span>
            <span className="text-[10px] font-mono text-teal-500/60">~120ms</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Uptime</span>
            <span className="text-[10px] font-mono text-teal-500/60">99.9%</span>
          </div>
        </div>
      </div>

      {/* Premium WhatsApp Message Overlay */}
      <AnimatePresence>
        {outgoingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="absolute bottom-32 z-50 px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.1)] max-w-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                outgoingMessage.startsWith("Searching") ? "bg-amber-500" : "bg-green-500"
              )} />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">
                {outgoingMessage.startsWith("Searching") ? "Robotic Composition" : "Neural Message Link"}
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed italic text-white/90">
              "{outgoingMessage}"
            </p>
            <div className="mt-3 w-full h-0.5 bg-white/5 overflow-hidden rounded-full">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-1/2 h-full bg-green-500/50"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Overlay for "Sassy" vibe */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none border-[20px] border-pink-500/5 z-0"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

