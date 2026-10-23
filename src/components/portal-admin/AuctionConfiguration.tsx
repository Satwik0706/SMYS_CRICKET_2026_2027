import React, { useState } from 'react';
import {
  Sliders,
  Save,
  Plus,
  Trash2,
  Clock,
  RotateCcw,
  ShieldCheck,
  IndianRupee,
  Layers,
} from 'lucide-react';
import { AuctionTier } from '../../types';
import { useTournamentStore } from '../../hooks/useTournamentStore';

export const AuctionConfiguration: React.FC = () => {
  const store = useTournamentStore();

  const [title, setTitle] = useState(store.config.title);
  const [subtitle, setSubtitle] = useState(store.config.subtitle);
  const [date, setDate] = useState(store.config.date);
  const [timerSeconds, setTimerSeconds] = useState(store.config.timerSeconds);
  const [unsoldRule, setUnsoldRule] = useState(store.config.unsoldRecallRule);
  const [allowPublicQueue, setAllowPublicQueue] = useState(store.config.allowPublicQueue);

  // Tiers copy for editing
  const [tiers, setTiers] = useState<AuctionTier[]>([...store.tiers]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdateTier = (id: string, updates: Partial<AuctionTier>) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleAddTier = () => {
    const newTier: AuctionTier = {
      id: `tier-${Date.now()}`,
      name: `Tier ${tiers.length + 1} — Custom`,
      minRating: 4.0,
      maxRating: 6.0,
      minBid: 5000000,
      bidIncrement: 200000,
      priority: tiers.length + 1,
      badgeColor: 'bg-indigo-500 text-white border-indigo-400',
    };
    setTiers([...tiers, newTier]);
  };

  const handleDeleteTier = (id: string) => {
    if (tiers.length <= 1) {
      alert('Must maintain at least one auction tier!');
      return;
    }
    setTiers(tiers.filter((t) => t.id !== id));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateConfig({
      title,
      subtitle,
      date,
      timerSeconds: Number(timerSeconds),
      unsoldRecallRule: unsoldRule,
      allowPublicQueue,
    });
    store.updateTiers(tiers);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-electric font-bold text-xs uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Auction Rules & Tier Engine</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Auction Engine Configuration</h2>
          <p className="text-xs text-slate-500">
            Define player rating thresholds, opening bids, increments, timer pacing, and unsold recall behavior.
          </p>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-electric hover:bg-electric-hover text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save All Settings</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 flex items-center space-x-2 animate-fadeIn">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Auction configurations and tier definitions updated successfully!</span>
        </div>
      )}

      {/* General Auction Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          General Tournament Info & Timing
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tournament Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-electric"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Subtitle / Host</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-electric"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Auction Date</label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-electric"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Bid Countdown Clock (Seconds)
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                min="10"
                max="120"
                value={timerSeconds}
                onChange={(e) => setTimerSeconds(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-electric"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Unsold Players Rule</label>
            <select
              value={unsoldRule}
              onChange={(e) => setUnsoldRule(e.target.value as 'immediate' | 'end_of_round' | 'manual')}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-electric bg-white"
            >
              <option value="end_of_round">Recall at End of Round (Recommended)</option>
              <option value="immediate">Immediate Re-auction</option>
              <option value="manual">Manual Recall by Auctioneer</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Upcoming Queue Visibility</label>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="publicQueueCheck"
                checked={allowPublicQueue}
                onChange={(e) => setAllowPublicQueue(e.target.checked)}
                className="w-4 h-4 rounded text-electric focus:ring-electric"
              />
              <label htmlFor="publicQueueCheck" className="text-slate-700 font-semibold cursor-pointer">
                Show Upcoming Queue on Public Broadcast
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Definitions & Minimum Bids */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Player Tier Definitions & Pricing Formulas
            </h3>
            <p className="text-xs text-slate-500">
              Players automatically qualify for tiers based on highest self-rating or admin evaluation.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddTier}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Tier</span>
          </button>
        </div>

        <div className="space-y-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
            >
              <div className="sm:col-span-3">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Tier Name
                </label>
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => handleUpdateTier(tier.id, { name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Rating Range (Min - Max)
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={tier.minRating}
                    onChange={(e) => handleUpdateTier(tier.id, { minRating: Number(e.target.value) })}
                    className="w-1/2 p-2 rounded-lg border border-slate-300 text-xs text-center"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={tier.maxRating}
                    onChange={(e) => handleUpdateTier(tier.id, { maxRating: Number(e.target.value) })}
                    className="w-1/2 p-2 rounded-lg border border-slate-300 text-xs text-center"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Opening Base Bid (₹)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={tier.minBid}
                  onChange={(e) => handleUpdateTier(tier.id, { minBid: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold text-electric"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Bid Increment (₹)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={tier.bidIncrement}
                  onChange={(e) => handleUpdateTier(tier.id, { bidIncrement: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold text-royal"
                />
              </div>

              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteTier(tier.id)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete Tier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};
