'use client';

import { useState } from 'react';
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

type Alert = {
  id: string;
  type: 'DLP_VIOLATION' | 'SYSTEM_ERROR' | 'AUTHENTICATION_FAILURE' | 'API_ERROR';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED';
  createdAt: Date;
  metadata: {
    userId?: string;
    userName?: string;
    queryId?: string;
    content?: string;
  };
};

const sampleAlerts: Alert[] = [
  {
    id: '1',
    type: 'DLP_VIOLATION',
    message: 'Potential credit card number detected in query',
    severity: 'CRITICAL',
    status: 'OPEN',
    createdAt: new Date('2024-03-15T10:30:00'),
    metadata: {
      userId: '1',
      userName: 'John Doe',
      queryId: '123',
      content: '****-****-****-1234',
    },
  },
  {
    id: '2',
    type: 'AUTHENTICATION_FAILURE',
    message: 'Multiple failed login attempts detected',
    severity: 'HIGH',
    status: 'ACKNOWLEDGED',
    createdAt: new Date('2024-03-14T15:45:00'),
    metadata: {
      userId: '2',
      userName: 'Jane Smith',
    },
  },
  {
    id: '3',
    type: 'SYSTEM_ERROR',
    message: 'API rate limit exceeded',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    createdAt: new Date('2024-03-13T09:15:00'),
    metadata: {},
  },
];

const typeIcons = {
  DLP_VIOLATION: ShieldExclamationIcon,
  SYSTEM_ERROR: XCircleIcon,
  AUTHENTICATION_FAILURE: ExclamationTriangleIcon,
  API_ERROR: ExclamationTriangleIcon,
};

const severityColors = {
  LOW: 'bg-blue-50 text-blue-700 border-blue-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
};

const statusColors = {
  OPEN: 'bg-red-50 text-red-700',
  ACKNOWLEDGED: 'bg-yellow-50 text-yellow-700',
  RESOLVED: 'bg-green-50 text-green-700',
  ESCALATED: 'bg-purple-50 text-purple-700',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(sampleAlerts);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAlerts = alerts.filter(alert => {
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    return true;
  });

  const handleUpdateStatus = (alertId: string, newStatus: Alert['status']) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, status: newStatus } : alert
    ));
    setSelectedAlert(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Alerts</h1>
        <div className="flex space-x-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="DLP_VIOLATION">DLP Violations</option>
            <option value="SYSTEM_ERROR">System Errors</option>
            <option value="AUTHENTICATION_FAILURE">Auth Failures</option>
            <option value="API_ERROR">API Errors</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="divide-y divide-gray-200">
          {filteredAlerts.map((alert) => {
            const Icon = typeIcons[alert.type];
            return (
              <div
                key={alert.id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-6 w-6 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      <p className="text-sm text-gray-500">
                        {alert.metadata.userName && `User: ${alert.metadata.userName} • `}
                        {alert.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityColors[alert.severity]}`}>
                      {alert.severity}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[alert.status]}`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium">Alert Details</h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Message</h4>
                <p className="mt-1">{selectedAlert.message}</p>
              </div>
              {selectedAlert.metadata.content && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Content</h4>
                  <p className="mt-1 text-sm">{selectedAlert.metadata.content}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Created</h4>
                  <p className="mt-1 text-sm">
                    {selectedAlert.createdAt.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Type</h4>
                  <p className="mt-1 text-sm">{selectedAlert.type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Severity</h4>
                  <p className="mt-1 text-sm">{selectedAlert.severity}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <p className="mt-1 text-sm">{selectedAlert.status}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  onClick={() => setSelectedAlert(null)}
                >
                  Close
                </button>
                {selectedAlert.status === 'OPEN' && (
                  <>
                    <button
                      className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
                      onClick={() => handleUpdateStatus(selectedAlert.id, 'ACKNOWLEDGED')}
                    >
                      Acknowledge
                    </button>
                    <button
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                      onClick={() => handleUpdateStatus(selectedAlert.id, 'ESCALATED')}
                    >
                      Escalate
                    </button>
                  </>
                )}
                {selectedAlert.status === 'ACKNOWLEDGED' && (
                  <button
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'RESOLVED')}
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 