import { connectToDatabase } from '@/lib/mongodb';
import Movie from '@/models/Movie';

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const data = await request.json();
    const movie = await Movie.create(data);

    return Response.json(movie);
  } catch (error) {
    console.error('Error adding movie:', error);
    return Response.json(
      { error: 'Failed to create movie' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const movies = await Movie.find({}).sort({ createdAt: -1 });
    return Response.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return Response.json(
      { error: 'Failed to fetch movies' },
      { status: 500 }
    );
  }
} 