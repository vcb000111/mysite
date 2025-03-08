import { NextResponse } from 'next/server';

const OUO_TOKEN = 'Hlw6RyvM';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Nếu URL đã là ouo.io link thì trả về nguyên bản
    if (url.includes('ouo.io')) {
      return NextResponse.json({ shortenedUrl: url });
    }

    const API_URL = `https://ouo.io/api/${OUO_TOKEN}?s=${encodeURIComponent(url)}`;

    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to shorten URL');
    }

    const shortenedUrl = await response.text();
    return NextResponse.json({ shortenedUrl: shortenedUrl.trim() });
  } catch (error) {
    console.error('Error shortening URL:', error);
    return NextResponse.json({ error: 'Failed to shorten URL' }, { status: 500 });
  }
} 