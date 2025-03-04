import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    // Kết nối đến database
    const { db } = await connectToDatabase();

    // Lấy toàn bộ danh sách phim, chỉ lấy các trường cần thiết
    const movies = await db.collection('movies').find({}, {
      projection: {
        _id: 1,
        code: 1,
        title: 1,
        poster: 1,
        releaseDate: 1,
        rating: 1,
        actress: 1,
        genre: 1,
        createdAt: 1
      }
    }).toArray();

    // Trả về kết quả
    return NextResponse.json(movies);

  } catch (error) {
    console.error('Lỗi khi lấy danh sách phim:', error);
    return NextResponse.json(
      { error: 'Không thể lấy danh sách phim' },
      { status: 500 }
    );
  }
} 