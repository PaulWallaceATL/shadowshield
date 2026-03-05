'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

type DLPRule = {
  id: string;
  name: string;
  description: string;
  pattern: string;
  type: 'REGEX' | 'KEYWORD' | 'ENTITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action: 'ALERT' | 'BLOCK' | 'REDACT';
  isActive: boolean;
};

const sampleRules: DLPRule[] = [
  {
    id: '1',
    name: 'Credit Card Numbers',
    description: 'Detects credit card numbers in text',
    pattern: '\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b',
    type: 'REGEX',
    severity: 'HIGH',
    action: 'REDACT',
    isActive: true,
  },
  {
    id: '2',
    name: 'API Keys',
    description: 'Detects potential API keys',
    pattern: '\\b([A-Za-z0-9]{32,})\\b',
    type: 'REGEX',
    severity: 'CRITICAL',
    action: 'BLOCK',
    isActive: true,
  },
  {
    id: '3',
    name: 'Sensitive Keywords',
    description: 'Blocks requests containing sensitive keywords',
    pattern: 'password|secret|key|token',
    type: 'KEYWORD',
    severity: 'MEDIUM',
    action: 'ALERT',
    isActive: true,
  },
];

export default function DLPPage() {
  const [rules, setRules] = useState<DLPRule[]>(sampleRules);
  const [selectedRule, setSelectedRule] = useState<DLPRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      setRules(rules.filter(rule => rule.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newRule: DLPRule = {
      id: selectedRule?.id || Date.now().toString(),
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      pattern: formData.get('pattern') as string,
      type: formData.get('type') as DLPRule['type'],
      severity: formData.get('severity') as DLPRule['severity'],
      action: formData.get('action') as DLPRule['action'],
      isActive: true,
    };

    if (selectedRule) {
      setRules(rules.map(rule => rule.id === selectedRule.id ? newRule : rule));
    } else {
      setRules([...rules, newRule]);
    }

    setIsModalOpen(false);
    setSelectedRule(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">DLP Rules</h1>
        <button
          onClick={() => {
            setSelectedRule(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Rule
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                  <div className="text-sm text-gray-500">{rule.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {rule.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    {
                      LOW: 'bg-green-100 text-green-800',
                      MEDIUM: 'bg-yellow-100 text-yellow-800',
                      HIGH: 'bg-orange-100 text-orange-800',
                      CRITICAL: 'bg-red-100 text-red-800',
                    }[rule.severity]
                  }`}>
                    {rule.severity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    {
                      ALERT: 'bg-blue-100 text-blue-800',
                      BLOCK: 'bg-red-100 text-red-800',
                      REDACT: 'bg-yellow-100 text-yellow-800',
                    }[rule.action]
                  }`}>
                    {rule.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedRule(rule);
                      setIsModalOpen(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-lg font-medium mb-4">
              {selectedRule ? 'Edit Rule' : 'Add New Rule'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedRule?.name}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  defaultValue={selectedRule?.description}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pattern</label>
                <input
                  type="text"
                  name="pattern"
                  defaultValue={selectedRule?.pattern}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    name="type"
                    defaultValue={selectedRule?.type}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="REGEX">Regex</option>
                    <option value="KEYWORD">Keyword</option>
                    <option value="ENTITY">Entity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Severity</label>
                  <select
                    name="severity"
                    defaultValue={selectedRule?.severity}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action</label>
                  <select
                    name="action"
                    defaultValue={selectedRule?.action}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="ALERT">Alert</option>
                    <option value="BLOCK">Block</option>
                    <option value="REDACT">Redact</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedRule(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  {selectedRule ? 'Save Changes' : 'Add Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 