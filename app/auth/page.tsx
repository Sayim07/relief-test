'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Users, Wallet, Heart, HandHeart, ArrowRight, BarChart3 } from 'lucide-react';

// Dynamically import MagicBento to avoid SSR issues with GSAP/DOM
import dynamic from 'next/dynamic';
const MagicBento = dynamic(() => import('@/components/MagicBento'), {
  ssr: false,
});
const ShinyText = dynamic(() => import('@/components/ShinyText'), {
  ssr: false,
});
const TargetCursor = dynamic(() => import('@/components/TargetCursor'), {
  ssr: false,
});

export default function AuthPage() {
  const router = useRouter();

  const roles = [
    {
      value: 'admin',
      label: 'ADMINISTRATOR',
      title: 'Admin',
      description: 'Manage beneficiaries, distribute relief funds, and monitor all transactions',
      icon: Shield,
      color: '#0a0a1a',
    },
    {
      value: 'beneficiary',
      label: 'RECIPIENT',
      title: 'Beneficiary',
      description: 'View your balance, spending limits, and make category-based transfers',
      icon: Users,
      color: '#0a1a10',
    },
    {
      value: 'donor',
      label: 'SUPPORTER',
      title: 'Donor',
      description: 'Make donations to support relief efforts and track your contributions',
      icon: Heart,
      color: '#1a0a1a',
    },
    {
      value: 'relief_partner',
      label: 'OPERATOR',
      title: 'Relief Partner',
      description: 'Execute relief operations and manage assigned funds',
      icon: HandHeart,
      color: '#1a150a',
    },
  ];

  const bentoData = roles.map(role => ({
    title: role.title,
    description: role.description,
    label: role.label,
    color: role.color,
    icon: role.icon,
    onClick: () => router.replace(`/login?role=${role.value}`)
  }));

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group transition-all">
            <div className="p-2 bg-blue-600/10 rounded-lg group-hover:bg-blue-600/20 transition-all border border-blue-500/20">
              <Shield className="w-6 h-6 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            </div>
            <span className="text-xl font-black tracking-tight text-white group-hover:text-blue-400 transition-colors">ReliefChain</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-white/60 hover:text-white font-medium transition-all hover:gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
          >
            ← Back
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl px-4 mx-auto">
          <div className="text-center mb-16 space-y-6">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter">
              <ShinyText
                text="Choose Your Journey"
                disabled={false}
                speed={3}
                className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 block"
              />
            </h1>
            <p className="text-xl text-white/50 max-w-2xl mx-auto font-light leading-relaxed">
              Select your role in the ecosystem to access personalized relief management tools and blockchain insights.
            </p>
          </div>

          {/* Role Grid with MagicBento */}
          <div className="mb-20">
            <MagicBento
              data={bentoData}
              glowColor="59, 130, 246"
              particleCount={15}
              enableTilt={true}
              enableMagnetism={true}
              cardClassName="cursor-target"
              enableBentoGrid={false}
              centered={true}
              gridClassName="max-w-7xl"
            />
          </div>

          {/* Additional Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: '🔒', title: 'Secure & Transparent', desc: 'Blockchain-verified every step of the way' },
              { icon: '⚡', title: 'Fast & Instant', desc: 'Real-time transactions and settlements' },
              { icon: '🌍', title: 'Global Reach', desc: 'Connect with relief partners worldwide' }
            ].map((info, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:border-white/20 hover:-translate-y-1">
                <div className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-500 inline-block">{info.icon}</div>
                <h4 className="text-lg font-bold text-white mb-2">{info.title}</h4>
                <p className="text-sm text-white/50 leading-relaxed">{info.desc}</p>
              </div>
            ))}
          </div>

          {/* Footer Links */}
          <div className="mt-20 text-center space-y-12">
            <div className="space-y-4">
              <p className="text-white/40 text-lg">
                Don't have an account?{' '}
                <Link href="/register" className="text-blue-500 font-bold hover:text-blue-400 underline underline-offset-8 decoration-blue-500/30 hover:decoration-blue-500 transition-all">
                  Create one here
                </Link>
              </p>
            </div>

            {/* Public Audit Trail Button */}
            <Link
              href="/audit"
              className="inline-block group relative"
            >
              <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-2xl opacity-0 group-hover:opacity-40 transition-all duration-700 -z-10"></div>
              <div className="px-12 py-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl shadow-2xl hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] transition-all duration-500 hover:scale-105 active:scale-95 inline-flex items-center gap-6 border border-white/20">
                <div className="p-3 bg-white/10 rounded-xl">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-black tracking-tight uppercase">Public Audit Trail</div>
                  <div className="text-sm text-blue-100/70 font-medium">View all live blockchain transactions</div>
                </div>
                <ArrowRight className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-2 transition-all" />
              </div>
            </Link>
          </div>
        </div>
      </div>
      <TargetCursor />
    </div>
  );
}

