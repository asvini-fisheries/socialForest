import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rowsToWorkbook } from '@/lib/master-excel';

interface ExportColumn {
  key: string;
  header: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const sheetName = String(body.sheetName || 'Export').slice(0, 31);
  const filename = String(body.filename || `${sheetName}.xlsx`);
  const columns = (body.columns as ExportColumn[]) || [];
  const rows = (body.rows as Record<string, unknown>[]) || [];

  if (!columns.length) {
    return NextResponse.json({ error: 'No columns selected' }, { status: 400 });
  }

  const headers = columns.map((c) => c.header);
  const dataRows = rows.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (value == null || value === '') return '';
      if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        if (obj.name) return String(obj.name);
        return JSON.stringify(value);
      }
      return String(value);
    })
  );

  const buffer = rowsToWorkbook(sheetName, headers, dataRows);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
