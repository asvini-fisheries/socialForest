import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CsrProgressReportData } from '@/lib/csr-progress-report-data';
import { drawGroupedHorizontalBarChart, drawProgressBarChart } from '@/lib/pdf-charts';
import { formatActivityResourcesLabel } from '@/lib/project-activity-summaries';
import { formatDate } from '@/lib/utils';

function pdfCurrency(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function addPageFooter(doc: jsPDF, text: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(text, pageWidth / 2, pageHeight - 24, { align: 'center' });
}

function ensureSpace(doc: jsPDF, y: number, needed: number, margin: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - margin) return y;
  doc.addPage();
  return margin;
}

export function buildCsrProgressReportPdf(data: CsrProgressReportData): Uint8Array {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text('Project Progress Report', margin, y);
  y += 22;

  doc.setFontSize(11);
  doc.text(data.organisationName, margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Prepared for CSR Partner: ${data.csrPartnerName}`, margin, y);
  y += 14;
  doc.text(`Project: ${data.projectName}${data.projectCode ? ` (${data.projectCode})` : ''}`, margin, y);
  y += 14;
  if (data.location) {
    doc.text(`Location: ${data.location}`, margin, y);
    y += 14;
  }
  doc.text(`Report Date: ${formatDate(data.reportDate)}`, margin, y);
  if (data.financialYear) {
    doc.text(`Financial Year: ${data.financialYear}`, pageWidth / 2, y);
  }
  y += 14;
  if (data.periodFrom && data.periodTo) {
    doc.text(
      `Reporting Period: ${formatDate(data.periodFrom)} to ${formatDate(data.periodTo)}`,
      margin,
      y
    );
    y += 14;
  }
  doc.text(`Project Status: ${formatStatus(data.projectStatus)}`, margin, y);
  y += 18;

  doc.setDrawColor(16, 185, 129);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Executive Summary', margin, y);
  y += 14;

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Planned / Budget', 'Actual / Achieved', 'Progress']],
    body: [
      [
        'Trees',
        data.summary.treesPlanned.toLocaleString('en-IN'),
        data.summary.treesPlanted.toLocaleString('en-IN'),
        `${data.summary.treeProgressPct.toFixed(1)}%`,
      ],
      [
        'Land Area (acres)',
        data.summary.landAcres.toLocaleString('en-IN'),
        '—',
        '—',
      ],
      [
        'Budget',
        pdfCurrency(data.summary.budgetAmount),
        pdfCurrency(data.summary.budgetActual),
        `${data.summary.budgetProgressPct.toFixed(1)}%`,
      ],
      [
        'Saplings Recorded',
        '—',
        data.summary.totalSaplings.toLocaleString('en-IN'),
        '—',
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });

  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 24;

  const clusterLabels = data.clusters.map((cluster) => cluster.areaCode || cluster.areaName);
  if (clusterLabels.length > 0) {
    doc.addPage();
    y = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text('Progress Charts', margin, y);
    y += 18;

    y = drawGroupedHorizontalBarChart(doc, {
      x: margin,
      y,
      width: pageWidth - margin * 2,
      barHeight: 10,
      rowGap: 10,
      title: 'Trees Planned vs Planted by Cluster',
      categories: clusterLabels,
      series: [
        {
          label: 'Planned',
          color: [203, 213, 225],
          values: data.clusters.map((cluster) => cluster.treesPlanned),
        },
        {
          label: 'Planted',
          color: [16, 185, 129],
          values: data.clusters.map((cluster) => cluster.treesPlanted),
        },
      ],
    });

    y = ensureSpace(doc, y, 120, margin);
    y = drawProgressBarChart(doc, {
      x: margin,
      y,
      width: pageWidth - margin * 2,
      rowHeight: 12,
      rowGap: 10,
      title: 'Tree Planting Progress by Cluster (%)',
      categories: clusterLabels,
      values: data.clusters.map((cluster) => cluster.progressPct),
    });

    y = ensureSpace(doc, y, 140, margin);
    y = drawGroupedHorizontalBarChart(doc, {
      x: margin,
      y,
      width: pageWidth - margin * 2,
      barHeight: 12,
      rowGap: 10,
      title: 'Spend by Cluster',
      categories: clusterLabels,
      series: [
        {
          label: 'Amount',
          color: [245, 158, 11],
          values: data.clusters.map((cluster) => cluster.amount),
        },
      ],
    });
  }

  doc.addPage();
  y = margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Cluster-wise Progress Summary', margin, y);
  y += 14;

  autoTable(doc, {
    startY: y,
    head: [
      ['Cluster', 'Land (ac)', 'Trees Planned', 'Trees Planted', 'Saplings', 'Amount', 'Progress'],
    ],
    body: data.clusters.map((cluster) => [
      cluster.areaCode ? `${cluster.areaName} (${cluster.areaCode})` : cluster.areaName,
      cluster.landAcres.toLocaleString('en-IN'),
      cluster.treesPlanned.toLocaleString('en-IN'),
      cluster.treesPlanted.toLocaleString('en-IN'),
      cluster.saplings.toLocaleString('en-IN'),
      pdfCurrency(cluster.amount),
      `${cluster.progressPct.toFixed(1)}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
  });

  for (const cluster of data.clusters) {
    if (!cluster.blocks.length) continue;

    y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 24;
    y = ensureSpace(doc, y, 80, margin);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text(`Blocks in ${cluster.areaName}`, margin, y);
    y += 12;

    autoTable(doc, {
      startY: y,
      head: [['Block', 'Land (ac)', 'Trees Planned', 'Trees Planted', 'Saplings', 'Amount', 'Progress']],
      body: cluster.blocks.map((block) => [
        block.areaCode ? `${block.areaName} (${block.areaCode})` : block.areaName,
        block.landAcres.toLocaleString('en-IN'),
        block.treesPlanned.toLocaleString('en-IN'),
        block.treesPlanted.toLocaleString('en-IN'),
        block.saplings.toLocaleString('en-IN'),
        pdfCurrency(block.amount),
        `${block.progressPct.toFixed(1)}%`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    });
  }

  if (data.activityTree.length > 0) {
    doc.addPage('a4', 'landscape');
    const landscapeMargin = 36;
    let landscapeY = landscapeMargin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Cluster-wise Activity Details', landscapeMargin, landscapeY);
    landscapeY += 16;

    const detailBody: string[][] = [];
    for (const cluster of data.activityTree) {
      for (const activity of cluster.activities) {
        if (activity.details.length) {
          for (const line of activity.details) {
            detailBody.push([
              cluster.areaName,
              activity.activityName,
              line.date ? formatDate(line.date) : '—',
              line.projectAreaName || '—',
              line.stakeholderName || '—',
              formatActivityResourcesLabel(line.resources) || '—',
              String(line.quantity || 0),
              String(line.saplings || 0),
              pdfCurrency(line.amount || 0),
            ]);
          }
        } else {
          detailBody.push([
            cluster.areaName,
            activity.activityName,
            '—',
            '—',
            '—',
            '—',
            String(activity.quantity),
            String(activity.saplings),
            pdfCurrency(activity.amount),
          ]);
        }
      }
    }

    autoTable(doc, {
      startY: landscapeY,
      head: [
        ['Cluster', 'Activity', 'Date', 'Sub Area', 'Stakeholder', 'Resources', 'Qty', 'Saplings', 'Amount'],
      ],
      body: detailBody,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: landscapeMargin, right: landscapeMargin },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    addPageFooter(
      doc,
      `${data.projectName} — CSR Progress Report — Page ${page} of ${pageCount}`
    );
  }

  return new Uint8Array(doc.output('arraybuffer'));
}
