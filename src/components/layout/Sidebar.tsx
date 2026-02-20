import { Images, Settings, Users, Server, Tag, Film, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../lib/types";

export type Page = "assets" | "admin-agents" | "admin-invitations" | "admin-properties" | "admin-characters" | "admin-config";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { page: Page; label: string; icon: React.ComponentType<{ className?: string }>; minRole?: UserRole }[] = [
  { page: "assets", label: "Assets", icon: Images },
];

const adminItems: { page: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { page: "admin-agents", label: "Agents", icon: Server },
  { page: "admin-invitations", label: "Invitations", icon: Users },
  { page: "admin-properties", label: "Properties", icon: Film },
  { page: "admin-characters", label: "Characters", icon: Tag },
  { page: "admin-config", label: "Configuration", icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === "admin";
  const initials = profile?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <aside className="w-[220px] flex-shrink-0 bg-slate-900 border-r border-slate-800/80 flex flex-col h-screen sticky top-0 select-none">
      <div className="px-4 py-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="font-semibold text-[13px] tracking-tight text-slate-100">POPDAM</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map(item => (
            <NavButton
              key={item.page}
              label={item.label}
              Icon={item.icon}
              active={currentPage === item.page}
              onClick={() => onNavigate(item.page)}
            />
          ))}
        </div>

        {isAdmin && (
          <div className="mt-5">
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Admin</p>
            <div className="space-y-0.5">
              {adminItems.map(item => (
                <NavButton
                  key={item.page}
                  label={item.label}
                  Icon={item.icon}
                  active={currentPage === item.page}
                  onClick={() => onNavigate(item.page)}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-slate-800/80 p-3 space-y-0.5">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-brand-700/60 border border-brand-600/30 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-brand-200">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-slate-200 truncate leading-tight">{profile?.email}</p>
            <p className="text-[10px] text-slate-600 capitalize leading-tight mt-0.5">{profile?.role ?? "viewer"}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[12px] text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
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
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-lg transition-all duration-150 ${
        active
          ? "bg-brand-600/15 text-brand-300 font-medium ring-1 ring-brand-600/20"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-brand-400" : ""}`} />
      {label}
    </button>
  );
}
