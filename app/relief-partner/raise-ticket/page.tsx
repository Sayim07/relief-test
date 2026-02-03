'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { verificationTicketService, userService, categoryService } from '@/lib/firebase/services';
import { cloudinaryService } from '@/lib/cloudinaryService';
import { Building, MapPin, Tag, FileText, Camera, Video, Upload, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/lib/middleware/withAuth';

export default function RaiseTicketPage() {
    const { profile } = useAuth();
    const { address } = useWallet();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        organizationName: '',
        location: '',
        description: '',
        categories: [] as string[],
    });

    const [proofImages, setProofImages] = useState<File[]>([]);
    const [proofVideos, setProofVideos] = useState<File[]>([]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const cats = await categoryService.getAll();
            if (!cats || cats.length === 0) {
                setCategories([
                    { id: 'food', name: 'Food' },
                    { id: 'shelter', name: 'Shelter' },
                    { id: 'medical', name: 'Medical' },
                    { id: 'clothing', name: 'Clothing' },
                    { id: 'utilities', name: 'Utilities' },
                ]);
            } else {
                setCategories(cats);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

    // Audit logs for debugging
    const logStep = (step: string, details?: any) => {
        const timestamp = new Date().toISOString();
        console.log(`[TICKET_SUBMISSION][${timestamp}] ${step}`, details || '');
    };

    // Fail-safe timeout wrapper
    const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Operation timed out: ${label} after ${ms / 1000}s`)), ms)
        );
        return Promise.race([promise, timeout]);
    };

    const uploadFiles = async (files: File[], path: string, typeLabel: string): Promise<string[]> => {
        if (!files || files.length === 0) return [];

        logStep(`Starting ${typeLabel} upload batch [Cloudinary]`, { count: files.length, folder: path });

        try {
            // Using Cloudinary service for multi-upload
            const urls = await withTimeout(
                cloudinaryService.uploadMultiple(files, path),
                90000,
                `Cloudinary ${typeLabel} Upload`
            );
            logStep(`[${typeLabel}] All files uploaded successfully`, { count: urls.length });
            return urls;
        } catch (err: any) {
            logStep(`[${typeLabel}] BATCH FAILED`, { error: err.message });
            throw err;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) {
            logStep('ABORTED: No user profile found');
            return;
        }

        setError(null);
        logStep('Submission initialized', {
            org: formData.organizationName,
            categories: formData.categories
        });

        // Validation
        if (!formData.organizationName || !formData.location || !formData.description) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.categories.length === 0) {
            setError('Please select at least one relief category');
            return;
        }

        // Media is now optional as requested for "Instant" submission

        try {
            setLoading(true);

            const wallet = address || profile.walletAddress || 'unknown';
            const phone = profile.phone || 'N/A'; // From registration Phase 0
            logStep('Determined identifiers', { wallet, phone });

            // Generate Relief Partner Key: RP-<CATEGORY>-<RANDOM_HASH>
            const primaryCategory = formData.categories[0].toUpperCase();
            const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
            const generatedPartnerKey = `RP-${primaryCategory}-${randomHash}`;
            logStep('Generated Partner Key', { generatedPartnerKey });

            logStep('STEP 1: Uploading media files');
            const [imageUrls, videoUrls] = await Promise.all([
                proofImages.length > 0
                    ? uploadFiles(proofImages, `verification_tickets/${profile.uid}/images`, 'IMAGES')
                    : Promise.resolve([]),
                proofVideos.length > 0
                    ? uploadFiles(proofVideos, `verification_tickets/${profile.uid}/videos`, 'VIDEOS')
                    : Promise.resolve([])
            ]);
            logStep('STEP 1 COMPLETE: Media uploaded', { images: imageUrls.length, videos: videoUrls.length });

            // Step 2: Create Verification Ticket with PhaseFlow fields
            logStep('STEP 2: Creating Firestore ticket record');
            const ticketData = {
                userId: profile.uid,
                uid: profile.uid, // Keep for compatibility
                walletAddress: wallet,
                phone: phone,
                organizationName: formData.organizationName,
                location: formData.location,
                description: formData.description,
                categories: formData.categories,
                reliefPartnerKey: generatedPartnerKey,
                proofImages: imageUrls,
                proofVideos: videoUrls,
                status: 'pending' as const,
                verified: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const ticketId = await withTimeout(
                verificationTicketService.create(ticketData as any),
                30000,
                'Create Firestore Ticket'
            );
            logStep('STEP 2 COMPLETE: Ticket created', { ticketId });

            // Step 3: Update User Profile
            logStep('STEP 3: Updating partner status');
            await withTimeout(
                userService.update(profile.uid, {
                    hasSubmittedTicket: true,
                    verified: false
                }),
                15000,
                'Update User Status'
            );
            logStep('STEP 3 COMPLETE: User profile updated');

            logStep('SUBMISSION SUCCESS: All steps completed');
            setSuccess(true);

        } catch (err: any) {
            logStep('SUBMISSION FAILED', {
                message: err.message,
                code: err.code
            });

            const userFriendlyError = err.message.includes('Cloudinary')
                ? `Media upload failed: ${err.message}. Please check your Cloudinary configuration.`
                : `Submission failed: ${err.message}. If this persists, try removing images/videos to submit "Instantly".`;

            setError(userFriendlyError);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto py-20 px-4 text-center">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Ticket Submitted Successfully!</h1>
                    <p className="text-gray-400 mb-8 font-light text-lg">
                        Your verification ticket is now pending review by our administrators.
                        You will be notified once your account is verified and your Relief Partner Key is generated.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => router.push('/relief-partner')}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (profile?.hasSubmittedTicket) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto py-20 px-4 text-center">
                    <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Verification in Progress</h1>
                    <p className="text-gray-400 mb-8 font-light text-lg">
                        You already have a verification ticket pending review.
                        Please wait for our administrators to process your request.
                    </p>
                    <button
                        onClick={() => router.push('/relief-partner')}
                        className="px-8 py-3 bg-[#1a1a2e] border border-[#392e4e] text-white rounded-xl hover:bg-[#2a2a4e] transition-all font-bold"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <AuthGuard requiredRole="relief_partner">
            <DashboardLayout>
                <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Raise Verification Ticket</h1>
                        <p className="text-gray-400 font-light">
                            Provide your organization details and operational proof to get verified as a Relief Partner.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info Section */}
                        <div className="bg-[#1a1a2e] rounded-3xl border border-[#392e4e] p-8 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Building className="w-5 h-5 text-blue-500" />
                                Organization Details
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Organization Name *</label>
                                    <div className="relative group">
                                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.organizationName}
                                            onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                                            className="w-full bg-[#0a0a1a] border border-[#392e4e] rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                                            placeholder="Agency Name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Location *</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full bg-[#0a0a1a] border border-[#392e4e] rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                                            placeholder="City, Region, Country"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 space-y-2">
                                <label className="text-sm font-medium text-gray-400">Mission Description *</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    <textarea
                                        required
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-[#0a0a1a] border border-[#392e4e] rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none resize-none"
                                        placeholder="Describe your organization's mission and why you need funds..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Categories Section */}
                        <div className="bg-[#1a1a2e] rounded-3xl border border-[#392e4e] p-8 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-purple-500" />
                                Relief Categories
                            </h2>
                            <p className="text-sm text-gray-500 mb-6 italic">Select the categories your organization specializes in.</p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {categoriesLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                ) : (
                                    categories.map((cat) => (
                                        <label
                                            key={cat.id}
                                            className={`flex flex-col items-center justify-center p-4 border rounded-2xl cursor-pointer transition-all gap-2 group ${formData.categories.includes(cat.id)
                                                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                                : 'bg-[#0a0a1a] border-[#392e4e] text-gray-500 hover:border-gray-600'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={formData.categories.includes(cat.id)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        categories: checked
                                                            ? [...prev.categories, cat.id]
                                                            : prev.categories.filter(id => id !== cat.id)
                                                    }));
                                                }}
                                            />
                                            <Tag className={`w-6 h-6 ${formData.categories.includes(cat.id) ? 'text-blue-400' : 'text-gray-600'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{cat.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Evidence Section */}
                        <div className="bg-[#1a1a2e] rounded-3xl border border-[#392e4e] p-8 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-green-500" />
                                Verification Proof
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Image Upload */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-400">Proof Images (Optional)</label>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">IDs, Certs, etc.</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                        className="w-full h-40 bg-[#0a0a1a] border-2 border-dashed border-[#392e4e] rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Camera className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Add Images</span>
                                    </button>
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*, .pdf, .jpg, .jpeg, .png, .webp"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                setProofImages(prev => [...prev, ...Array.from(e.target.files!)]);
                                            }
                                        }}
                                    />

                                    <div className="flex flex-wrap gap-3">
                                        {proofImages.map((file, i) => (
                                            <div key={i} className="relative group w-16 h-16">
                                                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover rounded-xl border border-white/10 shadow-lg" />
                                                <button
                                                    type="button"
                                                    onClick={() => setProofImages(prev => prev.filter((_, idx) => idx !== i))}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-xl hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Video Upload */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-400">Proof Videos (Optional)</label>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Operation Footage</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('video-upload')?.click()}
                                        className="w-full h-40 bg-[#0a0a1a] border-2 border-dashed border-[#392e4e] rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Video className="w-6 h-6 text-purple-500" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Add Videos</span>
                                    </button>
                                    <input
                                        id="video-upload"
                                        type="file"
                                        accept="video/*, .mp4, .mkv, .mov, .avi"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                setProofVideos(prev => [...prev, ...Array.from(e.target.files!)]);
                                            }
                                        }}
                                    />

                                    <div className="flex flex-wrap gap-3">
                                        {proofVideos.map((file, i) => (
                                            <div key={i} className="relative group w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
                                                <Video className="w-6 h-6 text-purple-400" />
                                                <button
                                                    type="button"
                                                    onClick={() => setProofVideos(prev => prev.filter((_, idx) => idx !== i))}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-xl hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {(error) && (
                            <div className="flex items-center gap-3 text-red-400 text-sm bg-red-900/20 p-4 rounded-2xl border border-red-900/30">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20 font-black uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-6 h-6" />
                                    Submit Verification Ticket
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
