'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Briefcase } from 'lucide-react';

interface GrowthData {
  date: string;
  totalUsers: number;
  seekers: number;
  providers: number;
}

export default function UserGrowthChart() {
  const [data, setData] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'seekers' | 'providers'>('all');

  useEffect(() => {
    fetchGrowthData();
  }, []);

  const fetchGrowthData = async () => {
    try {
      const response = await fetch(`/api/admin/user-growth?granularity=weekly&limit=8&t=${Date.now()}`);
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error('Failed to fetch growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    if (filter === 'seekers') {
      return data.map(d => ({ ...d, value: d.seekers }));
    } else if (filter === 'providers') {
      return data.map(d => ({ ...d, value: d.providers }));
    }
    return data.map(d => ({ ...d, value: d.totalUsers }));
  };

  const getMaxValue = () => {
    const filteredData = getFilteredData();
    return Math.max(...filteredData.map(d => d.value), 0);
  };

  const getFilterLabel = () => {
    switch (filter) {
      case 'seekers': return 'Seekers';
      case 'providers': return 'Providers';
      default: return 'All Users';
    }
  };

  const getFilterIcon = () => {
    switch (filter) {
      case 'seekers': return Users;
      case 'providers': return Briefcase;
      default: return TrendingUp;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();
  const maxValue = getMaxValue();
  const FilterIcon = getFilterIcon();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FilterIcon className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setFilter('seekers')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              filter === 'seekers'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Seekers
          </button>
          <button
            onClick={() => setFilter('providers')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              filter === 'providers'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Providers
          </button>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No growth data available</p>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-end space-x-2">
          {filteredData.map((item, index) => {
            const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const isLatest = index === filteredData.length - 1;
            
            return (
              <div key={item.date} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-100 rounded-t-lg relative flex items-end" style={{ height: '200px' }}>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      filter === 'seekers' 
                        ? 'bg-blue-500' 
                        : filter === 'providers' 
                        ? 'bg-green-500' 
                        : 'bg-indigo-500'
                    }`}
                    style={{ 
                      height: `${height}%`,
                      minHeight: item.value > 0 ? '4px' : '0px'
                    }}
                  >
                    {isLatest && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded">
                        {item.value}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  <div className="font-medium">{item.value}</div>
                  <div className="text-gray-400">
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>Showing {getFilterLabel().toLowerCase()} growth from platform launch to present</p>
      </div>
    </div>
  );
}