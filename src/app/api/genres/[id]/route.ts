import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Kiểm tra trùng tên với các thể loại khác
    const existingGenre = await db.collection('genres').findOne({
      _id: { $ne: new ObjectId(context.params.id) },
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingGenre) {
      return NextResponse.json({ error: 'Thể loại này đã tồn tại' }, { status: 400 });
    }

    const result = await db.collection('genres').findOneAndUpdate(
      { _id: new ObjectId(context.params.id) },
      { $set: { name, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Genre not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection('genres').findOneAndDelete({
      _id: new ObjectId(context.params.id)
    });

    if (!result) {
      return NextResponse.json({ error: 'Genre not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Genre deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 