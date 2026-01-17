'use client';

import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
            <div className="relative">
                {/* Pulsing Glow */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-blue-600 blur-[60px] rounded-full"
                />

                {/* Logo Container */}
                <motion.div
                    animate={{
                        rotateY: [0, 360],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="relative p-6 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl"
                >
                    <Shield className="w-16 h-16 text-blue-500" />
                </motion.div>
            </div>

            {/* Text */}
            <div className="mt-12 text-center">
                <h2 className="text-xl font-black text-white tracking-[0.3em] uppercase">
                    ReliefChain
                </h2>
                <div className="mt-4 flex items-center justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut"
                            }}
                            className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                        />
                    ))}
                </div>
            </div>

            {/* Progress Bar (Fake) */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="w-full h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                />
            </div>
        </div>
    );
}
