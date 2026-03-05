'use client';

import { motion } from 'framer-motion';
import { ShieldCheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import DLPRulesSection from '@/components/admin/DLPRulesSection';
import { useState } from 'react';

export default function DLPRulesPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="min-h-full">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="mb-4 sm:mb-0">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-8 w-8 text-[#00a0cb]" />
              <h1 className="text-2xl font-semibold text-white">DLP Rules</h1>
            </div>
            <p className="mt-1 text-sm text-gray-300">
              Configure and manage data loss prevention rules
            </p>
          </div>
          <motion.button
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#00a0cb] hover:bg-[#0090b7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#00a0cb] transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Rule
          </motion.button>
        </div>
        <DLPRulesSection showAddForm={showAddForm} setShowAddForm={setShowAddForm} />
      </div>
    </div>
  );
} 