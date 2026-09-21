import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Lock, 
  ShieldAlert,
  KeyRound
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Partial<User> & { password?: string }) => Promise<void>;
  onUpdateUser: (id: string, user: Partial<User>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const { user: currentUser, permissions } = useAuth();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('technician');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  if (!permissions.canManageUsers) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/30">
        <Lock className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-3 text-base font-bold text-rose-900 dark:text-rose-200">
          Admin Access Required
        </h2>
        <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">
          Only Admin users can view or manage user accounts.
        </p>
      </div>
    );
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name || !email) {
      setFormError('Please fill in both name and email.');
      return;
    }

    try {
      await onAddUser({
        name,
        email,
        role,
        department: department || 'Robotics Division',
        password,
      });
      setAddModalOpen(false);
      setName('');
      setEmail('');
      setRole('technician');
      setDepartment('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            User Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Add and manage user accounts and their assigned roles.
          </p>
        </div>

        <button
          id="open-add-user-btn"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px] text-slate-500 sm:hidden dark:border-slate-800 dark:bg-slate-800/40">
          <span>Scroll horizontally to view all user info</span>
          <span className="text-slate-400">&rarr;</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Role & Access Level</th>
                <th className="py-3 px-3">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {u.name} {isSelf && <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">(You)</span>}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">{u.email}</td>
                    <td className="py-3 px-3">{u.department}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                        u.role === 'admin'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                          : u.role === 'manager'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                          : u.role === 'technician'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        <ShieldCheck className="h-3 w-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isSelf ? (
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Active Session</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Role Permission Matrix
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Granular enforcement of privileges per system role
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
              <tr>
                <th className="py-2.5 px-3">System Permission</th>
                <th className="py-2.5 px-3 text-center">Admin</th>
                <th className="py-2.5 px-3 text-center">Manager</th>
                <th className="py-2.5 px-3 text-center">Technician</th>
                <th className="py-2.5 px-3 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: 'View Catalog & Inventory Cards', admin: true, manager: true, tech: true, viewer: true },
                { name: 'Log Part Usage / Consume Stock', admin: true, manager: true, tech: true, viewer: false },
                { name: 'Restock Incoming Parts', admin: true, manager: true, tech: false, viewer: false },
                { name: 'Authorize Reorders & POs', admin: true, manager: true, tech: false, viewer: false },
                { name: 'Create & Edit Item SKUs', admin: true, manager: true, tech: false, viewer: false },
                { name: 'Resolve Inventory Alerts', admin: true, manager: true, tech: false, viewer: false },
                { name: 'Delete Part SKUs', admin: true, manager: false, tech: false, viewer: false },
                { name: 'Manage Users & Roles (RBAC)', admin: true, manager: false, tech: false, viewer: false },
                { name: 'Export Reports (PDF, CSV, Excel)', admin: true, manager: true, tech: true, viewer: true },
              ].map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{p.name}</td>
                  <td className="py-2.5 px-3 text-center">
                    {p.admin ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <X className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-600" />}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {p.manager ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <X className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-600" />}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {p.tech ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <X className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-600" />}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {p.viewer ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <X className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-600" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New User</h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Liam Sterling"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. liam@toprun.com"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Role & Security Level</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="technician">Technician (Can consume parts & view)</option>
                  <option value="manager">Manager (Can edit, restock & reorder)</option>
                  <option value="admin">Administrator (Full system & user access)</option>
                  <option value="viewer">Viewer (Read-only catalog & reports)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Field Robotics & Maintenance"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Initial Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
