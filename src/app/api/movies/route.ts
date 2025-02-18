import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Movie from '@/models/Movie';

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const data = await request.json();
    const movie = await Movie.create(data);

    return NextResponse.json(movie);
  } catch (error) {
    console.error('Error adding movie:', error);
    return NextResponse.json(
      { error: 'Failed to create movie' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const movies = await Movie.find({}).sort({ createdAt: -1 });
    return NextResponse.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movies' },
      { status: 500 }
    );
  }
} 