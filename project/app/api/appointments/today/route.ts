import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (
          id,
          name,
          phone,
          email
        )
      `)
      .gte('scheduled_date', startOfDay.toISOString())
      .lte('scheduled_date', endOfDay.toISOString())
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching today\'s appointments:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    const summary = {
      total: data.length,
      scheduled: data.filter(apt => apt.status === 'scheduled').length,
      in_progress: data.filter(apt => apt.status === 'in_progress').length,
      completed: data.filter(apt => apt.status === 'completed').length,
      cancelled: data.filter(apt => apt.status === 'cancelled').length,
      revenue: data
        .filter(apt => apt.status === 'completed')
        .reduce((sum, apt) => sum + apt.price, 0),
    };

    return NextResponse.json({
      appointments: data,
      summary,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}