import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Construir o objeto de atualização com tipos explícitos
    const updateData: {
      status: 'completed';
      completed_at: string;
      payment_method?: 'dinheiro' | 'cartao' | 'pix' | 'transferencia' | null;
      price?: number;
      notes?: string | null;
    } = {
      status: 'completed',
      completed_at: new Date().toISOString(),
    };

    // Adicionar campos opcionais apenas se fornecidos
    if (body.payment_method) {
      updateData.payment_method = body.payment_method;
    }
    
    if (body.final_price) {
      updateData.price = parseFloat(body.final_price);
    }
    
    if (body.notes !== undefined) {
      updateData.notes = body.notes || null;
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData as any) // Type assertion necessário devido a limitações do Supabase
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

      if (clientData && clientData.length > 0) {
        const totalSpent = clientData.reduce((sum, apt) => sum + apt.price, 0);
        const totalVisits = clientData.length;
        const lastVisit = Math.max(...clientData.map(apt => new Date(apt.scheduled_date).getTime()));

        await supabase
          .from('clients')
          .update({
            total_spent: totalSpent,
            total_visits: totalVisits,
            last_visit: new Date(lastVisit).toISOString(),
          } as any) // Type assertion
          .eq('id', data.client_id);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}