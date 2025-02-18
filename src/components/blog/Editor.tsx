'use client';

import { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import ImageTool from '@editorjs/image';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Editor({ value, onChange }: EditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const isReady = useRef(false);
  const editorDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady.current) {
      const initEditor = async () => {
        if (!editorRef.current) {
          const EditorJS = (await import('@editorjs/editorjs')).default;
          editorRef.current = new EditorJS({
            holder: editorDivRef.current!,
            data: {
              blocks: []
            },
            onChange: async () => {
              const content = await editorRef.current?.save();
              onChange(JSON.stringify(content));
            },
            placeholder: 'Bắt đầu viết bài...',
            tools: {
              image: {
                class: ImageTool,
                config: {
                  uploader: {
                    async uploadByFile(file: File) {
                      // Tạo FormData
                      const formData = new FormData();
                      formData.append('image', file);

                      // Upload ảnh
                      try {
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData,
                        });
                        const data = await response.json();

                        return {
                          success: 1,
                          file: {
                            url: data.url,
                          }
                        };
                      } catch (error) {
                        console.error('Upload error:', error);
                        return {
                          success: 0,
                          error: 'Upload failed'
                        };
                      }
                    }
                  }
                }
              }
            }
          });
          isReady.current = true;
        }
      };

      initEditor();
    }

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
        isReady.current = false;
      }
    };
  }, []);

  return (
    <div className="prose max-w-none min-h-[500px] dark:prose-invert">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Kéo thả hoặc paste ảnh trực tiếp vào editor
      </div>
      <div ref={editorDivRef} className="min-h-[400px] border dark:border-gray-700 rounded-lg p-4" />
    </div>
  );
} 