// components/AdminDashboard.tsx
'use client';
import useSWR from 'swr';
import { useState } from 'react';
import UserTable from './UserTable';
import MovementsTable from './MovementsTable';
import { getErrorMessage } from '@/lib/error';

export default function AdminDashboard() {
  // Removed "users" from the destructuring since it's not used
  const { error } = useSWR('/api/users');
  const [activeTable, setActiveTable] = useState<'utilisateurs' | 'entrées/sorties'>('entrées/sorties');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">Panneau Admin</h1>
        </div>

        {error ? (
          <div className="flex items-center bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
            <span className="mr-2">⚠️</span>
            <span>{getErrorMessage(error)}</span>
          </div>
        ) : (
          <>
            {/* Modern Toggle Switch */}
            <div className="flex mb-8 p-1 bg-gray-50 rounded-lg max-w-md">
              <button
                className={`flex-1 px-6 py-3 text-sm font-medium rounded-md transition-all ${
                  activeTable === 'utilisateurs'
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTable('utilisateurs')}
              >
                Utilisateurs
              </button>
              <button
                className={`flex-1 px-6 py-3 text-sm font-medium rounded-md transition-all ${
                  activeTable === 'entrées/sorties'
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTable('entrées/sorties')}
              >
                Entrées/Sorties
              </button>
            </div>

            {/* Table Container */}
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              {activeTable === 'utilisateurs' ? <UserTable /> : <MovementsTable />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
