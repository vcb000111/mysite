'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Plus, Search, Star, StarOff, Edit, Trash2, X, Link as LinkIcon, Heart, HeartOff, Eye, EyeOff, Check, Image } from 'lucide-react';
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
  images: string[];
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
  images?: string[];
}

const mockMovies: Movie[] = [
  {
    _id: '1',
    title: 'Inception',
    poster: 'https://placehold.co/300x450',
    year: 2010,
    rating: 8.8,
    genre: ['Action', 'Sci-Fi'],
    images: [],
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
const AUTO_CHANGE_IMAGE_KEY = 'autoChangeImage';
const ITEMS_PER_PAGE_KEY = 'itemsPerPage'; // Thêm key mới

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

// Thêm các hàm helper mới
const saveItemsPerPage = (count: number) => {
  localStorage.setItem(ITEMS_PER_PAGE_KEY, count.toString());
};

const getItemsPerPage = (): number => {
  try {
    const saved = localStorage.getItem(ITEMS_PER_PAGE_KEY);
    return saved ? parseInt(saved, 10) : 20;
  } catch {
    return 20;
  }
};

const saveAutoChangeImage = (enabled: boolean) => {
  localStorage.setItem(AUTO_CHANGE_IMAGE_KEY, JSON.stringify(enabled));
};

const getAutoChangeImage = (): boolean => {
  try {
    const saved = localStorage.getItem(AUTO_CHANGE_IMAGE_KEY);
    return saved ? JSON.parse(saved) : false;
  } catch {
    return false;
  }
};

// Cập nhật kiểu SortOrder
type SortOrder = 'added' | 'newest' | 'oldest' | 'rating-desc' | 'rating-asc';

// Thêm hàm helper để trích xuất đường dẫn ảnh từ HTML
const extractImagesFromHtml = (html: string): string[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('a');
  const imageUrls = Array.from(links).map(link => link.getAttribute('href')).filter(url => url !== null) as string[];
  return imageUrls;
};

const saveMobileCardLayout = (isSingle: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mobileCardLayout', isSingle ? 'single' : 'double');
  }
};

const getMobileCardLayout = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('mobileCardLayout') === 'single';
  }
  return true; // Giá trị mặc định khi ở server-side
};

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
    genre: getLastSelectedGenres(),
    images: []
  });
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deletingMovie, setDeletingMovie] = useState<Movie | null>(null);
  const [showTooltip, setShowTooltip] = useState<{ id: string; text: string; position: string } | null>(null);
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: string]: number }>({});
  const [isFading, setIsFading] = useState<{ [key: string]: boolean }>({});
  const [autoChangeImage, setAutoChangeImage] = useState(getAutoChangeImage());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [ratingSort, setRatingSort] = useState<'rating-desc' | 'rating-asc' | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showScrollButtons, setShowScrollButtons] = useState<{ top: boolean; bottom: boolean }>({
    top: false,
    bottom: true
  });
  const [isSingleCardMobile, setIsSingleCardMobile] = useState(true); // Giá trị mặc định

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/movies');
        if (response.ok) {
          const data = await response.json();
          setMovies(data);
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setIsLoading(false);
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

  // Cập nhật useEffect để chỉ chạy khi autoChangeImage được bật
  useEffect(() => {
    if (!autoChangeImage) return; // Thêm điều kiện kiểm tra

    const interval = setInterval(() => {
      setIsFading(prev => {
        const newFading = { ...prev };
        movies.forEach(movie => {
          const allImages = [movie.poster, ...(movie.images || [])];
          if (allImages.length > 1) {
            newFading[movie._id] = true;
          }
        });
        return newFading;
      });

      setTimeout(() => {
        setCurrentImageIndexes(prev => {
          const newIndexes = { ...prev };
          movies.forEach(movie => {
            const allImages = [movie.poster, ...(movie.images || [])];
            if (allImages.length > 1) {
              const currentIndex = prev[movie._id] || 0;
              newIndexes[movie._id] = (currentIndex + 1) % allImages.length;
            }
          });
          return newIndexes;
        });

        setIsFading({});
      }, 1000);
    }, 3000);

    return () => clearInterval(interval);
  }, [movies, autoChangeImage]); // Thêm autoChangeImage vào dependencies

  // Thêm useEffect để theo dõi scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Hiện nút "To Top" khi scroll xuống 200px
      setShowScrollButtons(prev => ({
        ...prev,
        top: scrollTop > 200,
        // Ẩn nút "To Bottom" khi gần cuối trang (còn cách 50px)
        bottom: scrollTop + clientHeight < scrollHeight - 50
      }));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Thêm hàm xử lý scroll
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const handleAddMovie = async () => {
    try {
      if (!movieInput.title || !movieInput.code) {
        Toast.fire({
          icon: 'error',
          title: 'Vui lòng nhập đầy đủ thông tin'
        });
        return;
      }

      const parsedInfo = parseMovieInfo(pasteText);
      const rating = parsedInfo?.rating || 0;

      const movieData = {
        title: movieInput.title,
        code: movieInput.code,
        actress: movieInput.actress,
        poster: movieInput.poster || 'https://placehold.co/300x450',
        releaseDate: movieInput.releaseDate,
        year: new Date(movieInput.releaseDate).getFullYear(),
        rating: rating,
        genre: movieInput.genre,
        images: movieInput.images || [],
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
        genre: getLastSelectedGenres(), // Lưu genres đã chọn trước khi reset form
        images: []
      });
      setPasteText(''); // Reset paste text
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
          images: movieInput.images || [],
          isSeen: editingMovie.isSeen,
          isFavorite: editingMovie.isFavorite,
          rating: editingMovie.rating,
          year: movieInput.releaseDate ? new Date(movieInput.releaseDate).getFullYear() : editingMovie.year
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
        genre: getLastSelectedGenres(),
        images: []
      });
      setPasteText(''); // Reset paste text
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
      genre: getLastSelectedGenres(),
      images: []
    });
    setEditingMovie(null);
    setShowPasteArea(true); // Tự động mở textarea
  };

  // Cập nhật hàm parseMovieInfo để bỏ phần parse genre
  const parseMovieInfo = (text: string) => {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      const info: Partial<MovieInput & { rating?: number }> = {};

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

      // Parse rating
      const ratingMatch = text.match(/\((\d+\.\d+)\)/);
      if (ratingMatch) {
        const rating = parseFloat(ratingMatch[1]);
        // Làm tròn lên 1 nếu phần thập phân >= 0.5
        info.rating = Math.floor(rating) + (rating % 1 >= 0.5 ? 1 : 0);
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

  // Cập nhật hàm handlePaste để thêm rating vào dữ liệu phim
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    setPasteText(pastedText);

    // Tự động parse và áp dụng thông tin sau khi paste
    const parsedInfo = parseMovieInfo(pastedText);
    if (parsedInfo) {
      const { rating, ...movieInfo } = parsedInfo;
      setMovieInput(prev => ({
        ...prev,
        ...movieInfo,
        genre: prev.genre, // Giữ nguyên genre đã chọn
        images: prev.images || []
      }));

      // Cập nhật rating nếu có
      if (rating !== undefined) {
        const movieData = {
          ...movieInfo,
          rating
        };
        console.log('Movie data with rating:', movieData);
      }

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
        if (ratingSort === 'rating-desc') {
          // Sắp xếp theo rating giảm dần
          return (b.rating || 0) - (a.rating || 0);
        } else if (ratingSort === 'rating-asc') {
          // Sắp xếp theo rating tăng dần
          return (a.rating || 0) - (b.rating || 0);
        } else if (sortOrder === 'added') {
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
  }, [movies, searchTerm, showSeen, showFavorite, selectedGenre, sortOrder, showRandom, selectedActress, ratingSort]);

  // Thêm hàm reset
  const resetAllFilters = () => {
    setSearchTerm('');
    setShowSeen(false);
    setShowFavorite(false);
    setShowRandom(false);
    setSelectedGenre('');
    setSelectedActress('');
    setRatingSort('');
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

  // Thêm hàm handleCloseModal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMovie(null);
    setMovieInput({
      title: '',
      code: '',
      poster: '',
      releaseDate: '',
      actress: '',
      genre: getLastSelectedGenres(),
      images: []
    });
    setPasteText('');
    resetForm();
  };

  // Cập nhật useEffect để reset trang khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showSeen, showFavorite, selectedGenre, selectedActress, showRandom]);

  // Tính toán số trang và phim hiển thị
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  const paginatedMovies = filteredMovies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Thêm hàm điều hướng trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Thêm các hàm xử lý touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !previewImage) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = previewImages.indexOf(previewImage);
      let newIndex;

      if (isLeftSwipe) {
        // Swipe sang trái -> ảnh tiếp theo
        newIndex = currentIndex < previewImages.length - 1 ? currentIndex + 1 : 0;
      } else {
        // Swipe sang phải -> ảnh trước đó
        newIndex = currentIndex > 0 ? currentIndex - 1 : previewImages.length - 1;
      }

      setPreviewImage(previewImages[newIndex]);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const toggleMobileCardLayout = () => {
    const newValue = !isSingleCardMobile;
    setIsSingleCardMobile(newValue);
    saveMobileCardLayout(newValue);
  };

  useEffect(() => {
    // Chỉ cập nhật state sau khi component được mount ở client-side
    setIsSingleCardMobile(getMobileCardLayout());
  }, []);

  return (
    <div className="w-full md:p-4">
      {/* Mobile layout toggle button */}
      <div className="md:hidden fixed left-2 bottom-2 z-40">
        <button
          onClick={toggleMobileCardLayout}
          className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg
            hover:bg-white dark:hover:bg-gray-700
            text-gray-600 dark:text-gray-300
            transition-all duration-200 backdrop-blur-sm
            transform hover:scale-110 active:scale-95"
          title={isSingleCardMobile ? "Chuyển sang 2 cột" : "Chuyển sang 1 cột"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={isSingleCardMobile
                ? "M8 7h12M8 12h12M8 17h12M4 7h0M4 12h0M4 17h0"
                : "M4 5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z"}
            />
          </svg>
        </button>
      </div>

      {/* Scroll buttons */}
      <div className="fixed md:right-4 right-2 md:bottom-4 bottom-14 flex flex-col gap-2 z-40">
        {showScrollButtons.top && (
          <button
            onClick={scrollToTop}
            className="p-2 md:p-3 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg
              hover:bg-white dark:hover:bg-gray-700
              text-gray-600 dark:text-gray-300
              transition-all duration-200 backdrop-blur-sm
              transform hover:scale-110 active:scale-95"
            title="Lên đầu trang"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="md:h-6 md:w-6 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}

        {showScrollButtons.bottom && (
          <button
            onClick={scrollToBottom}
            className="p-2 md:p-3 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg
              hover:bg-white dark:hover:bg-gray-700
              text-gray-600 dark:text-gray-300
              transition-all duration-200 backdrop-blur-sm
              transform hover:scale-110 active:scale-95"
            title="Xuống cuối trang"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="md:h-6 md:w-6 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 md:rounded-2xl shadow-lg md:p-6 p-2 border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center md:mb-6 mb-2">
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

        {/* Loading spinner */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="relative w-20 h-20">
              <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
              <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Loading</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="md:mb-6 mb-2 space-y-4">
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

                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoChangeImage}
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          setAutoChangeImage(newValue);
                          saveAutoChangeImage(newValue); // Lưu vào localStorage
                          if (!newValue) {
                            // Thêm hiệu ứng fade khi reset về poster
                            setIsFading(prev => {
                              const newFading = { ...prev };
                              movies.forEach(movie => {
                                if (currentImageIndexes[movie._id] !== undefined) {
                                  newFading[movie._id] = true;
                                }
                              });
                              return newFading;
                            });

                            // Reset về poster sau khi fade out
                            setTimeout(() => {
                              setCurrentImageIndexes({});
                              setIsFading({});
                            }, 700);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-500 
                          focus:ring-blue-500 dark:border-gray-600
                          dark:focus:ring-offset-gray-800"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Tự động chuyển ảnh
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

                  {/* Rating sort select */}
                  <select
                    value={ratingSort}
                    onChange={(e) => setRatingSort(e.target.value as 'rating-desc' | 'rating-asc' | '')}
                    className="px-2 py-1 rounded-lg border dark:border-gray-700
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                      transition-all duration-200 text-sm"
                  >
                    <option value="">Đánh giá (Mặc định)</option>
                    <option value="rating-desc">Đánh giá (Cao đến thấp)</option>
                    <option value="rating-asc">Đánh giá (Thấp đến cao)</option>
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

              {/* Results count và Items per page */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  {filteredMovies.length === movies.length ? (
                    <span>Tổng số {movies.length} phim</span>
                  ) : (
                    <span>Hiển thị {filteredMovies.length}/{movies.length} phim</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span>Số phim mỗi trang:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      setItemsPerPage(newValue);
                      setCurrentPage(1);
                      saveItemsPerPage(newValue); // Lưu vào localStorage khi thay đổi
                    }}
                    className="px-2 py-1 rounded-lg border dark:border-gray-700
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                      transition-all duration-200"
                  >
                    {[20, 50, 100, 200, 500].map(value => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Movie grid - Cập nhật để sử dụng paginatedMovies */}
            <div className={`grid gap-4 ${isSingleCardMobile
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
              {paginatedMovies.map(movie => (
                <div
                  key={movie._id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-700
                    hover:shadow-lg transition-all duration-200"
                >
                  {/* Poster */}
                  <div className="relative overflow-hidden group aspect-video">
                    {/* Ảnh hiện tại */}
                    <img
                      key={currentImageIndexes[movie._id] || 0}
                      src={(() => {
                        const allImages = [movie.poster, ...(movie.images || [])];
                        const currentIndex = currentImageIndexes[movie._id] || 0;
                        return allImages[currentIndex] || movie.poster;
                      })()}
                      alt={movie.title}
                      className={`absolute inset-0 w-full h-full object-cover object-top rounded-t-xl 
                        transition-opacity duration-700 ease-in-out
                        bg-gray-100 dark:bg-gray-800 cursor-pointer
                        ${isFading[movie._id] ? 'opacity-0' : 'opacity-100'}`}
                      onClick={() => {
                        setPreviewImage(movie.poster);
                        setPreviewImages([movie.poster, ...(movie.images || [])]);
                      }}
                    />

                    {/* Ảnh tiếp theo (để fade) */}
                    <img
                      key={`next-${currentImageIndexes[movie._id] || 0}`}
                      src={(() => {
                        if (isFading[movie._id] && !autoChangeImage) {
                          // Khi đang fade và tắt auto change, hiển thị poster
                          return movie.poster;
                        }
                        const allImages = [movie.poster, ...(movie.images || [])];
                        const currentIndex = currentImageIndexes[movie._id] || 0;
                        const nextIndex = (currentIndex + 1) % allImages.length;
                        return allImages[nextIndex] || movie.poster;
                      })()}
                      alt={movie.title}
                      className={`absolute inset-0 w-full h-full object-cover object-top rounded-t-xl 
                        transition-opacity duration-700 ease-in-out
                        bg-gray-100 dark:bg-gray-800
                        ${isFading[movie._id] ? 'opacity-100' : 'opacity-0'}`}
                    />

                    {/* Overlay cho hover effect */}
                    <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-110">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Seen badge */}
                    {movie.isSeen && (
                      <div className="absolute top-1 md:top-2 left-1 md:left-2 bg-white/90 dark:bg-gray-800/90 
                        p-1 md:p-1.5 rounded-full shadow-lg z-10 backdrop-blur-sm"
                      >
                        <Eye className={`${isSingleCardMobile ? 'w-4 h-4' : 'w-3 h-3'} md:w-4 md:h-4 text-green-500`} fill="currentColor" />
                      </div>
                    )}

                    {/* Genre badges */}
                    <div className="absolute bottom-1 md:bottom-2 left-1 md:left-2 z-10">
                      <div className="flex flex-col space-y-0.5 md:space-y-1">
                        {movie.genre.slice(0, 3).map((genre, index) => (
                          <button
                            key={genre}
                            onClick={() => setSelectedGenre(genre)}
                            className={`px-1.5 md:px-2 py-0.5 md:py-1 ${isSingleCardMobile ? 'text-[11px]' : 'text-[10px]'} md:text-xs rounded-md text-left
                              bg-black/70 backdrop-blur-sm
                              text-white font-medium w-fit
                              hover:bg-black/80 transition-colors duration-200`}
                            style={{
                              zIndex: 30 - index
                            }}
                          >
                            {genre}
                          </button>
                        ))}
                        {movie.genre.length > 3 && (
                          <span className={`text-${isSingleCardMobile ? '11px' : '10px'} md:text-xs text-white px-1.5 md:px-2 py-0.5 md:py-1 bg-black/70 backdrop-blur-sm rounded-md w-fit`}
                            style={{ zIndex: 27 }}>
                            +{movie.genre.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Year badge */}
                    <div className={`absolute bottom-1 md:bottom-2 right-1 md:right-2 bg-black/70 backdrop-blur-sm
                      px-1.5 md:px-2 py-0.5 md:py-1 rounded-md text-white ${isSingleCardMobile ? 'text-[11px]' : 'text-[10px]'} md:text-sm font-medium z-10`}
                    >
                      {new Date(movie.releaseDate).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      }).split('/').join('-')}
                    </div>

                    {/* Favorite hoặc 4K badge (ở cùng vị trí) */}
                    {movie.isFavorite ? (
                      <div className="absolute top-1 md:top-2 right-1 md:right-2 bg-white/90 dark:bg-gray-800/90 
                        p-1 md:p-1.5 rounded-full shadow-lg z-10 backdrop-blur-sm"
                      >
                        <Heart className={`${isSingleCardMobile ? 'w-4 h-4' : 'w-3 h-3'} md:w-4 md:h-4 text-red-500`} fill="currentColor" />
                      </div>
                    ) : movie.genre.some(g => g.includes('4K')) && (
                      <div className="absolute top-1 md:top-2 right-1 md:right-2 bg-white/90 dark:bg-gray-800/90 
                        px-1 md:px-1.5 py-0 md:py-1 rounded-full shadow-lg z-10 backdrop-blur-sm"
                      >
                        <span className={`${isSingleCardMobile ? 'text-[11px]' : 'text-[10px]'} md:text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 
                          text-yellow-500 bg-clip-text`}>4K</span>
                      </div>
                    )}

                    {/* 4K badge (chỉ hiện khi có cả Favorite) */}
                    {movie.isFavorite && movie.genre.some(g => g.includes('4K')) && (
                      <div className="absolute top-7 md:top-9 right-1 md:right-2 bg-white/90 dark:bg-gray-800/90 
                        px-1 md:px-1.5 md:py-1 py-0 rounded-full shadow-lg z-10 backdrop-blur-sm"
                      >
                        <span className={`${isSingleCardMobile ? 'text-[11px] px-0.5' : 'text-[10px]'} md:text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 
                          text-yellow-500 bg-clip-text`}>4K</span>
                      </div>
                    )}

                    {/* Overlay khi hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40
                      transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        {/* Action buttons */}
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          {/* Seen button */}
                          <button
                            onClick={() => handleToggleSeen(movie._id, movie.isSeen)}
                            className="bg-white dark:bg-gray-800 p-1 md:p-2 rounded-full shadow-lg
                              hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                          >
                            {movie.isSeen ? (
                              <Eye className="w-4 h-4 md:w-5 md:h-5 text-green-500" fill="currentColor" />
                            ) : (
                              <EyeOff className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                            )}
                          </button>

                          {/* Favorite button */}
                          <button
                            onClick={() => handleToggleFavorite(movie._id, movie.isFavorite)}
                            className="bg-white dark:bg-gray-800 p-1 md:p-2 rounded-full shadow-lg
                              hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                          >
                            {movie.isFavorite ? (
                              <Heart className="w-4 h-4 md:w-5 md:h-5 text-red-500" fill="currentColor" />
                            ) : (
                              <HeartOff className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                            )}
                          </button>

                          {/* Rating button */}
                          <div className="relative">
                            <button
                              onClick={() => setShowRating(movie._id)}
                              className="bg-white dark:bg-gray-800 p-1 md:p-2 rounded-full shadow-lg
                                hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                            >
                              <Star
                                className="w-4 h-4 md:w-5 md:h-5 text-yellow-500"
                                fill={movie.rating > 0 ? "currentColor" : "none"}
                              />
                            </button>

                            {/* Rating popup */}
                            {showRating === movie._id && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1 md:p-2
                                bg-white dark:bg-gray-800 rounded-lg shadow-xl
                                border border-gray-100 dark:border-gray-700
                                transform scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100
                                transition-all duration-200 z-50"
                              >
                                <div className="flex items-center gap-0.5 md:gap-1 px-1 md:px-2 py-0.5 md:py-1">
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
                                      className="p-0.5 md:p-1 hover:scale-110 transition-transform"
                                    >
                                      <Star
                                        className={`w-3 h-3 md:w-4 md:h-4 rating-star ${index < movie.rating
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
                                genre: movie.genre,
                                images: movie.images
                              });
                              setEditingMovie(movie);
                              setShowModal(true);
                            }}
                            className="bg-white dark:bg-gray-800 p-1 md:p-2 rounded-full shadow-lg
                              hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                          >
                            <Edit className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => setDeletingMovie(movie)}
                            className="bg-white dark:bg-gray-800 p-1 md:p-2 rounded-full shadow-lg
                              hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Movie info */}
                  <div className="p-2 md:p-4 space-y-1 md:space-y-2">
                    {/* Title */}
                    <div
                      id={`movie-${movie._id}`}
                      className="relative group h-auto md:h-[72px]"
                    >
                      <h3
                        className={`font-semibold text-gray-800 dark:text-white
                          line-clamp-3 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400
                          transition-colors duration-200
                          ${isSingleCardMobile ? 'text-base leading-5' : 'text-sm leading-4'} md:text-lg md:leading-6`}
                        onClick={() => {
                          setMovieInput({
                            title: movie.title,
                            code: movie.code,
                            poster: movie.poster,
                            releaseDate: movie.releaseDate,
                            actress: movie.actress,
                            genre: movie.genre,
                            images: movie.images
                          });
                          setEditingMovie(movie);
                          setShowModal(true);
                        }}
                        onMouseEnter={(e) => {
                          const element = e.currentTarget;
                          const rect = element.getBoundingClientRect();
                          const viewportWidth = window.innerWidth;
                          const tooltipWidth = 300;

                          const spaceOnRight = viewportWidth - rect.right;
                          const showOnRight = spaceOnRight >= tooltipWidth;

                          if (element.scrollHeight > element.clientHeight) {
                            setShowTooltip({
                              id: movie._id,
                              text: movie.title,
                              position: showOnRight ? 'right' : 'left'
                            });
                          }
                        }}
                        onMouseLeave={() => setShowTooltip(null)}
                      >
                        {movie.title}
                      </h3>

                      {/* Tooltip */}
                      {showTooltip?.id === movie._id && (
                        <div
                          className={`absolute z-50 w-[300px] p-3 bg-white dark:bg-gray-800 
                            rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
                            text-gray-900 dark:text-white text-sm
                            ${showTooltip.position === 'right' ? 'left-full ml-2' : 'right-full mr-2'}
                            top-0`}
                        >
                          {showTooltip.text}
                        </div>
                      )}
                    </div>

                    {/* Code and Rating */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 flex items-center">
                        {movie.code.split('-').map((part, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && (
                              <span className="animate-gradient text-sm md:text-base font-bold">
                                -
                              </span>
                            )}
                            <button
                              onClick={() => setSearchTerm(part)}
                              className={`md:text-base font-bold animate-gradient
                                hover:opacity-75 transition-opacity duration-200 
                                focus:outline-none focus:ring-2 focus:ring-blue-500 
                                dark:focus:ring-blue-400 focus:ring-opacity-50 
                                rounded ${isSingleCardMobile ? 'text-base' : ''}`}
                            >
                              {part}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                      <span className={`flex items-center gap-1 text-gray-700 dark:text-gray-300 md:text-sm ${isSingleCardMobile ? 'text-base' : 'text-xs'}`}>
                        <Star className={`${isSingleCardMobile ? 'w-4 h-4' : 'w-3 h-3'} md:w-4 md:h-4 text-yellow-500`} fill="currentColor" />
                        {movie.rating || 0}
                      </span>
                    </div>

                    {/* Actress và Image count */}
                    <div className={`text-${isSingleCardMobile ? 'base' : 'xs'} md:text-sm text-gray-600 dark:text-gray-300 flex justify-between items-center`}>
                      <div className="flex flex-wrap gap-1 md:gap-2">
                        {formatActressName(movie.actress).map((pair, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchTerm(pair);
                            }}
                            className={`hover:text-blue-500 dark:hover:text-blue-400 
                              transition-colors duration-200 hover:underline
                              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                              focus:ring-opacity-50 rounded ${isSingleCardMobile ? 'text-base' : 'text-xs'}`}
                          >
                            {pair}
                          </button>
                        ))}
                      </div>
                      {/* Image count */}
                      {(movie.images?.length > 0 || movie.poster) && (
                        <button
                          onClick={() => {
                            setPreviewImage(movie.poster);
                            setPreviewImages([movie.poster, ...(movie.images || [])]);
                          }}
                          className={`flex items-center gap-1 ${isSingleCardMobile ? 'text-base' : 'text-xs'} bg-gray-100 hover:bg-gray-200 
                            dark:bg-gray-700 dark:hover:bg-gray-600 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg
                            transition-colors duration-200 group cursor-pointer`}
                          title="Nhấn để xem tất cả ảnh"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg"
                            className="w-3 h-3 md:w-4 md:h-4 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 
                              transition-colors duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200">
                            {(movie.images?.length || 0) + (movie.poster ? 1 : 0)}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-wrap justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`flex px-3 py-1 rounded-lg text-sm font-medium
                    ${currentPage === 1
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                  <span className="hidden md:inline">Đầu</span>
                  <span className="md:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </span>
                </button>

                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex px-3 py-1 rounded-lg text-sm font-medium
                    ${currentPage === 1
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                  <span className="hidden md:inline">Trước</span>
                  <span className="md:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    // Hiển thị nhiều trang hơn trên mobile nhưng vẫn giữ gọn gàng
                    const shouldHideOnMobile = (pageNumber !== currentPage &&
                      pageNumber !== 1 &&
                      pageNumber !== totalPages &&
                      Math.abs(pageNumber - currentPage) > 2);

                    return (
                      <button
                        key={i}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`${shouldHideOnMobile ? 'hidden md:flex' : 'flex'} 
                          w-7 h-7 md:w-8 md:h-8 items-center justify-center rounded-lg text-sm font-medium
                          ${currentPage === pageNumber
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-lg text-sm font-medium
                    ${currentPage === totalPages
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                  <span className="hidden md:inline">Sau</span>
                  <span className="md:hidden">&gt;</span>
                </button>

                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-lg text-sm font-medium
                    ${currentPage === totalPages
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                  <span className="hidden md:inline">Cuối</span>
                  <span className="md:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>

                <span className="w-full md:w-auto text-center text-sm text-gray-600 dark:text-gray-400">
                  Trang {currentPage}/{totalPages}
                </span>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto md:p-6 p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center md:mb-4 mb-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingMovie ? 'Sửa phim' : 'Thêm phim mới'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-4" onKeyDown={(e) => handleKeyDown(e, editingMovie ? 'edit' : 'add')}>
                {/* Paste area */}
                {!editingMovie && (
                  <div className="mb-4">
                    <textarea
                      ref={textareaRef}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      onPaste={handlePaste}
                      placeholder="Paste thông tin phim vào đây..."
                      className="w-full h-20 p-3 text-sm border rounded-lg 
                        dark:bg-gray-700 dark:border-gray-600 dark:text-white
                        focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Two columns layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left column - Basic info */}
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Tiêu đề *"
                        value={movieInput.title}
                        onChange={(e) => setMovieInput({ ...movieInput, title: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-lg border dark:border-gray-700
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Mã phim *"
                        value={movieInput.code}
                        onChange={(e) => setMovieInput({ ...movieInput, code: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-lg border dark:border-gray-700
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
                      />
                      <div className="space-y-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Link poster *
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <textarea
                            placeholder="Nhập đường dẫn poster"
                            value={movieInput.poster}
                            onChange={(e) => setMovieInput({ ...movieInput, poster: e.target.value.trim() })}
                            required
                            className="w-full h-32 p-3 text-sm border rounded-lg 
                              dark:bg-gray-700 dark:border-gray-600 dark:text-white
                              focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
                          />
                          {movieInput.poster ? (
                            <div className="relative group h-32">
                              <img
                                src={movieInput.poster}
                                alt="Poster preview"
                                className="w-full h-full object-cover rounded-lg cursor-pointer"
                                onClick={() => {
                                  setPreviewImage(movieInput.poster);
                                  setPreviewImages([movieInput.poster]);
                                }}
                              />
                              <button
                                onClick={() => setMovieInput({ ...movieInput, poster: '' })}
                                className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 
                                  group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg
                              flex items-center justify-center text-gray-400 dark:text-gray-500">
                              Preview
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="date"
                          id="releaseDate"
                          value={movieInput.releaseDate}
                          onChange={(e) => setMovieInput(prev => ({ ...prev, releaseDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                            focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
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
                      </div>

                      {/* Genre selection */}
                      <div className="space-y-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Thể loại</label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
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
                  </div>

                  {/* Right column - Images */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        Danh sách ảnh mô tả (mỗi dòng một đường dẫn)
                      </label>
                      <textarea
                        placeholder="Paste HTML hoặc nhập các đường dẫn ảnh, mỗi dòng một ảnh"
                        value={movieInput.images?.join('\n') || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.includes('<div class="previewthumbs"')) {
                            const imageUrls = extractImagesFromHtml(value);
                            setMovieInput({ ...movieInput, images: imageUrls });
                            Toast.fire({
                              icon: 'success',
                              title: `Đã trích xuất ${imageUrls.length} ảnh`
                            });
                          } else {
                            const imageUrls = value
                              .split('\n')
                              .map(url => url.trim())
                              .filter(url => url !== '');
                            setMovieInput({ ...movieInput, images: imageUrls });
                          }
                        }}
                        className="w-full h-32 p-3 text-sm border rounded-lg 
                          dark:bg-gray-700 dark:border-gray-600 dark:text-white
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
                      />
                      {movieInput.images && movieInput.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg max-h-[300px] overflow-y-auto">
                          {movieInput.images.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="w-full aspect-video object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  setPreviewImage(url);
                                  setPreviewImages(movieInput.images || []);
                                }}
                              />
                              <button
                                onClick={() => {
                                  setMovieInput({
                                    ...movieInput,
                                    images: movieInput.images?.filter((_, i) => i !== index)
                                  });
                                }}
                                className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 
                                  group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={handleCloseModal}
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

        {/* Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black bg-opacity-75"
            onClick={() => {
              setPreviewImage(null);
              setPreviewImages([]);
            }}
          >
            <div className="relative max-w-5xl w-full flex-1 flex flex-col items-center justify-center gap-4">
              <button
                onClick={() => {
                  setPreviewImage(null);
                  setPreviewImages([]);
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 
                  text-white backdrop-blur-sm transition-all duration-200 z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Main preview image with navigation buttons */}
              <div className="relative w-full flex-1 flex items-center justify-center">
                {/* Previous button */}
                {previewImages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentIndex = previewImages.indexOf(previewImage);
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : previewImages.length - 1;
                      setPreviewImage(previewImages[prevIndex]);
                    }}
                    className="absolute left-4 p-3 rounded-full bg-white/20 hover:bg-white/30 
                      text-white backdrop-blur-sm transition-all duration-200 z-10
                      transform hover:scale-110 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                <img
                  src={previewImage || ''}
                  alt="Preview"
                  className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />

                {/* Next button */}
                {previewImages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentIndex = previewImages.indexOf(previewImage);
                      const nextIndex = currentIndex < previewImages.length - 1 ? currentIndex + 1 : 0;
                      setPreviewImage(previewImages[nextIndex]);
                    }}
                    className="absolute right-4 p-3 rounded-full bg-white/20 hover:bg-white/30 
                      text-white backdrop-blur-sm transition-all duration-200 z-10
                      transform hover:scale-110 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Thumbnails */}
              {previewImages.length > 0 && (
                <div
                  className="w-full max-w-4xl overflow-x-auto p-2 bg-black/50 rounded-lg backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex gap-2">
                    {previewImages.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setPreviewImage(url)}
                        className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden 
                          ${url === previewImage ? 'ring-2 ring-blue-500' : 'ring-1 ring-white/20'}
                          hover:ring-2 hover:ring-blue-400 transition-all duration-200`}
                      >
                        <img
                          src={url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
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