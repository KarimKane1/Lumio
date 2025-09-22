'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';

interface ChartData {
  week: string;
  count: number;
  label: string;
}

interface ContactClicksChartProps {
  className?: string;
}

export default function ContactClicksChart({ className = '' }: ContactClicksChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'plumber' | 'electrician' | 'hvac' | 'carpenter' | 'handyman'>('all');
  const [totalClicks, setTotalClicks] = useState(0);

  useEffect(() => {
    fetchChartData();
  }, [filter]);

  // Auto-refresh chart data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChartData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [filter]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/contact-clicks-chart?filter=${filter}&t=${Date.now()}`);
      const data = await response.json();
      
      if (response.ok) {
        setChartData(data.chartData || []);
        setTotalClicks(data.totalClicks || 0);
      } else {
        console.error('Failed to fetch chart data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxCount = Math.max(...chartData.map(item => item.count), 1);

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Weekly Contact Clicks</h3>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchChartData()}
            className="p-2 text-gray-500 hover:text-purple-600 transition-colors"
            title="Refresh chart data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: 'All Services' },
            { key: 'plumber', label: 'Plumber' },
            { key: 'electrician', label: 'Electrician' },
            { key: 'hvac', label: 'HVAC' },
            { key: 'carpenter', label: 'Carpenter' },
            { key: 'handyman', label: 'Handyman' }
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setFilter(option.key as any)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === option.key
                  ? 'bg-white text-purple-600 shadow-sm border border-purple-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p>No contact clicks data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart */}
          <div className="h-64 flex items-end space-x-2 px-2">
            {chartData.map((item, index) => {
              const height = (item.count / maxCount) * 100;
              return (
                <div key={item.week} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center space-y-2">
                    {/* Bar */}
                    <div className="w-full bg-gray-100 rounded-t-lg relative flex flex-col justify-end" style={{ height: '200px' }}>
                      <div
                        className="w-full bg-purple-500 rounded-t-lg transition-all duration-300 hover:bg-purple-600 cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${item.count} clicks`}
                      />
                    </div>
                    
                    {/* Label */}
                    <div className="text-xs text-gray-600 text-center">
                      <div className="font-medium">{item.count}</div>
                      <div>{item.label}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Summary */}
          <div className="text-sm text-gray-500 text-center">
            Showing weekly contact clicks from platform launch to present
          </div>
        </div>
      )}
    </div>
  );
}
