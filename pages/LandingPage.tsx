import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const { user, login, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6 animate-fade-in">
        <div className="mb-4">
           {/* Placeholder Logo */}
           <div className="w-20 h-20 bg-eccos-blue rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold">
             E
           </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Reserva de Equipamentos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Colégio Eccos - Sistema de Gestão
        </p>

        <button 
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
          Entrar com Google
        </button>
        
        <p className="text-xs text-gray-500 mt-4">
          Acesso restrito a @colegioeccos.com.br
        </p>
      </div>
    </div>
  );
};
