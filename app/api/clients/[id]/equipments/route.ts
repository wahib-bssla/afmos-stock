// app/api/clients/[id]/equipments/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export async function GET(request: Request, context: any) {
  const { params } = context;
  const clientId = params.id;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Client ID is required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('equipments')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
