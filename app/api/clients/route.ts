import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/error';

export async function GET() {
  try {
    // Fetch all clients, ordered by 'id' in descending order.
    const { data, error } = await supabase
      .from('client')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Expecting the client data (only "name" in this case) in the request body.
    const { name } = await req.json();
    const { data, error } = await supabase
      .from('client')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
    
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
