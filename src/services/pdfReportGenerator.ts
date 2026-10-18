import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TournamentStore } from './store';

export function generateTournamentPDF(store: TournamentStore): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Title / Header ---
  // Deep Navy Header Box
  doc.setFillColor(11, 21, 53); // #0B1535
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Gold Accent Strip
  doc.setFillColor(245, 184, 46); // #F5B82E
  doc.rect(0, 40, pageWidth, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('SMYS — INTRA HOSTEL CRICKET', 14, 18);

  doc.setFontSize(11);
  doc.setTextColor(245, 184, 46);
  doc.text('BY 75TH SATHPANTHA — OFFICIAL AUCTION SUMMARY REPORT', 14, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 230);
  const now = new Date().toLocaleString();
  doc.text(`Generated on: ${now} | Status: ${store.config.status.toUpperCase()}`, 14, 34);

  let currentY = 52;

  // --- 1. Tournament Overview KPI Table ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 37, 84);
  doc.text('1. Tournament & Auction Statistics', 14, currentY);
  currentY += 4;

  const totalRegistered = store.players.length;
  const verifiedPlayers = store.players.filter((p) => p.status === 'verified').length;
  const pendingPlayers = store.players.filter((p) => p.status === 'pending').length;
  const soldCount = store.sales.length;
  const unsoldCount = store.players.filter(
    (p) => p.status === 'verified' && !store.sales.some((s) => s.playerId === p.id)
  ).length;
  const totalSpend = store.sales.reduce((sum, s) => sum + s.finalPrice, 0);
  const highestSale = store.sales.length > 0 ? Math.max(...store.sales.map((s) => s.finalPrice)) : 0;

  const summaryData = [
    ['Total Registered Players', totalRegistered.toString(), 'Total Teams', store.teams.length.toString()],
    ['Verified Players (Eligible)', verifiedPlayers.toString(), 'Pending Verification', pendingPlayers.toString()],
    ['Players Sold', soldCount.toString(), 'Players Unsold', unsoldCount.toString()],
    [
      'Total Tournament Expenditure',
      `INR ${totalSpend.toLocaleString('en-IN')}`,
      'Highest Player Bid',
      `INR ${highestSale.toLocaleString('en-IN')}`,
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Metric', 'Value', 'Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [20, 43, 89], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 12;

  // --- 2. Team Financial & Squad Overview ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 37, 84);
  doc.text('2. Participating Teams & Purse Breakdown', 14, currentY);
  currentY += 4;

  const teamRows = store.teams.map((t, idx) => {
    const soldForTeam = store.sales.filter((s) => s.teamId === t.id);
    const spent = soldForTeam.reduce((sum, s) => sum + s.finalPrice, 0);
    const remaining = Math.max(0, t.initialPurse - spent);
    return [
      (idx + 1).toString(),
      t.name,
      t.captain,
      `${soldForTeam.length} / ${t.maxSquadSize}`,
      `INR ${t.initialPurse.toLocaleString('en-IN')}`,
      `INR ${spent.toLocaleString('en-IN')}`,
      `INR ${remaining.toLocaleString('en-IN')}`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Team Name', 'Captain', 'Squad', 'Initial Purse', 'Spent', 'Remaining']],
    body: teamRows,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
  });

  // @ts-expect-error autoTable adds lastAutoTable
  currentY = doc.lastAutoTable.finalY + 12;

  // Check if we need page break
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  // --- 3. Confirmed Player Sales ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 37, 84);
  doc.text('3. Confirmed Player Sales & Team Roster', 14, currentY);
  currentY += 4;

  if (store.sales.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No players sold yet in this auction session.', 14, currentY + 4);
  } else {
    const saleRows = store.sales.map((s, idx) => [
      (idx + 1).toString(),
      s.regNumber,
      s.playerName,
      s.playerRole,
      s.playerTier,
      s.teamName,
      `INR ${s.finalPrice.toLocaleString('en-IN')}`,
      s.soldAt,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Player ID', 'Player Name', 'Role', 'Tier', 'Winning Team', 'Final Price', 'Sold Time']],
      body: saleRows,
      theme: 'striped',
      headStyles: { fillColor: [11, 21, 53], textColor: [245, 184, 46] },
      styles: { fontSize: 8, cellPadding: 2.2 },
    });
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 170);
    doc.text(
      `SMYS Intra Hostel Cricket 2026 | By 75th Sathpantha | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  return doc;
}
