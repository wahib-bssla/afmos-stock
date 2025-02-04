import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/error';

export async function PUT(
  req: Request,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  context: any
) {
  try {
    const { id } = context.params;
    const { name, ref, type, clientId, price } = await req.json();

    const { data, error } = await supabase
      .from('equipments')
      .update({ 
        name, 
        ref, 
        type,
        price, 
        client_id: clientId === 'NULL' ? null : clientId // Convert properly
      })
      .eq('id', id)
      .select()
      .single();

    console.log('ID:', id);
    console.log('Payload:', { name, ref, type, price, clientId });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  context: any
) {
  try {
    const { id } = context.params;

    const { error } = await supabase
      .from('equipments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
