'use client';

import React, { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Activity,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import UserGrowthChart from '../../../components/admin/UserGrowthChart';

interface KPIData {
  totalUsers: number;
  seekers: number;
  providers: number;
  activeUsersWAU: number;
  newProviders7d: number;
  contactClicks7d: number;
  newUsers7d: number;
}

export default function AdminDashboard() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchKPIData();
  }, []);

  const fetchKPIData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const response = await fetch(`/api/admin/kpis?t=${Date.now()}`);
      const data = await response.json();
      setKpiData(data);
    } catch (error) {
      console.error('Failed to fetch KPI data:', error);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchKPIData(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Users',
      value: kpiData?.totalUsers || 0,
      subtitle: 'All platform users',
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Weekly Active Users',
      value: kpiData?.activeUsersWAU || 0,
      subtitle: 'Active in last 7 days',
      icon: Activity,
      color: 'orange',
    },
    {
      title: 'Providers Added',
      value: kpiData?.newProviders7d || 0,
      subtitle: 'Last 7 days',
      icon: Briefcase,
      color: 'green',
    },
    {
      title: 'Contact Clicks',
      value: kpiData?.contactClicks7d || 0,
      subtitle: 'Last 7 days',
      icon: MessageCircle,
      color: 'purple',
    },
    {
      title: 'New Users',
      value: kpiData?.newUsers7d || 0,
      subtitle: 'Last 7 days',
      icon: TrendingUp,
      color: 'indigo',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
      indigo: 'bg-indigo-50 text-indigo-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your platform&apos;s performance</p>
          <p className="text-xs text-gray-500 mt-1">All timeframes are "last 7 days" (rolling window, not calendar weeks)</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.title} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${getColorClasses(kpi.color)}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{kpi.value.toLocaleString()}</p>
              <p className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
              <p className="text-xs text-gray-500">{kpi.subtitle}</p>
              {kpi.title === 'Total Users' && (
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    {kpiData?.seekers || 0} seekers
                  </span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    {kpiData?.providers || 0} providers
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Growth Chart */}
      <UserGrowthChart />

    </div>
  );
}
