import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import AssetsPage from './pages/AssetsPage';
import AgentsPage from './pages/admin/AgentsPage';
import InvitationsPage from './pages/admin/InvitationsPage';
import PropertiesPage from './pages/admin/PropertiesPage';
import CharactersPage from './pages/admin/CharactersPage';
import ConfigPage from './pages/admin/ConfigPage';
import Sidebar, { type Page } from './components/layout/Sidebar';

function AppShell() {
  const { session, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [currentPage, setCurrentPage] = useState<Page>('assets');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    if (authView === 'signup') {
      return <SignUpPage onShowLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onShowSignUp={() => setAuthView('signup')} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {currentPage === 'assets' && <AssetsPage />}
        {currentPage === 'admin-agents' && <AgentsPage />}
        {currentPage === 'admin-invitations' && <InvitationsPage />}
        {currentPage === 'admin-properties' && <PropertiesPage />}
        {currentPage === 'admin-characters' && <CharactersPage />}
        {currentPage === 'admin-config' && <ConfigPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
