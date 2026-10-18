import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  Trophy,
  Users,
  IndianRupee,
  Calendar,
  Printer,
} from 'lucide-react';
import { useTournamentStore } from '../../hooks/useTournamentStore';
import { generateTournamentPDF } from '../../services/pdfReportGenerator';

export const ReportsPDF: React.FC = () => {
  const store = useTournamentStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const totalRegistered = store.players.length;
  const verifiedCount = store.players.filter((p) => p.status === 'verified').length;
  const soldCount = store.sales.length;
  const totalSpend = store.sales.reduce((sum, s) => sum + s.finalPrice, 0);

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    try {
      const doc = generateTournamentPDF(store);
      doc.save(`SMYS-Cricket-Auction-Report-${Date.now().toString().slice(-4)}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Check console.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-electric font-bold text-xs uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Official Documentation & Audit Exports</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Tournament PDF Report Generator</h2>
          <p className="text-xs text-slate-500">
            Generate publication-ready PDF tournament summaries, verification records, and team purse statements.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-electric to-royal text-white font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Compiling PDF...' : 'Download Official PDF Report'}</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>PDF successfully compiled and downloaded to your device!</span>
        </div>
      )}

      {/* Report Preview Document Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10 max-w-4xl mx-auto space-y-8 font-sans">
        {/* Document Header */}
        <div className="border-b-4 border-gold pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-electric">
                Official Tournament Report
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 tracking-tight mt-1">
                SMYS — INTRA HOSTEL CRICKET AUCTION
              </h1>
              <p className="text-xs sm:text-sm font-bold text-amber-600">
                BY 75TH SATHPANTHA
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
              <p className="font-mono font-bold text-slate-800">
                DATE: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <p>STATUS: <strong className="text-emerald-600 uppercase">{store.config.status}</strong></p>
              <p className="font-mono text-[11px] text-slate-400">DOC ID: SMYS-RPT-2026-75</p>
            </div>
          </div>
        </div>

        {/* Section 1: Executive KPI Metrics */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center space-x-2">
            <span>1. Executive Tournament Metrics</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Registrations</span>
              <span className="text-lg font-black text-slate-900">{totalRegistered}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Verified Eligible</span>
              <span className="text-lg font-black text-emerald-600">{verifiedCount}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Sold Players</span>
              <span className="text-lg font-black text-royal">{soldCount}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Spend</span>
              <span className="text-lg font-black text-slate-900">
                ₹{totalSpend.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Team Financials & Purse Adjustments */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 mb-3">
            2. Franchise Purse Statements & Squad Quotas
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Team Name</th>
                  <th className="p-2.5">Captain</th>
                  <th className="p-2.5">Squad</th>
                  <th className="p-2.5">Initial Purse</th>
                  <th className="p-2.5">Spent Amount</th>
                  <th className="p-2.5">Remaining Purse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {store.teams.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">
                      {t.logo} {t.name}
                    </td>
                    <td className="p-2.5 text-slate-600">{t.captain}</td>
                    <td className="p-2.5 text-slate-800">{t.playersCount}/{t.maxSquadSize}</td>
                    <td className="p-2.5 font-mono">₹{t.initialPurse.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 font-mono text-royal">₹{t.spentPurse.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 font-mono font-bold text-emerald-600">
                      ₹{t.remainingPurse.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Player Sales & Transacted Values */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 mb-3">
            3. Player Auction Transacted Values & Assignments
          </h3>

          {store.sales.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No auction sales recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Reg ID</th>
                    <th className="p-2.5">Player Name</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Auction Tier</th>
                    <th className="p-2.5">Winning Franchise</th>
                    <th className="p-2.5">Hammer Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {store.sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono text-slate-400">{s.regNumber}</td>
                      <td className="p-2.5 font-bold text-slate-900">{s.playerName}</td>
                      <td className="p-2.5 text-electric">{s.playerRole}</td>
                      <td className="p-2.5 text-slate-600">{s.playerTier}</td>
                      <td className="p-2.5 font-bold text-slate-800">{s.teamLogo} {s.teamName}</td>
                      <td className="p-2.5 font-black text-slate-900 font-mono">
                        ₹{s.finalPrice.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Document Footer Signatures */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <div>
            <p className="font-semibold text-slate-700">75th Sathpantha Cricket Organizing Committee</p>
            <p className="text-[11px]">Certified Authentic Auction Ledger</p>
          </div>
          <div className="border-t border-slate-300 pt-1 w-48 text-center text-[11px]">
            Authorized Signatory / Chief Auctioneer
          </div>
        </div>
      </div>
    </div>
  );
};
