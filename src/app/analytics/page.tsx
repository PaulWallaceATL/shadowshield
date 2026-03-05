'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const stats = [
  { name: 'Total Queries', value: '8,439', icon: ChartBarIcon, change: '+12.3%', changeType: 'positive' },
  { name: 'Blocked Content', value: '147', icon: ShieldCheckIcon, change: '-3.2%', changeType: 'positive' },
  { name: 'Avg Response Time', value: '0.8s', icon: ClockIcon, change: '-0.1s', changeType: 'positive' },
  { name: 'DLP Violations', value: '23', icon: ExclamationTriangleIcon, change: '+2.3%', changeType: 'negative' },
];

const timeRanges = ['Last 24 hours', 'Last 7 days', 'Last 30 days', 'Last 90 days'];

// Mock data for charts
const queryVolumeData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Query Volume',
      data: [65, 59, 80, 81, 56, 55, 40],
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
    },
  ],
};

const dlpViolationsData = {
  labels: ['Credit Card', 'API Keys', 'PII', 'Sensitive Keywords', 'Other'],
  datasets: [
    {
      data: [12, 19, 3, 5, 2],
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
      ],
    },
  ],
};

const responseTimesData = {
  labels: ['0-200ms', '201-500ms', '501-1000ms', '1001-2000ms', '>2000ms'],
  datasets: [
    {
      label: 'Response Times',
      data: [30, 45, 15, 8, 2],
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
    },
  ],
};

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState('Last 7 days');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
        <select
          value={selectedRange}
          onChange={(e) => setSelectedRange(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {timeRanges.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      {isClient && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">Query Volume</h3>
              <div className="mt-4 h-64">
                <Line 
                  data={queryVolumeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">DLP Violations by Type</h3>
              <div className="mt-4 h-64">
                <Pie 
                  data={dlpViolationsData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">Response Times</h3>
              <div className="mt-4 h-64">
                <Bar 
                  data={responseTimesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">Top Users</h3>
              <div className="mt-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        U{i}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">User {i}</p>
                        <p className="text-sm text-gray-500">{Math.floor(Math.random() * 1000)} queries</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {Math.floor(Math.random() * 100)}% success rate
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 