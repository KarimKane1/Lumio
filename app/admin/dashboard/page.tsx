'use client';

import React, { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  Star,
  Activity,
  Calendar
} from 'lucide-react';
import UserGrowthChart from '../../../components/admin/UserGrowthChart';

interface KPIData {
  totalUsers: number;
  totalProviders: number;
  seekers: number;
  providers: number;
  newUsers7d: number;
  activeUsersDAU: number;
  activeUsersWAU: number;
  activeUsersMAU: number;
  providerViews7d: number;
  contactClicks7d: number;
  avgRecommendationsPerProvider: number;
  userGrowthData: Array<{ date: string; count: number }>;
  activityData: Array<{ date: string; dau: number; wau: number }>;
  // Percentage changes
  totalUsersChange: number;
  totalProvidersChange: number;
  newUsers7dChange: number;
  activeUsersDAUChange: number;
  providerViews7dChange: number;
  contactClicks7dChange: number;
}

export default function AdminDashboard() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIData();
  }, []);

  const fetchKPIData = async () => {
    try {
      const response = await fetch('/api/admin/kpis');
      const data = await response.json();
      setKpiData(data);
    } catch (error) {
      console.error('Failed to fetch KPI data:', error);
    } finally {
      setLoading(false);
    }
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
      icon: Users,
      color: 'blue',
      change: `+${kpiData?.totalUsersChange || 0}%`,
      changeType: 'positive' as const,
    },
    {
      title: 'Seekers',
      value: kpiData?.seekers || 0,
      icon: Users,
      color: 'blue',
      change: `+${kpiData?.totalUsersChange || 0}%`,
      changeType: 'positive' as const,
    },
    {
      title: 'Providers',
      value: kpiData?.totalProviders || 0,
      icon: Briefcase,
      color: 'green',
      change: `+${kpiData?.totalProvidersChange || 0}%`,
      changeType: 'positive' as const,
    },
    {
      title: 'New Users (7d)',
      value: kpiData?.newUsers7d || 0,
      icon: TrendingUp,
      color: 'purple',
      change: `+${kpiData?.newUsers7dChange || 0}%`,
      changeType: 'positive' as const,
    },
    {
      title: 'Active Users (DAU)',
      value: kpiData?.activeUsersDAU || 0,
      icon: Activity,
      color: 'orange',
      change: `+${kpiData?.activeUsersDAUChange || 0}%`,
      changeType: 'positive' as const,
    },
    {
      title: 'Provider Views (7d)',
      value: kpiData?.providerViews7d || 0,
      icon: Eye,
      color: 'indigo',
      change: `+${kpiData?.providerViews7dChange || 0}%`,
      changeType: 'positive' as const,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
      indigo: 'bg-indigo-50 text-indigo-600',
      pink: 'bg-pink-50 text-pink-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your platform&apos;s performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((kpi) => (
          <div key={kpi.title} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{kpi.value.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    kpi.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpi.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last week</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${getColorClasses(kpi.color)}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users Metrics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Users</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Daily Active Users</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {kpiData?.activeUsersDAU || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Weekly Active Users</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {kpiData?.activeUsersWAU || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Monthly Active Users</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {kpiData?.activeUsersMAU || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Provider Metrics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Avg Recommendations per Provider</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {kpiData?.avgRecommendationsPerProvider?.toFixed(1) || '0.0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Profile Views (7d)</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {kpiData?.providerViews7d || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MousePointer className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Contact Clicks (7d)</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {kpiData?.contactClicks7d || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <UserGrowthChart />
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Trends</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>DAU/WAU trends chart will be implemented</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
