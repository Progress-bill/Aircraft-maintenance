import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Shield, KeyRound, Check, X, Trash2, Edit2, AlertCircle, CheckCircle2, UserCheck, ShieldAlert } from 'lucide-react';

export default function UserManagement() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'technician',
    status: 'active',
    license_number: ''
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setSuccess(`User ${formData.name} successfully authorized for maintenance access.`);
      setIsAddOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'technician',
        status: 'active',
        license_number: ''
      });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setSuccess(`Account details for ${formData.name} updated.`);
      setIsEditOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser.id) {
      alert('You cannot delete your own administrative account.');
      return;
    }

    if (!window.confirm(`Revoke all maintenance record access for ${user.name} (${user.email})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      setSuccess(`Account for ${user.name} revoked.`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Blank unless admin enters new password
      role: user.role,
      status: user.status,
      license_number: user.license_number || ''
    });
    setIsEditOpen(true);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'engineer':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'inspector':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Personnel Authorization & User Management</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            As the Lead Administrator, you can grant aircraft maintenance record access, assign roles, and manage credentials.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: '',
              email: '',
              password: '',
              role: 'technician',
              status: 'active',
              license_number: ''
            });
            setIsAddOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-aero-600 to-cyan-600 hover:from-aero-500 hover:to-cyan-500 text-white shadow-lg shadow-aero-600/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Authorize New User</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-rose-300 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Active Personnel Roster ({users.length} Authorized Accounts)
          </span>
          <span className="text-xs text-slate-500">Only Admin can manage this directory</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-aero-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading personnel directory...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No personnel accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-6">Name / Identity</th>
                  <th className="py-3 px-6">System Email</th>
                  <th className="py-3 px-6">Assigned Clearance Role</th>
                  <th className="py-3 px-6">License / Cert No.</th>
                  <th className="py-3 px-6">Account Status</th>
                  <th className="py-3 px-6">Last Activity</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-slate-800 text-aero-400 px-1.5 py-0.5 rounded border border-slate-700">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300">{u.email}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${getRoleBadge(u.role)}`}>
                          {u.role === 'admin' && <Shield className="w-3 h-3 text-amber-400" />}
                          {u.role === 'engineer' && <UserCheck className="w-3 h-3 text-cyan-400" />}
                          <span>{u.role}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-400">
                        {u.license_number || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                          u.status === 'active'
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span className="capitalize">{u.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-400 text-[11px]">
                        {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => openEdit(u)}
                          title="Edit Permissions & Password"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-aero-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Revoke Maintenance Access"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-aero-400" />
                <h3 className="font-bold text-white text-base">Grant Maintenance Access</h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Captain David Miller"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-aero-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Aviation Email (Login)</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. dmiller@nero.aero"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-aero-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-aero-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">System Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-aero-500"
                  >
                    <option value="technician">Technician / Mechanic</option>
                    <option value="engineer">Lead Maintenance Engineer</option>
                    <option value="inspector">Airworthiness Inspector</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">License / Cert No.</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="FAA-A&P-12345"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-aero-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-aero-500"
                >
                  <option value="active">Active (Granted Access)</option>
                  <option value="inactive">Inactive / Suspended</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-aero-600 hover:bg-aero-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-aero-600/30"
                >
                  Confirm & Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-aero-400" />
                <h3 className="font-bold text-white text-base">Edit Account Permissions</h3>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-aero-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Aviation Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-aero-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Reset Password <span className="text-[10px] text-slate-500 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="New password (optional)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-aero-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Role Clearance</label>
                  <select
                    value={formData.role}
                    disabled={selectedUser.id === currentUser.id}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-aero-500 disabled:opacity-50"
                  >
                    <option value="technician">Technician / Mechanic</option>
                    <option value="engineer">Lead Maintenance Engineer</option>
                    <option value="inspector">Airworthiness Inspector</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">License / Cert No.</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-aero-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Account Access Status</label>
                <select
                  value={formData.status}
                  disabled={selectedUser.id === currentUser.id}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-aero-500 disabled:opacity-50"
                >
                  <option value="active">Active (Permitted Access)</option>
                  <option value="inactive">Suspended / Revoked Access</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-aero-600 hover:bg-aero-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-aero-600/30"
                >
                  Save Account Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
