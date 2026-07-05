'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { downloadCsrProgressReportPdf } from '@/lib/csr-progress-report-client';
import { Download, Loader2 } from 'lucide-react';

type CsrProgressPdfButtonProps = {
  projectId: string;
  projectName: string;
  projectCode?: string | null;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export function CsrProgressPdfButton({
  projectId,
  projectName,
  projectCode,
  variant = 'outline',
  size = 'default',
}: CsrProgressPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const base = (projectCode || projectName).replace(/\s+/g, '_');
      await downloadCsrProgressReportPdf(projectId, `${base}_csr_progress.pdf`);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'PDF download failed');
    }
    setLoading(false);
  }

  return (
    <Button variant={variant} size={size} onClick={handleDownload} disabled={loading}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      CSR Progress PDF
    </Button>
  );
}
