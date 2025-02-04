import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hash } from "bcryptjs";
import { getErrorMessage } from "@/lib/error";

export async function POST(request: Request) {
  try {
    const { username, password, role } = await request.json();

    // Check existing user
    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (lookupError) throw new Error(lookupError.message);
    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert([
        {
          username,
          password: hashedPassword,
          role,
        },
      ])
      .select()
      .single();

    if (createError) throw new Error(createError.message);

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}