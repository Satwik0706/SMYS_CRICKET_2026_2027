import React, { useState } from 'react';
import {
  Settings,
  RotateCcw,
  ShieldAlert,
  CheckCircle,
  Database,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Save,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useTournamentStore } from '../../hooks/useTournamentStore';

export const AdminSettings: React.FC = () => {
  const store = useTournamentStore();

  // Admin Credentials State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newAdminId, setNewAdminId] = useState(store.adminId);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [credMessage, setCredMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setCredMessage(null);

    if (!currentPassword) {
      setCredMessage({ type: 'error', text: 'Please enter your current admin password.' });
      return;
    }
    if (!newAdminId.trim()) {
      setCredMessage({ type: 'error', text: 'Admin ID cannot be empty.' });
      return;
    }
    if (!newPassword) {
      setCredMessage({ type: 'error', text: 'Please enter a new password.' });
      return;
    }
    if (newPassword.length < 4) {
      setCredMessage({ type: 'error', text: 'New password must be at least 4 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setCredMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    const res = store.updateAdminCredentials(currentPassword, newAdminId.trim(), newPassword);
    if (res.success) {
      setCredMessage({ type: 'success', text: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setCredMessage({ type: 'error', text: res.message });
    }
  };

  const handleResetData = () => {
    if (
      confirm(
        'Are you sure you want to restore the default SMYS Intra Hostel Cricket dataset? This will clear temporary bids and reset team balances.'
      )
    ) {
      store.resetToDefaultData();
      alert('Tournament dataset reset to official initial state.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>System Maintenance & Security</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Administrator System Settings</h2>
          <p className="text-xs text-slate-500">
            Manage admin security credentials, audit configurations, state maintenance, and demo data reset controls.
          </p>
        </div>
      </div>

      {/* Admin Credentials & Access Management Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-electric/10 text-electric flex items-center justify-center shadow-sm">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Admin Portal Login ID & Password
              </h3>
              <p className="text-xs text-slate-500">
                Change the ID and password used to unlock and access the Administrator Control Centre.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <Lock className="w-3.5 h-3.5 text-royal" />
            <span>Current ID: <strong className="font-mono text-electric">{store.adminId}</strong></span>
          </div>
        </div>

        {credMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs font-bold border flex items-center space-x-2 animate-fadeIn ${
              credMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-red-50 text-red-800 border-red-300'
            }`}
          >
            {credMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{credMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateCredentials} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                New Admin Login ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newAdminId}
                onChange={(e) => setNewAdminId(e.target.value)}
                placeholder="e.g. admin or smys_admin"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-electric"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                The username/ID you will enter at the common gateway portal dropdown.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Current Admin Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password to verify"
                  className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-electric"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Required for security verification before saving changes.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                New Admin Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 4 characters"
                  className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-electric"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-electric"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Admin credentials are protected and updated instantly.</span>
            </span>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-electric hover:bg-electric-hover text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & Update Admin Credentials</span>
            </button>
          </div>
        </form>
      </div>

      {/* Demo & Test Data Management */}
      <div className="bg-gradient-to-r from-midnight-900 to-deepBlue p-6 rounded-2xl border border-slate-700 text-white shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-gold font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Demo & Instant Testing Utility</span>
        </div>
        <h3 className="text-base font-extrabold text-white">
          One-Click Sample Tournament Dataset
        </h3>
        <p className="text-xs text-slate-300">
          Instantly load 4 participating franchises (Strikers, Titans, Warriors, Royals) and 6 verified superstar candidates with photos and career stats. Perfect for testing live bidding, hammer strikes, and projector broadcasts in seconds.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => {
              store.loadDemoData();
              alert('Loaded 4 sample teams and 6 verified players! You can now test live bidding immediately.');
            }}
            className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center space-x-2 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
            <span>Load Sample Tournament Data</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Clear all data to a 100% empty slate?')) {
                store.resetToDefaultData();
                alert('Database cleared to 100% empty state.');
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-2 border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear to Empty Slate</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-2 text-red-600 font-bold text-sm">
          <ShieldAlert className="w-5 h-5" />
          <span>Auction Session Reset</span>
        </div>
        <p className="text-xs text-slate-600">
          Reset all live bids and sales history while preserving registered players and teams.
        </p>

        <button
          onClick={handleResetData}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Live Bids & Sales</span>
        </button>
      </div>

      {/* Audit Log Full View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Full System Audit Trail ({store.auditLogs.length} events)
        </h3>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">User</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {store.auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-400 font-mono whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-2 px-3 font-bold text-slate-800">{log.action}</td>
                  <td className="py-2 px-3 text-electric font-semibold">{log.performedBy}</td>
                  <td className="py-2 px-3 text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
