import type { jsPDF } from 'jspdf';

export type BarChartSeries = {
  label: string;
  color: [number, number, number];
  values: number[];
};

type HorizontalBarChartOptions = {
  x: number;
  y: number;
  width: number;
  barHeight: number;
  rowGap: number;
  title: string;
  categories: string[];
  series: BarChartSeries[];
  maxValue?: number;
  valueSuffix?: string;
};

function truncateLabel(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && doc.getTextWidth(`${trimmed}…`) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}…`;
}

export function drawGroupedHorizontalBarChart(
  doc: jsPDF,
  options: HorizontalBarChartOptions
): number {
  const {
    x,
    y,
    width,
    barHeight,
    rowGap,
    title,
    categories,
    series,
    maxValue,
    valueSuffix = '',
  } = options;

  const labelWidth = 88;
  const chartLeft = x + labelWidth;
  const chartWidth = width - labelWidth - 8;
  const groupHeight = barHeight * series.length + Math.max(0, series.length - 1) * 2;
  const contentHeight = categories.length * (groupHeight + rowGap) - rowGap;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(title, x, y);
  let cursorY = y + 16;

  if (series.length > 0 && categories.length > 0) {
    const legendX = x;
    let legendY = cursorY;
    doc.setFontSize(8);
    for (const item of series) {
      doc.setFillColor(...item.color);
      doc.rect(legendX, legendY - 7, 10, 8, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70);
      doc.text(item.label, legendX + 14, legendY);
      legendY += 12;
    }
    cursorY = legendY + 4;
  }

  const peak = maxValue ?? Math.max(1, ...series.flatMap((s) => s.values));
  doc.setFontSize(8);

  for (let index = 0; index < categories.length; index += 1) {
    const rowTop = cursorY + index * (groupHeight + rowGap);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    doc.text(truncateLabel(doc, categories[index], labelWidth - 6), x, rowTop + groupHeight / 2 + 3);

    series.forEach((item, seriesIndex) => {
      const value = item.values[index] || 0;
      const barWidth = peak > 0 ? (value / peak) * chartWidth : 0;
      const barY = rowTop + seriesIndex * (barHeight + 2);
      doc.setFillColor(...item.color);
      if (barWidth > 0) {
        doc.rect(chartLeft, barY, barWidth, barHeight, 'F');
      }
      doc.setTextColor(40);
      const valueLabel = `${Math.round(value).toLocaleString('en-IN')}${valueSuffix}`;
      doc.text(valueLabel, chartLeft + barWidth + 4, barY + barHeight - 2);
    });
  }

  doc.setDrawColor(220);
  doc.line(chartLeft, cursorY - 4, chartLeft, cursorY + contentHeight + 4);
  return cursorY + contentHeight + 12;
}

type ProgressBarChartOptions = {
  x: number;
  y: number;
  width: number;
  rowHeight: number;
  rowGap: number;
  title: string;
  categories: string[];
  values: number[];
  maxValue?: number;
};

export function drawProgressBarChart(doc: jsPDF, options: ProgressBarChartOptions): number {
  const { x, y, width, rowHeight, rowGap, title, categories, values, maxValue = 100 } = options;
  const labelWidth = 88;
  const chartLeft = x + labelWidth;
  const chartWidth = width - labelWidth - 36;
  const contentHeight = categories.length * (rowHeight + rowGap) - rowGap;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(title, x, y);
  let cursorY = y + 18;

  for (let index = 0; index < categories.length; index += 1) {
    const value = Math.max(0, Math.min(maxValue, values[index] || 0));
    const rowTop = cursorY + index * (rowHeight + rowGap);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60);
    doc.text(truncateLabel(doc, categories[index], labelWidth - 6), x, rowTop + rowHeight / 2 + 3);

    doc.setDrawColor(230);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(chartLeft, rowTop, chartWidth, rowHeight, 2, 2, 'F');

    const fillWidth = maxValue > 0 ? (value / maxValue) * chartWidth : 0;
    if (fillWidth > 0) {
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(chartLeft, rowTop, fillWidth, rowHeight, 2, 2, 'F');
    }

    doc.setTextColor(40);
    doc.text(`${value.toFixed(1)}%`, chartLeft + chartWidth + 6, rowTop + rowHeight - 3);
  }

  return cursorY + contentHeight + 12;
}
