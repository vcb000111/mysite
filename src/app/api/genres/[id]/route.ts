import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { name } = await request.json();
    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { db } = await connectToDatabase();

    // Kiểm tra trùng tên với các thể loại khác
    const existingGenre = await db.collection('genres').findOne({
      _id: { $ne: new ObjectId(context.params.id) },
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingGenre) {
      return new Response(JSON.stringify({ error: 'Thể loại này đã tồn tại' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.collection('genres').findOneAndUpdate(
      { _id: new ObjectId(context.params.id) },
      { $set: { name, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return new Response(JSON.stringify({ error: 'Genre not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
      return new Response(JSON.stringify({ error: 'Genre not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Genre deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 