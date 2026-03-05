'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  ShieldCheckIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

type DLPRule = {
  id: string;
  name: string;
  pattern: string;
  description: string;
  type: 'REGEX' | 'KEYWORD' | 'ENTITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action: 'ALERT' | 'BLOCK' | 'REDACT';
  isActive: boolean;
};

interface DLPRulesSectionProps {
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
}

export default function DLPRulesSection({ showAddForm, setShowAddForm }: DLPRulesSectionProps) {
  const [rules, setRules] = useState<DLPRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRule, setEditingRule] = useState<DLPRule | null>(null);
  const [newRule, setNewRule] = useState<Partial<DLPRule>>({
    name: '',
    pattern: '',
    description: '',
    type: 'REGEX',
    severity: 'MEDIUM',
    action: 'ALERT',
    isActive: true
  });

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/dlp/rules');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch rules');
      }
      const data = await response.json();
      setRules(data);
    } catch (err) {
      console.error('Error fetching DLP rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to load DLP rules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const response = await fetch('/api/dlp/rules', {
        method: editingRule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRule ? { ...editingRule, ...newRule } : newRule)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingRule ? 'update' : 'create'} rule`);
      }

      await fetchRules();
      setShowAddForm(false);
      setEditingRule(null);
      setNewRule({
        name: '',
        pattern: '',
        description: '',
        type: 'REGEX',
        severity: 'MEDIUM',
        action: 'ALERT',
        isActive: true
      });
    } catch (err) {
      console.error('Error handling DLP rule:', err);
      setError(err instanceof Error ? err.message : `Failed to ${editingRule ? 'update' : 'create'} rule`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      setError('');
      const response = await fetch(`/api/dlp/rules?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete rule');
      }

      await fetchRules();
    } catch (err) {
      console.error('Error deleting DLP rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    }
  };

  const handleEdit = (rule: DLPRule) => {
    setEditingRule(rule);
    setNewRule(rule);
    setShowAddForm(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'LOW':
        return 'bg-blue-900 text-blue-200';
      case 'MEDIUM':
        return 'bg-yellow-900 text-yellow-200';
      case 'HIGH':
        return 'bg-orange-900 text-orange-200';
      case 'CRITICAL':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-gray-900 text-gray-200';
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'ALERT':
        return 'bg-blue-900 text-blue-200';
      case 'BLOCK':
        return 'bg-red-900 text-red-200';
      case 'REDACT':
        return 'bg-purple-900 text-purple-200';
      default:
        return 'bg-gray-900 text-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'REGEX':
        return 'bg-indigo-900 text-indigo-200';
      case 'KEYWORD':
        return 'bg-green-900 text-green-200';
      case 'ENTITY':
        return 'bg-pink-900 text-pink-200';
      default:
        return 'bg-gray-900 text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div 
          className="h-16 w-16 border-4 border-[#00a0cb] rounded-full"
          animate={{ 
            rotate: 360,
            borderTopColor: "transparent",
            borderRightColor: "rgba(0, 160, 203, 0.3)",
            borderBottomColor: "rgba(0, 160, 203, 0.6)"
          }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <AnimatePresence>
        {error && (
          <motion.div 
            className="bg-red-900 border border-red-700 rounded-lg p-4 flex items-start"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ExclamationTriangleIcon className="h-5 w-5 text-red-300 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-200">Error</h3>
              <p className="mt-1 text-sm text-red-300">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="ml-4"
            >
              <XMarkIcon className="h-5 w-5 text-red-300 hover:text-red-100" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            className="bg-[#151517] shadow-lg rounded-lg p-6 border border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-white">
                {editingRule ? 'Edit DLP Rule' : 'Add New DLP Rule'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingRule(null);
                }}
                className="text-gray-400 hover:text-gray-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Rule Name</label>
                  <input
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    className="w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-[#00a0cb] focus:ring-[#00a0cb] sm:text-sm placeholder-gray-400"
                    placeholder="Enter rule name"
                    style={{ color: 'white' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Pattern</label>
                  <input
                    type="text"
                    value={newRule.pattern}
                    onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                    className="w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-[#00a0cb] focus:ring-[#00a0cb] sm:text-sm font-mono placeholder-gray-400"
                    placeholder="Enter regex pattern"
                    style={{ color: 'white' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    className="w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-[#00a0cb] focus:ring-[#00a0cb] sm:text-sm placeholder-gray-400"
                    rows={3}
                    placeholder="Describe the purpose of this rule"
                    style={{ color: 'white' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                  <select
                    value={newRule.type}
                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value as DLPRule['type'] })}
                    className="w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-[#00a0cb] focus:ring-[#00a0cb] sm:text-sm"
                    style={{ color: 'white' }}
                  >
                    <option value="REGEX" className="bg-gray-700 text-white">Regex</option>
                    <option value="KEYWORD" className="bg-gray-700 text-white">Keyword</option>
                    <option value="ENTITY" className="bg-gray-700 text-white">Entity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Severity</label>
                  <select
                    value={newRule.severity}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as DLPRule['severity'] })}
                    className="w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-[#00a0cb] focus:ring-[#00a0cb] sm:text-sm"
                    style={{ color: 'white' }}
                  >
                    <option value="LOW" className="bg-gray-700 text-white">Low</option>
                    <option value="MEDIUM" className="bg-gray-700 text-white">Medium</option>
                    <option value="HIGH" className="bg-gray-700 text-white">High</option>
                    <option value="CRITICAL" className="bg-gray-700 text-white">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Action</label>
                  <select
                    value={newRule.action}
                    onChange={(e) => setNewRule({ ...newRule, action: e.target.value as DLPRule['action'] })}
                    className="w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-[#00a0cb] focus:ring-[#00a0cb] sm:text-sm"
                    style={{ color: 'white' }}
                  >
                    <option value="ALERT" className="bg-gray-700 text-white">Alert</option>
                    <option value="BLOCK" className="bg-gray-700 text-white">Block</option>
                    <option value="REDACT" className="bg-gray-700 text-white">Redact</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-4 pt-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingRule(null);
                  }}
                  className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-4 py-2 bg-[#00a0cb] text-white rounded-md hover:bg-[#0090b7] focus:outline-none focus:ring-2 focus:ring-[#00a0cb] focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Card View (visible on small screens) */}
      <motion.div 
        className="md:hidden space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {rules.length === 0 ? (
          <div className="bg-[#151517] rounded-lg p-8 text-center border border-gray-800">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-300">No DLP rules found. Add a new rule to get started.</p>
          </div>
        ) : (
          rules.map((rule) => (
            <motion.div 
              key={rule.id}
              className="bg-[#151517] rounded-lg p-4 border border-gray-800 shadow-md"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-medium">{rule.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{rule.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  rule.isActive ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
                }`}>
                  {rule.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="mt-3">
                <code className="text-sm font-mono bg-gray-800 text-white rounded px-2 py-1 block truncate">{rule.pattern}</code>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(rule.type)}`}>
                  {rule.type}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(rule.severity)}`}>
                  {rule.severity}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(rule.action)}`}>
                  {rule.action}
                </span>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-700 flex justify-end space-x-2">
                <motion.button
                  onClick={() => handleEdit(rule)}
                  className="text-[#00a0cb] hover:text-[#0090b7] bg-gray-800 p-2 rounded-full"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <PencilIcon className="h-5 w-5" />
                </motion.button>
                <motion.button
                  onClick={() => handleDelete(rule.id)}
                  className="text-red-400 hover:text-red-300 bg-gray-800 p-2 rounded-full"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <TrashIcon className="h-5 w-5" />
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Desktop Table View (hidden on small screens) */}
      <div className="hidden md:block bg-[#151517] shadow-lg rounded-lg overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rule</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pattern</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Severity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#151517] divide-y divide-gray-800">
              <AnimatePresence>
                {rules.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-400">No DLP rules found. Add a new rule to get started.</p>
                    </td>
                  </motion.tr>
                ) : (
                  rules.map((rule) => (
                    <motion.tr
                      key={rule.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="hover:bg-gray-800/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{rule.name}</div>
                        <div className="text-sm text-gray-400">{rule.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm font-mono bg-gray-800 text-white rounded px-2 py-1">{rule.pattern}</code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(rule.type)}`}>
                          {rule.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(rule.severity)}`}>
                          {rule.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(rule.action)}`}>
                          {rule.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          rule.isActive ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
                        }`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2 whitespace-nowrap">
                        <motion.button
                          onClick={() => handleEdit(rule)}
                          className="text-[#00a0cb] hover:text-[#0090b7] bg-gray-800 p-2 rounded-full inline-flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(rule.id)}
                          className="text-red-400 hover:text-red-300 bg-gray-800 p-2 rounded-full inline-flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
} 