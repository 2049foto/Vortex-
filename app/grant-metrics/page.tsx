/**
 * Vortex Protocol - Grant Metrics Dashboard (Public)
 * For Base Grant application screenshots
 */

'use client';

import { useState, useEffect } from 'react';
import { getAnalyticsDashboard } from '../../src/lib/api';
import { Card } from '../../src/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GrantMetricsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAnalyticsDashboard();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const { overview, timeSeries } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      {/* Header */}
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Vortex Protocol
          </h1>
          <p className="text-xl text-gray-600">Base Grant Metrics Dashboard</p>
          <p className="mt-2 text-sm text-gray-500">
            Real-time impact metrics • Updated every 30 seconds
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Total Portfolios Cleaned */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl">
            <div className="mb-2 text-sm font-medium opacity-90">Portfolios Cleaned</div>
            <div className="text-4xl font-bold">{overview.totalPortfoliosClean.toLocaleString()}</div>
            <div className="mt-2 text-sm opacity-80">Total successful consolidations</div>
          </Card>

          {/* Dust Value Cleaned */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl">
            <div className="mb-2 text-sm font-medium opacity-90">Dust Value Cleaned</div>
            <div className="text-4xl font-bold">${parseFloat(overview.dustValueCleaned).toLocaleString()}</div>
            <div className="mt-2 text-sm opacity-80">Total value consolidated</div>
          </Card>

          {/* Base TVL Added */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-xl">
            <div className="mb-2 text-sm font-medium opacity-90">Base TVL Added</div>
            <div className="text-4xl font-bold">${parseFloat(overview.baseTvlAdded).toLocaleString()}</div>
            <div className="mt-2 text-sm opacity-80">Value moved to Base chain</div>
          </Card>

          {/* Gas Saved */}
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-xl">
            <div className="mb-2 text-sm font-medium opacity-90">Gas Saved</div>
            <div className="text-4xl font-bold">${parseFloat(overview.gasSaved).toLocaleString()}</div>
            <div className="mt-2 text-sm opacity-80">Via gasless transactions</div>
          </Card>

          {/* Total Consolidations */}
          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white shadow-xl">
            <div className="mb-2 text-sm font-medium opacity-90">Total Consolidations</div>
            <div className="text-4xl font-bold">{overview.totalConsolidations.toLocaleString()}</div>
            <div className="mt-2 text-sm opacity-80">Including pending</div>
          </Card>

          {/* Unique Users */}
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 text-white shadow-xl">
            <div className="mb-2 text-sm font-medium opacity-90">Unique Users</div>
            <div className="text-4xl font-bold">{overview.uniqueUsers.toLocaleString()}</div>
            <div className="mt-2 text-sm opacity-80">Total users served</div>
          </Card>
        </div>

        {/* Time Series Chart */}
        <Card className="p-6 shadow-xl">
          <h3 className="mb-4 text-xl font-bold">Consolidation Volume Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="volumeUsd"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Volume (USD)"
              />
              <Line
                type="monotone"
                dataKey="consolidations"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Consolidations"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Impact Summary */}
        <Card className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-xl">
          <h3 className="mb-4 text-2xl font-bold">Impact on Base Ecosystem</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-3xl font-bold">{overview.totalPortfoliosClean}</div>
              <div className="text-sm opacity-90">Portfolios optimized</div>
            </div>
            <div>
              <div className="text-3xl font-bold">${parseFloat(overview.baseTvlAdded).toLocaleString()}</div>
              <div className="text-sm opacity-90">TVL migrated to Base</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{overview.uniqueUsers}</div>
              <div className="text-sm opacity-90">Users onboarded</div>
            </div>
          </div>
          <div className="mt-6 border-t border-white/20 pt-4">
            <p className="text-sm opacity-90">
              Vortex Protocol is driving portfolio hygiene and TVL growth on Base through gasless consolidation,
              multi-router optimization, and premium risk scoring.
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Data updated in real-time • Powered by Vortex Protocol</p>
          <p className="mt-2">
            <a href="/" className="text-blue-600 hover:underline">
              vortex.build
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

