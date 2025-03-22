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

    // Thử các proxy server khác nhau
    const proxyServers = [
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://api.codetabs.com/v1/proxy?quest='
    ];

    let shortenedUrl = null;
    let lastError = null;

    for (const proxy of proxyServers) {
      try {
        const proxyUrl = `${proxy}${encodeURIComponent(API_URL)}`;
        console.log('Trying proxy:', proxyUrl);

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/plain',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
        });

        if (response.ok) {
          shortenedUrl = await response.text();
          console.log('Successfully shortened URL with proxy:', shortenedUrl);
          break;
        } else {
          lastError = `Proxy ${proxy} failed with status ${response.status}`;
          console.error('Proxy error:', lastError);
        }
      } catch (error) {
        lastError = error;
        console.error('Proxy error:', error);
      }
    }

    if (!shortenedUrl) {
      // Nếu tất cả proxy đều thất bại, thử gọi trực tiếp
      try {
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Accept': 'text/plain',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to shorten URL: ${response.status} ${response.statusText}`);
        }

        shortenedUrl = await response.text();
        console.log('Successfully shortened URL directly:', shortenedUrl);
      } catch (error) {
        console.error('Direct API call failed:', error);
        throw new Error(`All attempts failed. Last error: ${lastError}`);
      }
    }

    if (!shortenedUrl || shortenedUrl.includes('error')) {
      console.error('Invalid response from ouo.io:', shortenedUrl);
      throw new Error('Invalid response from URL shortener');
    }

    return NextResponse.json({ shortenedUrl: shortenedUrl.trim() });
  } catch (error) {
    console.error('Error in shorten route:', error);
    return NextResponse.json({
      error: 'Failed to shorten URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 