// ModeratorPanel.tsx
'use client';
import useSWR from 'swr';
import { useState } from 'react';
import EquipmentTable from './EquipmentTable';
import ClientTable from './ClientTable';
import { getErrorMessage } from '@/lib/error';
import MovementsTable from './MovementsTable';

export default function ModeratorPanel() {
  const { data: users, error } = useSWR('/api/users');
  const [activeTable, setActiveTable] = useState<'equipment' | 'clients' | 'entrées/sorties'>('equipment');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">Panneau Modérateur</h1>
          {users && (
            <p className="mt-2 text-gray-600">
              Nombre d&apos;utilisateurs: {users.length}
            </p>
          )}
        </div>

        {error ? (
          <div className="flex items-center bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
            <span className="mr-2">⚠️</span>
            <span>{getErrorMessage(error)}</span>
          </div>
        ) : (
          <>
            <div className="flex mb-8 p-1 bg-gray-50 rounded-lg max-w-md">
              <button
                className={`flex-1 px-6 py-3 text-sm font-medium rounded-md transition-all ${
                  activeTable === 'equipment' 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTable('equipment')}
              >
                Équipement
              </button>
              <button
                className={`flex-1 px-6 py-3 text-sm font-medium rounded-md transition-all ${
                  activeTable === 'clients' 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTable('clients')}
              >
                Clients
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

            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              {activeTable === 'equipment' && <EquipmentTable />}
              {activeTable === 'clients' && <ClientTable />}
              {activeTable === 'entrées/sorties' && <MovementsTable />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
