import { NextResponse } from 'next/server';

const OUO_TOKEN = process.env.OUO_TOKEN || 'Hlw6RyvM';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      console.error('URL is missing in request');
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Nếu URL đã là ouo.io link thì trả về nguyên bản
    if (url.includes('ouo.io')) {
      console.log('URL is already an ouo.io link:', url);
      return NextResponse.json({ shortenedUrl: url });
    }

    const API_URL = `https://ouo.io/api/${OUO_TOKEN}?s=${encodeURIComponent(url)}`;
    console.log('Calling ouo.io API with URL:', API_URL);

    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
    });

    if (!response.ok) {
      console.error('ouo.io API error:', {
        status: response.status,
        statusText: response.statusText,
        url: API_URL
      });
      throw new Error(`Failed to shorten URL: ${response.status} ${response.statusText}`);
    }

    const shortenedUrl = await response.text();
    console.log('Successfully shortened URL:', shortenedUrl);

    if (!shortenedUrl || shortenedUrl.includes('error')) {
      console.error('Invalid response from ouo.io:', shortenedUrl);
      throw new Error('Invalid response from URL shortener');
    }

    return NextResponse.json({ shortenedUrl: shortenedUrl.trim() });
  } catch (error) {
    console.error('Error in shorten route:', error);
    // Trả về lỗi chi tiết hơn
    return NextResponse.json({
      error: 'Failed to shorten URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 