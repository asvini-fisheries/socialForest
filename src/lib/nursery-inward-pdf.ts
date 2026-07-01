import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/utils';

function pdfCurrency(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;
}

export type InwardBillPdfInput = {
  invoice_number: string;
  bill_date: string;
  total_amount: number;
  status: string;
  remarks?: string | null;
  stakeholder?: {
    name?: string;
    code?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    gstin?: string | null;
  } | null;
  project?: {
    name?: string;
    organisation?: {
      name?: string;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      gstin?: string | null;
      header_template?: string | null;
      footer_template?: string | null;
    } | null;
  } | null;
  items?: {
    description?: string;
    quantity: number;
    unit_rate: number;
    amount: number;
    resource?: { name?: string; code?: string | null } | null;
  }[];
};

type OrgInfo = NonNullable<NonNullable<InwardBillPdfInput['project']>['organisation']>;

function orgAddress(org: OrgInfo | null | undefined): string {
  if (!org) return '';
  return [org.address, [org.city, org.state].filter(Boolean).join(', ')].filter(Boolean).join('\n');
}

export function buildNurseryInwardBillPdf(bill: InwardBillPdfInput): Uint8Array {
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
  doc.text('NURSERY INWARD BILL', margin, y);
  doc.setFontSize(10);
  doc.text(`Invoice #: ${bill.invoice_number}`, pageWidth - margin, y, { align: 'right' });
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(bill.bill_date)}`, margin, y);
  doc.text(`Status: ${bill.status.toUpperCase()}`, pageWidth - margin, y, { align: 'right' });
  y += 14;
  if (bill.project?.name) {
    doc.text(`Project: ${bill.project.name}`, margin, y);
    y += 14;
  }
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Received From', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.text(bill.stakeholder?.name || 'Stakeholder', margin, y);
  y += 20;

  const items = (bill.items || []).map((item) => ({
    species: item.resource?.name || 'Species',
    quantity: item.quantity,
    unit_rate: item.unit_rate,
    amount: item.amount,
  }));

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  autoTable(doc, {
    startY: y,
    head: [['Species', 'Qty', 'Rate', 'Amount']],
    body: items.map((item) => [
      item.species,
      String(item.quantity),
      pdfCurrency(item.unit_rate),
      pdfCurrency(item.amount),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y + 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Total Quantity: ${totalQty}`, margin, finalY + 16);
  doc.text(`Total Amount: ${pdfCurrency(bill.total_amount)}`, pageWidth - margin, finalY + 16, {
    align: 'right',
  });

  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    org?.footer_template || 'Computer-generated nursery inward purchase bill.',
    margin,
    footerY
  );

  return new Uint8Array(doc.output('arraybuffer'));
}
