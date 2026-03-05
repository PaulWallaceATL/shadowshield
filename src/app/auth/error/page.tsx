import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold text-red-600 mb-8">Authentication Error</h1>
      <p className="text-xl text-gray-600 mb-8">There was an error signing you in.</p>
      <a
        href="/auth/signin"
        className="inline-block px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
      >
        Try Again
      </a>
    </div>
  );
} 