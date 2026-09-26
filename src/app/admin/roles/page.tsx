'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Shield,
  Layers,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { Role, PermissionDefinition } from '@/types/auth.types';

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, PermissionDefinition[]>>({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    permissions: string[];
  }>({
    name: '',
    description: '',
    permissions: [],
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch('/api/admin/permissions'),
      ]);

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      if (rolesData.success) {
        setRoles(rolesData.data || []);
      }
      if (permsData.success) {
        setPermissions(permsData.data || []);
        setGroupedPermissions(permsData.grouped || {});
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to load roles and permissions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const handleOpenAddModal = () => {
    setSelectedRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: ['products.view', 'orders.view'],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions],
    });
    setIsModalOpen(true);
  };

  const togglePermission = (code: string) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(code);
      if (exists) {
        return {
          ...prev,
          permissions: prev.permissions.filter(p => p !== code),
        };
      } else {
        return {
          ...prev,
          permissions: [...prev.permissions, code],
        };
      }
    });
  };

  const toggleModuleAll = (modulePerms: PermissionDefinition[]) => {
    const allCodes = modulePerms.map(p => p.code);
    const hasAll = allCodes.every(code => formData.permissions.includes(code));

    setFormData(prev => {
      if (hasAll) {
        return {
          ...prev,
          permissions: prev.permissions.filter(code => !allCodes.includes(code)),
        };
      } else {
        const unique = Array.from(new Set([...prev.permissions, ...allCodes]));
        return {
          ...prev,
          permissions: unique,
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ text: 'Role name is required.', type: 'error' });
      return;
    }

    if (formData.permissions.length === 0) {
      setMessage({ text: 'Please assign at least one permission to this role.', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const url = selectedRole ? `/api/admin/roles/${selectedRole.id}` : '/api/admin/roles';
      const method = selectedRole ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save role.');
      }

      setIsModalOpen(false);
      setMessage({
        text: selectedRole ? 'Role updated successfully.' : 'Role created successfully.',
        type: 'success',
      });
      fetchRolesAndPermissions();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete role.');
      }

      setIsDeleteModalOpen(false);
      setMessage({ text: 'Role removed successfully.', type: 'success' });
      fetchRolesAndPermissions();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-light text-brand rounded-full text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Access Control Policies</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-text-main">
            Roles & Permissions
          </h1>
          <p className="text-xs text-text-muted mt-1 max-w-2xl">
            Configure system and custom administrative roles, assign modular permissions, and define least-privilege security boundaries.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Custom Role</span>
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

      {/* Roles Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-text-muted bg-surface rounded-3xl border border-border">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
          <span>Loading roles matrix...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map(role => {
            const isWildcard = role.permissions.includes('*');
            const permCount = isWildcard ? permissions.length : role.permissions.length;

            return (
              <div
                key={role.id}
                className="bg-surface border border-border hover:border-brand/40 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-light text-brand flex items-center justify-center font-bold text-xs">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span className="font-display font-bold text-base text-text-main block">
                        {role.name}
                      </span>
                    </div>

                    {role.is_system ? (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-md uppercase tracking-wider">
                        System Default
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-brand-light text-brand text-[10px] font-bold rounded-md uppercase tracking-wider">
                        Custom Role
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-text-muted leading-relaxed min-h-[36px]">
                    {role.description || 'No description provided.'}
                  </p>

                  {/* Metrics Badges */}
                  <div className="mt-4 pt-4 border-t border-border/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-text-body font-semibold">
                      <Users className="w-4 h-4 text-text-muted" />
                      <span>{role.user_count || 0} Admin{(role.user_count || 0) === 1 ? '' : 's'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-brand font-semibold">
                      <Lock className="w-4 h-4" />
                      <span>
                        {isWildcard ? 'Full (All Permissions)' : `${permCount} Permission${permCount === 1 ? '' : 's'}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-6 pt-4 border-t border-border/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-text-muted font-mono">
                    slug: {role.slug}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(role)}
                      className="p-2 text-text-muted hover:text-brand hover:bg-brand-light rounded-xl transition-colors text-xs flex items-center gap-1 font-semibold"
                      title="Edit Permissions"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {!role.is_system && (
                      <button
                        onClick={() => {
                          setSelectedRole(role);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 text-text-muted hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete Role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT ROLE MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 w-full max-w-3xl shadow-elevated animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-brand-light text-brand rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-main">
                    {selectedRole ? `Edit Role: ${selectedRole.name}` : 'Create Custom Role'}
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Assign granular privileges across store features and marketing modules
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-text-muted hover:text-text-main rounded-xl hover:bg-surface-muted"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-main mb-1">Role Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Regional Fulfillment Lead"
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-main mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Handles Lagos order fulfillment and inventory restocks"
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Permissions Checkbox Matrix */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-display font-bold text-sm text-text-main">Module Permissions</h4>
                    <p className="text-[11px] text-text-muted">Select specific abilities granted to members with this role</p>
                  </div>
                  <span className="text-xs font-bold text-brand px-3 py-1 bg-brand-light rounded-full">
                    {formData.permissions.length} Selected
                  </span>
                </div>

                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => {
                    const allSelected = modulePerms.every(p => formData.permissions.includes(p.code));
                    const someSelected = modulePerms.some(p => formData.permissions.includes(p.code)) && !allSelected;

                    return (
                      <div
                        key={moduleName}
                        className="p-4 bg-surface-muted border border-border/80 rounded-2xl space-y-3"
                      >
                        {/* Module Header with Select All */}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-text-main">{moduleName}</span>
                          <button
                            type="button"
                            onClick={() => toggleModuleAll(modulePerms)}
                            className="text-[11px] font-semibold text-brand hover:underline flex items-center gap-1"
                          >
                            {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
                          </button>
                        </div>

                        {/* Permission Checkboxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {modulePerms.map(perm => {
                            const isChecked = formData.permissions.includes(perm.code);
                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-brand/5 border-brand/40 text-brand'
                                    : 'bg-surface border-border hover:border-border/80 text-text-body'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(perm.code)}
                                  className="mt-0.5 rounded border-border text-brand focus:ring-brand"
                                />
                                <div className="text-xs leading-tight">
                                  <span className="font-bold block">{perm.name}</span>
                                  <span className="text-[10px] text-text-muted font-mono">{perm.code}</span>
                                  <p className="text-[10px] text-text-muted mt-0.5 leading-snug">
                                    {perm.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-surface hover:bg-surface-muted border border-border rounded-xl text-xs font-semibold text-text-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  {saving ? 'Saving Role...' : selectedRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE ROLE MODAL */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && selectedRole && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-elevated animate-in fade-in zoom-in-95">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base text-text-main">
              Delete Role: {selectedRole.name}?
            </h3>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              Are you sure you want to permanently delete this role? Any administrators assigned to it must be reassigned first.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 bg-surface hover:bg-surface-muted border border-border rounded-xl text-xs font-semibold text-text-main"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRole}
                disabled={saving}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                {saving ? 'Deleting...' : 'Delete Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
