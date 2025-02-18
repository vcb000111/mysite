import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ message: 'Connected to MongoDB successfully!' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect to MongoDB' }, { status: 500 });
  }
} 