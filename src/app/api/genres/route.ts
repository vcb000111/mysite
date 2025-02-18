import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const genres = await db.collection('genres').find({}).sort({ createdAt: -1 }).toArray();
    return Response.json(genres);
  } catch (error) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Kiểm tra trùng tên
    const existingGenre = await db.collection('genres').findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingGenre) {
      return Response.json({ error: 'Thể loại này đã tồn tại' }, { status: 400 });
    }

    const result = await db.collection('genres').insertOne({
      name,
      createdAt: new Date(),
    });

    return Response.json({
      _id: result.insertedId,
      name,
      createdAt: new Date(),
    });
  } catch (error) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 