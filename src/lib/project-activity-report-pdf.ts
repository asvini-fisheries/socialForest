import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/utils';
import {
  formatActivityResourcesLabel,
  type ClusterActivityTree,
} from '@/lib/project-activity-summaries';

function pdfCurrency(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;
}

export type ProjectActivityReportInput = {
  projectName: string;
  organisationName?: string;
  tree: ClusterActivityTree[];
};

export function flattenActivityTreeForExport(tree: ClusterActivityTree[]) {
  const rows: Record<string, unknown>[] = [];
  for (const cluster of tree) {
    for (const activity of cluster.activities) {
      for (const line of activity.details) {
        rows.push({
          project_area: cluster.areaName,
          activity: activity.activityName,
          date: line.date ? formatDate(line.date) : '',
          sub_area: line.projectAreaName || '',
          stakeholder: line.stakeholderName || '',
          resources: formatActivityResourcesLabel(line.resources),
          quantity: line.quantity,
          saplings: line.saplings,
          amount: line.amount,
        });
      }
      if (!activity.details.length) {
        rows.push({
          project_area: cluster.areaName,
          activity: activity.activityName,
          date: '',
          sub_area: '',
          stakeholder: '',
          resources: '',
          quantity: activity.quantity,
          saplings: activity.saplings,
          amount: activity.amount,
        });
      }
    }
  }
  return rows;
}

export function buildProjectActivityReportPdf(input: ProjectActivityReportInput): Uint8Array {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Activities by Project Area', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Project: ${input.projectName}`, margin, y);
  if (input.organisationName) {
    doc.text(`Organisation: ${input.organisationName}`, pageWidth / 2, y);
  }
  y += 20;

  const body: string[][] = [];
  for (const cluster of input.tree) {
    for (const activity of cluster.activities) {
      if (activity.details.length) {
        for (const line of activity.details) {
          body.push([
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
        body.push([
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
    startY: y,
    head: [
      ['Project Area', 'Activity', 'Date', 'Sub Area', 'Stakeholder', 'Resources', 'Quantity', 'Saplings', 'Amount'],
    ],
    body,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: margin, right: margin },
  });

  return new Uint8Array(doc.output('arraybuffer'));
}
