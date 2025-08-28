import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type Service = Database['public']['Tables']['services']['Insert'];

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
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
    if (!body.name || !body.price || !body.duration_minutes) {
      return NextResponse.json(
        { error: 'Name, price, and duration_minutes are required fields' },
        { status: 400 }
      );
    }

    const service: Service = {
      name: body.name,
      price: parseFloat(body.price),
      duration_minutes: parseInt(body.duration_minutes),
      description: body.description,
      active: body.active !== undefined ? body.active : true,
    };

    const { data, error } = await supabase
      .from('services')
      .insert([service])
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}