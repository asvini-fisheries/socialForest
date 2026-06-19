import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface WhatsAppPayload {
  recipient_mobile: string;
  recipient_name?: string;
  message_type: string;
  message_content: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppPayload = await request.json();
    const supabase = await createClient();

    const { data: notification, error: dbError } = await supabase
      .from('whatsapp_notifications')
      .insert({
        recipient_mobile: body.recipient_mobile,
        recipient_name: body.recipient_name,
        message_type: body.message_type,
        message_content: body.message_content,
        related_entity_type: body.related_entity_type,
        related_entity_id: body.related_entity_id,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // TODO: Integrate with WhatsApp provider (Twilio/Gupshup/Interakt)
    // const whatsappResponse = await sendWhatsAppMessage(body);

    return NextResponse.json({
      success: true,
      notification_id: notification.id,
      message: 'Notification queued for delivery',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send notification' },
      { status: 500 }
    );
  }
}

