'use client';

import React, { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
import { Search, Download, Eye, Edit, Trash2, Plus, UserCheck, UserX } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone_e164: string;
  city: string;
  language: string;
  created_at: string;
  photo_url: string;
  is_active?: boolean;
  role?: 'seeker' | 'provider';
}

export default function AdminSeekers() {
  const [seekers, setSeekers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSeekers, setTotalSeekers] = useState(0);
  const [selectedSeeker, setSelectedSeeker] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchSeekers();
  }, [currentPage, searchTerm]);

  const fetchSeekers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        role: 'seeker', // Only fetch seekers
      });

      console.log('Fetching seekers with params:', params.toString());
      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      
      console.log('Fetched seekers:', data.users?.length, 'total:', data.total);
      setSeekers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalSeekers(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch seekers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSeekers();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const maskPhone = (phone: string) => {
    if (!phone) return 'N/A';
    
    // Handle E.164 format (e.g., +12022945325)
    if (phone.startsWith('+')) {
      const countryCode = phone.substring(0, 3); // +1, +22, etc.
      const lastFour = phone.slice(-4);
      const middleDigits = phone.slice(3, -4);
      const maskedMiddle = '*'.repeat(Math.min(middleDigits.length, 5));
      return `${countryCode} ${maskedMiddle} ${lastFour}`;
    }
    
    // Fallback for other formats
    const lastFour = phone.slice(-4);
    return `*****${lastFour}`;
  };

  const handleEditSeeker = (seeker: User) => {
    setSelectedSeeker(seeker);
    setShowEditModal(true);
  };

  const handleDeleteSeeker = (seeker: User) => {
    setSelectedSeeker(seeker);
    setShowDeleteModal(true);
  };

  const handleToggleSeekerStatus = async (seeker: User) => {
    try {
      const response = await fetch(`/api/admin/users/${seeker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is_active: !seeker.is_active,
          action: 'toggle_status'
        }),
      });

      if (response.ok) {
        fetchSeekers(); // Refresh the list
      } else {
        console.error('Failed to update seeker status');
      }
    } catch (error) {
      console.error('Error updating seeker status:', error);
    }
  };

  const handleCreateSeeker = () => {
    setShowCreateModal(true);
  };

  const handleExportSeekers = async () => {
    try {
      const response = await fetch('/api/admin/users/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seekers-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seekers</h1>
          <p className="text-gray-600">Manage and view all platform seekers</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleCreateSeeker}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Seeker
          </button>
          <button 
            onClick={handleExportSeekers}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSearch} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search seekers by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Seekers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              All Seekers ({totalSeekers.toLocaleString()})
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading seekers...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {seekers.map((seeker) => (
                    <tr key={seeker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mr-3">
                            {seeker.photo_url?.startsWith('emoji:') ? (
                              <span className="text-lg">{seeker.photo_url.replace('emoji:', '')}</span>
                            ) : seeker.photo_url ? (
                              <img src={seeker.photo_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <span>{seeker.name?.charAt(0) || 'U'}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {seeker.name || 'Unnamed Seeker'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{seeker.email || 'N/A'}</div>
                        <div className="text-sm font-medium text-gray-700">{maskPhone(seeker.phone_e164)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Seeker
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {seeker.city || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {seeker.language === 'fr' ? 'Français' : seeker.language === 'wo' ? 'Wolof' : 'English'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          seeker.is_active !== false 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {seeker.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(seeker.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleToggleSeekerStatus(seeker)}
                            className={`p-1 rounded ${
                              seeker.is_active !== false 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={seeker.is_active !== false ? 'Deactivate Seeker' : 'Activate Seeker'}
                          >
                            {seeker.is_active !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleEditSeeker(seeker)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit Seeker"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSeeker(seeker)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Seeker"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalSeekers)} of {totalSeekers} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Seeker Modal */}
      {showEditModal && selectedSeeker && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Seeker</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                // Handle edit submission
                setShowEditModal(false);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800">Name</label>
                    <input
                      type="text"
                      defaultValue={selectedSeeker.name}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800">Email</label>
                    <input
                      type="email"
                      defaultValue={selectedSeeker.email}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800">Phone</label>
                    <div className="mt-1 flex space-x-2">
                      <select
                        defaultValue={selectedSeeker.phone_e164?.startsWith('+221') ? '+221' : selectedSeeker.phone_e164?.startsWith('+1') ? '+1' : '+221'}
                        className="border border-gray-300 rounded-md px-3 py-2 w-20"
                      >
                        <option value="+221">+221</option>
                        <option value="+1">+1</option>
                        <option value="+33">+33</option>
                        <option value="+44">+44</option>
                      </select>
                      <input
                        type="tel"
                        defaultValue={selectedSeeker.phone_e164?.replace(/^\+\d{1,3}/, '') || ''}
                        placeholder="Phone number"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800">City</label>
                    <input
                      type="text"
                      defaultValue={selectedSeeker.city}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800">Language</label>
                    <select
                      defaultValue={selectedSeeker.language}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="wo">Wolof</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSeeker && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Seeker</h3>
              <p className="text-sm font-medium text-gray-700 mb-6">
                Are you sure you want to delete <strong>{selectedSeeker.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/admin/users/${selectedSeeker.id}`, {
                        method: 'DELETE',
                      });
                      if (response.ok) {
                        console.log('Seeker deleted successfully, refreshing list...');
                        await fetchSeekers(); // Refresh the list
                        setShowDeleteModal(false);
                        setSelectedSeeker(null);
                        console.log('List refreshed');
                      } else {
                        const errorData = await response.json();
                        console.error('Delete failed:', errorData.error);
                        alert('Failed to delete seeker: ' + (errorData.error || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Delete failed:', error);
                      alert('Network error while deleting seeker');
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
