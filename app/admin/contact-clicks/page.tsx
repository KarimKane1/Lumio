'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, User, Briefcase, Calendar, Filter } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ContactClick {
  id: string;
  seeker_name: string;
  seeker_id: string;
  provider_name: string;
  provider_id: string;
  service_type: string;
  clicked_at: string;
  provider_city?: string;
}

export default function ContactClicksPage() {
  const [contactClicks, setContactClicks] = useState<ContactClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '7d' | '30d'>('7d');
  const router = useRouter();

  useEffect(() => {
    fetchContactClicks();
  }, [filter]);

  const fetchContactClicks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/contact-clicks?filter=${filter}&t=${Date.now()}`);
      const data = await response.json();
      setContactClicks(data.contactClicks || []);
    } catch (error) {
      console.error('Failed to fetch contact clicks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getServiceTypeColor = (serviceType: string) => {
    const colors: { [key: string]: string } = {
      plumber: 'bg-blue-100 text-blue-800',
      electrician: 'bg-yellow-100 text-yellow-800',
      hvac: 'bg-green-100 text-green-800',
      carpenter: 'bg-orange-100 text-orange-800',
      handyman: 'bg-purple-100 text-purple-800',
      cleaner: 'bg-pink-100 text-pink-800',
      nanny: 'bg-indigo-100 text-indigo-800',
      hair: 'bg-red-100 text-red-800',
      henna: 'bg-teal-100 text-teal-800',
      chef: 'bg-gray-100 text-gray-800'
    };
    return colors[serviceType] || 'bg-gray-100 text-gray-800';
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="w-6 h-6 mr-3 text-purple-600" />
              Contact Clicks Details
            </h1>
            <p className="text-gray-600">Detailed view of all contact interactions</p>
          </div>
        </div>
        
        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | '7d' | '30d')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{contactClicks.length}</p>
              <p className="text-sm text-gray-600">Total Clicks</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {new Set(contactClicks.map(c => c.seeker_id)).size}
              </p>
              <p className="text-sm text-gray-600">Unique Seekers</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {new Set(contactClicks.map(c => c.provider_id)).size}
              </p>
              <p className="text-sm text-gray-600">Unique Providers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Clicks List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Contact Interactions</h3>
          <p className="text-sm text-gray-600">All contact clicks with detailed information</p>
        </div>
        
        {contactClicks.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contact clicks found</h3>
            <p className="text-gray-600">No contact interactions for the selected time period.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {contactClicks.map((click) => (
              <div key={click.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {click.seeker_name}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm font-medium text-gray-900">
                          {click.provider_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceTypeColor(click.service_type)}`}>
                          {capitalizeFirst(click.service_type)}
                        </span>
                        {click.provider_city && (
                          <span className="text-gray-500">{click.provider_city}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(click.clicked_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
