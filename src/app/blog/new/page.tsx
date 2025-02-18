'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Image, Tags, FolderOpen } from 'lucide-react';
import { GradientGenerator } from '@/app/utils/gradients';

// Import Editor động để tránh lỗi SSR
const Editor = dynamic(() => import('@/components/blog/Editor'), {
  ssr: false
});

export default function NewPost() {
  const router = useRouter();
  const [post, setPost] = useState({
    title: '',
    content: '',
    tags: [],
    category: '',
    coverImage: '',
    status: 'draft'
  });
  const [buttonClasses, setButtonClasses] = useState('');

  // Di chuyển việc tạo gradient vào useEffect
  useEffect(() => {
    setButtonClasses(GradientGenerator.getButtonClasses());
  }, []);

  const handleContentChange = (content: string) => {
    setPost(prev => ({
      ...prev,
      content
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
      if (res.ok) {
        router.push('/blog/posts');
      }
    } catch (error) {
      console.error('Lỗi khi tạo bài viết:', error);
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 m-2">
        <h1 className="text-2xl font-bold mb-4 text-center animate-gradient">
          Viết bài mới
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700">
            <input
              type="text"
              placeholder="Tiêu đề bài viết"
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              className="w-full p-3 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
                <Image className="w-5 h-5" />
                <span>Ảnh bìa</span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
                dark:file:bg-blue-900 dark:file:text-blue-300
                hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
                <Tags className="w-5 h-5" />
                <span>Thẻ</span>
              </div>
              <input
                type="text"
                placeholder="Nhập thẻ và nhấn Enter"
                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
                <FolderOpen className="w-5 h-5" />
                <span>Danh mục</span>
              </div>
              <select
                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={post.category}
                onChange={(e) => setPost({ ...post, category: e.target.value })}
              >
                <option value="">Chọn danh mục</option>
                <option value="tech">Công nghệ</option>
                <option value="life">Đời sống</option>
                <option value="news">Tin tức</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700">
            <Editor
              value={post.content}
              onChange={handleContentChange}
            />
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="submit"
              className={buttonClasses || 'px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium'}
            >
              Lưu bài viết
            </button>
            <button
              type="button"
              onClick={() => setPost({ ...post, status: 'published' })}
              className={buttonClasses || 'px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium'}
            >
              Xuất bản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 