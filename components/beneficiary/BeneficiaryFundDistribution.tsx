'use client';

import React, { useEffect, useState } from 'react';
import { UserProfile } from '@/lib/types/user';
import { Donation, ReliefPartnerAssignment } from '@/lib/types/database';
import {
  donationService,
  reliefPartnerAssignmentService,
  userService,
} from '@/lib/firebase/services';

interface ReliefPartnerInfo extends Partial<UserProfile> {
  uid: string;
  name: string;
  email: string;
  verified: boolean;
  organization?: string;
  servicesOffered?: string[];
}

interface AllocationItem {
  partnerId: string;
  partnerName: string;
  amount: number;
}

export const BeneficiaryFundDistribution: React.FC<{ beneficiaryId: string }> = ({
  beneficiaryId,
}) => {
  const [availableDonations, setAvailableDonations] = useState<Donation[]>([]);
  const [reliefPartners, setReliefPartners] = useState<ReliefPartnerInfo[]>([]);
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [beneficiary, setBeneficiary] = useState<UserProfile | null>(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [allocatingAmount, setAllocatingAmount] = useState(0);
  const [allocatingPartner, setAllocatingPartner] = useState<ReliefPartnerInfo | null>(null);

  // Fetch beneficiary info
  useEffect(() => {
    const fetchBeneficiary = async () => {
      try {
        const user = await userService.get(beneficiaryId);
        setBeneficiary(user);
      } catch (error) {
        console.error('Error fetching beneficiary:', error);
      }
    };
    fetchBeneficiary();
  }, [beneficiaryId]);

  // Fetch available donations (general pool + verified)
  useEffect(() => {
    const fetchAvailableDonations = async () => {
      try {
        setLoading(true);

        // Get all verified donations
        const allVerified = await donationService.getByStatus('verified');

        // Filter for general pool donations (not direct to relief partner)
        const availableDons = allVerified.filter((d: any) => d.donationType === 'general');

        setAvailableDonations(availableDons);
      } catch (error) {
        console.error('Error fetching donations:', error);
        setError('Failed to load available donations');
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableDonations();
  }, []);

  // Fetch relief partners
  useEffect(() => {
    const fetchReliefPartners = async () => {
      try {
        const partners = await userService.getByRole('relief-partner' as any);

        const formattedPartners: ReliefPartnerInfo[] = partners
          .filter((p: any) => p.verified)
          .map((p: any) => ({
            uid: p.uid,
            name: p.displayName || p.email.split('@')[0],
            email: p.email,
            verified: p.verified,
            organization: p.metadata?.organization,
            servicesOffered: p.metadata?.servicesOffered || [],
          }));

        setReliefPartners(formattedPartners);
      } catch (error) {
        console.error('Error fetching relief partners:', error);
      }
    };
    fetchReliefPartners();
  }, []);

  const totalAvailable = availableDonations.reduce((sum, d) => sum + d.amount, 0);
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  const remainingToAllocate = totalAvailable - totalAllocated;

  const handleStartAllocation = (donation: Donation) => {
    setSelectedDonation(donation);
    setAllocatingAmount(donation.amount);
    setShowAllocationModal(true);
  };

  const handleAddAllocation = () => {
    if (!allocatingPartner || !selectedDonation || allocatingAmount <= 0) {
      setError('Please select a partner and enter a valid amount');
      return;
    }

    if (allocatingAmount > selectedDonation.amount) {
      setError('Allocation amount cannot exceed donation amount');
      return;
    }

    // Add allocation
    const newAllocation: AllocationItem = {
      partnerId: allocatingPartner.uid,
      partnerName: allocatingPartner.name,
      amount: allocatingAmount,
    };

    setAllocations([...allocations, newAllocation]);
    setShowAllocationModal(false);
    setSelectedDonation(null);
    setAllocatingAmount(0);
    setAllocatingPartner(null);
    setError('');
  };

  const handleRemoveAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleSubmitAllocations = async () => {
    try {
      setError('');
      setSubmitting(true);

      if (allocations.length === 0) {
        setError('Please create at least one allocation');
        return;
      }

      if (totalAllocated === 0) {
        setError('Total allocated amount must be greater than 0');
        return;
      }

      if (!beneficiary) {
        setError('Beneficiary information not found');
        return;
      }

      // Create assignments for each allocation
      for (const allocation of allocations) {
        const partner = reliefPartners.find((p) => p.uid === allocation.partnerId);
        if (!partner) continue;

        const assignmentData: Omit<ReliefPartnerAssignment, 'id' | 'createdAt' | 'updatedAt'> =
          {
            reliefPartnerId: partner.uid,
            reliefPartnerEmail: partner.email,
            reliefPartnerName: partner.name,
            beneficiaryFundId: 'fund-' + selectedDonation!.id, // Reference to donation
            beneficiaryId: beneficiaryId,
            beneficiaryEmail: beneficiary.email,
            beneficiaryName: beneficiary.displayName,
            amount: allocation.amount,
            amountDisplay: `${allocation.amount} ${selectedDonation!.currency}`,
            currency: selectedDonation!.currency,
            category: selectedDonation!.category,
            purpose: selectedDonation!.description,
            status: 'pending',
            assignedBy: beneficiaryId,
            assignedAt: new Date(),
            spentAmount: 0,
            remainingAmount: allocation.amount,
          };

        await reliefPartnerAssignmentService.create(assignmentData);
      }

      setSuccess(
        `Successfully allocated ${allocations.length} distribution(s)! Relief partners will be notified.`
      );
      setAllocations([]);

      // Refresh available donations
      const allVerified = await donationService.getByStatus('verified');
      const availableDons = allVerified.filter((d: any) => d.donationType === 'general');
      setAvailableDonations(availableDons);

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error submitting allocations:', err);
      setError('Failed to submit allocations. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Fund Distribution</h1>
          <p className="text-slate-600">Allocate verified donations to relief partners</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-slate-600">Available Funds</div>
            <div className="text-3xl font-bold text-slate-900">
              ₹{totalAvailable.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-slate-600">Allocated</div>
            <div className="text-3xl font-bold text-blue-600">
              ₹{totalAllocated.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-slate-600">Remaining</div>
            <div className="text-3xl font-bold text-slate-900">
              ₹{remainingToAllocate.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-slate-600">Distributions</div>
            <div className="text-3xl font-bold text-purple-600">{allocations.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Available Donations */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Available Donations</h2>

              {availableDonations.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <p>No verified donations available for distribution</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className="border border-slate-200 rounded-lg p-4 hover:shadow-lg transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {donation.donorName || donation.donorEmail}
                          </h3>
                          <p className="text-sm text-slate-600">{donation.donorEmail}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-900">
                            {donation.amountDisplay}
                          </div>
                          <div className="text-xs text-slate-600">
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Purpose:</span> {donation.description}
                        </p>
                        {donation.category && (
                          <p className="text-sm text-slate-600 mt-1">
                            <span className="font-medium">Category:</span> {donation.category}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleStartAllocation(donation)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        Allocate to Relief Partner
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Allocations Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-20">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Allocation Summary</h2>

              {allocations.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  <p>No allocations yet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {allocations.map((allocation, index) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {allocation.partnerName}
                            </p>
                            <p className="text-sm text-slate-600">₹{allocation.amount.toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveAllocation(index)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-600">Total Allocated:</span>
                      <span className="font-bold text-slate-900">
                        ₹{totalAllocated.toFixed(2)}
                      </span>
                    </div>
                    {remainingToAllocate > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>Remaining:</span>
                        <span className="font-bold">₹{remainingToAllocate.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSubmitAllocations}
                    disabled={submitting || allocations.length === 0}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 transition font-semibold"
                  >
                    {submitting ? 'Processing...' : '✓ Confirm Allocations'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Allocation Modal */}
      {showAllocationModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Allocate Donation</h2>
              <button
                onClick={() => setShowAllocationModal(false)}
                className="text-slate-600 hover:text-slate-900 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Donation Info */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Donation Amount</p>
                <p className="text-2xl font-bold text-slate-900">{selectedDonation.amountDisplay}</p>
                <p className="text-sm text-slate-600 mt-2">Purpose: {selectedDonation.description}</p>
              </div>

              {/* Partner Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Relief Partner
                </label>
                <select
                  value={allocatingPartner?.uid || ''}
                  onChange={(e) => {
                    const partner = reliefPartners.find((p) => p.uid === e.target.value);
                    setAllocatingPartner(partner || null);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a partner...</option>
                  {reliefPartners.map((partner) => (
                    <option key={partner.uid} value={partner.uid}>
                      {partner.name} ({partner.email})
                    </option>
                  ))}
                </select>
              </div>

              {allocatingPartner && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="font-semibold text-slate-900 mb-1">{allocatingPartner.name}</p>
                  <p className="text-slate-600 text-xs">{allocatingPartner.email}</p>
                  {allocatingPartner.organization && (
                    <p className="text-slate-600 text-xs">Organization: {allocatingPartner.organization}</p>
                  )}
                  {allocatingPartner.servicesOffered && allocatingPartner.servicesOffered.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {allocatingPartner.servicesOffered.map((service) => (
                        <span key={service} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {service}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Allocation Amount
                </label>
                <input
                  type="number"
                  value={allocatingAmount || ''}
                  onChange={(e) => setAllocatingAmount(parseFloat(e.target.value) || 0)}
                  min="0"
                  max={selectedDonation.amount}
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-600 mt-1">Max: {selectedDonation.amountDisplay}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowAllocationModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAllocation}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add Allocation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeneficiaryFundDistribution;
