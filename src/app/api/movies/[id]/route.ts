import { connectToDatabase } from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
    }

    await connectToDatabase();
    const movie = await Movie.findByIdAndDelete(id);

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    return NextResponse.json(movie, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete movie' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
    }

    await connectToDatabase();
    const data = await request.json();
    console.log('Updating movie with ID:', id);
    console.log('Update data:', data);

    // Xử lý tăng số lượt download
    let updateData = { ...data };
    if (data.downloads === 1) {
      const movie = await Movie.findById(id);
      if (!movie) {
        return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
      }
      updateData.downloads = (movie.downloads || 0) + 1;
    }

    // Đảm bảo cập nhật isSeen nếu có
    updateData = {
      ...updateData,
      updatedAt: Date.now(),
      isSeen: typeof data.isSeen === 'boolean' ? data.isSeen : undefined
    };

    const movie = await Movie.findByIdAndUpdate(id, updateData, { new: true });
    console.log('Updated movie:', movie);

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...movie.toObject(),
      _id: movie._id.toString(),
      isSeen: movie.isSeen
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating movie:', error);
    return NextResponse.json({ error: 'Failed to update movie' }, { status: 500 });
  }
} 