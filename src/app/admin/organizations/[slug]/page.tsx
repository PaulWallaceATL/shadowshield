'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  UserPlusIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface OrganizationDetails {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  members: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    role: string;
  }>;
  settings: {
    apiKeys: Record<string, string>;
    dlpProviders: Record<string, any>;
  };
}

interface Member {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  role: string;
}

interface AddMemberResponse {
  temporaryPassword?: string;
  member: Member;
}

function MembersSection({ members, onAddMember, onUpdateRole, onRemoveMember }: { 
  members: Member[];
  onAddMember: (email: string, name: string, department: string, role: string) => Promise<AddMemberResponse | undefined>;
  onUpdateRole: (memberId: string, role: string) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
}) {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberDepartment, setNewMemberDepartment] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('USER');
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await onAddMember(newMemberEmail, newMemberName, newMemberDepartment, newMemberRole);
      if (result?.temporaryPassword) {
        setTemporaryPassword(result.temporaryPassword);
      } else {
        setIsAddingMember(false);
        setNewMemberEmail('');
        setNewMemberName('');
        setNewMemberDepartment('');
        setNewMemberRole('USER');
      }
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  return (
    <div className="mt-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900">Members</h2>
          <p className="mt-2 text-sm text-gray-700">
            Manage organization members and their roles
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setIsAddingMember(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add Member
          </button>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {member.user.name || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {member.user.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={member.role}
                          onChange={(e) => onUpdateRole(member.id, e.target.value)}
                          className="rounded-md border-gray-300 text-sm"
                        >
                          <option value="ORG_ADMIN">Organization Admin</option>
                          <option value="ADMIN">Admin</option>
                          <option value="USER">User</option>
                        </select>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <button
                          onClick={() => onRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isAddingMember && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">Add Member</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <input
                  type="text"
                  value={newMemberDepartment}
                  onChange={(e) => setNewMemberDepartment(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="ORG_ADMIN">Organization Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {temporaryPassword && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">Temporary Password Generated</h3>
            <div className="bg-yellow-50 p-4 rounded-md mb-4">
              <p className="text-sm text-yellow-800">
                Please save this password. The user will need it to log in for the first time.
                They will be required to change it upon first login.
              </p>
              <div className="mt-4 p-2 bg-white border border-yellow-300 rounded-md">
                <p className="font-mono text-lg break-all">{temporaryPassword}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setTemporaryPassword(null);
                  setIsAddingMember(false);
                  setNewMemberEmail('');
                  setNewMemberName('');
                  setNewMemberDepartment('');
                  setNewMemberRole('USER');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const { data: session } = useSession();
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      fetchOrganization();
    }
  }, [slug]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/admin/organizations/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch organization');
      }
      const data = await response.json();
      setOrganization(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (email: string, name: string, department: string, role: string): Promise<AddMemberResponse | undefined> => {
    try {
      const response = await fetch(`/api/admin/organizations/${slug}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, department, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add member');
      }

      const data = await response.json();
      await fetchOrganization();
      
      if (data.temporaryPassword) {
        return {
          temporaryPassword: data.temporaryPassword,
          member: data
        };
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/${slug}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      fetchOrganization();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/${slug}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      fetchOrganization();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteOrganization = async () => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/organizations/${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }

      router.push('/admin/organizations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Organization not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Created {new Date(organization.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={handleDeleteOrganization}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Delete Organization
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Overview</h3>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{organization.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Slug</dt>
              <dd className="mt-1 text-sm text-gray-900">{organization.slug}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Members</dt>
              <dd className="mt-1 text-sm text-gray-900">{organization.members.length}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              Security Settings
            </button>
            <button className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              View Analytics
            </button>
            <button className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              <BellIcon className="h-5 w-5 mr-2" />
              Alerts
            </button>
            <button className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      <MembersSection
        members={organization.members}
        onAddMember={handleAddMember}
        onUpdateRole={handleUpdateRole}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  );
} 