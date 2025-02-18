'use client';

import { QRCodeGenerator } from './components/QRCodeGenerator';

export default function QRCodePage() {
  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 m-2">
        <h1 className="text-2xl font-bold mb-4 text-center animate-gradient">
          Tạo mã QR
        </h1>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700">
          <QRCodeGenerator />
        </div>
      </div>
    </div>
  );
} 