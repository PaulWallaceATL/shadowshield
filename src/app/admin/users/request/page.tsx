'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

type UserRequest = {
  id: string;
  email: string;
  requestedRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  justification: string;
  createdAt: string;
  name: string;
  department: string;
  requestedBy: string;
  organization: string;
};

export default function UserRequestPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/users/request');
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session?.user?.role || !['SUPER_ADMIN', 'ORG_ADMIN'].includes(session.user.role)) {
    return <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Requests</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {requests.map((request) => (
          <div key={request.id} className="bg-white shadow rounded-lg p-6">
            <div className="space-y-2">
              <div className="px-3 py-2">
                <span className="text-black font-bold text-lg">{request.name}</span>
              </div>
              
              <div className="px-3 py-2">
                <span className="text-black font-bold">Role: {request.requestedRole}</span>
              </div>
              
              <div className="px-3 py-2">
                <span className="text-black font-bold">Department: {request.department || 'any'}</span>
              </div>
              
              <div className="px-3 py-2">
                <span className="text-black font-bold">Requested by: {request.requestedBy || 'antimatter'}</span>
              </div>
              
              <div className="px-3 py-2">
                <span className="text-black font-bold">Organization: {request.organization || 'antimatter'}</span>
              </div>
              
              <div className="px-3 py-2">
                <span className="text-black font-bold">Notes: {request.justification || 'please add'}</span>
              </div>

              <div className="mt-2 px-3">
                <span className="text-black font-bold">Status: </span>
                <span className="text-green-700 font-bold ml-1">
                  {request.status}
                </span>
              </div>

              {request.status === 'PENDING' && (
                <div className="mt-4 flex space-x-2">
                  <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium">
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 