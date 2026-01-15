'use client';

import Link from 'next/link';
import { Shield, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the ShinyText component
const ShinyText = dynamic(() => import('@/components/ShinyText'), {
  ssr: false,
});

// Dynamically import the TextType component
const TextType = dynamic(() => import('@/components/TextType'), {
  ssr: false,
});

// Dynamically import the Hyperspeed component to avoid SSR issues
const Hyperspeed = dynamic(() => import('@/components/Hyperspeed'), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-black" />,
});

// Dynamically import LightRays
const LightRays = dynamic(() => import('@/components/LightRays'), {
  ssr: false,
});

// Dynamically import PixelBlast
const PixelBlast = dynamic(() => import('@/components/PixelBlast'), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#060010]/80 border-b border-[#392e4e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <Shield className="w-8 h-8 text-blue-500 relative" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">ReliefChain</span>
          </div>
          <Link
            href="/auth"
            className="px-6 py-2 text-gray-300 hover:text-white font-medium transition-all hover:bg-blue-900/20 rounded-full border border-[#392e4e]"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Hyperspeed background layer */}
        <div className="absolute inset-0 z-0">
          <Hyperspeed />
        </div>

        {/* LightRays effect */}
        <div className="absolute inset-0 z-0">
          <LightRays
            raysColor="#3b82f6" // blue-500
            raysSpeed={0.2}
            lightSpread={0.2}
            rayLength={3.0}
            fadeDistance={2.0}
            mouseInfluence={0.05}
          />
        </div>

        {/* PixelBlast effect */}
        <div className="absolute inset-0 z-0 opacity-50">
          <PixelBlast
            variant="circle"
            pixelSize={8}
            color="#3b82f6" // blue-500
            patternDensity={1.2}
            enableRipples={true}
            rippleSpeed={1.5}
          />
        </div>

        {/* Gradient overlays to ensure readability */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
        <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/60 pointer-events-none" />

        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          {/* Main Logo */}
          <div className="mb-12 flex justify-center scale-110 sm:scale-125">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-600 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-all duration-1000 animate-pulse"></div>
              <div className="relative bg-[#0a0a1a]/50 backdrop-blur-2xl p-8 rounded-3xl border border-[#392e4e] shadow-2xl">
                <Shield className="w-24 h-24 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl sm:text-8xl font-black mb-6 tracking-tighter">
            <ShinyText
              text="ReliefChain"
              disabled={false}
              speed={3}
              className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500 block"
            />
          </h1>

          {/* Tagline with Typing Effect */}
          <div className="h-[40px] sm:h-[48px] mb-8">
            <TextType
              text="Next-Gen Transparent Disaster Relief"
              typingSpeed={70}
              pauseDuration={3000}
              showCursor={true}
              cursorClassName="bg-blue-500/80"
              className="text-2xl sm:text-3xl font-light text-blue-400/80 leading-relaxed tracking-wide"
            />
          </div>

          {/* Subtitle */}
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Fast, transparent, and decentralized. Leveraging Web3 to ensure
            every donation reaches those who need it most, instantly.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/auth"
              className="relative inline-flex items-center gap-3 px-10 py-5 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:bg-blue-500 transition-all duration-500 group overflow-hidden shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-10px_rgba(37,99,235,0.7)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              Get Started
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-500" />
            </Link>

            <button className="px-10 py-5 text-lg font-semibold text-gray-300 hover:text-white transition-colors border border-[#392e4e] rounded-2xl hover:bg-blue-900/10 backdrop-blur-sm">
              How it works
            </button>
          </div>
        </div>
      </div>

      <div className="py-32 px-4 sm:px-6 lg:px-8 bg-[#060010] relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#392e4e] to-transparent" />

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Powerful Transparency
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light">
              Built on industrial-grade blockchain technology for absolute accountability
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8 text-blue-500" />,
                title: 'Immutable Ledger',
                description: 'Every transaction is recorded permanently on the blockchain, providing a single source of truth.',
              },
              {
                icon: '⚡',
                title: 'Instant Aid',
                description: 'Proprietary stablecoin infrastructure enables sub-second cross-border fund distribution.',
              },
              {
                icon: '🌍',
                title: 'Global Scale',
                description: 'Decentralized nodes ensure the platform remains accessible even when local infrastructure fails.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative p-10 rounded-3xl bg-[#0a0a1a]/50 border border-[#392e4e] hover:border-blue-500/50 transition-all duration-700 hover:bg-blue-900/10"
              >
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed font-light">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-20 px-4 sm:px-6 lg:px-8 bg-[#060010] border-t border-[#392e4e]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-black tracking-tight">ReliefChain</span>
            </div>
            <div className="flex gap-8 text-gray-400 font-light">
              <a href="#" className="hover:text-blue-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Security</a>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-[#392e4e]">
            <p className="text-gray-500 font-light">
              © 2026 ReliefChain. All rights reserved. Pioneering transparent disaster relief.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
