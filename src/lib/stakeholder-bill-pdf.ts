import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/utils';

function pdfCurrency(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;
}

type BillItem = {
  description: string | null;
  quantity: number;
  unit_rate: number;
  amount: number;
};

export type BillPdfInput = {
  bill_number: string | null;
  period_from: string;
  period_to: string;
  total_amount: number;
  status: string;
  stakeholder?: {
    name?: string;
    code?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    gstin?: string | null;
    contact_person?: string | null;
    mobile?: string | null;
  } | null;
  project?: {
    name?: string;
    code?: string | null;
    organisation?: {
      name?: string;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      pincode?: string | null;
      gstin?: string | null;
      header_template?: string | null;
      footer_template?: string | null;
    } | null;
  } | null;
  items?: BillItem[];
};

function orgAddress(org: NonNullable<BillPdfInput['project']>['organisation']): string {
  if (!org) return '';
  return [org.address, [org.city, org.state, org.pincode].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join('\n');
}

function stakeholderAddress(stk: BillPdfInput['stakeholder']): string {
  if (!stk) return '';
  return [stk.address, [stk.city, stk.state, stk.pincode].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join('\n');
}

export function buildStakeholderBillPdf(bill: BillPdfInput): Uint8Array {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  const org = bill.project?.organisation;
  const orgName = org?.name || 'Organisation';
  const projectName = bill.project?.name || 'Project';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(orgName, margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const orgLines = doc.splitTextToSize(orgAddress(org) || '', pageWidth - margin * 2);
  doc.text(orgLines, margin, y);
  y += orgLines.length * 11 + 4;

  if (org?.gstin) {
    doc.text(`GSTIN: ${org.gstin}`, margin, y);
    y += 14;
  }

  if (org?.header_template) {
    const headerLines = doc.splitTextToSize(org.header_template, pageWidth - margin * 2);
    doc.text(headerLines, margin, y);
    y += headerLines.length * 11 + 8;
  }

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('STAKEHOLDER BILL', margin, y);

  doc.setFontSize(10);
  doc.text(`Bill #: ${bill.bill_number || '—'}`, pageWidth - margin, y, { align: 'right' });
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, margin, y);
  doc.text(`Status: ${bill.status.toUpperCase()}`, pageWidth - margin, y, { align: 'right' });
  y += 14;
  doc.text(
    `Period: ${formatDate(bill.period_from)} to ${formatDate(bill.period_to)}`,
    margin,
    y
  );
  y += 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Bill To', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.text(bill.stakeholder?.name || 'Stakeholder', margin, y);
  y += 12;
  const stkLines = doc.splitTextToSize(stakeholderAddress(bill.stakeholder), pageWidth / 2 - margin);
  if (stkLines.length) {
    doc.text(stkLines, margin, y);
    y += stkLines.length * 11;
  }
  if (bill.stakeholder?.gstin) {
    doc.text(`GSTIN: ${bill.stakeholder.gstin}`, margin, y);
    y += 12;
  }
  y += 10;

  const items = bill.items || [];
  autoTable(doc, {
    startY: y,
    head: [['#', 'Description', 'Qty', 'Rate', 'Amount']],
    body: items.map((item, index) => [
      String(index + 1),
      item.description || '—',
      String(item.quantity),
      pdfCurrency(item.unit_rate),
      pdfCurrency(item.amount),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 24 },
      2: { halign: 'right', cellWidth: 50 },
      3: { halign: 'right', cellWidth: 70 },
      4: { halign: 'right', cellWidth: 80 },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y + 40;
  const totalY = finalY + 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Total Amount: ${pdfCurrency(bill.total_amount)}`, pageWidth - margin, totalY, {
    align: 'right',
  });

  const footerY = doc.internal.pageSize.getHeight() - 50;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100);
  const footerText =
    org?.footer_template ||
    'This is a computer-generated stakeholder bill based on recorded daily activities.';
  const footerLines = doc.splitTextToSize(footerText, pageWidth - margin * 2);
  doc.text(footerLines, margin, footerY);

  return new Uint8Array(doc.output('arraybuffer'));
}
