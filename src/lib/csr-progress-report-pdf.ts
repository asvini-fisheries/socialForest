import { jsPDF } from 'jspdf';
import autoTable, { type RowInput } from 'jspdf-autotable';
import type { CsrProgressReportData } from '@/lib/csr-progress-report-data';
import { drawGroupedHorizontalBarChart, drawProgressBarChart } from '@/lib/pdf-charts';
import {
  formatActivityResourcesLabel,
  type ClusterActivityTree,
} from '@/lib/project-activity-summaries';
import { formatDate } from '@/lib/utils';

function pdfCurrency(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;
}

function formatPdfNumber(value: number): string {
  return value ? value.toLocaleString('en-IN') : '0';
}

const activitySubtotalFill: [number, number, number] = [236, 253, 245];
const clusterSubtotalFill: [number, number, number] = [209, 250, 229];

function pctLabel(progressPct: number): string {
  return `${progressPct.toFixed(1)}%`;
}

function buildClusterBudgetActualRows(
  clusterBudgetActuals: CsrProgressReportData['clusterBudgetActuals']
): RowInput[] {
  return clusterBudgetActuals.map((cluster) => [
    cluster.areaCode ? `${cluster.areaName} (${cluster.areaCode})` : cluster.areaName,
    pdfCurrency(cluster.budgetAmount),
    pdfCurrency(cluster.actualAmount),
    pctLabel(cluster.progressPct),
  ]);
}

function buildActivityBudgetActualRows(
  clusterBudgetActuals: CsrProgressReportData['clusterBudgetActuals']
): RowInput[] {
  const rows: RowInput[] = [];

  for (const cluster of clusterBudgetActuals) {
    for (const activity of cluster.activities) {
      rows.push([
        cluster.areaCode ? `${cluster.areaName} (${cluster.areaCode})` : cluster.areaName,
        activity.activityName,
        pdfCurrency(activity.budgetAmount),
        pdfCurrency(activity.actualAmount),
        pctLabel(activity.progressPct),
      ]);
    }

    if (cluster.activities.length > 1) {
      rows.push([
        {
          content: `Subtotal — ${cluster.areaName}`,
          colSpan: 2,
          styles: {
            fillColor: clusterSubtotalFill,
            fontStyle: 'bold',
            textColor: 20,
          },
        },
        {
          content: pdfCurrency(cluster.budgetAmount),
          styles: {
            fillColor: clusterSubtotalFill,
            fontStyle: 'bold',
            halign: 'right',
            textColor: 20,
          },
        },
        {
          content: pdfCurrency(cluster.actualAmount),
          styles: {
            fillColor: clusterSubtotalFill,
            fontStyle: 'bold',
            halign: 'right',
            textColor: 20,
          },
        },
        {
          content: pctLabel(cluster.progressPct),
          styles: {
            fillColor: clusterSubtotalFill,
            fontStyle: 'bold',
            halign: 'right',
            textColor: 20,
          },
        },
      ]);
    }
  }

  return rows;
}

function buildActivityDetailRows(tree: ClusterActivityTree[]): RowInput[] {
  const rows: RowInput[] = [];

  for (const cluster of tree) {
    for (const activity of cluster.activities) {
      if (activity.details.length) {
        for (const line of activity.details) {
          rows.push([
            cluster.areaName,
            activity.activityName,
            line.date ? formatDate(line.date) : '—',
            line.projectAreaName || '—',
            line.stakeholderName || '—',
            formatActivityResourcesLabel(line.resources) || '—',
            formatPdfNumber(line.quantity || 0),
            formatPdfNumber(line.saplings || 0),
            pdfCurrency(line.amount || 0),
          ]);
        }

        if (activity.details.length > 1) {
          rows.push([
            '',
            {
              content: `Subtotal — ${activity.activityName}`,
              colSpan: 5,
              styles: {
                fillColor: activitySubtotalFill,
                fontStyle: 'bold',
                textColor: 30,
              },
            },
            {
              content: formatPdfNumber(activity.quantity),
              styles: {
                fillColor: activitySubtotalFill,
                fontStyle: 'bold',
                halign: 'right',
                textColor: 30,
              },
            },
            {
              content: formatPdfNumber(activity.saplings),
              styles: {
                fillColor: activitySubtotalFill,
                fontStyle: 'bold',
                halign: 'right',
                textColor: 30,
              },
            },
            {
              content: pdfCurrency(activity.amount),
              styles: {
                fillColor: activitySubtotalFill,
                fontStyle: 'bold',
                halign: 'right',
                textColor: 30,
              },
            },
          ]);
        }
      } else {
        rows.push([
          cluster.areaName,
          activity.activityName,
          '—',
          '—',
          '—',
          '—',
          formatPdfNumber(activity.quantity),
          formatPdfNumber(activity.saplings),
          pdfCurrency(activity.amount),
        ]);
      }
    }

    rows.push([
      {
        content: `Subtotal — ${cluster.areaName}`,
        colSpan: 6,
        styles: {
          fillColor: clusterSubtotalFill,
          fontStyle: 'bold',
          textColor: 20,
        },
      },
      {
        content: formatPdfNumber(cluster.quantity),
        styles: {
          fillColor: clusterSubtotalFill,
          fontStyle: 'bold',
          halign: 'right',
          textColor: 20,
        },
      },
      {
        content: formatPdfNumber(cluster.saplings),
        styles: {
          fillColor: clusterSubtotalFill,
          fontStyle: 'bold',
          halign: 'right',
          textColor: 20,
        },
      },
      {
        content: pdfCurrency(cluster.amount),
        styles: {
          fillColor: clusterSubtotalFill,
          fontStyle: 'bold',
          halign: 'right',
          textColor: 20,
        },
      },
    ]);
  }

  return rows;
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

  const showBudgetComparison =
    data.summary.hasActivityBudgets && data.clusterBudgetActuals.length > 0;

  if (showBudgetComparison) {
    doc.addPage();
    y = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text('Cluster-wise Budget & Actuals Summary', margin, y);
    y += 14;

    autoTable(doc, {
      startY: y,
      head: [['Cluster', 'Budget', 'Actual', 'Progress']],
      body: buildClusterBudgetActualRows(data.clusterBudgetActuals),
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    });

    y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 20;
    y = ensureSpace(doc, y, 160, margin);

    const clusterLabels = data.clusterBudgetActuals.map(
      (cluster) => cluster.areaCode || cluster.areaName
    );
    y = drawGroupedHorizontalBarChart(doc, {
      x: margin,
      y,
      width: pageWidth - margin * 2,
      barHeight: 12,
      rowGap: 10,
      title: 'Budget vs Actual by Cluster',
      categories: clusterLabels,
      series: [
        {
          label: 'Budget',
          color: [203, 213, 225],
          values: data.clusterBudgetActuals.map((cluster) => cluster.budgetAmount),
        },
        {
          label: 'Actual',
          color: [245, 158, 11],
          values: data.clusterBudgetActuals.map((cluster) => cluster.actualAmount),
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
      title: 'Budget Utilisation by Cluster (%)',
      categories: clusterLabels,
      values: data.clusterBudgetActuals.map((cluster) => cluster.progressPct),
    });
  }

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
      title: showBudgetComparison ? 'Actual Spend by Cluster' : 'Spend by Cluster',
      categories: clusterLabels,
      series: showBudgetComparison
        ? [
            {
              label: 'Budget',
              color: [203, 213, 225],
              values: data.clusterBudgetActuals.map((cluster) => cluster.budgetAmount),
            },
            {
              label: 'Actual',
              color: [245, 158, 11],
              values: data.clusters.map((cluster) => cluster.amount),
            },
          ]
        : [
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

  if (showBudgetComparison && data.clusterBudgetActuals.some((cluster) => cluster.activities.length > 0)) {
    doc.addPage('a4', 'landscape');
    const landscapeMargin = 36;
    let landscapeY = landscapeMargin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Activity-wise Budget & Actuals Summary', landscapeMargin, landscapeY);
    landscapeY += 16;

    autoTable(doc, {
      startY: landscapeY,
      head: [['Cluster', 'Activity', 'Budget', 'Actual', 'Progress']],
      body: buildActivityBudgetActualRows(data.clusterBudgetActuals),
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: landscapeMargin, right: landscapeMargin },
    });

    const topActivities = [...data.activityBudgetActuals]
      .filter((activity) => activity.budgetAmount > 0 || activity.actualAmount > 0)
      .sort((a, b) => b.budgetAmount - a.budgetAmount)
      .slice(0, 10);

    if (topActivities.length > 0) {
      doc.addPage();
      let chartY = margin;
      chartY = drawGroupedHorizontalBarChart(doc, {
        x: margin,
        y: chartY,
        width: pageWidth - margin * 2,
        barHeight: 12,
        rowGap: 10,
        title: 'Budget vs Actual by Activity (Top 10)',
        categories: topActivities.map((activity) => activity.activityName),
        series: [
          {
            label: 'Budget',
            color: [203, 213, 225],
            values: topActivities.map((activity) => activity.budgetAmount),
          },
          {
            label: 'Actual',
            color: [245, 158, 11],
            values: topActivities.map((activity) => activity.actualAmount),
          },
        ],
      });

      chartY = ensureSpace(doc, chartY, 120, margin);
      drawProgressBarChart(doc, {
        x: margin,
        y: chartY,
        width: pageWidth - margin * 2,
        rowHeight: 12,
        rowGap: 10,
        title: 'Budget Utilisation by Activity (%)',
        categories: topActivities.map((activity) => activity.activityName),
        values: topActivities.map((activity) => activity.progressPct),
      });
    }
  }

  if (data.activityTree.length > 0) {
    doc.addPage('a4', 'landscape');
    const landscapeMargin = 36;
    let landscapeY = landscapeMargin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Cluster-wise Activity Details', landscapeMargin, landscapeY);
    landscapeY += 16;

    const detailBody = buildActivityDetailRows(data.activityTree);

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
