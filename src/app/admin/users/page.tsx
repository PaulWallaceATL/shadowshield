'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  UserPlusIcon, 
  UserGroupIcon, 
  ExclamationCircleIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import AddUserModal from '@/components/admin/AddUserModal';

// Custom Dropdown Component
interface CustomDropdownProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  dropdownPosition?: 'top' | 'bottom';
}

const CustomDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  label, 
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  optionClassName = '',
  dropdownPosition = 'bottom'
}: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-400 mb-1">
          {label}
        </label>
      )}
      <div 
        className={`w-full px-3 py-2 rounded-md bg-[#0f172a] border border-[#1e293b] text-white focus:ring-2 focus:ring-[#00a0cb] cursor-pointer flex justify-between items-center hover:bg-[#172135] transition-colors duration-150 ${buttonClassName}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-white" : "text-gray-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {isOpen ? (
          <ChevronUpIcon className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        )}
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: dropdownPosition === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dropdownPosition === 'top' ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-10 ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} w-full bg-[#0f172a] border border-[#1e293b] rounded-md shadow-lg max-h-60 overflow-auto ${dropdownClassName}`}
            style={{ 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              minWidth: '100%'
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                className={`px-3 py-2 cursor-pointer hover:bg-[#1e293b] flex items-center transition-colors duration-150 ${
                  option.value === value ? "bg-[#1e293b] text-[#00a0cb]" : "text-white"
                } ${optionClassName}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.value === value && <CheckIcon className="h-4 w-4 mr-2 text-[#00a0cb]" />}
                <span className={option.value === value ? "ml-0" : "ml-6"}>
                  {option.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Date Picker Component
interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  min?: string;
  className?: string;
}

const CustomDatePicker = ({ value, onChange, label, placeholder, min, className }: DatePickerProps) => {
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-400 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-[#0f172a] border-0 text-white focus:ring-2 focus:ring-[#00a0cb] appearance-none"
          placeholder={placeholder}
          min={min}
          style={{ colorScheme: 'dark' }}
        />
        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  department: string | null;
  isActive: boolean;
  createdAt: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    fetchUsers();
  }, [status]);

  // Handle clicks outside the filter panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extract unique departments and roles for filter options
  useEffect(() => {
    if (users.length > 0) {
      const uniqueDepartments = Array.from(new Set(users.map(user => user.department).filter(Boolean) as string[]));
      const uniqueRoles = Array.from(new Set(users.map(user => user.role)));
      
      setDepartments(uniqueDepartments);
      setRoles(uniqueRoles);
    }
  }, [users]);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await fetch('/api/admin/users');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      console.log('Fetched users:', data);
      
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (userData: { email: string; name: string; role: string; department: string }) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add user');
      }

      const data = await response.json();
      setTemporaryPassword(data.temporaryPassword);
      fetchUsers();
    } catch (err) {
      throw err;
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      // Refresh the users list
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      console.log('Attempting to delete user:', userId);
      
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      const text = await response.text();
      console.log('Raw response:', text);

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to delete user');
      }

      console.log('Delete successful:', data);
      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while deleting user');
    }
  };

  const handleRowClick = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  // Apply all filters
  useEffect(() => {
    let result = [...users];

    // Search term filter
    if (searchTerm.trim() !== '') {
      result = result.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (selectedDepartment) {
      result = result.filter(user => user.department === selectedDepartment);
    }

    // Role filter
    if (selectedRole) {
      result = result.filter(user => user.role === selectedRole);
    }

    // Status filter
    if (selectedStatus) {
      const isActive = selectedStatus === 'active';
      result = result.filter(user => user.isActive === isActive);
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      result = result.filter(user => new Date(user.createdAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      result = result.filter(user => new Date(user.createdAt) <= end);
    }

    setFilteredUsers(result);
    // Reset to first page when filters change
    setPage(1);
  }, [users, searchTerm, selectedDepartment, selectedRole, selectedStatus, startDate, endDate]);

  const clearFilters = () => {
    setSelectedDepartment('');
    setSelectedRole('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedDepartment) count++;
    if (selectedRole) count++;
    if (selectedStatus) count++;
    if (startDate || endDate) count++;
    return count;
  };

  // Get paginated data based on current filters
  const getPaginatedData = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  // Get current data with pagination
  const currentUsers = getPaginatedData();

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  if (status === 'loading') {
    return (
      <motion.div 
        className="flex justify-center items-center h-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div 
          className="h-16 w-16 border-4 border-[#190b37] rounded-full"
          animate={{ 
            rotate: 360,
            borderTopColor: "transparent",
            borderRightColor: "rgba(25, 11, 55, 0.3)",
            borderBottomColor: "rgba(25, 11, 55, 0.6)"
          }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.div>
    );
  }

  if (!session?.user) {
    router.push('/auth/signin');
    return null;
  }

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

  return (
    <div className="h-full">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
          <div className="w-full sm:w-auto mb-4 sm:mb-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#2f4faa] bg-opacity-20 rounded-lg flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-[#2f4faa]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-white">Users</h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  A list of all users in your organization including their name, department, role and status.
                </p>
              </div>
            </div>
          </div>
          {isSuperAdmin && (
            <motion.button
              onClick={() => setIsAddUserModalOpen(true)}
              className="w-full sm:w-auto flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#00a0cb] hover:bg-[#0090b7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00a0cb]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add User
            </motion.button>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-2 mb-4 sm:mb-6">
          {/* Search input */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border-0 bg-[#1e293b] text-[#00a0cb] placeholder-gray-500 focus:ring-2 focus:ring-[#00a0cb] focus:text-white transition-colors duration-200 shadow-[0_0_10px_rgba(0,160,203,0.1)] focus:shadow-[0_0_15px_rgba(0,160,203,0.2)]"
              style={{
                textShadow: searchTerm ? '0 0 8px rgba(0,160,203,0.3)' : 'none'
              }}
            />
          </div>

          {/* Filter button and counter */}
          <motion.div className="relative">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 rounded-lg bg-[#1e293b] text-white hover:bg-[#2a3749] transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-[#00a0cb]" />
              Filters
              {getActiveFilterCount() > 0 && (
                <span className="ml-2 bg-[#00a0cb] text-white text-xs px-2 py-1 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
            </motion.button>

            {/* Filters dropdown panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  ref={filterPanelRef}
                  className="absolute right-0 mt-2 w-72 md:w-96 bg-[#1e293b] rounded-lg shadow-lg z-10 overflow-hidden"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-medium">Filter Users</h3>
                      <button 
                        onClick={() => setShowFilters(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Department filter */}
                    <div className="mb-4">
                      <CustomDropdown
                        label="Department"
                        placeholder="All Departments"
                        options={[
                          { value: '', label: 'All Departments' },
                          ...departments.map(dept => ({ value: dept, label: dept }))
                        ]}
                        value={selectedDepartment}
                        onChange={setSelectedDepartment}
                      />
                    </div>

                    {/* Role filter */}
                    <div className="mb-4">
                      <CustomDropdown
                        label="Role"
                        placeholder="All Roles"
                        options={[
                          { value: '', label: 'All Roles' },
                          ...roles.map(role => ({ value: role, label: role }))
                        ]}
                        value={selectedRole}
                        onChange={setSelectedRole}
                      />
                    </div>

                    {/* Status filter */}
                    <div className="mb-4">
                      <CustomDropdown
                        label="Status"
                        placeholder="All Status"
                        options={[
                          { value: '', label: 'All Status' },
                          { value: 'active', label: 'Active' },
                          { value: 'inactive', label: 'Inactive' }
                        ]}
                        value={selectedStatus}
                        onChange={setSelectedStatus}
                      />
                    </div>

                    {/* Date range filters */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Join Date Range
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <CustomDatePicker
                          value={startDate}
                          onChange={setStartDate}
                          placeholder="Start date"
                          className="flex-1"
                        />
                        <CustomDatePicker
                          value={endDate}
                          onChange={setEndDate}
                          placeholder="End date"
                          min={startDate}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Filter actions */}
                    <div className="flex justify-between">
                      <button
                        onClick={clearFilters}
                        className="px-3 py-1 rounded-md bg-[#0f172a] text-gray-300 hover:text-white"
                      >
                        Clear Filters
                      </button>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="px-3 py-1 rounded-md bg-[#00a0cb] text-white hover:bg-[#0090b7]"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Active filters display */}
        {getActiveFilterCount() > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedDepartment && (
              <div className="flex items-center bg-[#1e293b] px-3 py-1 rounded-full text-sm">
                <span className="text-gray-400 mr-1">Department:</span>
                <span className="text-white">{selectedDepartment}</span>
                <button 
                  onClick={() => setSelectedDepartment('')}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {selectedRole && (
              <div className="flex items-center bg-[#1e293b] px-3 py-1 rounded-full text-sm">
                <span className="text-gray-400 mr-1">Role:</span>
                <span className="text-white">{selectedRole}</span>
                <button 
                  onClick={() => setSelectedRole('')}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {selectedStatus && (
              <div className="flex items-center bg-[#1e293b] px-3 py-1 rounded-full text-sm">
                <span className="text-gray-400 mr-1">Status:</span>
                <span className="text-white">{selectedStatus === 'active' ? 'Active' : 'Inactive'}</span>
                <button 
                  onClick={() => setSelectedStatus('')}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {(startDate || endDate) && (
              <div className="flex items-center bg-[#1e293b] px-3 py-1 rounded-full text-sm">
                <span className="text-gray-400 mr-1">Date:</span>
                <span className="text-white">
                  {startDate ? new Date(startDate).toLocaleDateString() : 'Any'} - 
                  {endDate ? new Date(endDate).toLocaleDateString() : 'Any'}
                </span>
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            
            <button 
              onClick={clearFilters}
              className="text-[#00a0cb] hover:text-white text-sm px-3 py-1 rounded-full hover:bg-[#1e293b] transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Mobile Header Info - Shows total results */}
        <div className="md:hidden mb-3 px-2">
          <p className="text-sm text-gray-400">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
          </p>
        </div>

        {/* Users table */}
        <div className="bg-[#1e293b] shadow rounded-lg overflow-hidden">
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center p-8 sm:p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00a0cb]"></div>
            </div>
          )}

          {/* No results state */}
          {!isLoading && filteredUsers.length === 0 && (
            <div className="flex flex-col justify-center items-center p-8 sm:p-12 text-center">
              <ExclamationCircleIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">No users found</h3>
              <p className="text-sm text-gray-400 max-w-md">
                {getActiveFilterCount() > 0 
                  ? "No users match the selected filters. Try adjusting your filter criteria." 
                  : searchTerm 
                    ? `We couldn't find any users matching "${searchTerm}". Try a different search term.` 
                    : "There are no users in the system. Add a user to get started."}
              </p>
              
              {/* Applied filters summary */}
              {getActiveFilterCount() > 0 && (
                <div className="mt-4 text-sm text-left w-full max-w-md bg-[#131e30] p-3 rounded-lg">
                  <h4 className="font-medium text-gray-300 mb-2">Applied filters:</h4>
                  <ul className="space-y-1 text-gray-400">
                    {selectedDepartment && (
                      <li>
                        <span className="font-medium">Department:</span> {selectedDepartment}
                      </li>
                    )}
                    {selectedRole && (
                      <li>
                        <span className="font-medium">Role:</span> {selectedRole}
                      </li>
                    )}
                    {selectedStatus && (
                      <li>
                        <span className="font-medium">Status:</span> {selectedStatus === 'active' ? 'Active' : 'Inactive'}
                      </li>
                    )}
                    {(startDate || endDate) && (
                      <li>
                        <span className="font-medium">Join date:</span> {startDate ? new Date(startDate).toLocaleDateString() : 'Any'} to {endDate ? new Date(endDate).toLocaleDateString() : 'Any'}
                      </li>
                    )}
                    {searchTerm && (
                      <li>
                        <span className="font-medium">Search term:</span> "{searchTerm}"
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#00a0cb] rounded-md hover:bg-[#0090b7] transition-colors"
                  >
                    Clear search
                  </button>
                )}
                {getActiveFilterCount() > 0 && (
                  <button 
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#1e293b] rounded-md hover:bg-[#2a3749] transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}

          {!isLoading && filteredUsers.length > 0 && (
            <>
              {/* Regular table for medium and large screens */}
              <div className="hidden md:block">
                <div className="min-w-full divide-y divide-gray-700 overflow-x-auto">
                  <div className="bg-[#131e30]">
                    <div className="sticky top-0 grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="col-span-4 lg:col-span-3">USER</div>
                      <div className="col-span-2">DEPARTMENT</div>
                      <div className="col-span-2">ROLE</div>
                      <div className="col-span-1">STATUS</div>
                      <div className="col-span-2 lg:col-span-3">JOIN DATE</div>
                      <div className="col-span-1">ACTIONS</div>
                    </div>
                  </div>
                  
                  <div className="bg-[#1e293b] divide-y divide-gray-800 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                    <AnimatePresence>
                      {currentUsers.map((user) => (
                        <motion.div
                          key={user.id}
                          className="group cursor-pointer grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[#2a3749] transition-colors duration-200"
                          onClick={() => handleRowClick(user.id)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="col-span-4 lg:col-span-3 flex items-center">
                            <div className="h-10 w-10 rounded-full bg-[#2a3749] flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-medium text-white">
                                {user.name?.[0] || user.email[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{user.name}</div>
                              <div className="text-xs text-gray-400 truncate">{user.email}</div>
                            </div>
                          </div>
                          <div className="col-span-2 flex items-center text-sm text-gray-300 truncate">
                            {user.department || '-'}
                          </div>
                          <div className="col-span-2 flex items-center">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900 text-blue-200">
                              {user.role.toLowerCase()}
                            </span>
                          </div>
                          <div className="col-span-1 flex items-center">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.isActive 
                                ? 'bg-green-900 text-green-200' 
                                : 'bg-red-900 text-red-200'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="col-span-2 lg:col-span-3 flex items-center text-sm text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="col-span-1 flex items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleUserStatus(user.id, user.isActive);
                              }}
                              className="invisible group-hover:visible px-3 py-1 text-xs rounded-md bg-red-900 text-red-200 hover:bg-red-800"
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Card view for small screens */}
              <div className="md:hidden">
                <div className="grid grid-cols-1 gap-4 p-3 sm:p-4">
                  <div className="flex justify-between items-center p-2 text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-700">
                    <div>USER</div>
                    <div className="hidden xs:block">DEPARTMENT</div>
                    <div className="hidden sm:block">ROLE</div>
                  </div>
                  
                  {currentUsers.map((user) => (
                    <motion.div 
                      key={user.id}
                      onClick={() => handleRowClick(user.id)}
                      className="bg-[#0f172a] p-3 sm:p-4 rounded-lg hover:bg-[#2a3749] transition-all duration-200 cursor-pointer shadow"
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#2a3749] flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-medium text-white">
                              {user.name?.[0] || user.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{user.name}</div>
                            <div className="text-xs text-gray-400 truncate">{user.email}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-300 hidden xs:block">{user.department || '-'}</div>
                      </div>
                      
                      {/* Mobile-only department row */}
                      <div className="xs:hidden mb-2 text-xs text-gray-300">
                        <span className="font-medium text-gray-400">Department:</span> {user.department || '-'}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-0">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900 text-blue-200">
                            {user.role.toLowerCase()}
                          </span>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive 
                              ? 'bg-green-900 text-green-200' 
                              : 'bg-red-900 text-red-200'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-400">
                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleUserStatus(user.id, user.isActive);
                          }}
                          className="px-3 py-1 text-xs rounded-md bg-red-900 text-red-200 hover:bg-red-800 self-start sm:self-auto"
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pagination controls */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 text-sm text-gray-400">
            <div className="mb-3 sm:mb-0">
              Showing <span className="font-medium text-white">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-white">{Math.min(page * itemsPerPage, filteredUsers.length)}</span> of <span className="font-medium text-white">{filteredUsers.length}</span> users
              {getActiveFilterCount() > 0 && ` (filtered from ${users.length})`}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="mr-2 whitespace-nowrap">Show</span>
                <CustomDropdown
                  options={[
                    { value: '5', label: '5' },
                    { value: '10', label: '10' },
                    { value: '25', label: '25' },
                    { value: '50', label: '50' }
                  ]}
                  value={itemsPerPage.toString()}
                  onChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    setPage(1); // Reset to first page when changing items per page
                  }}
                  placeholder="10"
                  className="w-20"
                  buttonClassName="py-1 px-2 text-center"
                  dropdownPosition="top"
                />
                <span className="ml-2 whitespace-nowrap">per page</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`px-3 py-2 rounded-md ${
                    page === 1
                      ? 'bg-[#1e293b] text-gray-600 cursor-not-allowed'
                      : 'bg-[#1e293b] text-white hover:bg-[#2a3749]'
                  }`}
                >
                  Previous
                </button>
                
                <div className="hidden sm:block w-24">
                  <CustomDropdown
                    options={Array.from({ length: totalPages }, (_, i) => ({
                      value: (i + 1).toString(),
                      label: (i + 1).toString()
                    }))}
                    value={page.toString()}
                    onChange={(value) => {
                      setPage(parseInt(value));
                    }}
                    placeholder="Page"
                    buttonClassName="py-1 px-2 text-center"
                    dropdownClassName="w-24 overflow-y-auto"
                    dropdownPosition="top"
                  />
                </div>
                
                <span className="hidden sm:inline-block">of {totalPages}</span>
                
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={`px-3 py-2 rounded-md ${
                    page === totalPages
                      ? 'bg-[#1e293b] text-gray-600 cursor-not-allowed'
                      : 'bg-[#1e293b] text-white hover:bg-[#2a3749]'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isSuperAdmin && (
        <AddUserModal
          isOpen={isAddUserModalOpen}
          onClose={() => {
            setIsAddUserModalOpen(false);
            setTemporaryPassword(null);
          }}
          onSubmit={handleAddUser}
          temporaryPassword={temporaryPassword}
        />
      )}
    </div>
  );
} 