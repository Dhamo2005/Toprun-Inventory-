import React, { useState } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { PartsCatalog } from './components/PartsCatalog.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ReorderCenter } from './components/ReorderCenter.tsx';
import { AlertsCenter } from './components/AlertsCenter.tsx';
import { AuditLogs } from './components/AuditLogs.tsx';
import { UserManagement } from './components/UserManagement.tsx';
import { ExportReportsView } from './components/ExportReportsView.tsx';
import { StockDetailView } from './components/StockDetailView.tsx';

import { ConsumeStockModal } from './components/modals/ConsumeStockModal.tsx';
import { RestockModal } from './components/modals/RestockModal.tsx';
import { AddEditPartModal } from './components/modals/AddEditPartModal.tsx';
import { PartDetailModal } from './components/modals/PartDetailModal.tsx';
import { DeletePartModal } from './components/modals/DeletePartModal.tsx';
import { LoginModal } from './components/modals/LoginModal.tsx';
import { ErpLoginScreen } from './components/ErpLoginScreen.tsx';

import { api, exportToCSV, exportToExcel, exportToPDF } from './lib/apiClient.ts';
import { SparePart, User } from './types.ts';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 seconds
      refetchOnWindowFocus: false,
    },
  },
});

function MainAppContent() {
  const { user, permissions, isLoginModalOpen, setLoginModalOpen } = useAuth();
  const qc = useQueryClient();

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [selectedPartForConsume, setSelectedPartForConsume] = useState<SparePart | null>(null);
  const [selectedPartForRestock, setSelectedPartForRestock] = useState<SparePart | null>(null);
  const [selectedPartForDetail, setSelectedPartForDetail] = useState<SparePart | null>(null);
  const [selectedPartForEdit, setSelectedPartForEdit] = useState<SparePart | null>(null);
  const [selectedPartForDelete, setSelectedPartForDelete] = useState<SparePart | null>(null);
  const [selectedStockPartId, setSelectedStockPartId] = useState<string | null>(null);
  const [isAddPartOpen, setIsAddPartOpen] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Queries
  const { data: parts = [], isLoading: isPartsLoading, refetch: refetchParts } = useQuery({
    queryKey: ['parts'],
    queryFn: () => api.getParts(),
    enabled: !!user,
  });

  const { data: stats = null, refetch: refetchStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api.getDashboardStats(),
    enabled: !!user,
  });

  const { data: alerts = [], refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.getAlerts(),
    enabled: !!user,
  });

  const { data: logs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['logs'],
    queryFn: () => api.getLogs(),
    enabled: !!user,
  });

  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ['reorders'],
    queryFn: () => api.getReorders(),
    enabled: !!user,
  });

  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    enabled: !!user && permissions.canManageUsers,
  });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['parts'] });
    qc.invalidateQueries({ queryKey: ['dashboardStats'] });
    qc.invalidateQueries({ queryKey: ['alerts'] });
    qc.invalidateQueries({ queryKey: ['logs'] });
    qc.invalidateQueries({ queryKey: ['reorders'] });
  };

  // Action handlers
  const handleConsume = async (partId: string, quantity: number, notes: string) => {
    try {
      await api.consumeStock(partId, quantity, notes);
      showToast(`Successfully recorded consumption of ${quantity} units`);
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to consume stock', 'error');
      throw err;
    }
  };

  const handleRestock = async (partId: string, quantity: number, notes: string) => {
    try {
      await api.restockPart(partId, quantity, notes);
      showToast(`Successfully restocked ${quantity} units`);
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to restock part', 'error');
      throw err;
    }
  };

  const handleSavePart = async (partData: Partial<SparePart>) => {
    try {
      if (selectedPartForEdit) {
        await api.updatePart(selectedPartForEdit.id, partData);
        showToast(`Updated SKU ${partData.partNumber || selectedPartForEdit.partNumber}`);
      } else {
        await api.createPart(partData);
        showToast(`Created new item: ${partData.name}`);
      }
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to save item', 'error');
      throw err;
    }
  };

  const handleConfirmDeletePart = async (id: string) => {
    try {
      await api.deletePart(id);
      showToast('Item deleted successfully');
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete part', 'error');
      throw err;
    }
  };

  const handlePlaceReorder = async (part: SparePart, quantity: number) => {
    try {
      await api.reorderPart(part.id, quantity, part.supplier);
      showToast(`Purchase order requisition generated for ${quantity}x ${part.name}`);
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to place reorder', 'error');
      throw err;
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.updateReorderStatus(orderId, status);
      showToast(`Order status updated to: ${status.toUpperCase()}`);
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      await api.resolveAlert(id);
      showToast('Alert acknowledged and resolved');
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to resolve alert', 'error');
    }
  };

  const handleAddUser = async (userData: Partial<User> & { password?: string }) => {
    try {
      await api.createUser(userData);
      showToast(`Personnel account created for ${userData.name}`);
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
      throw err;
    }
  };

  const handleUpdateUser = async (id: string, userData: Partial<User>) => {
    try {
      await api.updateUser(id, userData);
      showToast('User profile updated');
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
      throw err;
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to remove this user account?')) return;
    try {
      await api.deleteUser(id);
      showToast('User deleted');
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  if (!user) {
    return <ErpLoginScreen />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Toast feedback banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl dark:bg-white dark:text-slate-900 animate-in slide-in-from-top-4 duration-150">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab: ActiveTab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeAlertsCount={alerts.filter(a => !a.isResolved).length}
        needToOrderCount={parts.filter(p => p.needToOrder > 0).length}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          alerts={alerts}
          onOpenAlerts={() => setActiveTab('alerts')}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {activeTab === 'catalog' && (
              <PartsCatalog
                parts={parts}
                isLoading={isPartsLoading}
                onRefresh={refetchParts}
                onSelectPart={(p: SparePart) => setSelectedPartForDetail(p)}
                onOpenAddModal={() => {
                  setSelectedPartForEdit(null);
                  setIsAddPartOpen(true);
                }}
                onOpenEditModal={(p: SparePart) => {
                  setSelectedPartForEdit(p);
                  setIsAddPartOpen(true);
                }}
                onOpenConsumeModal={(p: SparePart) => setSelectedPartForConsume(p)}
                onOpenRestockModal={(p: SparePart) => setSelectedPartForRestock(p)}
                onOpenReorderModal={(p: SparePart) => handlePlaceReorder(p, p.needToOrder || 5)}
                onDeletePart={(p: SparePart) => setSelectedPartForDelete(p)}
              />
            )}

            {activeTab === 'stock-detail' && (
              <StockDetailView
                parts={parts}
                selectedPartId={selectedStockPartId}
                onSelectPartId={(id) => setSelectedStockPartId(id)}
                onRefreshParts={refreshAll}
                onOpenConsumeModal={(p) => setSelectedPartForConsume(p)}
                onOpenRestockModal={(p) => setSelectedPartForRestock(p)}
                onOpenReorderModal={(p) => handlePlaceReorder(p, p.needToOrder || 5)}
                onDeletePart={(p: SparePart) => setSelectedPartForDelete(p)}
              />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard
                stats={stats}
                alerts={alerts}
                logs={logs}
                parts={parts}
                onNavigateToCatalog={() => setActiveTab('catalog')}
                onNavigateToReorders={() => setActiveTab('reorders')}
                onNavigateToAlerts={() => setActiveTab('alerts')}
                onResolveAlert={handleResolveAlert}
                onReorderPart={(p) => handlePlaceReorder(p, p.needToOrder || 5)}
              />
            )}

            {activeTab === 'reorders' && (
              <ReorderCenter
                parts={parts}
                orders={orders}
                onPlaceReorder={handlePlaceReorder}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsCenter
                alerts={alerts}
                onResolveAlert={handleResolveAlert}
                onRefresh={refreshAll}
              />
            )}

            {activeTab === 'logs' && (
              <AuditLogs logs={logs} />
            )}

            {activeTab === 'users' && (
              <UserManagement
                users={users}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
              />
            )}

            {activeTab === 'exports' && (
              <ExportReportsView parts={parts} />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <ConsumeStockModal
        part={selectedPartForConsume}
        isOpen={!!selectedPartForConsume}
        onClose={() => setSelectedPartForConsume(null)}
        onConfirm={handleConsume}
      />

      <RestockModal
        part={selectedPartForRestock}
        isOpen={!!selectedPartForRestock}
        onClose={() => setSelectedPartForRestock(null)}
        onConfirm={handleRestock}
      />

      <AddEditPartModal
        part={selectedPartForEdit}
        isOpen={isAddPartOpen}
        onClose={() => {
          setIsAddPartOpen(false);
          setSelectedPartForEdit(null);
        }}
        onSave={handleSavePart}
      />

      <PartDetailModal
        part={selectedPartForDetail}
        isOpen={!!selectedPartForDetail}
        onClose={() => setSelectedPartForDetail(null)}
        onOpenConsume={(p) => setSelectedPartForConsume(p)}
        onOpenRestock={(p) => setSelectedPartForRestock(p)}
        onOpenReorder={(p) => handlePlaceReorder(p, p.needToOrder || 5)}
        onNavigateToStockDetailPage={(partId) => {
          setSelectedStockPartId(partId);
          setActiveTab('stock-detail');
        }}
      />

      <DeletePartModal
        part={selectedPartForDelete}
        isOpen={!!selectedPartForDelete}
        onClose={() => setSelectedPartForDelete(null)}
        onConfirm={handleConfirmDeletePart}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
