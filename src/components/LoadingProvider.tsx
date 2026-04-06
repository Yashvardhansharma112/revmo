"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Bot, MessageCircle, Phone, Package, Check } from "lucide-react";

const agents = [
  { icon: Package, color: "#10b981", label: "Inventory" },
  { icon: MessageCircle, color: "#7c3aed", label: "WhatsApp" },
  { icon: Phone, color: "#2563eb", label: "Voice" },
];

interface LoadingContextType {
  isLoading: boolean;
  complete: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: true,
  complete: () => {},
});

export function useLoading() {
  return useContext(LoadingContext);
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const complete = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 500);
          return 100;
        }
        return Math.min(prev + Math.random() * 20 + 8, 100);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, complete }}>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)",
            }}
          >
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{ x: [0, 120, 0], y: [0, -60, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[150px]"
              />
              <motion.div
                animate={{ x: [0, -100, 0], y: [0, 80, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/5 rounded-full blur-[200px]"
              />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Logo with pulse */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 rounded-2xl gradient-bg flex items-center justify-center shadow-2xl shadow-purple-500/40"
                >
                  <Zap className="w-12 h-12 text-white" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl bg-purple-500/30 blur-xl"
                />
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-4xl font-black tracking-tight mt-8 mb-2"
              >
                <span className="text-white">Store</span>
                <span className="gradient-text">Pilot</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-sm text-zinc-500 mb-10"
              >
                AI Agents for your Shopify store
              </motion.p>

              {/* Loading Bar */}
              <div className="w-56 h-1.5 bg-zinc-800/50 rounded-full overflow-hidden mb-8">
                <motion.div
                  className="h-full gradient-bg rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>

              {/* Agent Icons Animating in sequence */}
              <div className="flex items-center gap-3 mb-8">
                {agents.map((agent, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.12 }}
                  >
                    <motion.div
                      animate={{
                        y: [0, -6, 0],
                        boxShadow: [
                          `0 0 0 0 ${agent.color}40`,
                          `0 0 20px 5px ${agent.color}30`,
                          `0 0 0 0 ${agent.color}40`,
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeInOut",
                      }}
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: `${agent.color}15`,
                        border: `1px solid ${agent.color}30`,
                      }}
                    >
                      <agent.icon
                        className="w-7 h-7"
                        style={{ color: agent.color }}
                      />
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {/* Dynamic Status Text */}
              <motion.div
                key={Math.floor(progress / 30)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-zinc-500 h-5 flex items-center gap-2"
              >
                {progress < 20 && "Initializing..."}
                {progress >= 20 && progress < 40 && (
                  <span className="flex items-center gap-1.5">
                    <motion.span animate={{ opacity: [0.5, 1] }} className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Connecting to servers
                  </span>
                )}
                {progress >= 40 && progress < 60 && (
                  <span className="flex items-center gap-1.5">
                    <motion.span animate={{ opacity: [0.5, 1] }} className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    Loading AI models
                  </span>
                )}
                {progress >= 60 && progress < 80 && (
                  <span className="flex items-center gap-1.5">
                    <motion.span animate={{ opacity: [0.5, 1] }} className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Configuring agents
                  </span>
                )}
                {progress >= 80 && progress < 100 && (
                  <span className="flex items-center gap-1.5">
                    <motion.span animate={{ opacity: [0.5, 1] }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Almost ready
                  </span>
                )}
                {progress >= 100 && (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-3 h-3" /> Ready
                  </span>
                )}
              </motion.div>
            </div>

            {/* Decorative pulsing dots at bottom */}
            <div className="absolute bottom-10 flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1, 0.8] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                  className="w-1.5 h-1.5 rounded-full bg-purple-500/40"
                />
              ))}
            </div>

            {/* Corner accents */}
            <div className="absolute top-6 left-6 w-20 h-20 border-l-2 border-t-2 border-purple-500/20 rounded-tl-3xl" />
            <div className="absolute top-6 right-6 w-20 h-20 border-r-2 border-t-2 border-purple-500/20 rounded-tr-3xl" />
            <div className="absolute bottom-6 left-6 w-20 h-20 border-l-2 border-b-2 border-purple-500/20 rounded-bl-3xl" />
            <div className="absolute bottom-6 right-6 w-20 h-20 border-r-2 border-b-2 border-purple-500/20 rounded-br-3xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      {children}
    </LoadingContext.Provider>
  );
}