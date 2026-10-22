import React, { useState } from 'react';
import { Trophy, CheckCircle, UserX, IndianRupee, Users, Shield, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';
import { useTournamentStore } from '../../hooks/useTournamentStore';
import { SaleRecord } from '../../types';

export const AuctionSummary: React.FC = () => {
  const store = useTournamentStore();
  const [refundingSale, setRefundingSale] = useState<SaleRecord | null>(null);

  const totalSpend = store.sales.reduce((sum, s) => sum + s.finalPrice, 0);
  const highestSale = store.sales.length > 0 ? Math.max(...store.sales.map((s) => s.finalPrice)) : 0;
  const highestPlayer = store.sales.find((s) => s.finalPrice === highestSale);

  const unsoldCount = store.players.filter(
    (p) => p.status === 'verified' && !store.sales.some((s) => s.playerId === p.id)
  ).length;

  const handleCancelSaleAndRefund = (sale: SaleRecord) => {
    store.cancelSaleAndRefund(sale.playerId);
    setRefundingSale(null);
  };

  const handleDeletePlayerAndRefund = (sale: SaleRecord) => {
    store.deletePlayer(sale.playerId);
    setRefundingSale(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-gold-dark font-bold text-xs uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" />
            <span>Official Tournament Summary Ledger</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Auction Results & Final Roster</h2>
          <p className="text-xs text-slate-500">
            Comprehensive audit of all player acquisitions, team expenditure, and unsold players.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Total Spent</span>
            <span className="text-sm font-black text-slate-900">
              ₹{totalSpend.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
            <span className="text-amber-700 font-bold block text-[10px] uppercase">Top Buy</span>
            <span className="text-sm font-black text-amber-900">
              ₹{highestSale.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Highest Sold Marquee Card */}
      {highestPlayer && (
        <div className="bg-gradient-to-r from-midnight via-deepBlue to-midnight-800 rounded-2xl p-6 text-white border-2 border-gold/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={highestPlayer.playerPhoto}
              alt={highestPlayer.playerName}
              className="w-16 h-16 rounded-xl object-cover border-2 border-gold shadow-md"
            />
            <div>
              <span className="text-[10px] bg-gold text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                ★ Most Expensive Player of Tournament
              </span>
              <h3 className="text-xl font-black mt-1">{highestPlayer.playerName}</h3>
              <p className="text-xs text-slate-300">
                Purchased by <strong>{highestPlayer.teamName}</strong> • {highestPlayer.playerRole}
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <span className="text-xs text-gold uppercase font-bold block">Winning Bid</span>
            <span className="text-2xl sm:text-3xl font-black font-display text-white">
              ₹{highestPlayer.finalPrice.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Complete Sales Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Confirmed Player Sales ({store.sales.length})</h3>
            <p className="text-xs text-slate-400 mt-0.5">Admin can delete or cancel any sale to automatically refund the purchasing franchise.</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time ledger</span>
        </div>

        {store.sales.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-bold text-slate-600">No players finalized yet</p>
            <p className="text-xs mt-1">Confirmed sales will appear chronologically here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Role & Tier</th>
                  <th className="py-3 px-4">Purchased By</th>
                  <th className="py-3 px-4">Sale Price</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {store.sales.map((sale, idx) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={sale.playerPhoto}
                          alt={sale.playerName}
                          className="w-9 h-9 rounded-lg object-cover border"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{sale.playerName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{sale.regNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-electric block">{sale.playerRole}</span>
                      <span className="text-[10px] text-slate-400">{sale.playerTier}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                        <span>{sale.teamLogo}</span>
                        <span>{sale.teamName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 text-sm">
                      ₹{sale.finalPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {sale.soldAt}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setRefundingSale(sale)}
                        className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] border border-red-200 transition-colors inline-flex items-center space-x-1"
                        title="Delete player or cancel purchase with automatic team refund"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete / Refund</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team-by-Team Squad Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {store.teams.map((team) => {
          const teamSales = store.sales.filter((s) => s.teamId === team.id);

          return (
            <div key={team.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{team.logo}</span>
                  <div>
                    <h4 className="font-bold text-slate-900">{team.name}</h4>
                    <p className="text-[11px] text-slate-400">
                      Spent ₹{team.spentPurse.toLocaleString('en-IN')} • Remaining: ₹{team.remainingPurse.toLocaleString('en-IN')} • {teamSales.length} players
                    </p>
                  </div>
                </div>
              </div>

              {teamSales.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No players acquired</p>
              ) : (
                <div className="space-y-2">
                  {teamSales.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <img
                          src={item.playerPhoto}
                          alt={item.playerName}
                          className="w-7 h-7 rounded-md object-cover"
                        />
                        <div>
                          <span className="font-semibold text-slate-800 block">{item.playerName}</span>
                          <span className="text-[10px] text-slate-400">{item.playerRole}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">
                          ₹{(item.finalPrice / 1000).toFixed(0)}K
                        </span>
                        <button
                          onClick={() => setRefundingSale(item)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete or cancel purchase with automatic refund"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Sold Player Action (Refund Team & Return to Pool OR Delete Completely) */}
      {refundingSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 text-red-600 font-bold text-sm mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Refund Team & Remove Sold Player</span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200 my-3">
              <img
                src={refundingSale.playerPhoto}
                alt={refundingSale.playerName}
                className="w-12 h-12 rounded-xl object-cover border"
              />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{refundingSale.playerName}</h4>
                <p className="text-xs text-slate-500">
                  Acquired by <strong>{refundingSale.teamName}</strong>
                </p>
                <p className="text-xs font-black text-emerald-700">
                  Purchase Price: ₹{refundingSale.finalPrice.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1 mb-4">
              <p className="font-bold">💰 Automatic Refund Guarantee:</p>
              <p>
                Whichever option you pick, <strong>₹{refundingSale.finalPrice.toLocaleString('en-IN')}</strong> will be immediately <strong>refunded back to {refundingSale.teamName}</strong> and 1 squad slot will be restored.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleCancelSaleAndRefund(refundingSale)}
                className="w-full p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-between transition-colors text-left"
              >
                <div>
                  <span className="block font-black flex items-center space-x-1.5">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>Refund & Return to Auction Pool</span>
                  </span>
                  <span className="text-[11px] text-amber-800 font-normal mt-0.5 block">
                    Refunds {refundingSale.teamName} and keeps the player available for future bidding.
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleDeletePlayerAndRefund(refundingSale)}
                className="w-full p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-between transition-colors shadow-md text-left"
              >
                <div>
                  <span className="block font-black flex items-center space-x-1.5">
                    <Trash2 className="w-4 h-4" />
                    <span>Refund & Delete Player Completely</span>
                  </span>
                  <span className="text-[11px] text-red-100 font-normal mt-0.5 block">
                    Refunds {refundingSale.teamName} and permanently deletes player from tournament.
                  </span>
                </div>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setRefundingSale(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
