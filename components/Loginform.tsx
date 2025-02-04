'use client';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

const LoginForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username')?.toString().trim();
    const password = formData.get('password')?.toString().trim();

    if (!username || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    try {
      const response = await signIn('credentials', {
        redirect: false,
        username,
        password
      });

      if (response?.error) {
        // Using HTML entity for the apostrophe
        setError("Nom d&apos;utilisateur ou mot de passe incorrect.");
      } else {
        router.refresh();
        router.push('/');
      }
    } catch (_error) {  // The unused error parameter is now renamed to _error
      setError('Une erreur inattendue est survenue.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-6 sm:px-8 lg:px-10">
      <div className="max-w-md w-full space-y-6 bg-white p-10 rounded-xl shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Connexion à votre compte</h2>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <span>{error}</span>
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Nom d&apos;utilisateur
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Entrez votre nom d'utilisateur"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Entrez votre mot de passe"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
