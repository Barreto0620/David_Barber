import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const updateData = {
      status: 'completed' as const,
      completed_at: new Date().toISOString(),
      payment_method: body.payment_method,
      price: body.final_price ? parseFloat(body.final_price) : undefined,
      notes: body.notes,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]
    );

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        clients (
          id,
          name,
          phone,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Error confirming appointment:', error);
      return NextResponse.json({ error: 'Failed to confirm appointment' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Update client stats
    if (data.client_id) {
      const { data: clientData } = await supabase
        .from('appointments')
        .select('price, scheduled_date')
        .eq('client_id', data.client_id)
        .eq('status', 'completed');

      if (clientData) {
        const totalSpent = clientData.reduce((sum, apt) => sum + apt.price, 0);
        const totalVisits = clientData.length;
        const lastVisit = Math.max(...clientData.map(apt => new Date(apt.scheduled_date).getTime()));

        await supabase
          .from('clients')
          .update({
            total_spent: totalSpent,
            total_visits: totalVisits,
            last_visit: new Date(lastVisit).toISOString(),
          })
          .eq('id', data.client_id);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}