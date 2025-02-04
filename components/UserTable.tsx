'use client';
import { useState } from 'react';
import { User } from '@/types';
import useSWR, { mutate as globalMutate } from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const AdminPage = () => {
  const { data: users, error, isLoading } = useSWR<User[]>('/api/users', fetcher);
  const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (error) return <div>Échec du chargement des utilisateurs</div>;
  if (isLoading) return <div>Chargement...</div>;

  const filteredUsers = users?.filter(user => {
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  }) || [];

  const optimisticMutate = async (optimisticData: User[], apiCall: Promise<unknown>) => {
    try {
      globalMutate('/api/users', optimisticData, false);
      await apiCall;
      globalMutate('/api/users');
    } catch (error) {
      globalMutate('/api/users');
      throw error;
    }
  };

  const handleSubmit = async (formData: Partial<User>) => {
    try {
      let apiCall: Promise<unknown>;

      if (isEditing && selectedUser?.id) {
        const optimisticData = users?.map(user =>
          user.id === selectedUser.id ? { ...user, ...formData } : user
        ) || [];

        apiCall = fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        await optimisticMutate(optimisticData, apiCall);
      } else {
        const tempId = `temp-${Date.now()}`;
        const newUser = { ...formData, id: tempId } as User;
        const optimisticData = [...(users || []), newUser];

        apiCall = fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }).then(res => res.json());

        await optimisticMutate(optimisticData, apiCall);
      }

      setShowModal(false);
    } catch (error) {
      console.error('Échec de l&apos;opération :', error);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const optimisticData = users?.filter(user => user.id !== userId) || [];
      const apiCall = fetch(`/api/users/${userId}`, { method: 'DELETE' });
      await optimisticMutate(optimisticData, apiCall);
      setDeleteUserId(null);
    } catch (error) {
      console.error('Échec de la suppression :', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <button
            onClick={() => {
              setSelectedUser({
                id: '',
                username: '',
                role: 'TECHNICIAN',
                created_at: new Date().toISOString()
              });
              setIsEditing(false);
              setShowModal(true);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
          >
            Ajouter un Utilisateur
          </button>
        </div>

        {/* Filtres */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher par nom d'utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 flex-grow"
          />
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tous les rôles</option>
            <option value="ADMIN">Administrateur</option>
            <option value="MODERATOR">Modérateur</option>
            <option value="TECHNICIAN">Technicien</option>
          </select>
        </div>

        {/* Tableau */}
        <div className="border border-gray-100 rounded-xl overflow-x-auto shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Nom d&apos;utilisateur
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Rôle
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Date de création
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full ${
                      user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                      user.role === 'MODERATOR' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'ADMIN' ? 'Administrateur' : 
                       user.role === 'MODERATOR' ? 'Modérateur' : 'Technicien'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setIsEditing(true);
                        setShowModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setDeleteUserId(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun utilisateur trouvé
            </div>
          )}
        </div>

        {/* Modal Ajout/Édition */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold mb-6">
                {isEditing ? "Modifier l&apos;utilisateur" : 'Nouvel Utilisateur'}
              </h2>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSubmit({
                    username: formData.get('username') as string,
                    role: formData.get('role') as User['role'],
                    password: (formData.get('password') as string) || '',
                    id: selectedUser.id,
                    created_at: selectedUser.created_at
                  });
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">Nom d&apos;utilisateur</label>
                  <input
                    name="username"
                    type="text"
                    defaultValue={selectedUser.username}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Mot de passe</label>
                    <input
                      name="password"
                      type="password"
                      required={!isEditing}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Rôle</label>
                  <select
                    name="role"
                    defaultValue={selectedUser.role}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ADMIN">Administrateur</option>
                    <option value="MODERATOR">Modérateur</option>
                    <option value="TECHNICIAN">Technicien</option>
                  </select>
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
                    {isEditing ? 'Enregistrer' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Suppression */}
        {deleteUserId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-medium mb-4">Confirmer la suppression</h3>
              <p className="mb-6">Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteUserId(null)}
                  className="px-5 py-2.5 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    await handleDelete(deleteUserId);
                    setDeleteUserId(null);
                  }}
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

export default AdminPage;
