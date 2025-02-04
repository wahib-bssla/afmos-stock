'use client';
import { useState } from 'react';
import useSWR from 'swr';
import Select from 'react-select';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type MovementType = 'ENTREE' | 'SORTIE';
type EquipmentType =
  | 'ANTI INTRUSION'
  | 'INCENDIES'
  | 'VIDEO SURVEILLANCE'
  | "CONTROLE D'ACCES"
  | 'LSB/ELS'
  | 'GESTION DE CLE'
  | 'CABLES/ACCESSOIRES';

interface Movement {
  id: string;
  equipment: {
    name: string;
    type: EquipmentType;
    client: {
      id: string;
      name: string;
    };
  };
  agence: string;
  type: MovementType;
  technician: {
    username: string;
  };
  quantity: number;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const MovementsTable = () => {
  const { data: movements, error, isLoading } = useSWR<Movement[]>('/api/movements', fetcher);
  const { data: clients } = useSWR<Client[]>('/api/clients', fetcher);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovementType, setSelectedMovementType] = useState<MovementType | 'ALL'>('ALL');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<EquipmentType | 'ALL'>('ALL');
  const [selectedClient, setSelectedClient] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const movementTypeOptions = [
    { value: 'ALL', label: 'Tous les types' },
    { value: 'ENTREE', label: 'Entrée' },
    { value: 'SORTIE', label: 'Sortie' }
  ];

  const equipmentTypeOptions = [
    { value: 'ALL', label: 'Tous les équipements' },
    { value: 'ANTI INTRUSION', label: 'Anti Intrusion' },
    { value: 'INCENDIES', label: 'Incendies' },
    { value: 'VIDEO SURVEILLANCE', label: 'Vidéo Surveillance' },
    { value: "CONTROLE D'ACCES", label: "Contrôle d'Accès" },
    { value: 'LSB/ELS', label: 'LSB/ELS' },
    { value: 'GESTION DE CLE', label: 'Gestion de Clé' },
    { value: 'CABLES/ACCESSOIRES', label: 'Câbles/Accessoires' }
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

  const clientOptions = [
    { value: 'ALL', label: 'Tous les clients' },
    ...(clients?.map((client) => ({ value: client.id, label: client.name })) || [])
  ];

  const filteredMovements =
    movements?.filter((movement) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        movement.equipment.name.toLowerCase().includes(searchLower) ||
        movement.technician.username.toLowerCase().includes(searchLower) ||
        new Date(movement.created_at).toLocaleDateString().includes(searchLower);

      const matchesMovementType = selectedMovementType === 'ALL' || movement.type === selectedMovementType;
      const matchesEquipmentType = selectedEquipmentType === 'ALL' || movement.equipment.type === selectedEquipmentType;
      const matchesClient = selectedClient === 'ALL' || movement.equipment.client.id === selectedClient;

      const movementDate = new Date(movement.created_at);
      const matchesStartDate = !startDate || movementDate >= new Date(startDate);
      const matchesEndDate = !endDate || movementDate <= new Date(endDate);

      return (
        matchesSearch &&
        matchesMovementType &&
        matchesEquipmentType &&
        matchesClient &&
        matchesStartDate &&
        matchesEndDate
      );
    }) || [];

  const handleExport = () => {
    const doc = new jsPDF();
    const logoUrl = '/AFMOS.png';
    const today = new Date();
    const formattedDate = today.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: '2-digit'
    });

    // Get page width
    const pageWidth = doc.internal.pageSize.width;

    // Add logo (left side)
    const logoWidth = 50;
    doc.addImage(logoUrl, 'PNG', 10, 10, logoWidth, 20);

    // Add date (right side)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(formattedDate, pageWidth - 40, 20);

    // Add title (centered)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Historique des Mouvements', pageWidth / 2, 45, { align: 'center' });

    // Add time span below title
    const from =
      startDate === ''
        ? '...'
        : new Date(startDate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: '2-digit'
          });
    const to =
      endDate === ''
        ? '...'
        : new Date(endDate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: '2-digit'
          });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Du: ${from}  -  Au: ${to}`, pageWidth / 2, 55, { align: 'center' });

    // Define columns
    const tableColumn = [
      'Équipement',
      "Type d'équip.",
      'Client',
      'Agence',
      'Type',
      'Technicien',
      'Qté'
    ];

    // Map data
    const tableRows = filteredMovements.map((movement) => [
      movement.equipment.name,
      movement.equipment.type,
      movement.equipment.client.name,
      movement.agence,
      movement.type === 'ENTREE' ? 'Entrée' : 'Sortie',
      movement.technician.username,
      movement.quantity.toString()
    ]);

    // Generate table (starting below the date range)
    autoTable(doc, {
      startY: 65,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 1.5,
        halign: 'left'
      },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [33, 37, 41],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
        6: { cellWidth: 15 }
      },
      margin: { top: 50 }
    });

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save('mouvements.pdf');
  };

  if (error)
    return (
      <div className="flex items-center bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
        <span className="mr-2">⚠️</span>
        <span>Échec du chargement des mouvements</span>
      </div>
    );

  if (isLoading) return <div className="text-center py-8 text-gray-500">Chargement...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">Historique des Mouvements</h1>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4 items-end">
          <div className="w-full sm:w-auto">
            <Select
              options={movementTypeOptions}
              value={movementTypeOptions.find((opt) => opt.value === selectedMovementType)}
              onChange={(option) => setSelectedMovementType(option?.value as MovementType | 'ALL')}
              className="w-full sm:w-48"
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
              placeholder="Type de mouvement"
            />
          </div>

          <div className="w-full sm:w-auto">
            <Select
              options={equipmentTypeOptions}
              value={equipmentTypeOptions.find((opt) => opt.value === selectedEquipmentType)}
              onChange={(option) => setSelectedEquipmentType(option?.value as EquipmentType | 'ALL')}
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
              placeholder="Type d'équipement"
            />
          </div>

          <div className="w-full sm:w-auto">
            <Select
              options={clientOptions}
              value={clientOptions.find((opt) => opt.value === selectedClient)}
              onChange={(option) => setSelectedClient(option?.value || 'ALL')}
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
              placeholder="Client"
            />
          </div>

          <div className="w-full sm:w-auto">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1 m-auto">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1 m-auto">Date de fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Export Button */}
        <div className="mb-4">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Générer PDF
          </button>
        </div>

        {/* Table */}
        <div className="border border-gray-100 rounded-xl overflow-x-auto shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Équipement
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Agence
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Mouvement
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Technicien
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Quantité
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Date/Heure
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.map((movement) => (
                <tr key={movement.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">
                      {movement.equipment.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${typeColors[movement.equipment.type].bg} ${typeColors[movement.equipment.type].text}`}
                    >
                      {movement.equipment.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {movement.equipment.client.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {movement.agence}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full ${
                        movement.type === 'ENTREE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {movement.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {movement.technician.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {movement.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(movement.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMovements.length === 0 && (
            <div className="text-center py-8 text-gray-500">Aucun mouvement trouvé</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovementsTable;
