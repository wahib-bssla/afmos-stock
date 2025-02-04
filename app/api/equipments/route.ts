import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/error';

export async function GET() {
  try {
    

    /*const { data, error } = await supabase
      .from('equipments')
      .select('*')
      .order('created_at', { ascending: false });*/

      
const { data, error } = await supabase
.from('equipments')
.select(`
  *,
  client (
    *
  )
`)
        


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

    const { name, ref, type, clientId, price} = await req.json();
    const { data, error } = await supabase
      .from('equipments')
      .insert([{ name, ref, type, client_id:clientId, price}])
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