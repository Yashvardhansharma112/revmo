"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Bot, MessageCircle, Phone, Package, Check } from "lucide-react";

const agents = [
  { icon: Package, color: "#10b981", label: "Inventory" },
  { icon: MessageCircle, color: "#7c3aed", label: "WhatsApp" },
  { icon: Phone, color: "#2563eb", label: "Voice" },
];

export default function PageLoader({ onComplete }: { onComplete?: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            onComplete?.();
          }, 400);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)",
          }}
        >
          {/* Animated Background Orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]"
            />
            <motion.div
              animate={{
                x: [0, -80, 0],
                y: [0, 60, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px]"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mb-8 shadow-lg shadow-purple-500/30"
            >
              <Zap className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-black tracking-tight mb-2"
            >
              <span className="text-white">Store</span>
              <span className="gradient-text">Pilot</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-zinc-500 mb-12"
            >
              AI Agents for your Shopify store
            </motion.p>

            {/* Loading Bar */}
            <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden mb-6">
              <motion.div
                className="h-full gradient-bg rounded-full"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            {/* Agent Icons Animating */}
            <div className="flex items-center gap-4 mb-8">
              {agents.map((agent, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                >
                  <motion.div
                    animate={{
                      y: [0, -8, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut",
                    }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${agent.color}20`,
                      border: `1px solid ${agent.color}40`,
                    }}
                  >
                    <agent.icon
                      className="w-6 h-6"
                      style={{ color: agent.color }}
                    />
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Status Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-zinc-600 flex items-center gap-2"
            >
              {progress < 30 && <span>Connecting to servers...</span>}
              {progress >= 30 && progress < 60 && <span>Loading AI agents...</span>}
              {progress >= 60 && progress < 90 && <span>Configuring integration...</span>}
              {progress >= 90 && (
                <span className="flex items-center gap-1 text-green-500">
                  <Check className="w-3 h-3" /> Ready
                </span>
              )}
            </motion.div>
          </div>

          {/* Pulsing dots decoration */}
          <div className="absolute bottom-8 flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 rounded-full bg-purple-500/50"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}