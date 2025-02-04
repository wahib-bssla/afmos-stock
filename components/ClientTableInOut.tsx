'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Select from 'react-select';

type EquipmentType =
  | 'ANTI INTRUSION'
  | 'INCENDIES'
  | 'VIDEO SURVEILLANCE'
  | "CONTROLE D'ACCES"
  | 'LSB/ELS'
  | 'GESTION DE CLE'
  | 'CABLES/ACCESSOIRES';

interface Client {
  id: string;
  name: string;
}

interface Equipment {
  id: string;
  name: string;
  ref?: string;
  price?: number;
  type: EquipmentType;
  created_at: string;
  updated_at: string;
  clientId: string;
  client?: {
    id: string;
    name: string;
  };
  quantity: number;
}

interface Movement {
  equipment_id: string;
  quantity: number;
  type: 'ENTREE' | 'SORTIE';
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ClientTableInOut = () => {
  const { data: session } = useSession();
  const { data: clients, error, isLoading } = useSWR<Client[]>('/api/clients', fetcher);
  const [agence, setAgence] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedMovementType, setSelectedMovementType] = useState<'ENTREE' | 'SORTIE' | null>(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [clientEquipments, setClientEquipments] = useState<Equipment[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [equipmentSearch, setEquipmentSearch] = useState<string>('');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<EquipmentType | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingEquipments, setIsLoadingEquipments] = useState(false);

  const ITEMS_PER_PAGE = 4;
  const typeOptions = [
    { value: 'ALL', label: 'Tous les types' },
    { value: 'ANTI INTRUSION', label: 'Anti Intrusion' },
    { value: 'INCENDIES', label: 'Incendies' },
    { value: 'VIDEO SURVEILLANCE', label: 'Vidéo Surveillance' },
    { value: "CONTROLE D'ACCES", label: "Contrôle d'Accès" },
    { value: 'LSB/ELS', label: 'LSB/ELS' },
    { value: 'GESTION DE CLE', label: 'Gestion de Clé' },
    { value: 'CABLES/ACCESSOIRES', label: 'Câbles/Accessoires' },
  ];

  const typeColors = {
    'ANTI INTRUSION': { bg: 'bg-blue-100', text: 'text-blue-800' },
    'INCENDIES': { bg: 'bg-red-100', text: 'text-red-800' },
    'VIDEO SURVEILLANCE': { bg: 'bg-purple-100', text: 'text-purple-800' },
    "CONTROLE D'ACCES": { bg: 'bg-green-100', text: 'text-green-800' },
    'LSB/ELS': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'GESTION DE CLE': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    'CABLES/ACCESSOIRES': { bg: 'bg-gray-100', text: 'text-gray-800' },
  };

  useEffect(() => {
    const fetchEquipments = async () => {
      if (selectedClient) {
        setIsLoadingEquipments(true);
        try {
          const response = await fetch(`/api/clients/${selectedClient.id}/equipments`);
          const data = await response.json();
          setClientEquipments(data);
        } catch (error) {
          console.error('Erreur de chargement :', error);
        } finally {
          setIsLoadingEquipments(false);
        }
      }
    };

    fetchEquipments();
  }, [selectedClient]);

  const filteredEquipments = clientEquipments.filter((equipment) =>
    equipment.name.toLowerCase().includes(equipmentSearch.toLowerCase()) &&
    (selectedEquipmentType === 'ALL' || equipment.type === selectedEquipmentType)
  );

  const totalPages = Math.ceil(filteredEquipments.length / ITEMS_PER_PAGE);
  const paginatedEquipments = filteredEquipments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleQuantityChange = (equipmentId: string, value: string) => {
    const numericValue = Math.max(0, parseInt(value) || 0);
    setQuantities((prev) => ({ ...prev, [equipmentId]: numericValue }));
  };

  const handleSubmitMovement = async () => {
    try {
      if (!session?.user?.id) throw new Error('Technicien non authentifié');

      const movements: Movement[] = Object.entries(quantities)
        // Use a leading comma to ignore the unused equipmentId parameter in filter.
        .filter(([, quantity]) => quantity > 0)
        .map(([equipmentId, quantity]) => ({
          equipment_id: equipmentId,
          quantity,
          type: selectedMovementType!,
        }));

      if (movements.length === 0) {
        alert('Veuillez sélectionner au moins un équipement avec quantité');
        return;
      }

      const response = await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movements,
          technician_id: session.user.id,
          agence, // Include the agency in the body
        }),
      });

      if (!response.ok) throw new Error('Échec de l\'enregistrement');

      setShowMovementModal(false);
      setQuantities({});
      setSelectedClient(null);
      setSelectedMovementType(null);
      setCurrentPage(1);
      setAgence(''); // Reset agency after submission
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };

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

  if (!session || session.user.role !== 'TECHNICIAN') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="text-red-500 text-center py-8">
            Accès réservé aux techniciens autorisés
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Entrées/Sorties</h1>
        </div>

        {/* Recherche Client */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Rechercher par nom client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tableau Clients */}
        <div className="border border-gray-100 rounded-xl overflow-x-auto shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients
                ?.filter((client) =>
                  client.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{client.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setSelectedMovementType('ENTREE');
                          setShowMovementModal(true);
                        }}
                        className="px-6 py-2 bg-green-500 text-white rounded-full shadow-sm hover:bg-green-600 transition-colors"
                      >
                        Entrées
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setSelectedMovementType('SORTIE');
                          setShowMovementModal(true);
                        }}
                        className="px-6 py-2 bg-red-500 text-white rounded-full shadow-sm hover:bg-red-600 transition-colors"
                      >
                        Sorties
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Modal Mouvements */}
        {showMovementModal && selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-xl">
              <h2 className="text-xl font-bold mb-6">
                {selectedMovementType === 'ENTREE' ? 'Entrée' : 'Sortie'}: {selectedClient.name}
              </h2>

              <input
                type="text"
                placeholder="Spécifier l'agence..."
                value={agence}
                onChange={(e) => setAgence(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 mb-6"
              />

              {/* Filtres Équipements */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Rechercher par nom..."
                  value={equipmentSearch}
                  onChange={(e) => {
                    setEquipmentSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 flex-grow"
                />
                <Select
                  options={typeOptions}
                  value={typeOptions.find((opt) => opt.value === selectedEquipmentType)}
                  onChange={(option) => {
                    setSelectedEquipmentType(option?.value as EquipmentType | 'ALL');
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-56"
                  classNamePrefix="select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '48px',
                      borderColor: '#e5e7eb',
                      borderRadius: '0.5rem',
                      '&:hover': { borderColor: '#e5e7eb' },
                    }),
                  }}
                  placeholder="Type d'équipement"
                />
              </div>

              {/* Liste Équipements */}
              {isLoadingEquipments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Chargement des équipements...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedEquipments.map((equipment) => (
                      <div
                        key={equipment.id}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="space-y-1">
                          <h3 className="font-medium text-gray-900">{equipment.name}</h3>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ${typeColors[equipment.type].bg} ${typeColors[equipment.type].text}`}
                            >
                              {equipment.type}
                            </span>
                            {equipment.ref && (
                              <span className="text-xs text-gray-500">
                                Réf: {equipment.ref}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">
                            Qté: {equipment.quantity}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={quantities[equipment.id] || 0}
                            onChange={(e) => handleQuantityChange(equipment.id, e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Qté"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {filteredEquipments.length > 0 && (
                    <div className="mt-6 flex justify-between items-center">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        Précédent
                      </button>
                      <span className="text-sm text-gray-500">
                        Page {currentPage} sur {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        Suivant
                      </button>
                    </div>
                  )}

                  {filteredEquipments.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      Aucun équipement trouvé
                    </div>
                  )}
                </>
              )}

              {/* Actions Modal */}
              <div className="flex justify-end space-x-4 mt-8 border-t border-gray-100 pt-6">
                <button
                  onClick={() => {
                    setShowMovementModal(false);
                    setQuantities({});
                    setCurrentPage(1);
                    setEquipmentSearch('');
                    setSelectedEquipmentType('ALL');
                  }}
                  className="px-5 py-2.5 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitMovement}
                  className={`px-5 py-2.5 text-white rounded-lg ${
                    selectedMovementType === 'ENTREE'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  } transition-colors`}
                >
                  Confirmer {selectedMovementType === 'ENTREE' ? 'Entrée' : 'Sortie'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientTableInOut;
