'use client';

import { useState, useEffect } from 'react';
import { Copy, Loader2, Search } from 'lucide-react';
import { Toast } from '@/lib/toast.helper';

interface Movie {
  _id: string;
  poster: string;
  code: string;
  title: string;
  genre: string;
  movieUrl: string;
}

export default function GenerateComment() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const response = await fetch('/api/movies');
      if (!response.ok) throw new Error('Failed to fetch movies');
      const data = await response.json();
      setMovies(data);
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

  const generateComment = (movie: Movie) => {
    const comment = `
[img]${movie.poster}[/img]

[color=#cc0000][b]Download more SUBJECTIVITY, POV, PROSTITUTION ENGLISH SOFT SUBBED movies from Bmink.info[/b][/color]

[b]Title[/b]: ${movie.title}
[b]Code[/b]: ${movie.code}
[b]Genre[/b]: ${movie.genre}
[b]Subtitle[/b]: English Softsub
[b]Download URL[/b]: [url=${movie.movieUrl}]${movie.movieUrl}[/url]
[b]More movies[/b]: [url=https://bmink.info]Bmink.info[/url]
[b]Access Tutorial[/b]: 
   - Step 1: Visit [url=https://bmink.info]Bmink.info[/url]
   - Step 2: Click "Enter giftcode" in the sidebar
   - Step 3: Enter the giftcode in the format ddMMyyyy9999. For example, if today is 09/03/2025, please enter 090320259999 to unlock the Movies List.
[b]Note[/b]:
   - If you encounter an "ACCESS ERROR" message, please copy the link and paste it into a new tab in your browser. This should work.
   - Request more SUBJECTIVITY, POV, PROSTITUTION ENGLISH SOFT SUBBED movies from [url=https://bmink.info/movies/feedback]Bmink.info/movies/feedback[/url]
   `;

    return comment;
  };

  const copyToClipboard = async (movie: Movie) => {
    const comment = generateComment(movie);
    try {
      // Phương pháp 1: Sử dụng Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(comment);
        Toast.fire({
          icon: 'success',
          title: 'Đã sao chép vào clipboard'
        });
        return;
      }

      // Phương pháp 2: Sử dụng textarea tạm thời
      const textarea = document.createElement('textarea');
      textarea.value = comment;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand('copy');
        document.body.removeChild(textarea);
        Toast.fire({
          icon: 'success',
          title: 'Đã sao chép vào clipboard'
        });
      } catch (err) {
        document.body.removeChild(textarea);
        throw new Error('Không thể sao chép');
      }
    } catch (err) {
      console.error('Copy failed:', err);

      // Hiển thị modal với nội dung để người dùng có thể copy manually
      const textArea = document.createElement('textarea');
      textArea.value = comment;
      textArea.style.width = '100%';
      textArea.style.height = '200px';
      textArea.style.margin = '10px 0';
      textArea.style.padding = '10px';
      textArea.style.resize = 'none';

      Toast.fire({
        icon: 'error',
        title: 'Không thể tự động sao chép',
        html: `
          <p class="mb-2">Vui lòng sao chép thủ công nội dung bên dưới:</p>
          ${textArea.outerHTML}
        `,
        customClass: {
          popup: 'dark:bg-gray-800 dark:text-white',
          title: 'text-red-500',
          htmlContainer: 'text-left'
        }
      });
    }
  };

  const copyMovieCode = async (code: string) => {
    try {
      // Phương pháp 1: Sử dụng Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        setCopiedCode(code);
        Toast.fire({
          icon: 'success',
          title: 'Đã sao chép mã phim'
        });
        return;
      }

      // Phương pháp 2: Sử dụng textarea tạm thời
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.left = '0';
      textarea.style.top = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedCode(code);
        Toast.fire({
          icon: 'success',
          title: 'Đã sao chép mã phim'
        });
      } catch (err) {
        document.body.removeChild(textarea);
        throw new Error('Không thể sao chép');
      }
    } catch (err) {
      console.error('Copy failed:', err);
      Toast.fire({
        icon: 'error',
        title: 'Không thể sao chép mã phim',
        text: code
      });
    }
  };

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center animate-gradient">
        Generate Forum Comment
      </h1>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, mã phim hoặc thể loại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
              focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Movies List */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Poster
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Mã phim
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tiêu đề
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Thể loại
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMovies.map((movie, index) => (
                  <tr key={movie._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {movie.poster && (
                        <button
                          onClick={() => {
                            // Hiển thị ảnh lớn khi click
                            Toast.fire({
                              imageUrl: movie.poster,
                              imageWidth: 400,
                              imageAlt: movie.title,
                              showConfirmButton: false,
                              customClass: {
                                popup: 'dark:bg-gray-800',
                              }
                            });
                          }}
                          className="hover:opacity-80 transition-opacity duration-200"
                        >
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-128 object-cover rounded"

                          />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <button
                        onClick={() => copyMovieCode(movie.code)}
                        className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors duration-200 
                          flex items-center gap-1 group"
                      >
                        {movie.code}
                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </button>
                    </td>
                    <td className={`px-4 py-3 text-sm transition-colors duration-200
                      ${copiedCode === movie.code
                        ? 'text-green-600 dark:text-green-400 font-medium'
                        : 'text-gray-900 dark:text-white'
                      }`}>
                      {movie.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {movie.genre}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => copyToClipboard(movie)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg
                          hover:bg-blue-600 transition-colors text-xs"
                      >
                        <Copy className="w-3 h-3" />
                        Generate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMovies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Không tìm thấy phim nào
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 