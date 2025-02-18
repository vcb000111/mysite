'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Plus, Search, Star, StarOff, Edit, Trash2, X, Link as LinkIcon, Heart, HeartOff, Eye, EyeOff, Check } from 'lucide-react';
import { GradientGenerator } from '@/app/utils/gradients';
import React from 'react';
import Swal from 'sweetalert2';

interface Movie {
  _id: string;
  title: string;
  code: string;
  actress: string;
  poster: string;
  year: number;
  rating: number;
  genre: string[];
  isFavorite: boolean;
  isSeen: boolean;
  releaseDate: string;
  createdAt: string;
}

interface MovieInput {
  title: string;
  code: string;
  poster: string;
  releaseDate: string;
  actress: string;
  genre: string[];
}

const mockMovies: Movie[] = [
  {
    _id: '1',
    title: 'Inception',
    poster: 'https://placehold.co/300x450',
    year: 2010,
    rating: 8.8,
    genre: ['Action', 'Sci-Fi'],
    isFavorite: true,
    isSeen: false,
    releaseDate: '2010-07-16',
    code: 'tt0133093',
    actress: 'Leonardo DiCaprio',
    createdAt: '2024-04-01T12:00:00'
  }
];

// Thêm Toast helper ở đầu file
const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

// Thêm hàm helper để xử lý tên diễn viên
const formatActressName = (actress: string) => {
  const words = actress.split(' ');
  const pairs = [];

  for (let i = 0; i < words.length; i += 2) {
    if (i + 1 < words.length) {
      // Nếu còn đủ 2 từ
      pairs.push(words[i] + ' ' + words[i + 1]);
    } else {
      // Nếu chỉ còn 1 từ cuối
      pairs.push(words[i]);
    }
  }

  return pairs;
};

// Thêm hàm helper để làm việc với localStorage
const LAST_SELECTED_GENRES_KEY = 'lastSelectedGenres';

const saveLastSelectedGenres = (genres: string[]) => {
  localStorage.setItem(LAST_SELECTED_GENRES_KEY, JSON.stringify(genres));
};

const getLastSelectedGenres = (): string[] => {
  try {
    const saved = localStorage.getItem(LAST_SELECTED_GENRES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Cập nhật kiểu SortOrder
type SortOrder = 'added' | 'newest' | 'oldest';

export default function MovieList() {
  const [buttonClasses, setButtonClasses] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [movieUrl, setMovieUrl] = useState('');
  const [movieInput, setMovieInput] = useState<MovieInput>({
    title: '',
    code: '',
    poster: '',
    releaseDate: '',
    actress: '',
    genre: getLastSelectedGenres() // Khởi tạo với genres đã lưu
  });
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deletingMovie, setDeletingMovie] = useState<Movie | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [showRating, setShowRating] = useState<string | null>(null);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [showSeen, setShowSeen] = useState(false);
  const [showFavorite, setShowFavorite] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('added');
  const [genres, setGenres] = useState<string[]>([]);
  const [showRandom, setShowRandom] = useState(false);
  const [selectedActress, setSelectedActress] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch('/api/movies');
        if (response.ok) {
          const data = await response.json();
          setMovies(data);
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
      }
    };

    fetchMovies();
    setButtonClasses(GradientGenerator.getButtonClasses());
  }, []);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/genres');
        if (response.ok) {
          const data = await response.json();
          setGenres(data.map((genre: { name: string }) => genre.name));
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };

    fetchGenres();
    setButtonClasses(GradientGenerator.getButtonClasses());
  }, []);

  useEffect(() => {
    if (showPasteArea && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showPasteArea]);

  const handleAddMovie = async () => {
    try {
      if (!movieInput.title || !movieInput.code) {
        Toast.fire({
          icon: 'error',
          title: 'Vui lòng nhập đầy đủ thông tin'
        });
        return;
      }

      const movieData = {
        title: movieInput.title,
        code: movieInput.code,
        actress: movieInput.actress,
        poster: movieInput.poster || 'https://placehold.co/300x450',
        releaseDate: movieInput.releaseDate,
        year: new Date(movieInput.releaseDate).getFullYear(),
        rating: 0,
        genre: movieInput.genre,
        isFavorite: false,
        isSeen: false
      };

      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieData),
      });

      if (!response.ok) {
        throw new Error('Failed to add movie');
      }

      const newMovie = await response.json();
      setMovies(prev => [{
        ...newMovie,
        isSeen: false
      }, ...prev]);
      setShowModal(false);
      setMovieInput({
        title: '',
        code: '',
        poster: '',
        releaseDate: '',
        actress: '',
        genre: getLastSelectedGenres() // Lưu genres đã chọn trước khi reset form
      });
      resetForm();
      saveLastSelectedGenres(movieInput.genre);
      Toast.fire({
        icon: 'success',
        title: 'Thêm phim mới thành công'
      });
    } catch (error) {
      console.error('Error adding movie:', error);
      Toast.fire({
        icon: 'error',
        title: 'Có lỗi xảy ra khi thêm phim'
      });
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    try {
      const response = await fetch(`/api/movies/${movieId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete movie');

      setMovies(prev => prev.filter(movie => movie._id !== movieId));
      setDeletingMovie(null);
      Toast.fire({
        icon: 'success',
        title: 'Xóa phim thành công'
      });
    } catch (error) {
      console.error('Error deleting movie:', error);
      Toast.fire({
        icon: 'error',
        title: 'Có lỗi xảy ra khi xóa phim'
      });
    }
  };

  const handleEditMovie = async () => {
    if (!editingMovie) return;

    try {
      const response = await fetch(`/api/movies/${editingMovie._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...movieInput,
          isSeen: editingMovie.isSeen,
          isFavorite: editingMovie.isFavorite,
          rating: editingMovie.rating
        }),
      });

      if (!response.ok) throw new Error('Failed to update movie');

      const updatedMovie = await response.json();
      setMovies(prev => prev.map(movie =>
        movie._id === updatedMovie._id ? updatedMovie : movie
      ));
      setEditingMovie(null);
      setShowModal(false);
      setMovieInput({
        title: '',
        code: '',
        poster: '',
        releaseDate: '',
        actress: '',
        genre: getLastSelectedGenres() // Khôi phục genres đã lưu
      });
      resetForm();
      saveLastSelectedGenres(movieInput.genre);
      Toast.fire({
        icon: 'success',
        title: 'Cập nhật phim thành công'
      });
    } catch (error) {
      console.error('Error updating movie:', error);
      Toast.fire({
        icon: 'error',
        title: 'Có lỗi xảy ra khi cập nhật phim'
      });
    }
  };

  const handleToggleFavorite = async (movieId: string, isFavorite: boolean) => {
    try {
      const response = await fetch(`/api/movies/${movieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite: !isFavorite }),
      });

      if (!response.ok) throw new Error('Failed to update favorite');

      setMovies(prev => prev.map(movie =>
        movie._id === movieId ? { ...movie, isFavorite: !isFavorite } : movie
      ));
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleRating = async (movieId: string, rating: number) => {
    try {
      const response = await fetch(`/api/movies/${movieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) throw new Error('Failed to update rating');

      setMovies(prev => prev.map(movie =>
        movie._id === movieId ? { ...movie, rating } : movie
      ));
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const handleToggleSeen = async (movieId: string, isSeen: boolean) => {
    try {
      const response = await fetch(`/api/movies/${movieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isSeen: !isSeen }),
      });

      if (!response.ok) throw new Error('Failed to update seen status');

      setMovies(prev => prev.map(movie =>
        movie._id === movieId ? { ...movie, isSeen: !isSeen } : movie
      ));
    } catch (error) {
      console.error('Error updating seen status:', error);
    }
  };

  const resetForm = () => {
    setMovieInput({
      title: '',
      code: '',
      poster: '',
      releaseDate: '',
      actress: '',
      genre: getLastSelectedGenres()
    });
    setEditingMovie(null);
    setShowPasteArea(true); // Tự động mở textarea
  };

  // Cập nhật hàm parseMovieInfo để bỏ phần parse genre
  const parseMovieInfo = (text: string) => {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      const info: Partial<MovieInput> = {};

      // Parse title - lấy dòng đầu tiên có chứa chữ
      for (const line of lines) {
        if (line && !line.startsWith('ID:') && !line.startsWith('Release') && !line.startsWith('Cast:') && !line.startsWith('Genre')) {
          info.title = line.trim();
          break;
        }
      }

      // Parse ID/code
      const idLine = lines.find(line => line.includes('ID:'));
      if (idLine) {
        const idMatch = idLine.match(/ID:\s*(.+)/);
        if (idMatch) info.code = idMatch[1].trim();
      }

      // Parse release date
      const dateLine = lines.find(line => line.includes('Release Date:'));
      if (dateLine) {
        const dateMatch = dateLine.match(/Release Date:\s*(.+)/);
        if (dateMatch) info.releaseDate = dateMatch[1].trim();
      }

      // Parse cast/actress
      const castLine = lines.find(line => line.includes('Cast:'));
      if (castLine) {
        const castMatch = castLine.match(/Cast:\s*(.+)/);
        if (castMatch) info.actress = castMatch[1].trim();
      }

      // Log để debug
      console.log('Parsed Info:', info);
      console.log('Original Text:', text);

      return Object.keys(info).length > 0 ? info : null;
    } catch (error) {
      console.error('Error parsing movie info:', error);
      return null;
    }
  };

  // Cập nhật hàm handlePaste để giữ nguyên genre hiện tại
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    setPasteText(pastedText);

    // Tự động parse và áp dụng thông tin sau khi paste
    const parsedInfo = parseMovieInfo(pastedText);
    if (parsedInfo) {
      setMovieInput(prev => ({
        ...prev,
        ...parsedInfo,
        genre: prev.genre // Giữ nguyên genre đã chọn
      }));
      setPasteText('');
      setShowPasteArea(false);
      Toast.fire({
        icon: 'success',
        title: 'Đã áp dụng thông tin thành công'
      });
    } else {
      Toast.fire({
        icon: 'error',
        title: 'Không thể đọc được thông tin. Vui lòng kiểm tra lại định dạng.'
      });
    }
  };

  // Lấy danh sách unique genres từ tất cả phim
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    movies.forEach(movie => {
      movie.genre.forEach(g => genres.add(g));
    });
    return Array.from(genres).sort();
  }, [movies]);

  // Lấy danh sách diễn viên unique
  const allActresses = useMemo(() => {
    const actresses = new Set<string>();
    movies.forEach(movie => {
      const pairs = formatActressName(movie.actress);
      pairs.forEach(pair => actresses.add(pair));
    });
    return Array.from(actresses).sort();
  }, [movies]);

  // Cập nhật hàm lọc và sort
  const filteredMovies = useMemo(() => {
    let filtered = [...movies]
      .filter(movie => {
        const matchesSearch = searchTerm.trim() ? (() => {
          const searchLower = searchTerm.toLowerCase().trim();
          return (
            movie.title.toLowerCase().includes(searchLower) ||
            movie.code.toLowerCase().includes(searchLower) ||
            movie.actress.toLowerCase().includes(searchLower) ||
            movie.genre.some(g => g.toLowerCase().includes(searchLower))
          );
        })() : true;

        const matchesFilters = (!showSeen || movie.isSeen) && (!showFavorite || movie.isFavorite);
        const matchesGenre = !selectedGenre || movie.genre.includes(selectedGenre);
        const matchesActress = !selectedActress || formatActressName(movie.actress).includes(selectedActress);

        return matchesSearch && matchesFilters && matchesGenre && matchesActress;
      })
      .sort((a, b) => {
        if (sortOrder === 'added') {
          // Sắp xếp theo createdAt (ngày thêm phim)
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          return timeB - timeA; // Mới nhất lên đầu
        } else {
          // Sắp xếp theo releaseDate
          const dateA = new Date(a.releaseDate).getTime();
          const dateB = new Date(b.releaseDate).getTime();
          return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        }
      });

    // Nếu chọn ngẫu nhiên, trộn mảng
    if (showRandom) {
      filtered = filtered.sort(() => Math.random() - 0.5);
    }

    return filtered;
  }, [movies, searchTerm, showSeen, showFavorite, selectedGenre, sortOrder, showRandom, selectedActress]);

  // Thêm hàm reset
  const resetAllFilters = () => {
    setSearchTerm('');
    setShowSeen(false);
    setShowFavorite(false);
    setShowRandom(false);
    setSelectedGenre('');
    setSelectedActress('');
  };

  // Thêm hàm xử lý enter
  const handleKeyDown = (e: React.KeyboardEvent, action: 'add' | 'edit') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (action === 'add') {
        handleAddMovie();
      } else {
        handleEditMovie();
      }
    }
  };

  // Cập nhật useEffect để focus khi mở modal
  useEffect(() => {
    if (showModal && !editingMovie && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showModal, editingMovie]);

  return (
    <div className="w-full p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold animate-gradient">Danh sách phim</h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className={buttonClasses || 'flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all duration-200 bg-blue-500 hover:bg-blue-600'}
          >
            <Plus className="w-5 h-5" />
            Thêm phim mới
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-6 space-y-4">
          {/* Search controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề, mã phim, diễn viên, thể loại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 rounded-lg border dark:border-gray-700 
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                  transition-all duration-200"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                    text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                    focus:outline-none focus:text-gray-600 dark:focus:text-gray-300
                    transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Checkbox filters */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSeen}
                    onChange={(e) => setShowSeen(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 
                      focus:ring-blue-500 dark:border-gray-600
                      dark:focus:ring-offset-gray-800"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Đã xem
                  </span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFavorite}
                    onChange={(e) => setShowFavorite(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 
                      focus:ring-blue-500 dark:border-gray-600
                      dark:focus:ring-offset-gray-800"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Yêu thích
                  </span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRandom}
                    onChange={(e) => setShowRandom(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 
                      focus:ring-blue-500 dark:border-gray-600
                      dark:focus:ring-offset-gray-800"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Ngẫu nhiên
                  </span>
                </label>
              </div>

              {/* Actress select */}
              <select
                value={selectedActress}
                onChange={(e) => setSelectedActress(e.target.value)}
                className="px-2 py-1 rounded-lg border dark:border-gray-700
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                  transition-all duration-200 text-sm"
              >
                <option value="">Tất cả diễn viên</option>
                {allActresses.map(actress => (
                  <option key={actress} value={actress}>{actress}</option>
                ))}
              </select>

              {/* Genre select */}
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-2 py-1 rounded-lg border dark:border-gray-700
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                  transition-all duration-200 text-sm"
              >
                <option value="">Tất cả thể loại</option>
                {allGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>

              {/* Sort select */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="px-2 py-1 rounded-lg border dark:border-gray-700
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                  transition-all duration-200 text-sm"
              >
                <option value="added">Ngày thêm</option>
                <option value="newest">Ngày phát hành (Mới nhất)</option>
                <option value="oldest">Ngày phát hành (Cũ nhất)</option>
              </select>
            </div>

            {/* Reset button */}
            {(searchTerm || showSeen || showFavorite || selectedGenre || selectedActress) && (
              <button
                onClick={resetAllFilters}
                className="px-2 py-1 rounded-lg text-sm
                  bg-gray-100 hover:bg-gray-200 
                  dark:bg-gray-700 dark:hover:bg-gray-600
                  text-gray-600 dark:text-gray-300
                  transition-colors duration-200
                  flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredMovies.length === movies.length ? (
              <span>Tổng số {movies.length} phim</span>
            ) : (
              <span>Hiển thị {filteredMovies.length}/{movies.length} phim</span>
            )}
          </div>
        </div>

        {/* Movie grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMovies.map(movie => (
            <div
              key={movie._id}
              className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-700
                hover:shadow-lg transition-all duration-200"
            >
              {/* Poster */}
              <div className="relative overflow-hidden group aspect-video">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover object-top rounded-t-xl 
                    transition-transform duration-300 group-hover:scale-110
                    bg-gray-100 dark:bg-gray-800"
                />

                {/* Seen badge */}
                {movie.isSeen && (
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-800/90 
                    p-1.5 rounded-full shadow-lg z-10 backdrop-blur-sm"
                  >
                    <Eye className="w-4 h-4 text-green-500" fill="currentColor" />
                  </div>
                )}

                {/* Genre badge */}
                <div className="absolute bottom-3 left-3 z-10">
                  <button
                    onClick={() => setSelectedGenre(movie.genre[0] || '')}
                    className="px-2 py-1 text-xs rounded-md
                      bg-black/70 backdrop-blur-sm
                      text-white font-medium
                      hover:bg-black/80 transition-colors duration-200"
                  >
                    {movie.genre[0] || 'N/A'}
                  </button>
                </div>

                {/* Year badge */}
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm
                  px-2 py-1 rounded-md text-white text-sm font-medium z-10"
                >
                  {new Date(movie.releaseDate).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).split('/').join('-')}
                </div>

                {/* Favorite badge */}
                {movie.isFavorite && (
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 
                    p-1.5 rounded-full shadow-lg z-10 backdrop-blur-sm"
                  >
                    <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
                  </div>
                )}

                {/* Overlay khi hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40
                  transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    {/* Action buttons */}
                    <div className="flex items-center justify-center gap-2">
                      {/* Seen button */}
                      <button
                        onClick={() => handleToggleSeen(movie._id, movie.isSeen)}
                        className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg
                          hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        {movie.isSeen ? (
                          <Eye className="w-5 h-5 text-green-500" fill="currentColor" />
                        ) : (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* Favorite button */}
                      <button
                        onClick={() => handleToggleFavorite(movie._id, movie.isFavorite)}
                        className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg
                          hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        {movie.isFavorite ? (
                          <Heart className="w-5 h-5 text-red-500" fill="currentColor" />
                        ) : (
                          <HeartOff className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* Rating button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowRating(movie._id)}
                          className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg
                            hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                        >
                          <Star
                            className="w-5 h-5 text-yellow-500"
                            fill={movie.rating > 0 ? "currentColor" : "none"}
                          />
                        </button>

                        {/* Rating popup */}
                        {showRating === movie._id && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2
                            bg-white dark:bg-gray-800 rounded-lg shadow-xl
                            border border-gray-100 dark:border-gray-700
                            transform scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100
                            transition-all duration-200 z-50"
                          >
                            <div className="flex items-center gap-1 px-2 py-1">
                              {[...Array(10)].map((_, index) => (
                                <button
                                  key={index}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRating(movie._id, index + 1);
                                    setShowRating(null);
                                  }}
                                  onMouseEnter={(e) => {
                                    const stars = e.currentTarget.parentElement?.children;
                                    if (stars) {
                                      for (let i = 0; i <= index; i++) {
                                        (stars[i] as HTMLElement).querySelector('svg')?.classList.add('text-yellow-500');
                                        (stars[i] as HTMLElement).querySelector('svg')?.classList.add('fill-current');
                                      }
                                      for (let i = index + 1; i < stars.length; i++) {
                                        (stars[i] as HTMLElement).querySelector('svg')?.classList.remove('text-yellow-500');
                                        (stars[i] as HTMLElement).querySelector('svg')?.classList.remove('fill-current');
                                      }
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    if (!showRating) return;
                                    const stars = document.querySelectorAll('.rating-star');
                                    stars.forEach((star, i) => {
                                      if (i < movie.rating) {
                                        star.classList.add('text-yellow-500');
                                        star.classList.add('fill-current');
                                      } else {
                                        star.classList.remove('text-yellow-500');
                                        star.classList.remove('fill-current');
                                      }
                                    });
                                  }}
                                  className="p-1 hover:scale-110 transition-transform"
                                >
                                  <Star
                                    className={`w-4 h-4 rating-star ${index < movie.rating
                                      ? 'text-yellow-500 fill-current'
                                      : 'text-gray-300 dark:text-gray-600'
                                      }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Edit button */}
                      <button
                        onClick={() => {
                          setMovieInput({
                            title: movie.title,
                            code: movie.code,
                            poster: movie.poster,
                            releaseDate: movie.releaseDate,
                            actress: movie.actress,
                            genre: movie.genre
                          });
                          setEditingMovie(movie);
                          setShowModal(true);
                        }}
                        className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg
                          hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        <Edit className="w-5 h-5 text-blue-500" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => setDeletingMovie(movie)}
                        className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg
                          hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Movie info */}
              <div className="p-4 space-y-2">
                {/* Title */}
                <div
                  id={`movie-${movie._id}`}
                  className="relative group h-[72px]"
                >
                  <h3
                    className="text-lg font-semibold text-gray-800 dark:text-white
                      line-clamp-3 cursor-pointer leading-6 hover:text-blue-500 dark:hover:text-blue-400
                      transition-colors duration-200"
                    onClick={() => {
                      setMovieInput({
                        title: movie.title,
                        code: movie.code,
                        poster: movie.poster,
                        releaseDate: movie.releaseDate,
                        actress: movie.actress,
                        genre: movie.genre
                      });
                      setEditingMovie(movie);
                      setShowModal(true);
                    }}
                  >
                    {movie.title}
                  </h3>
                </div>

                {/* Code and Rating */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                    {movie.code.split('-').map((part, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && (
                          <span className="text-base font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                            -
                          </span>
                        )}
                        <button
                          onClick={() => setSearchTerm(part)}
                          className="text-base font-bold bg-gradient-to-r from-blue-500 to-purple-500 
                            bg-clip-text text-transparent hover:from-blue-600 hover:to-purple-600
                            transition-colors duration-200 focus:outline-none
                            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                            focus:ring-opacity-50 rounded px-0.5"
                        >
                          {part}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                  <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                    <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    {movie.rating || 0}
                  </span>
                </div>

                {/* Actress */}
                <div className="text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-2">
                  {formatActressName(movie.actress).map((pair, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(pair);
                      }}
                      className="hover:text-blue-500 dark:hover:text-blue-400 
                        transition-colors duration-200 hover:underline
                        focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                        focus:ring-opacity-50 rounded"
                    >
                      {pair}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingMovie ? 'Sửa phim' : 'Thêm phim mới'}
              </h2>

              <div className="space-y-4" onKeyDown={(e) => handleKeyDown(e, editingMovie ? 'edit' : 'add')}>
                {/* Paste area */}
                {!editingMovie && (
                  <div className="space-y-2">
                    <textarea
                      ref={textareaRef}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      onPaste={handlePaste}
                      placeholder="Paste thông tin phim vào đây..."
                      className="w-full h-40 p-3 text-sm border rounded-lg 
                        dark:bg-gray-700 dark:border-gray-600 dark:text-white
                        focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Input fields */}
                <input
                  type="text"
                  placeholder="Tiêu đề *"
                  value={movieInput.title}
                  onChange={(e) => setMovieInput({ ...movieInput, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-700
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                    required:border-red-500 dark:required:border-red-500
                    invalid:border-red-500 dark:invalid:border-red-500"
                />
                <input
                  type="text"
                  placeholder="Mã phim *"
                  value={movieInput.code}
                  onChange={(e) => setMovieInput({ ...movieInput, code: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-700
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                    required:border-red-500 dark:required:border-red-500
                    invalid:border-red-500 dark:invalid:border-red-500"
                />
                <input
                  type="text"
                  placeholder="Link poster *"
                  value={movieInput.poster}
                  onChange={(e) => setMovieInput({ ...movieInput, poster: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-700
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                    required:border-red-500 dark:required:border-red-500
                    invalid:border-red-500 dark:invalid:border-red-500"
                />
                <input
                  type="text"
                  placeholder="Ngày phát hành"
                  value={movieInput.releaseDate}
                  onChange={(e) => {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value) || e.target.value === '') {
                      setMovieInput({ ...movieInput, releaseDate: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-700
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Tên diễn viên"
                  value={movieInput.actress}
                  onChange={(e) => setMovieInput({ ...movieInput, actress: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-700
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
                />
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Thể loại</label>
                  <div className="flex flex-wrap gap-2">
                    {genres.map(genre => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => {
                          setMovieInput(prev => ({
                            ...prev,
                            genre: prev.genre.includes(genre)
                              ? prev.genre.filter(g => g !== genre)
                              : [...prev.genre, genre]
                          }));
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200
                          ${movieInput.genre.includes(genre)
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingMovie(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                    dark:hover:text-gray-200 transition-all duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={editingMovie ? handleEditMovie : handleAddMovie}
                  className={buttonClasses || 'px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200'}
                >
                  {editingMovie ? 'Lưu' : 'Thêm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {deletingMovie && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md relative">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                Xác nhận xóa phim
              </h2>

              <div className="mb-6 text-gray-600 dark:text-gray-300">
                Bạn có chắc chắn muốn xóa phim <span className="font-medium text-gray-800 dark:text-white">{deletingMovie.title}</span>?
                <br />
                Hành động này không thể hoàn tác.
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setDeletingMovie(null)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                    transition-all duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDeleteMovie(deletingMovie._id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg
                    transition-all duration-200"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 