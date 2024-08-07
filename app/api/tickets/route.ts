import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello from tickets API route!' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ message: 'POST request received', data: body });
}
