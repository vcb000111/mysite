import { connectToDatabase } from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { NextRequest } from 'next/server';

interface RouteSegment {
  params: { id: string };
}

export async function DELETE(request: NextRequest, { params }: RouteSegment) {
  try {
    await connectToDatabase();
    const movie = await Movie.findByIdAndDelete(params.id);
    if (!movie) {
      return new Response(JSON.stringify({ error: 'Movie not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(movie), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete movie' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request: NextRequest, { params }: RouteSegment) {
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
      return new Response(JSON.stringify({ error: 'Movie not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      ...movie.toObject(),
      _id: movie._id.toString(),
      isSeen: movie.isSeen
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update movie' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 