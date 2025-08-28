import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get today's appointments
    const { data: todayAppointments, error: todayError } = await supabase
      .from('appointments')
      .select('*')
      .gte('scheduled_date', today.toISOString())
      .lt('scheduled_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

    if (todayError) {
      console.error('Error fetching today\'s appointments:', todayError);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    // Get weekly revenue
    const { data: weeklyAppointments, error: weeklyError } = await supabase
      .from('appointments')
      .select('price')
      .eq('status', 'completed')
      .gte('scheduled_date', weekAgo.toISOString());

    if (weeklyError) {
      console.error('Error fetching weekly appointments:', weeklyError);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    // Get monthly revenue
    const { data: monthlyAppointments, error: monthlyError } = await supabase
      .from('appointments')
      .select('price')
      .eq('status', 'completed')
      .gte('scheduled_date', monthStart.toISOString());

    if (monthlyError) {
      console.error('Error fetching monthly appointments:', monthlyError);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    // Calculate metrics
    const todayRevenue = todayAppointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + apt.price, 0);

    const todayTotal = todayAppointments.length;
    const todayCompleted = todayAppointments.filter(apt => apt.status === 'completed').length;
    const todayScheduled = todayAppointments.filter(apt => apt.status === 'scheduled').length;

    const weeklyRevenue = weeklyAppointments.reduce((sum, apt) => sum + apt.price, 0);
    const monthlyRevenue = monthlyAppointments.reduce((sum, apt) => sum + apt.price, 0);

    const metrics = {
      todayRevenue,
      todayAppointments: todayTotal,
      weeklyRevenue,
      monthlyRevenue,
      completedToday: todayCompleted,
      scheduledToday: todayScheduled,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}