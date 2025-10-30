// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // today, week, month, year
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get completed appointments in the period
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (
          id,
          name,
          phone
        )
      `)
      .eq('status', 'completed')
      .gte('scheduled_date', startDate.toISOString())
      .lte('scheduled_date', now.toISOString())
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching revenue data:', error);
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
    }

    // Calculate summary metrics
    const totalRevenue = appointments.reduce((sum, apt) => sum + apt.price, 0);
    const totalAppointments = appointments.length;
    const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

    // Group by service type
    const serviceRevenue = appointments.reduce((acc, apt) => {
      acc[apt.service_type] = (acc[apt.service_type] || 0) + apt.price;
      return acc;
    }, {});

    // Group by payment method
    const paymentMethods = appointments.reduce((acc, apt) => {
      if (apt.payment_method) {
        acc[apt.payment_method] = (acc[apt.payment_method] || 0) + apt.price;
      }
      return acc;
    }, {});

    // Daily breakdown (for charts)
    const dailyRevenue = {};
    appointments.forEach(apt => {
      const date = new Date(apt.scheduled_date).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + apt.price;
    });

    return NextResponse.json({
      period,
      summary: {
        totalRevenue,
        totalAppointments,
        averageTicket,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
      breakdown: {
        byService: Object.entries(serviceRevenue).map(([service, revenue]) => ({
          service,
          revenue,
          percentage: (revenue / totalRevenue) * 100
        })),
        byPaymentMethod: Object.entries(paymentMethods).map(([method, revenue]) => ({
          method,
          revenue,
          percentage: (revenue / totalRevenue) * 100
        })),
        daily: Object.entries(dailyRevenue).map(([date, revenue]) => ({
          date,
          revenue
        }))
      },
      appointments: appointments.map(apt => ({
        id: apt.id,
        date: apt.scheduled_date,
        client_name: apt.clients?.name,
        service: apt.service_type,
        price: apt.price,
        payment_method: apt.payment_method
      }))
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}