// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/error';

// Get all users
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}