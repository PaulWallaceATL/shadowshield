'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserIcon, BellIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend
} from 'recharts';

type UserAlert = {
  id: string;
  createdAt: string;
  message: string;
  type: string;
  status: string;
  severity: string;
  metadata: any;
};

type UserChat = {
  id: string;
  title: string | null;
  provider: string;
  model: string;
  createdAt: string;
  messageCount: number;
};

type UserDetails = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  department: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  chats: UserChat[];
  alerts: UserAlert[];
};

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allChatsPage, setAllChatsPage] = useState(0);
  const [allAlertsPage, setAllAlertsPage] = useState(0);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [userReport, setUserReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const itemsPerPage = 5;

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`/api/admin/users/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }
        const data = await response.json();
        setUser(data);
        
        // After fetching user details, fetch the user report
        fetchUserReport();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUserReport = async () => {
      setReportLoading(true);
      try {
        const response = await fetch(`/api/admin/users/${params.id}/report`);
        if (response.ok) {
          const data = await response.json();
          setUserReport(data);
        }
      } catch (err) {
        console.error('Failed to fetch user report:', err);
      } finally {
        setReportLoading(false);
      }
    };

    fetchUserDetails();
  }, [params.id]);

  // Handle pagination bounds
  useEffect(() => {
    if (user) {
      const totalChatsPages = Math.max(1, Math.ceil(user.chats.length / itemsPerPage));
      const totalAlertsPages = Math.max(1, Math.ceil(user.alerts.length / itemsPerPage));

      if (allChatsPage >= totalChatsPages) {
        setAllChatsPage(Math.max(0, totalChatsPages - 1));
      }
      if (allAlertsPage >= totalAlertsPages) {
        setAllAlertsPage(Math.max(0, totalAlertsPages - 1));
      }
    }
  }, [user, allChatsPage, allAlertsPage, itemsPerPage]);

  const handleDeactivate = async () => {
    if (!user || isDeactivating) return;
    
    setIsDeactivating(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false })
      });

      if (!response.ok) throw new Error('Failed to deactivate user');

      setUser(prev => prev ? { ...prev, isActive: false } : null);
    } catch (error) {
      console.error('Error deactivating user:', error);
    } finally {
      setIsDeactivating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a0cb]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">User not found</div>
      </div>
    );
  }

  // Calculate pagination values
  const totalChatsPages = Math.ceil(user.chats.length / itemsPerPage);
  const totalAlertsPages = Math.ceil(user.alerts.length / itemsPerPage);
  const recentChats = user.chats.slice(0, 3);
  const recentAlerts = user.alerts.slice(0, 3);
  
  // Calculate start and end indices for pagination
  const chatStartIndex = allChatsPage * itemsPerPage;
  const chatEndIndex = chatStartIndex + itemsPerPage;
  const alertStartIndex = allAlertsPage * itemsPerPage;
  const alertEndIndex = alertStartIndex + itemsPerPage;
  
  // Get paginated items
  const paginatedAllChats = user.chats.slice(chatStartIndex, chatEndIndex);
  const paginatedAllAlerts = user.alerts.slice(alertStartIndex, alertEndIndex);

  // Process chat data to get real activity by day of week
  const chatsByDay = Array(7).fill(0); // [Sun, Mon, ..., Sat]
  user.chats.forEach(chat => {
    const date = new Date(chat.createdAt);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    chatsByDay[dayOfWeek]++;
  });

  // Create real activity data for the chart
  const chatActivityData = [
    { name: 'Sun', chats: chatsByDay[0] },
    { name: 'Mon', chats: chatsByDay[1] },
    { name: 'Tue', chats: chatsByDay[2] },
    { name: 'Wed', chats: chatsByDay[3] },
    { name: 'Thu', chats: chatsByDay[4] },
    { name: 'Fri', chats: chatsByDay[5] },
    { name: 'Sat', chats: chatsByDay[6] },
  ];

  // Process alerts to get real alert types for the pie chart
  const alertTypeCounts: Record<string, number> = {};
  user.alerts.forEach(alert => {
    const type = alert.type;
    alertTypeCounts[type] = (alertTypeCounts[type] || 0) + 1;
  });

  // Create alert type data for the pie chart
  const alertsByType = Object.entries(alertTypeCounts).map(([name, value]) => ({
    name,
    value
  }));

  // If no alerts, use some placeholder data
  if (alertsByType.length === 0) {
    alertsByType.push({ name: 'No Alerts', value: 1 });
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF00FF', '#00FFFF', '#FFFF00'];

  // Process chat data to get activity over time for the area chart
  const chatDates = user.chats.map(chat => new Date(chat.createdAt))
    .sort((a, b) => a.getTime() - b.getTime());
  
  const alertDates = user.alerts.map(alert => new Date(alert.createdAt))
    .sort((a, b) => a.getTime() - b.getTime());
  
  // Get the earliest and latest dates from both chats and alerts
  const allDates = [...chatDates, ...alertDates];
  const earliestDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
  const latestDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date();
  
  // Create date points between earliest and latest (7 points)
  const datePoints: Date[] = [];
  const timeSpan = latestDate.getTime() - earliestDate.getTime();
  
  for (let i = 0; i < 7; i++) {
    const pointTime = earliestDate.getTime() + (timeSpan / 6) * i;
    datePoints.push(new Date(pointTime));
  }
  
  // Count chats and alerts for each date point
  const userActivityData = datePoints.map(date => {
    const dateStr = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const chatsCount = user.chats.filter(chat => {
      const chatDate = new Date(chat.createdAt);
      return chatDate >= date && chatDate < nextDay;
    }).length;
    
    const alertsCount = user.alerts.filter(alert => {
      const alertDate = new Date(alert.createdAt);
      return alertDate >= date && alertDate < nextDay;
    }).length;
    
    return { date: dateStr, chats: chatsCount, alerts: alertsCount };
  });

  // Create more interesting and creative data for a radar chart
  // analyzing chat patterns by various metrics
  const chatMetrics = {
    messageVolume: 0,
    dailyActivity: 0,
    modelVariety: new Set<string>(),
    providerVariety: new Set<string>(),
    engagementScore: 0
  };

  // Calculate metrics
  chatMetrics.messageVolume = user.chats.reduce((sum, chat) => sum + chat.messageCount, 0);
  
  const chatDaySet = new Set(user.chats.map(chat => 
    new Date(chat.createdAt).toLocaleDateString()
  ));
  chatMetrics.dailyActivity = chatDaySet.size;
  
  user.chats.forEach(chat => {
    chatMetrics.modelVariety.add(chat.model);
    chatMetrics.providerVariety.add(chat.provider);
  });
  
  // Simple engagement score (more complex logic could be implemented)
  const chatRecency = user.chats.length > 0 ? 
    (new Date().getTime() - new Date(user.chats[0].createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;
  chatMetrics.engagementScore = chatRecency < 7 ? 100 : chatRecency < 14 ? 80 : chatRecency < 30 ? 60 : 40;
  
  // Normalized values for the radar chart (scale of 0-100)
  const maxExpectedMessages = 500;
  const maxExpectedDailyActivity = 30;
  const maxExpectedModelVariety = 5;
  const maxExpectedProviderVariety = 3;
  
  const radarData = [
    {
      metric: "Message Volume",
      value: Math.min(100, (chatMetrics.messageVolume / maxExpectedMessages) * 100),
      fullMark: 100
    },
    {
      metric: "Daily Activity",
      value: Math.min(100, (chatMetrics.dailyActivity / maxExpectedDailyActivity) * 100),
      fullMark: 100
    },
    {
      metric: "Model Variety",
      value: Math.min(100, (chatMetrics.modelVariety.size / maxExpectedModelVariety) * 100),
      fullMark: 100
    },
    {
      metric: "Provider Diversity",
      value: Math.min(100, (chatMetrics.providerVariety.size / maxExpectedProviderVariety) * 100),
      fullMark: 100
    },
    {
      metric: "Engagement Score",
      value: chatMetrics.engagementScore,
      fullMark: 100
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#2d1657] rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-6 w-6 text-[#00a0cb]" />
          </button>
          <UserIcon className="h-8 w-8 text-[#00a0cb]" />
          <h1 className="text-2xl font-semibold text-white">User Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a2e] p-6 rounded-lg"
        >
          <h2 className="text-xl font-semibold mb-4 text-white">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Name</label>
              <p className="text-white">{user.name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Role</label>
              <p className="text-white">{user.role}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Department</label>
              <p className="text-white">{user.department || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Status</label>
              <p className="text-white flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                {user.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Activity Overview</label>
              <div className="h-[150px] -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userActivityData} margin={{ left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d1657" />
                    <XAxis dataKey="date" stroke="#718096" />
                    <YAxis stroke="#718096" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid #2d1657',
                        borderRadius: '4px',
                        color: '#fff'
                      }}
                      formatter={(value: any, name: string) => [value, name === 'chats' ? 'Chat Sessions' : 'Alert Events']}
                    />
                    <Area type="monotone" dataKey="chats" stroke="#00a0cb" fill="#00a0cb33" />
                    <Area type="monotone" dataKey="alerts" stroke="#f59e0b" fill="#f59e0b33" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDeactivate}
                disabled={!user.isActive || isDeactivating}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {isDeactivating ? 'Deactivating...' : 'Deactivate User'}
              </button>
              <button
                onClick={() => router.push(`/admin/users/${user.id}/chats`)}
                className="flex-1 px-4 py-2 bg-[#00a0cb] hover:bg-[#0090b7] text-white rounded-lg transition-colors"
              >
                View Chats
              </button>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1a1a2e] p-6 rounded-lg"
        >
          <h2 className="text-xl font-semibold mb-4 text-white">Recent Activity</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-white">Recent Chats</h3>
              {recentChats.length > 0 ? (
                <div className="space-y-2">
                  {recentChats.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => router.push(`/admin/chats/${chat.id}`)}
                      className="p-3 bg-[#2d1657] rounded cursor-pointer hover:bg-[#3d2667] transition-colors"
                    >
                      <p className="text-white font-medium">{chat.title || 'Untitled Chat'}</p>
                      <p className="text-sm text-gray-400">
                        {chat.provider} - {chat.model}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(chat.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent chats</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2 text-white">Recent Alerts</h3>
              {recentAlerts.length > 0 ? (
                <div className="space-y-2">
                  {recentAlerts.map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => router.push(`/admin/alerts/${alert.id}`)}
                      className="p-3 bg-[#2d1657] rounded cursor-pointer hover:bg-[#3d2667] transition-colors"
                    >
                      <p className="text-white font-medium">{alert.message}</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{alert.type}</span>
                        <span className="text-gray-400">{alert.severity}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent alerts</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Analytics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Chat Activity Chart */}
        <div className="bg-[#1a1a2e] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-white">Chat Activity Analysis</h2>
          <p className="text-gray-400 mb-4">Visualizing user's chat engagement and interaction patterns</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={90} data={radarData}>
                <PolarGrid stroke="#2d1657" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#CBD5E0' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#A0AEC0' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #2d1657',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Value']}
                />
                <Radar name="User Engagement" dataKey="value" stroke="#00a0cb" fill="#00a0cb" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts by Type */}
        <div className="bg-[#1a1a2e] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-white">Alerts by Type</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={alertsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {alertsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #2d1657',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* All Chats Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-[#1a1a2e] p-6 rounded-lg"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">All Chats ({user.chats.length})</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAllChatsPage(Math.max(0, allChatsPage - 1))}
              disabled={allChatsPage === 0}
              className="p-1 rounded hover:bg-[#2d1657] disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronLeftIcon className="h-5 w-5 text-white" />
            </button>
            <span className="text-white">
              {allChatsPage + 1} / {Math.max(1, totalChatsPages)}
            </span>
            <button
              onClick={() => setAllChatsPage(Math.min(totalChatsPages - 1, allChatsPage + 1))}
              disabled={allChatsPage >= totalChatsPages - 1}
              className="p-1 rounded hover:bg-[#2d1657] disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronRightIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-gray-400 py-2">Title</th>
                <th className="text-left text-sm font-medium text-gray-400 py-2">Provider</th>
                <th className="text-left text-sm font-medium text-gray-400 py-2">Model</th>
                <th className="text-left text-sm font-medium text-gray-400 py-2">Messages</th>
                <th className="text-left text-sm font-medium text-gray-400 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAllChats.map(chat => (
                <tr
                  key={chat.id}
                  onClick={() => router.push(`/admin/chats/${chat.id}`)}
                  className="border-t border-[#2d1657] cursor-pointer hover:bg-[#2d1657] transition-colors"
                >
                  <td className="py-3 text-white">{chat.title || 'Untitled'}</td>
                  <td className="py-3 text-white">{chat.provider}</td>
                  <td className="py-3 text-white">{chat.model}</td>
                  <td className="py-3 text-white">{chat.messageCount}</td>
                  <td className="py-3 text-white">{new Date(chat.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* All Alerts Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-[#1a1a2e] p-6 rounded-lg"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">All Alerts ({user.alerts.length})</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAllAlertsPage(Math.max(0, allAlertsPage - 1))}
              disabled={allAlertsPage === 0}
              className="p-1 rounded hover:bg-[#2d1657] disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronLeftIcon className="h-5 w-5 text-white" />
            </button>
            <span className="text-white">
              {allAlertsPage + 1} / {Math.max(1, totalAlertsPages)}
            </span>
            <button
              onClick={() => setAllAlertsPage(Math.min(totalAlertsPages - 1, allAlertsPage + 1))}
              disabled={allAlertsPage >= totalAlertsPages - 1}
              className="p-1 rounded hover:bg-[#2d1657] disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronRightIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-gray-400 py-2">Message</th>
                <th className="text-left text-sm font-medium text-gray-400 py-2">Type</th>
                <th className="text-left text-sm font-medium text-gray-400 py-2">Severity</th>
                <th className="text-left text-sm font-medium text-gray-400 py-2">Status</th>
                <th className="text-left text-sm font-medium text-gray-400 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAllAlerts.map(alert => (
                <tr
                  key={alert.id}
                  onClick={() => router.push(`/admin/alerts/${alert.id}`)}
                  className="border-t border-[#2d1657] cursor-pointer hover:bg-[#2d1657] transition-colors"
                >
                  <td className="py-3 text-white">{alert.message}</td>
                  <td className="py-3 text-white">{alert.type}</td>
                  <td className="py-3 text-white">{alert.severity}</td>
                  <td className="py-3 text-white">{alert.status}</td>
                  <td className="py-3 text-white">{new Date(alert.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
} 