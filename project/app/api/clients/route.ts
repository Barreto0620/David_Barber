// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let query = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
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
    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: 'Name and phone are required fields' },
        { status: 400 }
      );
    }

    // Check if client with this phone already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('phone', body.phone)
      .single();

    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this phone number already exists' },
        { status: 409 }
      );
    }

    const client = {
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      preferences: body.preferences || {},
      notes: body.notes || null,
    };

    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}