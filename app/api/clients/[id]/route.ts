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
    // Expect the request body to include only the "name" field for a client.
    const { name } = await req.json();
    
    const { data, error } = await supabase
      .from('client')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

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
      .from('client')
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
