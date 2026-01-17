'use client';

import React, { useEffect, useState } from 'react';
import { Donation, DonationStatus } from '@/lib/types/database';
import { donationService, donationVerificationService, userService } from '@/lib/firebase/services';
import { UserProfile } from '@/lib/types/user';

interface VerificationFilters {
  status: DonationStatus | 'all';
  riskLevel: 'all' | 'low' | 'medium' | 'high';
  sortBy: 'newest' | 'oldest' | 'largest' | 'smallest' | 'highestRisk';
}

export const DonationVerificationDashboard: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [filters, setFilters] = useState<VerificationFilters>({
    status: 'all',
    riskLevel: 'all',
    sortBy: 'newest',
  });
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [expandedDonationId, setExpandedDonationId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState<UserProfile | null>(null);

  // Fetch current user (admin)
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        // Get admin info from session/auth
        const adminId = localStorage.getItem('userId');
        if (adminId) {
          const admin = await userService.get(adminId);
          setCurrentAdmin(admin);
        }
      } catch (error) {
        console.error('Error fetching admin:', error);
      }
    };
    fetchAdmin();
  }, []);

  // Fetch all donations
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true);
        // Fetch all donations (admin sees all)
        const allDonations = await donationService.getByStatus('pending');
        const verifiedDonations = await donationService.getByStatus('verified');
        const rejectedDonations = await donationService.getByStatus('rejected');

        const combined = [...allDonations, ...verifiedDonations, ...rejectedDonations];
        setDonations(combined);
      } catch (error) {
        console.error('Error fetching donations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...donations];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter((d) => d.status === filters.status);
    }

    // Filter by risk level
    if (filters.riskLevel !== 'all') {
      const riskScore = (d: Donation) => d.verification?.riskScore || 0;
      filtered = filtered.filter((d) => {
        const score = riskScore(d);
        if (filters.riskLevel === 'low') return score < 30;
        if (filters.riskLevel === 'medium') return score >= 30 && score < 70;
        if (filters.riskLevel === 'high') return score >= 70;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'largest':
          return b.amount - a.amount;
        case 'smallest':
          return a.amount - b.amount;
        case 'highestRisk':
          return (b.verification?.riskScore || 0) - (a.verification?.riskScore || 0);
        default:
          return 0;
      }
    });

    setFilteredDonations(filtered);
  }, [donations, filters]);

  const getRiskLevelLabel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 70) return 'Medium Risk';
    return 'High Risk';
  };

  const getRiskLevelColor = (score: number) => {
    if (score < 30) return 'bg-green-100 text-green-800';
    if (score < 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusBadgeColor = (status: DonationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'distributed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDonationTypeLabel = (donationType: string) => {
    return donationType === 'direct' ? 'Direct to Partner' : 'General Pool';
  };

  const handleVerify = async (donationId: string) => {
    try {
      if (!currentAdmin?.uid) {
        alert('Admin info not found');
        return;
      }
      await donationVerificationService.verifyDonation(
        donationId,
        'manual',
        currentAdmin.uid,
        { notes: adminNote }
      );
      // Refresh donations
      const updated = await donationService.get(donationId);
      if (updated) {
        setDonations((prev) => prev.map((d) => (d.id === donationId ? updated : d)));
      }
      setAdminNote('');
      alert('Donation verified successfully!');
    } catch (error) {
      console.error('Error verifying donation:', error);
      alert('Error verifying donation');
    }
  };

  const handleReject = async (donationId: string, reason: string) => {
    try {
      if (!currentAdmin?.uid) {
        alert('Admin info not found');
        return;
      }
      await donationVerificationService.rejectDonation(donationId, currentAdmin.uid, reason);
      // Refresh donations
      const updated = await donationService.get(donationId);
      if (updated) {
        setDonations((prev) => prev.map((d) => (d.id === donationId ? updated : d)));
      }
      alert('Donation rejected');
    } catch (error) {
      console.error('Error rejecting donation:', error);
      alert('Error rejecting donation');
    }
  };

  const handleAddNote = async (donationId: string) => {
    try {
      if (!currentAdmin?.uid) {
        alert('Admin info not found');
        return;
      }
      await donationVerificationService.addVerificationNote(donationId, currentAdmin.uid, adminNote);
      setAdminNote('');
      alert('Note added successfully!');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Error adding note');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Donation Verification Dashboard</h1>
          <p className="text-slate-600">Review and verify donations from donors</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-slate-600">Total Donations</div>
            <div className="text-3xl font-bold text-slate-900">{donations.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-slate-600">Pending</div>
            <div className="text-3xl font-bold text-blue-600">{donations.filter((d) => d.status === 'pending').length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-slate-600">Verified</div>
            <div className="text-3xl font-bold text-green-600">{donations.filter((d) => d.status === 'verified').length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-slate-600">High Risk</div>
            <div className="text-3xl font-bold text-red-600">
              {donations.filter((d) => (d.verification?.riskScore || 0) >= 70).length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value as DonationStatus | 'all' })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="distributed">Distributed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Risk Level</label>
              <select
                value={filters.riskLevel}
                onChange={(e) =>
                  setFilters({ ...filters, riskLevel: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="largest">Largest Amount</option>
                <option value="smallest">Smallest Amount</option>
                <option value="highestRisk">Highest Risk</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({
                    status: 'all',
                    riskLevel: 'all',
                    sortBy: 'newest',
                  })
                }
                className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Donations List */}
        <div className="space-y-4">
          {filteredDonations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-slate-600">No donations found</p>
            </div>
          ) : (
            filteredDonations.map((donation) => (
              <div
                key={donation.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
              >
                {/* Summary */}
                <div
                  onClick={() =>
                    setExpandedDonationId(expandedDonationId === donation.id ? null : donation.id)
                  }
                  className="p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{donation.donorName || donation.donorEmail}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(donation.status)}`}>
                          {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getDonationTypeLabel(donation.donationType)}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(
                            donation.verification?.riskScore || 0
                          )}`}
                        >
                          {getRiskLevelLabel(donation.verification?.riskScore || 0)} (
                          {donation.verification?.riskScore || 0})
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{donation.donorEmail}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">
                        {donation.amountDisplay} {donation.currency}
                      </div>
                      <div className="text-sm text-slate-600">
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedDonationId === donation.id && (
                  <div className="border-t border-slate-200 p-6 bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Donation Details */}
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Donation Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Donation ID:</span>
                            <span className="font-mono text-slate-900 break-all">{donation.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Amount:</span>
                            <span className="text-slate-900 font-semibold">
                              {donation.amount} {donation.currency}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Category:</span>
                            <span className="text-slate-900">{donation.category || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Description:</span>
                            <span className="text-slate-900">{donation.description || 'N/A'}</span>
                          </div>
                          {donation.transactionHash && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Tx Hash:</span>
                              <span className="font-mono text-xs text-slate-900 break-all">
                                {donation.transactionHash}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Verification Details */}
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Verification Info</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Risk Score:</span>
                            <span className="font-bold">{donation.verification?.riskScore || 0}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Method:</span>
                            <span className="text-slate-900 capitalize">
                              {donation.verification?.method || 'pending'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Transaction Verified:</span>
                            <span className="text-slate-900">
                              {donation.verification?.transactionVerified ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Donor Verified:</span>
                            <span className="text-slate-900">
                              {donation.verification?.donorVerified ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Amount Verified:</span>
                            <span className="text-slate-900">
                              {donation.verification?.amountVerified ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                          {donation.verification?.verifiedAt && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Verified At:</span>
                              <span className="text-slate-900">
                                {new Date(donation.verification.verifiedAt).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes Section */}
                    {donation.status === 'pending' && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Verification Notes</h4>
                        <textarea
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Add verification notes or concerns..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                      </div>
                    )}

                    {/* Actions */}
                    {donation.status === 'pending' && (
                      <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <button
                          onClick={() => handleVerify(donation.id)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium"
                        >
                          ✓ Verify Donation
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) handleReject(donation.id, reason);
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
                        >
                          ✗ Reject Donation
                        </button>
                        <button
                          onClick={() => handleAddNote(donation.id)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
                        >
                          💬 Add Note
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationVerificationDashboard;
