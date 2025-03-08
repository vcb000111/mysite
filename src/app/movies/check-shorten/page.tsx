'use client';

import { useState, useEffect } from 'react';
import { Link2, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Toast } from '@/lib/toast.helper';

interface Movie {
  _id: string;
  title: string;
  code: string;
  movieUrl: string;
}

export default function CheckShortenLinks() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<{ [key: string]: boolean }>({});

  // Fetch danh sách phim
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch('/api/movies');
        if (!response.ok) throw new Error('Failed to fetch movies');
        const data = await response.json();

        // Lọc chỉ lấy phim có movieUrl
        const moviesWithUrl = data.filter((movie: Movie) => movie.movieUrl && movie.movieUrl.trim() !== '');
        setMovies(moviesWithUrl);
      } catch (error) {
        console.error('Error fetching movies:', error);
        Toast.fire({
          icon: 'error',
          title: 'Không thể tải danh sách phim'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Kiểm tra một URL có phải là ouo.io link không
  const isOuoLink = (url: string): boolean => {
    return url.includes('ouo.io');
  };

  // Rút gọn link qua ouo.io
  const shortenLink = async (movieId: string, url: string) => {
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Failed to shorten URL');

      const { shortenedUrl } = await response.json();

      // Cập nhật link mới vào database
      const updateResponse = await fetch(`/api/movies/${movieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieUrl: shortenedUrl }),
      });

      if (!updateResponse.ok) throw new Error('Failed to update movie URL');

      return true;
    } catch (error) {
      console.error('Error shortening URL:', error);
      return false;
    }
  };

  // Kiểm tra và rút gọn tất cả link chưa được shorten
  const checkAndShortenAll = async () => {
    setChecking(true);
    const newResults = { ...results };

    try {
      for (const movie of movies) {
        if (!isOuoLink(movie.movieUrl)) {
          const success = await shortenLink(movie._id, movie.movieUrl);
          newResults[movie._id] = success;
          setResults(newResults);
        } else {
          newResults[movie._id] = true;
          setResults(newResults);
        }
      }

      Toast.fire({
        icon: 'success',
        title: 'Đã kiểm tra và rút gọn xong tất cả link'
      });
    } catch (error) {
      console.error('Error processing links:', error);
      Toast.fire({
        icon: 'error',
        title: 'Có lỗi xảy ra khi xử lý link'
      });
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Kiểm tra Shorten Link
        </h1>
        <button
          onClick={checkAndShortenAll}
          disabled={checking || movies.length === 0}
          className={`px-4 py-2 rounded-lg flex items-center gap-2
            ${checking || movies.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors`}
        >
          <Link2 className="w-4 h-4" />
          <span>{checking ? 'Đang xử lý...' : 'Kiểm tra & Rút gọn tất cả'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-gray-600 dark:text-gray-300">Mã số</th>
                <th className="px-6 py-3 text-gray-600 dark:text-gray-300">Tên phim</th>
                <th className="px-6 py-3 text-gray-600 dark:text-gray-300">Link hiện tại</th>
                <th className="px-6 py-3 text-gray-600 dark:text-gray-300">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {movies.map((movie) => (
                <tr key={movie._id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="px-6 py-4 text-gray-800 dark:text-gray-200">
                    {movie.code}
                  </td>
                  <td className="px-6 py-4 text-gray-800 dark:text-gray-200">
                    {movie.title}
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={movie.movieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                    >
                      <span className="truncate max-w-xs">{movie.movieUrl}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    {checking ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    ) : results[movie._id] !== undefined ? (
                      results[movie._id] ? (
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="w-5 h-5" />
                          <span>Đã rút gọn</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500">
                          <XCircle className="w-5 h-5" />
                          <span>Lỗi rút gọn</span>
                        </div>
                      )
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400">
                        {isOuoLink(movie.movieUrl) ? 'Đã là ouo.io' : 'Chưa rút gọn'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {movies.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Không có phim nào có link cần kiểm tra
          </div>
        )}
      </div>
    </div>
  );
} 