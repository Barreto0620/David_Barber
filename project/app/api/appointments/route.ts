// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let query = supabase
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
      .order('scheduled_date', { ascending: true });

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query
        .gte('scheduled_date', startOfDay.toISOString())
        .lte('scheduled_date', endOfDay.toISOString());
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['client_id', 'scheduled_date', 'service_type', 'price'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const appointment = {
      client_id: body.client_id,
      scheduled_date: body.scheduled_date,
      service_type: body.service_type,
      price: parseFloat(body.price),
      status: body.status || 'scheduled',
      payment_method: body.payment_method || null,
      created_via: body.created_via || 'manual',
      notes: body.notes || null,
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert([appointment])
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
      console.error('Error creating appointment:', error);
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}