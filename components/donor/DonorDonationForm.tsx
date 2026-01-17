'use client';

import React, { useEffect, useState } from 'react';
import { UserProfile, UserRole } from '@/lib/types/user';
import { donationService, userService } from '@/lib/firebase/services';
import { Donation } from '@/lib/types/database';

interface ReliefPartnerInfo extends Partial<UserProfile> {
  uid: string;
  name: string;
  email: string;
  verified: boolean;
  profileImage?: string;
  organization?: string;
  yearsOfExperience?: number;
  servicesOffered?: string[];
}

interface DonationFormData {
  amount: number;
  currency: string;
  description: string;
  category?: string;
  donationType: 'direct' | 'general';
  reliefPartnerId?: string;
}

export const DonorDonationForm: React.FC<{ userId: string }> = ({ userId }) => {
  const [formData, setFormData] = useState<DonationFormData>({
    amount: 0,
    currency: 'USD',
    description: '',
    category: '',
    donationType: 'general',
  });

  const [reliefPartners, setReliefPartners] = useState<ReliefPartnerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<ReliefPartnerInfo | null>(null);
  const [partnerModal, setPartnerModal] = useState(false);
  const [donor, setDonor] = useState<UserProfile | null>(null);

  // Fetch donor info
  useEffect(() => {
    const fetchDonor = async () => {
      try {
        const user = await userService.get(userId);
        setDonor(user);
      } catch (error) {
        console.error('Error fetching donor info:', error);
      }
    };
    fetchDonor();
  }, [userId]);

  // Fetch relief partners
  useEffect(() => {
    const fetchReliefPartners = async () => {
      try {
        setLoading(true);
        const partners = await userService.getByRole('relief-partner' as UserRole);

        const formattedPartners: ReliefPartnerInfo[] = partners
          .filter((p: any) => p.verified) // Only show verified partners
          .map((p: any) => ({
            uid: p.uid,
            name: p.displayName || p.email.split('@')[0],
            email: p.email,
            verified: p.verified,
            profileImage: p.profileImage,
            organization: p.metadata?.organization,
            yearsOfExperience: p.metadata?.yearsOfExperience,
            servicesOffered: p.metadata?.servicesOffered || [],
          }));

        setReliefPartners(formattedPartners);
      } catch (error) {
        console.error('Error fetching relief partners:', error);
        setError('Failed to load relief partners');
      } finally {
        setLoading(false);
      }
    };
    fetchReliefPartners();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'donationType') {
      setFormData({
        ...formData,
        donationType: value as 'direct' | 'general',
        reliefPartnerId: undefined, // Clear partner selection
      });
      setSelectedPartner(null);
    } else if (name === 'amount') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSelectPartner = (partner: ReliefPartnerInfo) => {
    setSelectedPartner(partner);
    setFormData({
      ...formData,
      reliefPartnerId: partner.uid,
    });
    setPartnerModal(false);
  };

  const validateForm = (): boolean => {
    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid donation amount');
      return false;
    }

    if (formData.amount < 10) {
      setError('Minimum donation amount is $10');
      return false;
    }

    if (formData.amount > 1000000) {
      setError('Maximum donation amount is $1,000,000');
      return false;
    }

    if (!formData.description || formData.description.trim().length < 10) {
      setError('Please provide a description (at least 10 characters)');
      return false;
    }

    if (formData.donationType === 'direct' && !formData.reliefPartnerId) {
      setError('Please select a relief partner');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      if (!donor) {
        setError('Donor information not found');
        return;
      }

      // Create donation
      const donationData: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'> = {
        donorId: userId,
        donorEmail: donor.email,
        donorName: donor.displayName,
        amount: formData.amount,
        amountDisplay: `${formData.amount} ${formData.currency}`,
        currency: formData.currency,
        category: formData.category,
        description: formData.description,
        status: 'pending',
        donationType: formData.donationType,
        reliefPartnerId: formData.reliefPartnerId,
        verification: {
          method: 'auto',
          status: 'pending',
          riskScore: 0,
          donorVerified: donor.verified,
        },
      };

      const donationId = await donationService.create(donationData);

      setSuccess(
        `Donation created successfully! ID: ${donationId}. Your donation is pending verification by admins.`
      );
      setFormData({
        amount: 0,
        currency: 'USD',
        description: '',
        category: '',
        donationType: 'general',
      });
      setSelectedPartner(null);

      // Reset form after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Error creating donation:', err);
      setError('Failed to create donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Make a Donation</h1>
          <p className="text-slate-600">Support relief efforts by donating today</p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Donation Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                How would you like to donate?
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* General Donation */}
                <button
                  type="button"
                  onClick={() => handleInputChange({
                    target: { name: 'donationType', value: 'general' }
                  } as any)}
                  className={`p-4 rounded-lg border-2 transition ${
                    formData.donationType === 'general'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-lg font-semibold text-slate-900 mb-1">💰 General Pool</div>
                  <div className="text-sm text-slate-600">
                    Donate to relief pool. Admin & beneficiaries decide allocation.
                  </div>
                </button>

                {/* Direct Donation */}
                <button
                  type="button"
                  onClick={() => handleInputChange({
                    target: { name: 'donationType', value: 'direct' }
                  } as any)}
                  className={`p-4 rounded-lg border-2 transition ${
                    formData.donationType === 'direct'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-lg font-semibold text-slate-900 mb-1">🤝 Direct Partner</div>
                  <div className="text-sm text-slate-600">
                    Donate directly to a relief partner.
                  </div>
                </button>
              </div>
            </div>

            {/* Relief Partner Selection (if direct donation) */}
            {formData.donationType === 'direct' && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Select a Relief Partner
                </label>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : reliefPartners.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-slate-600">
                    No verified relief partners available at this time.
                  </div>
                ) : (
                  <>
                    {selectedPartner ? (
                      <div className="p-4 bg-blue-50 border-2 border-blue-500 rounded-lg mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-1">{selectedPartner.name}</h3>
                            <p className="text-sm text-slate-600">{selectedPartner.email}</p>
                            {selectedPartner.organization && (
                              <p className="text-sm text-slate-600 mt-1">
                                Organization: {selectedPartner.organization}
                              </p>
                            )}
                            {selectedPartner.servicesOffered && selectedPartner.servicesOffered.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {selectedPartner.servicesOffered.map((service) => (
                                  <span
                                    key={service}
                                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                  >
                                    {service}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setPartnerModal(true)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPartnerModal(true)}
                        className="w-full p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-500 hover:text-blue-600 transition font-medium"
                      >
                        Click to select a relief partner
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-semibold text-slate-900 mb-2">
                Donation Amount *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount || ''}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  min="10"
                  max="1000000"
                  step="0.01"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
              <p className="text-xs text-slate-600 mt-1">Min: $10 | Max: $1,000,000</p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-slate-900 mb-2">
                Category (Optional)
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                <option value="food">Food & Nutrition</option>
                <option value="medical">Medical & Healthcare</option>
                <option value="shelter">Shelter & Housing</option>
                <option value="water">Water & Sanitation</option>
                <option value="education">Education</option>
                <option value="clothing">Clothing & Essentials</option>
                <option value="emergency">Emergency Response</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-900 mb-2">
                Purpose of Donation * (Min 10 characters)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your donation purpose..."
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={10}
              />
              <p className="text-xs text-slate-600 mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition font-semibold text-lg"
            >
              {submitting ? 'Processing...' : '💳 Donate Now'}
            </button>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 rounded-lg text-sm text-slate-700">
              <p className="font-semibold mb-2">📋 What happens next?</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Your donation will be reviewed by admins</li>
                <li>Blockchain verification will be performed</li>
                <li>Once verified, it will be available for distribution</li>
                <li>You'll receive confirmation updates via email</li>
              </ul>
            </div>
          </form>
        </div>
      </div>

      {/* Relief Partner Selection Modal */}
      {partnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Select a Relief Partner</h2>
              <button
                onClick={() => setPartnerModal(false)}
                className="text-slate-600 hover:text-slate-900 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {reliefPartners.map((partner) => (
                <button
                  key={partner.uid}
                  onClick={() => handleSelectPartner(partner)}
                  className="w-full p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                >
                  <div className="font-semibold text-slate-900">{partner.name}</div>
                  <div className="text-sm text-slate-600">{partner.email}</div>
                  {partner.organization && (
                    <div className="text-sm text-slate-600 mt-1">Organization: {partner.organization}</div>
                  )}
                  {partner.yearsOfExperience && (
                    <div className="text-sm text-slate-600">
                      Experience: {partner.yearsOfExperience} years
                    </div>
                  )}
                  {partner.servicesOffered && partner.servicesOffered.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {partner.servicesOffered.map((service) => (
                        <span
                          key={service}
                          className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-green-600 font-semibold">✓ Verified Partner</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorDonationForm;
