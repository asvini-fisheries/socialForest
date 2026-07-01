import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  plantation: 'Plantation',
  replacement: 'Replacement',
};

export type OutwardBillPdfInput = {
  log_number: string | null;
  issue_date: string;
  issue_category: string;
  remarks?: string | null;
  project_area?: { name?: string; code?: string | null } | null;
  project?: {
    name?: string;
    organisation?: {
      name?: string;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      gstin?: string | null;
      footer_template?: string | null;
    } | null;
  } | null;
  items?: {
    quantity: number;
    resource?: { name?: string; code?: string | null } | null;
  }[];
};

type OrgInfo = NonNullable<NonNullable<OutwardBillPdfInput['project']>['organisation']>;

function orgAddress(org: OrgInfo | null | undefined): string {
  if (!org) return '';
  return [org.address, [org.city, org.state].filter(Boolean).join(', ')].filter(Boolean).join('\n');
}

export function buildNurseryOutwardBillPdf(bill: OutwardBillPdfInput): Uint8Array {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  const org = bill.project?.organisation;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(org?.name || 'Organisation', margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const orgLines = doc.splitTextToSize(orgAddress(org) || '', pageWidth - margin * 2);
  if (orgLines.length) {
    doc.text(orgLines, margin, y);
    y += orgLines.length * 11 + 4;
  }
  if (org?.gstin) {
    doc.text(`GSTIN: ${org.gstin}`, margin, y);
    y += 14;
  }

  doc.setDrawColor(16, 185, 129);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('NURSERY OUTWARD LOG', margin, y);
  doc.setFontSize(10);
  doc.text(`Log #: ${bill.log_number || '—'}`, pageWidth - margin, y, { align: 'right' });
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(bill.issue_date)}`, margin, y);
  doc.text(
    `Category: ${CATEGORY_LABELS[bill.issue_category] || bill.issue_category}`,
    pageWidth - margin,
    y,
    { align: 'right' }
  );
  y += 14;
  if (bill.project?.name) {
    doc.text(`Project: ${bill.project.name}`, margin, y);
    y += 14;
  }
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Issued To', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  const areaName = bill.project_area?.name || 'Project Area';
  const areaCode = bill.project_area?.code ? ` (${bill.project_area.code})` : '';
  doc.text(`${areaName}${areaCode}`, margin, y);
  y += 20;

  const items = (bill.items || []).map((item) => ({
    species: item.resource?.name || 'Species',
    quantity: item.quantity,
  }));
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  autoTable(doc, {
    startY: y,
    head: [['Tree Species', 'Quantity']],
    body: items.map((item) => [item.species, String(item.quantity)]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      1: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y + 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Total Saplings: ${totalQty}`, margin, finalY + 16);

  if (bill.remarks?.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Remarks:', margin, finalY + 36);
    doc.setFont('helvetica', 'normal');
    const remarkLines = doc.splitTextToSize(bill.remarks.trim(), pageWidth - margin * 2);
    doc.text(remarkLines, margin, finalY + 50);
  }

  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    org?.footer_template || 'Computer-generated nursery outward issue log.',
    margin,
    footerY
  );

  return new Uint8Array(doc.output('arraybuffer'));
}
