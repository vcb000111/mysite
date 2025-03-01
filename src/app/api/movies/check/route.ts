import { connectToDatabase } from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Tìm mã phim trong tên file
    // Tìm theo pattern: chữ cái + số (có thể có dấu gạch ngang)
    const codeMatch = filename.match(/([a-zA-Z]+)[-]?(\d+)/i);

    if (!codeMatch) {
      return NextResponse.json({
        exists: false,
        movie: null
      });
    }

    // Chuẩn hóa mã phim: chữ in hoa + số (không có dấu gạch ngang)
    const prefix = codeMatch[1].toUpperCase();
    const number = codeMatch[2];
    const normalizedCode = `${prefix}${number}`;

    console.log('Searching for code:', normalizedCode);

    // Tìm kiếm trong database
    const movie = await Movie.findOne({
      $or: [
        // Tìm theo code đã chuẩn hóa
        { code: normalizedCode },
        // Tìm theo code có dấu gạch ngang
        { code: `${prefix}-${number}` }
      ]
    });

    console.log('Found movie:', movie);

    return NextResponse.json({
      exists: !!movie,
      movie: movie ? {
        _id: movie._id.toString(),
        title: movie.title,
        code: movie.code,
        poster: movie.poster,
        releaseDate: movie.releaseDate,
        rating: movie.rating,
        actress: movie.actress,
        genre: movie.genre,
        createdAt: movie.createdAt
      } : null
    });

  } catch (error) {
    console.error('Error checking movie:', error);
    return NextResponse.json(
      { error: 'Failed to check movie' },
      { status: 500 }
    );
  }
} 