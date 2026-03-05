'use client';

import { useState } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { MotionSelect } from '@/components/ui/MotionSelect';
import AnalyticsSection from '@/components/admin/AnalyticsSection';

const dateRangeOptions = [
  { value: '24h', label: 'Last 24 hours' },
  { value: 'week', label: 'Last week' },
  { value: 'all', label: 'All time' }
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('24h');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00a0cb] bg-opacity-20 rounded-lg">
            <ChartBarIcon className="h-6 w-6 text-[#00a0cb]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Analytics Overview</h1>
            <p className="text-sm text-gray-400">Monitor system performance and user activity</p>
          </div>
        </div>
        <MotionSelect
          value={dateRange}
          onChange={setDateRange}
          options={dateRangeOptions}
          className="w-48"
        />
      </div>
      <AnalyticsSection dateRange={dateRange} setDateRange={setDateRange} />
    </div>
  );
} 