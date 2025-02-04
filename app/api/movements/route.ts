import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Define the type for movement input to avoid using 'any'
type MovementInput = {
  equipment_id: string;
  type: string;
  quantity: number;
  // Include any other necessary properties from the movement object
};

// POST endpoint: Inserts new movement records.
export async function POST(req: Request) {
  try {
    const { movements, technician_id, agence } = await req.json();

    const { data, error } = await supabase
      .from('movements')
      .insert(
        movements.map((m: MovementInput) => ({
          ...m,
          technician_id,
          agence
        }))
      );

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error recording movements:', error);
    return NextResponse.json(
      { error: 'Failed to record movements' },
      { status: 500 }
    );
  }
}

// GET endpoint: Retrieves movement records.
// Use '_req' to indicate the parameter is intentionally unused
export async function GET(_req: Request) {
  try {
    const { data, error } = await supabase
      .from('movements')
      .select(`
        id,
        equipment_id,
        type,
        agence,
        technician_id,
        quantity,
        created_at,
        equipment:equipment_id (
          name,
          type,
          price,
          client:client_id(
            id,
            name
          )
        ),
        technician:technician_id (
          username
        )
      `);

    console.log('Data:', data);
    console.log('Error:', error);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching movements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movements' },
      { status: 500 }
    );
  }
}