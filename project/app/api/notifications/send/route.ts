import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { type, recipient, message, data } = body;
    
    // Validate required fields
    if (!type || !recipient || !message) {
      return NextResponse.json(
        { error: 'Type, recipient, and message are required' },
        { status: 400 }
      );
    }

    // This endpoint is designed to trigger n8n webhooks
    // In a real implementation, you would:
    // 1. Send webhook to n8n with notification data
    // 2. n8n would handle the actual WhatsApp/SMS sending
    
    const notificationPayload = {
      type, // 'appointment_reminder', 'appointment_confirmed', 'service_completed', etc.
      recipient, // phone number or client ID
      message,
      data, // additional context data
      timestamp: new Date().toISOString(),
      source: 'david-barber-system'
    };

    // Log the notification (in production, send to n8n webhook)
    console.log('Notification to send:', notificationPayload);

    // Simulate successful notification
    const response = {
      id: `notif_${Date.now()}`,
      status: 'sent',
      ...notificationPayload
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}