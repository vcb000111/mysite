import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const genres = await db.collection('genres').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(genres);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Kiểm tra trùng tên
    const existingGenre = await db.collection('genres').findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingGenre) {
      return NextResponse.json({ error: 'Thể loại này đã tồn tại' }, { status: 400 });
    }

    const result = await db.collection('genres').insertOne({
      name,
      createdAt: new Date(),
    });

    return NextResponse.json({
      _id: result.insertedId,
      name,
      createdAt: new Date(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 