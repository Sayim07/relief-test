import Image from 'next/image';

interface PageLoaderProps {
    className?: string;
}

export default function PageLoader({ className = '' }: PageLoaderProps) {
    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#060010]/80 backdrop-blur-md ${className}`}>
            <div className="relative animate-pulse">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-150 animate-pulse"></div>

                {/* Logo */}
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                    <Image
                        src="/logo.png"
                        alt="ReliefChain Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </div>
        </div>
    );
}
