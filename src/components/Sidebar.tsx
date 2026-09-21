import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  Boxes, 
  BarChart3, 
  ShoppingCart, 
  BellRing, 
  History, 
  Users, 
  FileSpreadsheet, 
  Database,
  Lock,
  X
} from 'lucide-react';

export type ActiveTab = 'catalog' | 'stock-detail' | 'dashboard' | 'reorders' | 'alerts' | 'logs' | 'users' | 'exports';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  needToOrderCount: number;
  activeAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  needToOrderCount,
  activeAlertsCount,
}) => {
  const { permissions, role } = useAuth();

  const inventoryNavItems = [
    {
      id: 'catalog' as ActiveTab,
      label: 'Items',
      icon: Boxes,
      badge: null,
      enabled: true,
    },
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: BarChart3,
      badge: null,
      enabled: true,
    },
    {
      id: 'reorders' as ActiveTab,
      label: 'Orders',
      icon: ShoppingCart,
      badge: needToOrderCount > 0 ? needToOrderCount : null,
      badgeColor: 'bg-amber-500 text-white',
      enabled: true,
    },
    {
      id: 'alerts' as ActiveTab,
      label: 'Low Stock Alerts',
      icon: BellRing,
      badge: activeAlertsCount > 0 ? activeAlertsCount : null,
      badgeColor: 'bg-rose-600 text-white',
      enabled: true,
    },
  ];

  const systemNavItems = [
    {
      id: 'logs' as ActiveTab,
      label: 'Usage History',
      icon: History,
      badge: null,
      enabled: true,
    },
    {
      id: 'users' as ActiveTab,
      label: 'Users',
      icon: Users,
      badge: !permissions.canManageUsers ? 'Admin Only' : null,
      badgeColor: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      enabled: permissions.canManageUsers,
      adminOnly: true,
    },
    {
      id: 'exports' as ActiveTab,
      label: 'Download Reports',
      icon: FileSpreadsheet,
      badge: 'PDF / XLS',
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
      enabled: true,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-72 max-w-[85vw] h-[calc(100dvh-4rem)] overflow-y-auto border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:static lg:h-auto lg:w-64 lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex min-h-full flex-col justify-between p-4 gap-6">
          <div className="space-y-5">
            {/* Mobile Header with close button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 lg:hidden">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Menu
              </span>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                Inventory
              </p>
              <nav className="mt-2 space-y-1">
                {inventoryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 min-h-[44px] text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-600'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== null && (
                        <span className={`ml-2 inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                System
              </p>
              <nav className="mt-2 space-y-1">
                {systemNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isLocked = item.adminOnly && !permissions.canManageUsers;

                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      disabled={isLocked}
                      onClick={() => {
                        if (!isLocked) {
                          onSelectTab(item.id);
                          onClose();
                        }
                      }}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 min-h-[44px] text-xs font-semibold transition-all ${
                        isLocked
                          ? 'cursor-not-allowed opacity-50 text-slate-400 dark:text-slate-600'
                          : isActive
                          ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-600'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isLocked ? (
                          <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                        ) : (
                          <Icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                        )}
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== null && (
                        <span className={`ml-2 inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Database Connected Status */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-white">Database Active</span>
              <span className="ml-auto inline-block h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
              <span>Your Role:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{role}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
