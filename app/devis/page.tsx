'use client';
import { useState, Fragment, ChangeEvent } from 'react';
import useSWR from 'swr';
import Select from 'react-select';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid

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
    price: number;
    client: {
      id: string;
      name: string;
    };
  };
  quantity: number;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

interface CustomItem {
  id: string;
  description: string;
  unitPrice: number;
  quantity: number;
}

interface CustomGroup {
  id: string;
  type: string; // Name of the custom type
  items: CustomItem[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const equipmentTypeOrder: EquipmentType[] = [
  'ANTI INTRUSION',
  'INCENDIES',
  'VIDEO SURVEILLANCE',
  "CONTROLE D'ACCES",
  'LSB/ELS',
  'GESTION DE CLE',
  'CABLES/ACCESSOIRES'
];

// Define a type for table cells used in the jsPDF autoTable.
// Adjust this type as needed based on the library's expectations.
type StyleValue = string | number | number[];

type TableCell = string | {
  content: string;
  colSpan?: number;
  styles?: Record<string, StyleValue>;
};
const Devis = () => {
  // Data fetching via SWR
  const { data: movements, error, isLoading } = useSWR<Movement[]>('/api/movements', fetcher);
  const { data: clients } = useSWR<Client[]>('/api/clients', fetcher);

  // Filter and general info states
  const [selectedClient, setSelectedClient] = useState<string>('ALL');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<EquipmentType | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [objet, setObjet] = useState<string>(''); // New input for Objet

  // State for custom groups (each with its own custom items)
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);
  const [newGroupType, setNewGroupType] = useState<string>('');

  // Instead of a single active form, use an object to store new item form values per group.
  const [groupNewItem, setGroupNewItem] = useState<
    Record<
      string,
      {
        description: string;
        unitPrice: string;
        quantity: string;
      }
    >
  >({});

  const equipmentTypeOptions = [
    { value: 'ALL', label: 'Tous les équipements' },
    ...equipmentTypeOrder.map((type) => ({ value: type, label: type }))
  ];

  const clientOptions = [
    { value: 'ALL', label: 'Tous les clients' },
    ...(clients?.map((client) => ({ value: client.id, label: client.name })) || [])
  ];

  // Filter movements based on selected filters
  const filteredMovements = movements?.filter((movement) => {
    const matchesClient =
      selectedClient === 'ALL' || movement.equipment.client.id === selectedClient;
    const matchesEquipmentType =
      selectedEquipmentType === 'ALL' || movement.equipment.type === selectedEquipmentType;
    const movementDate = new Date(movement.created_at);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const matchesDate = (!start || movementDate >= start) && (!end || movementDate <= end);

    return matchesClient && matchesEquipmentType && matchesDate;
  }) || [];

  const groupedMovements = filteredMovements.reduce((acc, movement) => {
    const type = movement.equipment.type;
    if (!acc[type]) {
      acc[type] = {
        movements: [] as Movement[],
        subtotal: 0
      };
    }
    acc[type].movements.push(movement);
    acc[type].subtotal += movement.equipment.price * movement.quantity;
    return acc;
  }, {} as Record<EquipmentType, { movements: Movement[]; subtotal: number }>);

  const sortedGroups = Object.entries(groupedMovements).sort(
    ([a], [b]) =>
      equipmentTypeOrder.indexOf(a as EquipmentType) -
      equipmentTypeOrder.indexOf(b as EquipmentType)
  );

  const grandTotalMovements = sortedGroups.reduce(
    (sum, [_, group]) => sum + group.subtotal,
    0
  );

  // Calculate total for custom groups
  const customGroupsTotal = customGroups.reduce((groupSum, group) => {
    const subtotal = group.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    return groupSum + subtotal;
  }, 0);

  const grandTotal = grandTotalMovements + customGroupsTotal;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Create a new custom group (type)
  const handleAddCustomGroup = () => {
    if (!newGroupType.trim()) return;
    const newGroup: CustomGroup = {
      id: uuidv4(),
      type: newGroupType,
      items: []
    };
    setCustomGroups([...customGroups, newGroup]);
    // Initialize the form for that group
    setGroupNewItem((prev) => ({
      ...prev,
      [newGroup.id]: { description: '', unitPrice: '', quantity: '' }
    }));
    setNewGroupType('');
  };

  // Update the new item form for a given group
  const handleGroupNewItemChange = (
    groupId: string,
    field: 'description' | 'unitPrice' | 'quantity',
    value: string
  ) => {
    setGroupNewItem((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [field]: value
      }
    }));
  };

  // Add a new item to the specified custom group
  const handleAddCustomItem = (groupId: string) => {
    const form = groupNewItem[groupId];
    if (!form || !form.description || !form.unitPrice || !form.quantity) return;
    const newItem: CustomItem = {
      id: uuidv4(),
      description: form.description,
      unitPrice: parseFloat(form.unitPrice),
      quantity: parseInt(form.quantity, 10)
    };

    setCustomGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, items: [...group.items, newItem] } : group
      )
    );

    // Reset the form for this group
    setGroupNewItem((prev) => ({
      ...prev,
      [groupId]: { description: '', unitPrice: '', quantity: '' }
    }));
  };

  // Remove a custom item from a specific group
  const handleRemoveCustomItem = (groupId: string, itemId: string) => {
    setCustomGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, items: group.items.filter((item) => item.id !== itemId) }
          : group
      )
    );
  };

  // Remove an entire custom group
  const handleRemoveCustomGroup = (groupId: string) => {
    setCustomGroups((prev) => prev.filter((group) => group.id !== groupId));
    setGroupNewItem((prev) => {
      // Remove the property without using the removed variable
      const { [groupId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleExport = () => {
    // Generate a new devis number on each download.
    const newDevisNumber = 'DEV' + Date.now().toString().slice(-6);
    const doc = new jsPDF();
    const logoUrl = '/LOGO.png';
    const date = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    // --- PDF Header ---
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.addImage(logoUrl, 'PNG', pageWidth - 60, 10, 3300 / 100, 2700 / 100);

    const leftStartY = 50; // adjust as needed
    doc.setFontSize(10);
    doc.text(`Devis N°: ${newDevisNumber}`, 15, leftStartY);
    const projetText =
      selectedClient !== 'ALL' && clients
        ? `Projet: ${clients.find((c) => c.id === selectedClient)?.name || ''}`
        : 'Projet:';
    doc.text(projetText, 15, leftStartY + 7);
    doc.text(`Objet: ${objet}`, 15, leftStartY + 14);
    doc.text(`Casablanca le ${date}`, 15, leftStartY + 21);

    doc.setFontSize(13);
    doc.text('Bordereau des prix', 90, leftStartY + 35);
    doc.setFontSize(10);

    // Use const because the value is never reassigned
    const yPosition = leftStartY + 40;

    // Define table columns and body
    const tableColumns = ['Désignation', 'Prix Unitaire', 'Quantité', 'Total'];
    const tableBody: TableCell[][] = [];

    // Standard equipment groups from API data
    sortedGroups.forEach(([type, group]) => {
      tableBody.push([
        {
          content: type,
          colSpan: 4,
          styles: {
            halign: 'center',
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
          }
        }
      ]);
      group.movements.forEach((movement) => {
        tableBody.push([
          movement.equipment.name,
          formatCurrency(movement.equipment.price),
          movement.quantity.toString(),
          formatCurrency(movement.equipment.price * movement.quantity)
        ]);
      });
    });

    // Custom groups
    customGroups.forEach((group) => {
      if (group.items.length > 0) {
        tableBody.push([
          {
            content: group.type,
            colSpan: 4,
            styles: {
              halign: 'center',
              fillColor: [70, 128, 185],
              textColor: 255,
              fontStyle: 'bold'
            }
          }
        ]);
        group.items.forEach((item) => {
          tableBody.push([
            item.description,
            formatCurrency(item.unitPrice),
            item.quantity.toString(),
            formatCurrency(item.unitPrice * item.quantity)
          ]);
        });
      }
    });

    // Totals rows
    tableBody.push(['', '', 'Total (HT):', formatCurrency(grandTotal)]);
    const tax = grandTotal * 0.20;
    const totalTTC = grandTotal + tax;
    tableBody.push(['', '', 'TVA (20%):', formatCurrency(tax)]);
    tableBody.push(['', '', 'Total TTC:', formatCurrency(totalTTC)]);

    autoTable(doc, {
      startY: yPosition,
      head: [tableColumns],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [70, 70, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 2,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 80, halign: 'left' },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 }
      },
      didParseCell: (data) => {
        if (data.cell.raw === '') {
          data.cell.styles.lineWidth = 0;
        }
        if (data.cell.raw && typeof data.cell.raw === 'string') {
          if (
            data.cell.raw.includes('Total (HT):') ||
            data.cell.raw.includes('TVA (20%):') ||
            data.cell.raw.includes('Total TTC:')
          ) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawPage: () => {
        doc.setFontSize(6);
        doc.text(
          'AFMOS MAROC SARL 37 lotissement la colline 2, résidence California Garden N37-38, Sidi Maarouf, 20 190 Casablanca Maroc',
          45,
          doc.internal.pageSize.getHeight() - 10
        );
        doc.text(
          'Tél 05 22 88 01 70, Fax 05 22 88 01 73',
          80,
          doc.internal.pageSize.getHeight() - 7
        );
        doc.text(
          'Capital social de 48 676 400,00 dhs - ICE: 000221084000015 - IF: 3381181 - RC: 212167 - Patente: 37998325 - CNSS: 7742580',
          45,
          doc.internal.pageSize.getHeight() - 4
        );
      }
    });

    doc.save(`devis-${newDevisNumber}.pdf`);
  };

  if (error)
    return <div className="p-4 text-red-600">Erreur de chargement des données</div>;
  if (isLoading)
    return <div className="p-4 text-gray-600">Chargement en cours...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Création de Devis</h1>

        {/* Filters Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block mb-2 font-medium">Client</label>
            <Select
              options={clientOptions}
              value={clientOptions.find((c) => c.value === selectedClient)}
              onChange={(option) => setSelectedClient(option?.value || 'ALL')}
              classNamePrefix="react-select"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Type d&apos;équipement</label>
            <Select
              options={equipmentTypeOptions}
              value={equipmentTypeOptions.find(
                (e) => e.value === selectedEquipmentType
              )}
              onChange={(option) =>
                setSelectedEquipmentType((option?.value as EquipmentType) || 'ALL')
              }
              classNamePrefix="react-select"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Date de début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setStartDate(e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Date de fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEndDate(e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Objet input */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">Objet</label>
          <input
            type="text"
            value={objet}
            onChange={(e) => setObjet(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Ex: Installation réseau"
          />
        </div>

        {/* Display Table */}
        <table className="w-full mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Équipement / Service</th>
              <th className="p-2 text-right">Prix Unitaire</th>
              <th className="p-2 text-right">Quantité</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedGroups.map(([type, group]) => (
              <Fragment key={type}>
                <tr className="bg-blue-50">
                  <td colSpan={4} className="p-2 font-bold border-t">
                    {type}
                  </td>
                </tr>
                {group.movements.map((movement) => (
                  <tr key={movement.id} className="border-b">
                    <td className="p-2">{movement.equipment.name}</td>
                    <td className="p-2 text-right">
                      {formatCurrency(movement.equipment.price)}
                    </td>
                    <td className="p-2 text-right">{movement.quantity}</td>
                    <td className="p-2 text-right">
                      {formatCurrency(movement.equipment.price * movement.quantity)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="p-2 text-right font-bold">
                    Sous-total {type}
                  </td>
                  <td className="p-2 text-right font-bold">
                    {formatCurrency(group.subtotal)}
                  </td>
                </tr>
              </Fragment>
            ))}

            {customGroups.map((group) => {
              if (group.items.length === 0) return null;
              const groupSubtotal = group.items.reduce(
                (sum, item) => sum + item.unitPrice * item.quantity,
                0
              );
              return (
                <Fragment key={group.id}>
                  <tr className="bg-blue-50">
                    <td colSpan={4} className="p-2 font-bold border-t">
                      {group.type}
                    </td>
                  </tr>
                  {group.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">{item.description}</td>
                      <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-right">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="p-2 text-right font-bold">
                      Sous-total {group.type}
                    </td>
                    <td className="p-2 text-right font-bold">
                      {formatCurrency(groupSubtotal)}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="p-2 text-right font-bold">
                Total (HT)
              </td>
              <td className="p-2 text-right font-bold">{formatCurrency(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>

        <button
          onClick={handleExport}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
        >
          Générer le Devis PDF
        </button>

        {/* Custom Groups Section */}
        <div className="mb-6 border p-4 rounded">
          <h2 className="text-xl font-bold mb-4">Ajouter un nouveau type personnalisé</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Nom du type (ex: Maintenance, Installation)"
              value={newGroupType}
              onChange={(e) => setNewGroupType(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleAddCustomGroup}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Ajouter le type
            </button>
          </div>
          {customGroups.length > 0 && (
            <div className="space-y-6">
              {customGroups.map((group) => (
                <div key={group.id} className="border p-4 rounded">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{group.type}</h3>
                    <button
                      onClick={() => handleRemoveCustomGroup(group.id)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Supprimer ce type
                    </button>
                  </div>
                  {/* New item form for this custom group */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block mb-2">Désignation</label>
                      <input
                        type="text"
                        value={groupNewItem[group.id]?.description || ''}
                        onChange={(e) =>
                          handleGroupNewItemChange(group.id, 'description', e.target.value)
                        }
                        className="w-full p-2 border rounded"
                        placeholder="Ex: Réparation"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Prix Unitaire</label>
                      <input
                        type="number"
                        value={groupNewItem[group.id]?.unitPrice || ''}
                        onChange={(e) =>
                          handleGroupNewItemChange(group.id, 'unitPrice', e.target.value)
                        }
                        className="w-full p-2 border rounded"
                        placeholder="Ex: 1500"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Quantité</label>
                      <input
                        type="number"
                        value={groupNewItem[group.id]?.quantity || ''}
                        onChange={(e) =>
                          handleGroupNewItemChange(group.id, 'quantity', e.target.value)
                        }
                        className="w-full p-2 border rounded"
                        placeholder="Ex: 2"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddCustomItem(group.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
                  >
                    Ajouter l&apos;équipement/service
                  </button>
                  {group.items.length > 0 && (
                    <ul>
                      {group.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex justify-between items-center border-b py-1"
                        >
                          <span>
                            {item.description} - {item.quantity} x {formatCurrency(item.unitPrice)}
                          </span>
                          <button
                            onClick={() => handleRemoveCustomItem(group.id, item.id)}
                            className="text-red-500 hover:underline text-sm"
                          >
                            Supprimer
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Devis;
