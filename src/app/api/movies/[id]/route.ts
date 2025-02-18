import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Movie from '@/models/Movie';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const movie = await Movie.findByIdAndDelete(params.id);
    if (!movie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(movie);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete movie' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      params.id,
      updateData,
      { new: true }
    );

    if (!movie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...movie.toObject(),
      _id: movie._id.toString(),
      isSeen: movie.isSeen
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update movie' },
      { status: 500 }
    );
  }
} 