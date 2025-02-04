'use client';
import { useState } from 'react';
import Select from 'react-select';
import useSWR, { mutate as globalMutate } from 'swr';
import { Equipment } from '@/types';

export interface Client {
  id: string;
  name: string;
}

const typeColors = {
  'ANTI INTRUSION': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'INCENDIES': { bg: 'bg-red-100', text: 'text-red-800' },
  'VIDEO SURVEILLANCE': { bg: 'bg-purple-100', text: 'text-purple-800' },
  "CONTROLE D'ACCES": { bg: 'bg-green-100', text: 'text-green-800' },
  'LSB/ELS': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'GESTION DE CLE': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  'CABLES/ACCESSOIRES': { bg: 'bg-gray-100', text: 'text-gray-800' },
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

const EquipmentTable = () => {
  type SelectOption = { value: string; label: string };
  const { data: clients } = useSWR<Client[]>('/api/clients', fetcher);
  const { data: equipments, error, isLoading } = useSWR<Equipment[]>('/api/equipments', fetcher);
  const [selectedEquipment, setSelectedEquipment] = useState<Partial<Equipment> | null>(null);
  const [selectedType, setSelectedType] = useState<SelectOption | null>(null);
  const [selectedClient, setSelectedClient] = useState<SelectOption | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteEquipmentId, setDeleteEquipmentId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
  
  const clientOptions = [
    { value: 'ALL', label: 'Tous les clients' },
    { value: 'NULL', label: 'Non assigné' },
    ...clients?.map(client => ({ value: client.id, label: client.name })) || [],
  ];

  const modaltypeOptions = [
    { value: 'ANTI INTRUSION', label: 'Anti Intrusion' },
    { value: 'INCENDIES', label: 'Incendies' },
    { value: 'VIDEO SURVEILLANCE', label: 'Vidéo Surveillance' },
    { value: "CONTROLE D'ACCES", label: "Contrôle d'Accès" },
    { value: 'LSB/ELS', label: 'LSB/ELS' },
    { value: 'GESTION DE CLE', label: 'Gestion de Clé' },
    { value: 'CABLES/ACCESSOIRES', label: 'Câbles/Accessoires' },
  ];
  
  const modalclientOptions = clients?.map(client => ({
    value: client.id,
    label: client.name,
  })) || [];

  if (error) return (
    <div className="flex items-center bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
      <span className="mr-2">⚠️</span>
      <span>Échec du chargement des équipements</span>
    </div>
  );

  if (isLoading) return (
    <div className="text-center py-8 text-gray-500">
      Chargement des équipements...
    </div>
  );

  const filteredEquipments = equipments?.filter(equipment => {
    const matchesType = typeFilter === 'ALL' || equipment.type === typeFilter;
    const matchesSearch = 
      equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      equipment.ref?.toLowerCase().includes(searchQuery.toLowerCase());
    const equipmentClientId = equipment.client?.id || 'NULL';
    const matchesClient = clientFilter === 'ALL' || clientFilter === equipmentClientId;
    return matchesType && matchesSearch && matchesClient;
  }) || [];

  const optimisticMutate = async (optimisticData: Equipment[], apiCall: Promise<unknown>) => {
    try {
      globalMutate('/api/equipments', optimisticData, false);
      await apiCall;
      globalMutate('/api/equipments');
    } catch (error) {
      globalMutate('/api/equipments');
      throw error;
    }
  };

  const handleSubmit = async (equipmentData: Partial<Equipment>) => {
    try {
      let apiCall: Promise<unknown>;
      const isEdit = isEditing && selectedEquipment?.id;

      const baseData = {
        ...equipmentData,
        updated_at: new Date().toISOString()
      };

      if (isEdit) {
        const optimisticData = equipments?.map(e => 
          e.id === selectedEquipment.id ? { ...e, ...baseData } : e
        ) || [];
        
        apiCall = fetch(`/api/equipments/${selectedEquipment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(baseData)
        });

        await optimisticMutate(optimisticData, apiCall);
      } else {
        const tempId = `temp-${Date.now()}`;
        const newEquipment = {
          ...baseData,
          id: tempId,
          created_at: new Date().toISOString()
        } as Equipment;

        const optimisticData = [...(equipments || []), newEquipment];
        
        apiCall = fetch('/api/equipments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(baseData)
        }).then(res => res.json());

        await optimisticMutate(optimisticData, apiCall);
      }

      setShowModal(false);
      setSelectedEquipment(null);
    } catch (error) {
      console.error('Échec de l\'opération :', error);
    }
  };

  const handleDelete = async (equipmentId: string) => {
    try {
      const optimisticData = equipments?.filter(e => e.id !== equipmentId) || [];
      const apiCall = fetch(`/api/equipments/${equipmentId}`, { method: 'DELETE' });
      await optimisticMutate(optimisticData, apiCall);
      setDeleteEquipmentId(null);
    } catch (error) {
      console.error('Échec de la suppression :', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Équipements</h1>
        </div>

        {/* Contrôles */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <button
            onClick={() => {
              setSelectedEquipment({
                name: '',
                ref: '',
                type: 'ANTI INTRUSION'
              });
              setSelectedType(modaltypeOptions[0]);
              setIsEditing(false);
              setShowModal(true);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
          >
            Ajouter un Équipement
          </button>
        </div>

        {/* Filtres */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 flex-grow"
          />
          
          <Select
            options={typeOptions}
            value={typeOptions.find(opt => opt.value === typeFilter)}
            onChange={(selected) => setTypeFilter(selected?.value || 'ALL')}
            placeholder="Type..."
            className="w-full sm:w-56"
            classNamePrefix="select"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '48px',
                borderColor: '#e5e7eb',
                borderRadius: '0.5rem',
                '&:hover': { borderColor: '#e5e7eb' }
              })
            }}
          />

          <Select
            options={clientOptions}
            value={clientOptions.find(opt => opt.value === clientFilter)}
            onChange={(selected) => setClientFilter(selected?.value || 'ALL')}
            placeholder="Client..."
            className="w-full sm:w-56"
            classNamePrefix="select"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '48px',
                borderColor: '#e5e7eb',
                borderRadius: '0.5rem',
                '&:hover': { borderColor: '#e5e7eb' }
              })
            }}
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
                  Référence
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Prix
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEquipments.map((equipment) => (
                <tr key={equipment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{equipment.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{equipment.ref}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      typeColors[equipment.type].bg
                    } ${typeColors[equipment.type].text}`}>
                      {equipment.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {equipment.price?.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'MAD'
                      }) || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {equipment.client?.name || 'Non assigné'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <button
                      onClick={() => {
                        setSelectedEquipment(equipment);
                        setSelectedType(modaltypeOptions.find(opt => opt.value === equipment.type) || null);
                        setSelectedClient(clientOptions.find(opt => opt.value === equipment.client?.id) || null);
                        setIsEditing(true);
                        setShowModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setDeleteEquipmentId(equipment.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEquipments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun équipement trouvé
            </div>
          )}
        </div>

        {/* Modal Ajout/Modification */}
        {showModal && selectedEquipment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold mb-6">
                {isEditing ? 'Modifier l\'Équipement' : 'Nouvel Équipement'}
              </h2>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSubmit({
                    ...selectedEquipment,
                    name: formData.get('name') as string,
                    ref: formData.get('ref') as string,
                    price: parseFloat(formData.get('price') as string),
                    type: (selectedType?.value || 'ANTI INTRUSION') as Equipment['type'],
                    clientId: selectedClient?.value || ""
                  });
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">Nom</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={selectedEquipment.name}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Référence</label>
                  <input
                    name="ref"
                    type="text"
                    defaultValue={selectedEquipment.ref || ''}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <Select
                      options={modaltypeOptions}
                      value={selectedType}
                      onChange={(option) => setSelectedType(option)}
                      placeholder="Sélectionner un type..."
                      className="w-full"
                      classNamePrefix="select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '48px',
                          borderColor: '#e5e7eb',
                          borderRadius: '0.5rem',
                          '&:hover': { borderColor: '#e5e7eb' }
                        })
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Prix</label>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={selectedEquipment.price || ''}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Client</label>
                    <Select
                      options={modalclientOptions}
                      defaultValue={clientOptions.find(opt => opt.value === selectedEquipment.client?.id)}
                      onChange={(option) => setSelectedClient(option)}
                      placeholder="Sélectionner un client..."
                      className="w-full"
                      classNamePrefix="select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '48px',
                          borderColor: '#e5e7eb',
                          borderRadius: '0.5rem',
                          '&:hover': { borderColor: '#e5e7eb' }
                        })
                      }}
                    />
                  </div>
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
        {deleteEquipmentId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-medium mb-4">Confirmer la suppression</h3>
              <p className="mb-6">Êtes-vous sûr de vouloir supprimer cet équipement ?</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteEquipmentId(null)}
                  className="px-5 py-2.5 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(deleteEquipmentId)}
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

export default EquipmentTable;
