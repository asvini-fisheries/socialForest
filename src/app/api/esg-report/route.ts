import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { schedule_id, period_from, period_to } = await request.json();
    const supabase = await createClient();

    const { data: schedule, error: scheduleError } = await supabase
      .from('esg_report_schedules')
      .select('*, project:projects(name), csr_partner:csr_partners(name, email)')
      .eq('id', schedule_id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // TODO: Generate ESG report PDF with project metrics
    // const reportData = await generateESGReport(schedule.project_id, period_from, period_to);

    const { data: history, error: historyError } = await supabase
      .from('esg_report_history')
      .insert({
        schedule_id,
        report_period_from: period_from,
        report_period_to: period_to,
        sent_to_email: schedule.csr_partner?.email,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (historyError) throw historyError;

    // TODO: Send email with report attachment
    // await sendESGReportEmail(schedule.csr_partner.email, reportData);

    await supabase
      .from('esg_report_schedules')
      .update({ last_sent_at: new Date().toISOString() })
      .eq('id', schedule_id);

    return NextResponse.json({
      success: true,
      report_id: history.id,
      message: `ESG report queued for ${schedule.csr_partner?.name}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate ESG report' },
      { status: 500 }
    );
  }
}
