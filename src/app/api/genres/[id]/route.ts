import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop();
    const { db } = await connectToDatabase();

    const result = await db.collection('genres').findOneAndDelete({
      _id: new ObjectId(id)
    });

    if (!result) {
      return NextResponse.json({ error: 'Genre not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Genre deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop();
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Kiểm tra trùng tên với các thể loại khác
    const existingGenre = await db.collection('genres').findOne({
      _id: { $ne: new ObjectId(id) },
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingGenre) {
      return NextResponse.json({ error: 'Thể loại này đã tồn tại' }, { status: 400 });
    }

    const result = await db.collection('genres').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Genre not found' }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
