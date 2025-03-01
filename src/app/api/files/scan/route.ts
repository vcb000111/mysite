import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface FileInfo {
  name: string;
  path: string;
  size: number;
}

async function scanDirectory(dirPath: string, basePath = ''): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      const subFiles = await scanDirectory(fullPath, relativePath);
      files.push(...subFiles);
    } else if (entry.isFile() && isVideoFile(entry.name)) {
      const stats = await fs.stat(fullPath);
      files.push({
        name: entry.name,
        path: relativePath,
        size: stats.size
      });
    }
  }

  return files;
}

function isVideoFile(filename: string): boolean {
  const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv'];
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

export async function POST(request: NextRequest) {
  try {
    const { folderPath } = await request.json();

    if (!folderPath) {
      return NextResponse.json(
        { error: 'Folder path is required' },
        { status: 400 }
      );
    }

    // Kiểm tra đường dẫn hợp lệ
    try {
      await fs.access(folderPath);
    } catch {
      return NextResponse.json(
        { error: 'Invalid folder path or access denied' },
        { status: 400 }
      );
    }

    const files = await scanDirectory(folderPath);

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error scanning directory:', error);
    return NextResponse.json(
      { error: 'Failed to scan directory' },
      { status: 500 }
    );
  }
} 