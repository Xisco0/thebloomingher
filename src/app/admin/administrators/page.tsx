'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Eye,
  History,
  AlertTriangle,
  UserCheck,
  UserX,
  Lock,
  Phone,
  Mail,
  Shield,
} from 'lucide-react';
import { AdminUser, Role, AdminStatus } from '@/types/auth.types';
import { TeamSubNav } from '@/components/admin/subnav/TeamSubNav';

export default function AdministratorsPage() {
  const [mounted, setMounted] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected Admin for modal actions
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [adminActivity, setAdminActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role_id: '',
    phone: '',
  });

  // Success Temporary Password Reveal Modal
  const [createdCredential, setCreatedCredential] = useState<{
    email: string;
    fullName: string;
    temporaryPassword: string;
    isReset?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Status message
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedRole !== 'all') queryParams.set('role', selectedRole);
      if (selectedStatus !== 'all') queryParams.set('status', selectedStatus);
      if (searchQuery) queryParams.set('search', searchQuery);

      const res = await fetch(`/api/admin/administrators?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data || []);
        if (data.roles) setRoles(data.roles);
      } else {
        setMessage({ text: data.error || 'Failed to fetch administrators', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error connecting to server', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (data.success) {
        setRoles(data.data || []);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [selectedRole, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdmins();
  };

  // Open Add Admin Modal
  const handleOpenAddModal = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      role_id: roles[0]?.id || 'role-admin',
      phone: '',
    });
    setIsAddModalOpen(true);
  };

  // Create Administrator
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/administrators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create administrator');
      }

      setIsAddModalOpen(false);
      setCreatedCredential({
        email: data.data.email,
        fullName: data.data.full_name,
        temporaryPassword: data.temporaryPassword,
        isReset: false,
      });
      fetchAdmins();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Admin Modal
  const handleOpenEditModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setFormData({
      first_name: admin.first_name || admin.full_name.split(' ')[0] || '',
      last_name: admin.last_name || admin.full_name.split(' ').slice(1).join(' ') || '',
      email: admin.email,
      role_id: admin.role_id || '',
      phone: admin.phone || '',
    });
    setIsEditModalOpen(true);
  };

  // Update Administrator
  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/administrators/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          role_id: formData.role_id,
          phone: formData.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update administrator');
      }

      setIsEditModalOpen(false);
      setMessage({ text: 'Administrator profile updated successfully.', type: 'success' });
      fetchAdmins();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Toggle Status (Active / Inactive / Suspended)
  const handleStatusChange = async (adminId: string, newStatus: AdminStatus) => {
    try {
      const res = await fetch(`/api/admin/administrators/${adminId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      setMessage({ text: `Administrator status set to '${newStatus}'.`, type: 'success' });
      fetchAdmins();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  // Open Reset Password Dialog
  const handleOpenResetModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setIsResetModalOpen(true);
  };

  // Execute Password Reset
  const handleExecuteReset = async () => {
    if (!selectedAdmin) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/administrators/${selectedAdmin.id}/reset-password`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setIsResetModalOpen(false);
      setCreatedCredential({
        email: selectedAdmin.email,
        fullName: selectedAdmin.full_name,
        temporaryPassword: data.temporaryPassword,
        isReset: true,
      });
      fetchAdmins();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // View Activity Logs
  const handleOpenActivityModal = async (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setIsActivityModalOpen(true);
    setLoadingActivity(true);
    try {
      const res = await fetch(`/api/admin/administrators/${admin.id}`);
      const data = await res.json();
      if (data.success) {
        setAdminActivity(data.activity || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Delete Admin
  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/administrators/${selectedAdmin.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete administrator');
      }

      setIsDeleteModalOpen(false);
      setMessage({ text: 'Administrator removed successfully.', type: 'success' });
      fetchAdmins();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Role Color Badges
  const getRoleBadge = (roleName: string, slug?: string) => {
    if (slug === 'super_admin' || roleName.toLowerCase().includes('super')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (slug === 'admin' || roleName.toLowerCase().includes('administrator')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (slug === 'staff' || roleName.toLowerCase().includes('staff')) {
      return 'bg-teal-50 text-teal-700 border-teal-200';
    }
    if (slug === 'marketing_manager' || roleName.toLowerCase().includes('marketing')) {
      return 'bg-pink-50 text-pink-700 border-pink-200';
    }
    if (slug === 'product_manager' || roleName.toLowerCase().includes('product')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (slug === 'order_manager' || roleName.toLowerCase().includes('order')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const totalCount = admins.length;
  const activeCount = admins.filter(a => a.status === 'active').length;
  const inactiveCount = admins.filter(a => a.status === 'inactive').length;
  const suspendedCount = admins.filter(a => a.status === 'suspended').length;

  return (
    <div className="space-y-6">
      <TeamSubNav />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-light text-brand rounded-full text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Team Management</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-text-main">
            Staff
          </h1>
          <p className="text-xs text-text-muted mt-1 max-w-2xl">
            Manage people on your team who have access to your store dashboard.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Global Notification */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-text-muted hover:text-text-main">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-text-muted font-bold block">Total Admins</span>
            <span className="text-xl font-bold text-text-main">{totalCount}</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-text-muted font-bold block">Active</span>
            <span className="text-xl font-bold text-emerald-600">{activeCount}</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-text-muted font-bold block">Suspended</span>
            <span className="text-xl font-bold text-amber-600">{suspendedCount}</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-text-muted font-bold block">Deactivated</span>
            <span className="text-xl font-bold text-text-muted">{inactiveCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-surface-muted border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="py-2 px-3 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand"
          >
            <option value="all">All Roles</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="py-2 px-3 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={fetchAdmins}
            className="p-2 text-text-muted hover:text-brand hover:bg-surface-muted rounded-xl transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Administrators Table */}
      <div className="bg-surface border border-border rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
            <span>Loading administrators...</span>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto text-text-muted/40 mb-3" />
            <h3 className="font-display font-bold text-sm text-text-main">No administrators found</h3>
            <p className="text-xs text-text-muted mt-1">Try adjusting your search criteria or add a new admin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60 text-text-muted font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-5">Administrator</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Password Status</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {admins.map(admin => (
                  <tr key={admin.id} className="hover:bg-surface-muted/40 transition-colors">
                    {/* Admin Profile */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-light text-brand font-bold text-xs flex items-center justify-center border border-brand/20 flex-shrink-0">
                          {admin.first_name?.[0] || admin.full_name?.[0] || 'A'}
                        </div>
                        <div>
                          <span className="font-bold text-text-main block">
                            {admin.full_name}
                          </span>
                          <span className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-text-muted/70" />
                            {admin.email}
                          </span>
                          {admin.phone && (
                            <span className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-text-muted/70" />
                              {admin.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${getRoleBadge(
                          admin.role_name,
                          admin.role
                        )}`}
                      >
                        <ShieldCheck className="w-3 h-3 opacity-70" />
                        <span>{admin.role_name}</span>
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      {admin.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active</span>
                        </span>
                      ) : admin.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Suspended</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* Password Status */}
                    <td className="py-4 px-4">
                      {admin.must_change_password ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Must Change</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Secured</span>
                        </span>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="py-4 px-4 text-text-muted text-[11px]">
                      {admin.last_login_at ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-text-muted/60" />
                          <span>{new Date(admin.last_login_at).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="italic text-text-muted/60">Never logged in</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditModal(admin)}
                          className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                          title="Edit Admin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => handleOpenResetModal(admin)}
                          className="p-1.5 text-text-muted hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Activity Logs */}
                        <button
                          onClick={() => handleOpenActivityModal(admin)}
                          className="p-1.5 text-text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Activity Logs"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {/* Status Toggle Dropdown / Quick Button */}
                        {admin.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(admin.id, 'inactive')}
                            className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Deactivate Account"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(admin.id, 'active')}
                            className="p-1.5 text-text-muted hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Activate Account"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Admin */}
                        <button
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-text-muted hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Admin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD ADMINISTRATOR MODAL */}
      {/* ========================================================================= */}
      {mounted && isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-elevated animate-in fade-in zoom-in-95 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-light text-brand rounded-2xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-main">Add New Administrator</h3>
                  <p className="text-xs text-text-muted">Create administrative credentials and assign role permissions</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-text-muted hover:text-text-main rounded-xl hover:bg-surface-muted transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 mt-5">
              {/* 2-Column Grid for Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-main mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="e.g. Grace"
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-main mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="e.g. Okafor"
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* 2-Column Grid for Email and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-main mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="grace.okafor@thebloomingher.com"
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-main mb-1.5">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+234 812 345 6789"
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Assigned Role */}
              <div>
                <label className="block text-xs font-bold text-text-main mb-1.5">Assigned Role *</label>
                <select
                  value={formData.role_id}
                  onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand font-medium"
                >
                  {roles.length > 0 ? (
                    roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))
                  ) : (
                    <option value="role-admin">Administrator</option>
                  )}
                </select>
              </div>

              {/* Password Rule Notice */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800 text-xs">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Initial Password Policy</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Initial password is automatically generated as <code className="px-1.5 py-0.5 bg-amber-100/90 rounded font-bold">{formData.first_name ? `${formData.first_name.toLowerCase()}123` : '{firstname}123'}</code>. The user will be required to change this password upon their first login.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-surface hover:bg-surface-muted border border-border rounded-xl text-xs font-semibold text-text-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  {saving ? 'Creating Admin...' : 'Create Administrator'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* EDIT ADMINISTRATOR MODAL */}
      {/* ========================================================================= */}
      {mounted && isEditModalOpen && selectedAdmin && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-elevated animate-in fade-in zoom-in-95 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-light text-brand rounded-2xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-main">Edit Administrator</h3>
                  <p className="text-xs text-text-muted">{selectedAdmin.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-text-muted hover:text-text-main rounded-xl hover:bg-surface-muted transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin} className="space-y-4 mt-5">
              {/* 2-Column Grid for Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-main mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-main mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* 2-Column Grid for Role and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-main mb-1.5">Assigned Role *</label>
                  <select
                    value={formData.role_id}
                    onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand font-medium"
                  >
                    {roles.length > 0 ? (
                      roles.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))
                    ) : (
                      <option value="role-admin">Administrator</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-main mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-surface hover:bg-surface-muted border border-border rounded-xl text-xs font-semibold text-text-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* RESET PASSWORD CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {mounted && isResetModalOpen && selectedAdmin && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center">
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-7 w-full max-w-md my-auto max-h-[calc(100dvh-3rem)] overflow-y-auto shadow-elevated animate-in fade-in zoom-in-95">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base text-text-main">
              Reset Password for {selectedAdmin.full_name}?
            </h3>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              This will reset the administrator&apos;s password to the temporary credential{' '}
              <code className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-bold">
                {selectedAdmin.first_name ? `${selectedAdmin.first_name.toLowerCase()}123` : 'admin123'}
              </code>{' '}
              and require them to choose a new password on their next login.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2.5 bg-surface hover:bg-surface-muted border border-border rounded-xl text-xs font-semibold text-text-main"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReset}
                disabled={saving}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                {saving ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* CREATED / RESET CREDENTIAL SUCCESS REVEAL MODAL */}
      {/* ========================================================================= */}
      {mounted && createdCredential && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center">
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-7 w-full max-w-md my-auto max-h-[calc(100dvh-3rem)] overflow-y-auto shadow-elevated animate-in fade-in zoom-in-95 relative">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-lg text-text-main">
                {createdCredential.isReset ? 'Password Reset Successful' : 'Administrator Created'}
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Share this temporary login credential with <strong>{createdCredential.fullName}</strong>.
              </p>
            </div>

            {/* Credential Card */}
            <div className="mt-5 p-4 bg-surface-muted border border-border rounded-2xl space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">Login Email</span>
                <span className="text-xs font-bold text-text-main">{createdCredential.email}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">Temporary Password</span>
                <div className="flex items-center justify-between gap-2 mt-1 bg-surface p-2.5 rounded-xl border border-border">
                  <code className="text-xs font-mono font-bold text-brand">
                    {createdCredential.temporaryPassword}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdCredential.temporaryPassword)}
                    className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-light rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                On first login, the administrator will be forced to change this temporary password before accessing any dashboard tools.
              </span>
            </div>

            <button
              onClick={() => setCreatedCredential(null)}
              className="w-full mt-5 py-3 px-4 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              Done & Close
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* ACTIVITY LOG MODAL */}
      {/* ========================================================================= */}
      {mounted && isActivityModalOpen && selectedAdmin && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-start sm:justify-center">
          <div className="bg-surface border border-border rounded-3xl p-5 sm:p-7 w-full max-w-2xl my-auto shadow-elevated animate-in fade-in zoom-in-95 max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col flex-shrink-0">
            <div className="flex items-center justify-between pb-3.5 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-main">
                    Activity Audit Trail: {selectedAdmin.full_name}
                  </h3>
                  <p className="text-[11px] text-text-muted">{selectedAdmin.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="p-2 text-text-muted hover:text-text-main rounded-xl hover:bg-surface-muted"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {loadingActivity ? (
                <div className="p-8 text-center text-xs text-text-muted">Loading activity logs...</div>
              ) : adminActivity.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-muted">
                  No recorded activity yet for this administrator.
                </div>
              ) : (
                adminActivity.map((log: any) => (
                  <div key={log.id} className="p-3.5 bg-surface-muted border border-border/80 rounded-2xl flex items-start justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-text-main block">{log.action}</span>
                      <span className="text-[11px] text-text-muted">
                        Resource: <span className="font-medium text-text-body">{log.resource}</span>
                      </span>
                      {log.details && (
                        <pre className="mt-1 p-2 bg-surface border border-border/60 rounded-lg text-[10px] text-text-muted font-mono overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="text-[10px] text-text-muted whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3.5 border-t border-border flex justify-end flex-shrink-0">
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="px-5 py-2.5 bg-surface hover:bg-surface-muted border border-border rounded-xl text-xs font-semibold text-text-main"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {mounted && isDeleteModalOpen && selectedAdmin && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center">
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-7 w-full max-w-md my-auto max-h-[calc(100dvh-3rem)] overflow-y-auto shadow-elevated animate-in fade-in zoom-in-95">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base text-text-main">
              Remove Administrator Access?
            </h3>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              Are you sure you want to completely remove <strong>{selectedAdmin.full_name}</strong> ({selectedAdmin.email})? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 bg-surface hover:bg-surface-muted border border-border rounded-xl text-xs font-semibold text-text-main"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAdmin}
                disabled={saving}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                {saving ? 'Deleting...' : 'Delete Admin'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
