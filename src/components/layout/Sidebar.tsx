import { Database, Images, Settings, Users, Server, Tag, Film, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../lib/types';

export type Page = 'assets' | 'admin-agents' | 'admin-invitations' | 'admin-properties' | 'admin-characters' | 'admin-config';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { page: Page; label: string; icon: React.ComponentType<{ className?: string }>; minRole?: UserRole }[] = [
  { page: 'assets', label: 'Assets', icon: Images },
];

const adminItems: { page: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { page: 'admin-agents', label: 'Agents', icon: Server },
  { page: 'admin-invitations', label: 'Invitations', icon: Users },
  { page: 'admin-properties', label: 'Properties', icon: Film },
  { page: 'admin-characters', label: 'Characters', icon: Tag },
  { page: 'admin-config', label: 'Configuration', icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <aside className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Database className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">POPDAM</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavButton
            key={item.page}
            label={item.label}
            Icon={item.icon}
            active={currentPage === item.page}
            onClick={() => onNavigate(item.page)}
          />
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-2">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Admin</span>
            </div>
            {adminItems.map(item => (
              <NavButton
                key={item.page}
                label={item.label}
                Icon={item.icon}
                active={currentPage === item.page}
                onClick={() => onNavigate(item.page)}
              />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg mb-1">
          <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-brand-200">
              {profile?.email?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{profile?.email}</p>
            <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function NavButton({
  label,
  Icon,
  active,
  onClick,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg transition-colors ${
        active
          ? 'bg-brand-600/20 text-brand-300 font-medium'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
      {active && <ChevronRight className="w-3 h-3 ml-auto" />}
    </button>
  );
}
