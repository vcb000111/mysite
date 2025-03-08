import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Tạo schema cho feedback
const FeedbackSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['feedback', 'request'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  movieCode: String,
  contact: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed'],
    default: 'pending'
  }
});

// Tạo model (chỉ tạo nếu chưa tồn tại)
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo mới nhất
      .lean();

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.content || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Create new feedback
    const feedback = await Feedback.create({
      type: body.type,
      title: body.title,
      content: body.content,
      movieCode: body.movieCode,
      contact: body.contact
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 