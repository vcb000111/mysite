import { connectToDatabase } from '@/lib/mongodb';
import Movie from '@/models/Movie';

type Context = {
  params: {
    id: string;
  };
};

export async function DELETE(request: Request, context: Context) {
  try {
    await connectToDatabase();
    const movie = await Movie.findByIdAndDelete(context.params.id);
    if (!movie) {
      return Response.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }
    return Response.json(movie);
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete movie' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    await connectToDatabase();
    const data = await request.json();

    // Đảm bảo cập nhật isSeen nếu có
    const updateData = {
      ...data,
      updatedAt: Date.now(),
      isSeen: typeof data.isSeen === 'boolean' ? data.isSeen : undefined
    };

    const movie = await Movie.findByIdAndUpdate(
      context.params.id,
      updateData,
      { new: true }
    );

    if (!movie) {
      return Response.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }

    return Response.json({
      ...movie.toObject(),
      _id: movie._id.toString(),
      isSeen: movie.isSeen
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to update movie' },
      { status: 500 }
    );
  }
} 