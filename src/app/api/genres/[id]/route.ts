import { connectToDatabase } from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest, { params }: { params: Record<string, string> }) {
  try {
    await connectToDatabase();

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
    }

    const movie = await Movie.findByIdAndDelete(id);
    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    return NextResponse.json(movie, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete movie' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Record<string, string> }) {
  try {
    await connectToDatabase();
    const data = await request.json();

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
    }

    // Đảm bảo cập nhật isSeen nếu có
    const updateData = {
      ...data,
      updatedAt: Date.now(),
      isSeen: typeof data.isSeen === 'boolean' ? data.isSeen : undefined
    };

    const movie = await Movie.findByIdAndUpdate(id, updateData, { new: true });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...movie.toObject(),
      _id: movie._id.toString(),
      isSeen: movie.isSeen
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to update movie' }, { status: 500 });
  }
}
