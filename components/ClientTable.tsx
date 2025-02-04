'use client';
import { useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

export interface Client {
  id: string;
  name: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ClientTable = () => {
  const { data: clients, error, isLoading } = useSWR<Client[]>('/api/clients', fetcher);
  const [selectedClient, setSelectedClient] = useState<Partial<Client> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (error)
    return (
      <div className="flex items-center bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
        <span className="mr-2">⚠️</span>
        <span>Échec du chargement des clients</span>
      </div>
    );

  if (isLoading)
    return (
      <div className="text-center py-8 text-gray-500">
        Chargement des clients...
      </div>
    );

  const filteredClients =
    clients?.filter((client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // Instead of Promise<any>, we use Promise<unknown> to avoid the explicit 'any'
  const optimisticMutate = async (optimisticData: Client[], apiCall: Promise<unknown>) => {
    try {
      globalMutate('/api/clients', optimisticData, false);
      await apiCall;
      globalMutate('/api/clients');
    } catch (error) {
      globalMutate('/api/clients');
      throw error;
    }
  };

  const handleSubmit = async (clientData: Partial<Client>) => {
    try {
      let apiCall: Promise<unknown>;
      const isEdit = isEditing && selectedClient?.id;

      const baseData = {
        ...clientData,
        updated_at: new Date().toISOString(),
      };

      if (isEdit) {
        const optimisticData =
          clients?.map((client) =>
            client.id === selectedClient!.id ? { ...client, ...baseData } : client
          ) || [];

        apiCall = fetch(`/api/clients/${selectedClient!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(baseData),
        });
        await optimisticMutate(optimisticData, apiCall);
      } else {
        const tempId = `temp-${Date.now()}`;
        const newClient = {
          ...baseData,
          id: tempId,
          created_at: new Date().toISOString(),
        } as Client;

        const optimisticData = [...(clients || []), newClient];

        apiCall = fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(baseData),
        }).then((res) => res.json());

        await optimisticMutate(optimisticData, apiCall);
      }

      setShowModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error("Échec de l'opération :", error);
    }
  };

  const handleDelete = async (clientId: string) => {
    try {
      const optimisticData = clients?.filter((client) => client.id !== clientId) || [];
      const apiCall = fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      await optimisticMutate(optimisticData, apiCall);
      setDeleteClientId(null);
    } catch (error) {
      console.error('Échec de la suppression :', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
        </div>

        {/* Contrôles */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <button
            onClick={() => {
              setSelectedClient({ name: '' });
              setIsEditing(false);
              setShowModal(true);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
          >
            Ajouter un Client
          </button>
        </div>

        {/* Recherche */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tableau */}
        <div className="border border-gray-100 rounded-xl overflow-x-auto shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Nom
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{client.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setIsEditing(true);
                        setShowModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setDeleteClientId(client.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-gray-500">Aucun client trouvé</div>
          )}
        </div>

        {/* Modal Ajout/Modification */}
        {showModal && selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold mb-6">
                {isEditing ? 'Modifier le Client' : 'Nouveau Client'}
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSubmit({
                    ...selectedClient,
                    name: formData.get('name') as string,
                  });
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">Nom</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={selectedClient.name}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {isEditing ? 'Enregistrer' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Suppression */}
        {deleteClientId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-medium mb-4">Confirmer la suppression</h3>
              <p className="mb-6">Êtes-vous sûr de vouloir supprimer ce client ?</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteClientId(null)}
                  className="px-5 py-2.5 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(deleteClientId)}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientTable;
