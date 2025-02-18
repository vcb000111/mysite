import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';

type Context = {
  params: {
    id: string;
  };
};

export async function PUT(request: NextRequest, context: Context) {
  try {
    const { name } = await request.json();
    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Kiểm tra trùng tên với các thể loại khác
    const existingGenre = await db.collection('genres').findOne({
      _id: { $ne: new ObjectId(context.params.id) },
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingGenre) {
      return Response.json({ error: 'Thể loại này đã tồn tại' }, { status: 400 });
    }

    const result = await db.collection('genres').findOneAndUpdate(
      { _id: new ObjectId(context.params.id) },
      { $set: { name, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return Response.json({ error: 'Genre not found' }, { status: 404 });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection('genres').findOneAndDelete({
      _id: new ObjectId(context.params.id)
    });

    if (!result) {
      return Response.json({ error: 'Genre not found' }, { status: 404 });
    }

    return Response.json({ message: 'Genre deleted successfully' });
  } catch (error) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 