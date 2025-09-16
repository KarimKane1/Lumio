'use client';

import React, { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
import { Search, Download, Eye, Star, Edit, Trash2, Plus } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  service_type: string;
  city: string;
  created_at: string;
  photo_url: string;
  owner_user_id: string;
  recommendation_count: number;
  phone?: string;
}

export default function AdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProviders, setTotalProviders] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchProviders();
  }, [currentPage, searchTerm]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/providers?${params}`);
      const data = await response.json();
      
      setProviders(data.providers || []);
      setTotalPages(data.totalPages || 1);
      setTotalProviders(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProviders();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getServiceTypeColor = (serviceType: string) => {
    const colors = {
      plumber: 'bg-blue-100 text-blue-800',
      cleaner: 'bg-green-100 text-green-800',
      nanny: 'bg-pink-100 text-pink-800',
      electrician: 'bg-yellow-100 text-yellow-800',
      carpenter: 'bg-orange-100 text-orange-800',
      hair: 'bg-purple-100 text-purple-800',
      henna: 'bg-red-100 text-red-800',
      chef: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[serviceType as keyof typeof colors] || colors.other;
  };

  const handleEditProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowEditModal(true);
  };

  const handleDeleteProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowDeleteModal(true);
  };


  const handleCreateProvider = () => {
    setShowCreateModal(true);
  };

  const handleExportProviders = async () => {
    try {
      const response = await fetch('/api/admin/providers/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `providers-export-${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
          <p className="text-gray-600">Manage and view all service providers</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleCreateProvider}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </button>
          <button 
            onClick={handleExportProviders}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSearch} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search providers by name, service type, or city..."
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

      {/* Providers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              All Providers ({totalProviders.toLocaleString()})
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading providers...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recommendations
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
                  {providers.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mr-3">
                            {provider.photo_url?.startsWith('emoji:') ? (
                              <span className="text-lg">{provider.photo_url.replace('emoji:', '')}</span>
                            ) : provider.photo_url ? (
                              <img src={provider.photo_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <span>{provider.name?.charAt(0) || 'P'}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {provider.name || 'Unnamed Provider'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceTypeColor(provider.service_type)}`}>
                          {provider.service_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {provider.city || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-bold text-gray-900">
                            {provider.recommendation_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatDate(provider.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleEditProvider(provider)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit Provider"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProvider(provider)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Provider"
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
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalProviders)} of {totalProviders} results
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

      {/* Edit Provider Modal */}
      {showEditModal && selectedProvider && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-xl font-black text-gray-900 mb-4">Edit Provider</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const countryCode = formData.get('countryCode') as string;
                const phoneNumber = formData.get('phoneNumber') as string;
                const fullPhone = countryCode + phoneNumber;

                try {
                  const response = await fetch(`/api/admin/providers/${selectedProvider.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: formData.get('name'),
                      service_type: formData.get('service_type'),
                      city: formData.get('city'),
                      phone: fullPhone,
                    }),
                  });

                  if (response.ok) {
                    fetchProviders(); // Refresh the list
                    setShowEditModal(false);
                    setSelectedProvider(null);
                  } else {
                    const errorData = await response.json();
                    console.error('Update failed:', errorData.error);
                    alert('Failed to update provider: ' + (errorData.error || 'Unknown error'));
                  }
                } catch (error) {
                  console.error('Update failed:', error);
                  alert('Network error while updating provider');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-black text-gray-900">Provider Name</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={selectedProvider.name}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-900">Service Type</label>
                    <select
                      name="service_type"
                      defaultValue={selectedProvider.service_type}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="plumber">Plumber</option>
                      <option value="cleaner">Cleaner</option>
                      <option value="nanny">Nanny</option>
                      <option value="electrician">Electrician</option>
                      <option value="carpenter">Carpenter</option>
                      <option value="hair">Hair Stylist</option>
                      <option value="henna">Henna Artist</option>
                      <option value="chef">Chef</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-900">City</label>
                    <input
                      type="text"
                      name="city"
                      defaultValue={selectedProvider.city}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-900">Phone</label>
                    <div className="mt-1 flex space-x-2">
                      <select
                        name="countryCode"
                        defaultValue={selectedProvider.phone?.startsWith('+221') ? '+221' : selectedProvider.phone?.startsWith('+1') ? '+1' : '+221'}
                        className="border border-gray-300 rounded-md px-3 py-2 w-20"
                      >
                        <option value="+221">+221</option>
                        <option value="+1">+1</option>
                        <option value="+33">+33</option>
                        <option value="+44">+44</option>
                      </select>
                      <input
                        type="tel"
                        name="phoneNumber"
                        defaultValue={selectedProvider.phone?.replace(/^\+\d{1,3}/, '') || ''}
                        placeholder="Phone number"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
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
      {showDeleteModal && selectedProvider && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-xl font-black text-gray-900 mb-4">Delete Provider</h3>
              <p className="text-sm font-black text-gray-900 mb-6">
                Are you sure you want to delete <strong>{selectedProvider.name}</strong>? This action cannot be undone and will also delete all associated recommendations.
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
                      const response = await fetch(`/api/admin/providers/${selectedProvider.id}`, {
                        method: 'DELETE',
                      });
                      if (response.ok) {
                        fetchProviders(); // Refresh the list
                        setShowDeleteModal(false);
                        setSelectedProvider(null);
                      } else {
                        const errorData = await response.json();
                        console.error('Delete failed:', errorData.error);
                        alert('Failed to delete provider: ' + (errorData.error || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Delete failed:', error);
                      alert('Network error while deleting provider');
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

      {/* Create Provider Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-xl font-black text-gray-900 mb-4">Add New Provider</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const countryCode = formData.get('countryCode') as string;
                const phoneNumber = formData.get('phoneNumber') as string;
                const fullPhone = countryCode + phoneNumber;

                try {
                  const response = await fetch('/api/admin/providers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: formData.get('name'),
                      service_type: formData.get('service_type'),
                      city: 'Dakar', // Default city
                      phone: fullPhone,
                      owner_user_id: null, // No owner
                    }),
                  });

                  if (response.ok) {
                    fetchProviders(); // Refresh the list
                    setShowCreateModal(false);
                  } else {
                    const errorData = await response.json();
                    console.error('Create failed:', errorData.error);
                    alert('Failed to create provider: ' + (errorData.error || 'Unknown error'));
                  }
                } catch (error) {
                  console.error('Create failed:', error);
                  alert('Network error while creating provider');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-black text-gray-900">Provider Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-900">Service Type</label>
                    <select
                      name="service_type"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select service type</option>
                      <option value="plumber">Plumber</option>
                      <option value="cleaner">Cleaner</option>
                      <option value="nanny">Nanny</option>
                      <option value="electrician">Electrician</option>
                      <option value="carpenter">Carpenter</option>
                      <option value="hair">Hair Stylist</option>
                      <option value="henna">Henna Artist</option>
                      <option value="chef">Chef</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-900">Phone</label>
                    <div className="mt-1 flex space-x-2">
                      <select
                        name="countryCode"
                        required
                        className="border border-gray-300 rounded-md px-3 py-2 w-20"
                      >
                        <option value="+221">+221</option>
                        <option value="+1">+1</option>
                        <option value="+33">+33</option>
                        <option value="+44">+44</option>
                      </select>
                      <input
                        type="tel"
                        name="phoneNumber"
                        required
                        placeholder="Phone number"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Create Provider
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
