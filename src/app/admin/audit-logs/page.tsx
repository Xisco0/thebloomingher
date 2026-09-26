'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  RefreshCw,
  Search,
  Calendar,
  User,
  Activity,
} from 'lucide-react';
import { AuditLogEntry } from '@/types/cms.types';

export const dynamic = 'force-dynamic';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.admin_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.details && JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Security & Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Immutable log of catalog edits, price changes, stock adjustments, and administrative operations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="self-start sm:self-auto p-2.5 bg-surface hover:bg-surface-muted text-text-muted hover:text-brand border border-border rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-surface p-4 rounded-2xl border border-border/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search action, resource, or details..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main placeholder:text-text-muted focus:outline-brand"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-text-muted uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Resource</th>
                <th className="py-3.5 px-4">Details Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-surface-muted/40 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-4 text-text-muted whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Operator */}
                    <td className="py-3.5 px-4 font-semibold text-text-main">
                      {log.admin_email}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-light text-brand">
                        {log.action}
                      </span>
                    </td>

                    {/* Resource */}
                    <td className="py-3.5 px-4 font-mono text-text-body">
                      {log.resource}
                      {log.resource_id && (
                        <span className="text-text-muted text-[10px] block">#{log.resource_id}</span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="py-3.5 px-4">
                      {log.details ? (
                        <code className="text-[10px] bg-surface-muted px-2 py-1 rounded text-text-body font-mono block max-w-sm truncate">
                          {JSON.stringify(log.details)}
                        </code>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
