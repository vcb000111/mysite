'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { SketchPicker } from 'react-color';
import { Download, Upload } from 'lucide-react';
import { GradientGenerator } from '@/app/utils/gradients';

interface QRCodeConfig {
  value: string;
  size: number;
  bgColor: string;
  fgColor: string;
  level: 'L' | 'M' | 'Q' | 'H';
  includeImage: boolean;
  imageH: number;
  imageW: number;
  imageUrl: string;
}

export function QRCodeGenerator() {
  const [config, setConfig] = useState<QRCodeConfig>({
    value: 'https://example.com',
    size: 256,
    bgColor: '#FFFFFF',
    fgColor: '#000000',
    level: 'H',
    includeImage: false,
    imageH: 24,
    imageW: 24,
    imageUrl: '',
  });

  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showFgPicker, setShowFgPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadButtonClasses, setUploadButtonClasses] = useState('');
  const [downloadButtonClasses, setDownloadButtonClasses] = useState('');

  useEffect(() => {
    setUploadButtonClasses(GradientGenerator.getButtonClasses());
    setDownloadButtonClasses(GradientGenerator.getButtonClasses());
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setConfig(prev => ({
          ...prev,
          imageUrl: reader.result as string,
          includeImage: true
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Tạo canvas mới với padding và border
      const padding = 20;
      const borderWidth = 2;
      const newCanvas = document.createElement('canvas');
      const ctx = newCanvas.getContext('2d');
      if (!ctx) return;

      // Set kích thước canvas mới
      newCanvas.width = canvas.width + (padding + borderWidth) * 2;
      newCanvas.height = canvas.height + (padding + borderWidth) * 2;

      // Vẽ background màu trắng
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

      // Vẽ border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(borderWidth/2, borderWidth/2, newCanvas.width - borderWidth, newCanvas.height - borderWidth);

      // Vẽ QR code vào giữa
      ctx.drawImage(canvas, padding + borderWidth, padding + borderWidth);

      // Tải xuống canvas mới
      const url = newCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = url;
      link.click();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nội dung QR Code</label>
            <input
              type="text"
              name="value"
              value={config.value}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md text-black"
              placeholder="Nhập URL hoặc văn bản"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Kích thước (px)</label>
            <input
              type="number"
              name="size"
              value={config.size}
              onChange={handleInputChange}
              min="128"
              max="512"
              step="32"
              className="w-full p-2 border rounded-md text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Độ phức tạp</label>
            <select
              name="level"
              value={config.level}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md text-black"
            >
              <option value="L">Thấp</option>
              <option value="M">Trung bình</option>
              <option value="Q">Khá</option>
              <option value="H">Cao</option>
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-2">Màu nền</label>
            <div
              className="w-full h-10 border rounded-md cursor-pointer"
              style={{ backgroundColor: config.bgColor }}
              onClick={() => setShowBgPicker(!showBgPicker)}
            />
            {showBgPicker && (
              <div className="absolute z-10">
                <div className="fixed inset-0" onClick={() => setShowBgPicker(false)} />
                <SketchPicker
                  color={config.bgColor}
                  onChange={(color) => setConfig(prev => ({ ...prev, bgColor: color.hex }))}
                />
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-2">Màu mã QR</label>
            <div
              className="w-full h-10 border rounded-md cursor-pointer"
              style={{ backgroundColor: config.fgColor }}
              onClick={() => setShowFgPicker(!showFgPicker)}
            />
            {showFgPicker && (
              <div className="absolute z-10">
                <div className="fixed inset-0" onClick={() => setShowFgPicker(false)} />
                <SketchPicker
                  color={config.fgColor}
                  onChange={(color) => setConfig(prev => ({ ...prev, fgColor: color.hex }))}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Icon ở giữa</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full justify-center ${uploadButtonClasses || 'flex items-center gap-2 px-4 py-2 font-semibold text-white rounded-lg bg-blue-500 hover:bg-blue-600'}`}
            >
              <Upload size={20} />
              <span>Tải lên icon</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center gap-5">
        <label className="block text-xl font-medium">Mã QR Code</label>
        <div className="p-4 bg-white rounded-lg shadow-lg">
          <QRCodeCanvas
            value={config.value}
            size={config.size}
            bgColor={config.bgColor}
            fgColor={config.fgColor}
            level={config.level}
            imageSettings={config.includeImage ? {
              src: config.imageUrl,
              height: config.imageH,
              width: config.imageW,
              excavate: true,
            } : undefined}
          />
        </div>
        <button
          onClick={downloadQRCode}
          className={`w-full max-w-[256px] justify-center ${downloadButtonClasses || 'flex items-center gap-2 px-4 py-2 font-semibold text-white rounded-lg bg-blue-500 hover:bg-blue-600'}`}
        >
          <Download size={20} />
          <span>Tải xuống</span>
        </button>
      </div>
    </div>
  );
} 