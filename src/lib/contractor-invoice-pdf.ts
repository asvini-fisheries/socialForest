import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/utils';

function pdfCurrency(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;
}

export type ContractorInvoicePdfItem = {
  source_type: string;
  description: string | null;
  amount: number;
};

export type ContractorInvoicePdfInput = {
  invoice_number: string | null;
  invoice_date: string;
  period_from: string | null;
  period_to: string | null;
  total_amount: number;
  status: string;
  remarks?: string | null;
  stakeholder?: { name?: string; code?: string | null; gstin?: string | null } | null;
  organisation?: {
    name?: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    gstin?: string | null;
    header_template?: string | null;
    footer_template?: string | null;
  } | null;
  project?: {
    name?: string;
    csr_partner?: { name?: string; code?: string | null } | null;
  } | null;
  items?: ContractorInvoicePdfItem[];
};

function orgAddress(org: ContractorInvoicePdfInput['organisation']): string {
  if (!org) return '';
  return [org.address, [org.city, org.state].filter(Boolean).join(', ')].filter(Boolean).join('\n');
}

export function buildContractorInvoicePdf(invoice: ContractorInvoicePdfInput): Uint8Array {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  const org = invoice.organisation;
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
  if (org?.header_template) {
    const headerLines = doc.splitTextToSize(org.header_template, pageWidth - margin * 2);
    doc.text(headerLines, margin, y);
    y += headerLines.length * 11 + 6;
  }

  doc.setDrawColor(16, 185, 129);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CONTRACTOR INVOICE', margin, y);
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoice.invoice_number || '—'}`, pageWidth - margin, y, { align: 'right' });
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(invoice.invoice_date)}`, margin, y);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - margin, y, { align: 'right' });
  y += 14;
  if (invoice.project?.name) {
    doc.text(`Project: ${invoice.project.name}`, margin, y);
    y += 14;
  }
  if (invoice.project?.csr_partner?.name) {
    doc.text(`CSR Partner: ${invoice.project.csr_partner.name}`, margin, y);
    y += 14;
  }
  if (invoice.period_from && invoice.period_to) {
    doc.text(
      `Period: ${formatDate(invoice.period_from)} to ${formatDate(invoice.period_to)}`,
      margin,
      y
    );
    y += 14;
  }
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Contractor', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.stakeholder?.name || '—', margin, y);
  if (invoice.stakeholder?.gstin) {
    y += 12;
    doc.text(`GSTIN: ${invoice.stakeholder.gstin}`, margin, y);
  }
  y += 20;

  const items = invoice.items || [];
  autoTable(doc, {
    startY: y,
    head: [['#', 'Source', 'Description', 'Amount']],
    body: items.map((item, index) => [
      String(index + 1),
      item.source_type === 'activity_bill' ? 'Activity Bill' : 'Expense',
      item.description || '—',
      pdfCurrency(item.amount),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 24 },
      3: { halign: 'right', cellWidth: 90 },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y + 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Total Amount: ${pdfCurrency(invoice.total_amount)}`, pageWidth - margin, finalY + 16, {
    align: 'right',
  });

  if (invoice.remarks?.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Remarks:', margin, finalY + 36);
    const remarkLines = doc.splitTextToSize(invoice.remarks.trim(), pageWidth - margin * 2);
    doc.text(remarkLines, margin, finalY + 50);
  }

  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    org?.footer_template ||
      'Computer-generated contractor invoice for CSR partner submission.',
    margin,
    footerY
  );

  return new Uint8Array(doc.output('arraybuffer'));
}
