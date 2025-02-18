import { connectToDatabase } from '@/lib/mongodb';
import Movie from '@/models/Movie';

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const data = await request.json();

    // Đảm bảo images là một mảng
    const movieData = {
      ...data,
      images: Array.isArray(data.images) ? data.images : []
    };

    // Tạo document mới với dữ liệu đã xử lý
    const movieDoc = new Movie(movieData);

    // Gán trực tiếp mảng images nếu cần
    if (data.images && Array.isArray(data.images)) {
      movieDoc.images = data.images;
    }

    const movie = await movieDoc.save();
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