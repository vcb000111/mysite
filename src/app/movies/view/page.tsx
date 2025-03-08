'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, Star, Edit, Trash2, X, Link as Heart, HeartOff, Eye, EyeOff, Image, Download, Link2 } from 'lucide-react';
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
  movieUrl: string;
  downloads: number;
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
  movieUrl?: string;
  images?: string[];
}

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
  const [isQuickEditModalOpen, setIsQuickEditModalOpen] = useState(false);
  const [quickEditUrl, setQuickEditUrl] = useState('');
  const [editingMovieId, setEditingMovieId] = useState('');
  const [movieInputValues, setMovieInputValues] = useState<{ [key: string]: string }>({});

  const fetchMoviesWithRetry = async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        setIsLoading(true);
        const response = await fetch('/api/movies');
        if (response.ok) {
          const data = await response.json();
          setMovies(data);
          return true;
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          Toast.fire({
            icon: 'error',
            title: 'Cannot connect to server. Please try again later.'
          });
          return false;
        }
        // Đợi trước khi thử lại
        await new Promise(resolve => setTimeout(resolve, delay));
      } finally {
        setIsLoading(false);
      }
    }
    return false;
  };

  const fetchMovies = async () => {
    return fetchMoviesWithRetry();
  };

  useEffect(() => {
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

  const handleDownload = async (movieId: string, movieUrl: string) => {
    try {
      // Hiển thị modal hướng dẫn
      await Swal.fire({
        title: 'Download Guide',
        html: `
          <div class="text-left space-y-4 dark:text-gray-300">
            <p>1. Click the <strong>"Go to download page"</strong> button below</p>
            <p>2. Wait 3 seconds and click <strong>"I'M A HUMAN"</strong> on ouo.io</p>
            <p>3. Wait 3 seconds and click <strong>"GET LINK"</strong> on ouo.io</p>
            <p>4. If you get <strong class="text-red-500">ERR_FAILED</strong> error in browser:</p>
            <ul class="list-disc pl-5">
              <li>Copy link from address bar</li>
              <li>Open new tab and paste the link</li>
            </ul>
            <p>5. Watch online or save to your Pikpak account</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Go to download page',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
        color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
        customClass: {
          popup: 'dark:bg-gray-800 dark:text-white',
          title: 'dark:text-white text-center font-semibold',
          htmlContainer: 'dark:text-gray-300',
          confirmButton: 'dark:bg-blue-600 dark:hover:bg-blue-700',
          cancelButton: 'dark:bg-red-600 dark:hover:bg-red-700'
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Mở link trong tab mới
          window.open(movieUrl, '_blank');

          try {
            // Tăng số lượt download
            const response = await fetch(`/api/movies/${movieId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ downloads: 1 }), // Server sẽ tự tăng thêm 1
            });

            if (!response.ok) throw new Error('Failed to update download count');

            const updatedMovie = await response.json();

            // Cập nhật state
            setMovies(prev => prev.map(movie =>
              movie._id === movieId ? { ...movie, downloads: updatedMovie.downloads } : movie
            ));
          } catch (error) {
            console.error('Error updating download count:', error);
            Toast.fire({
              icon: 'error',
              title: 'Error updating download count',
              background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
              color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
            });
          }
        }
      });
    } catch (error) {
      console.error('Error showing guide:', error);
      Toast.fire({
        icon: 'error',
        title: 'Error showing guide',
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
        color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
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


  // Cập nhật useEffect để focus khi mở modal
  useEffect(() => {
    if (showModal && !editingMovie && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showModal, editingMovie]);

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


  useEffect(() => {
    // Khởi tạo giá trị ban đầu cho movieInputValues từ danh sách phim
    const initialValues = movies.reduce((acc, movie) => ({
      ...acc,
      [movie._id]: movie.movieUrl || ''
    }), {});
    setMovieInputValues(initialValues);
  }, [movies]);

  const sortMoviesByLinkStatus = (movies: Movie[]) => {
    return [...movies].sort((a, b) => {
      const aHasValidLink = a.movieUrl && a.movieUrl.toLowerCase().includes(a.code.toLowerCase());
      const bHasValidLink = b.movieUrl && b.movieUrl.toLowerCase().includes(b.code.toLowerCase());

      if (!a.movieUrl && !b.movieUrl) return 0; // Cả hai không có link
      if (!a.movieUrl) return -1; // a không có link -> lên đầu
      if (!b.movieUrl) return 1; // b không có link -> lên đầu

      if (!aHasValidLink && !bHasValidLink) return 0; // Cả hai có link lỗi
      if (!aHasValidLink) return -1; // a có link lỗi -> lên đầu
      if (!bHasValidLink) return 1; // b có link lỗi -> lên đầu

      return 0; // Cả hai có link hợp lệ
    });
  };

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
          title={isSingleCardMobile ? "Switch to 2 columns" : "Switch to 1 column"}
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
            title="To top"
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
            title="To bottom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="md:h-6 md:w-6 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 md:rounded-2xl shadow-lg md:p-6 p-2 border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="flex flex-col md:mb-6 mb-2">
          <h1 className="text-2xl font-bold animate-gradient">Movie List</h1>
          <p className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200">
            <span className="font-bold">Subjectivity, POV, Prostitution, Beauty, 4K, 1080p.</span>
            <span className="font-bold"> All movies are <strong className="text-blue-500">ENGLISH SOFT SUB</strong> and always available for download.</span>
          </p>
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
                    placeholder="Search by title, code, actress, genre..."
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
                      type="button"
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
                        checked={showRandom}
                        onChange={(e) => setShowRandom(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-500 
                          focus:ring-blue-500 dark:border-gray-600
                          dark:focus:ring-offset-gray-800"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Random
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
                        Auto change image
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
                    <option value="">All actresses</option>
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
                    <option value="">All genres</option>
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
                    <option value="added">Date added</option>
                    <option value="newest">Release date (Newest)</option>
                    <option value="oldest">Release date (Oldest)</option>
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
                    <option value="">Rating (Default)</option>
                    <option value="rating-desc">Rating (High to Low)</option>
                    <option value="rating-asc">Rating (Low to High)</option>
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
                    Clear filters
                  </button>
                )}
              </div>

              {/* Results count and Items per page */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  {filteredMovies.length === movies.length ? (
                    <span>Total {movies.length} movies</span>
                  ) : (
                    <span>Showing {filteredMovies.length}/{movies.length} movies</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span>Movies per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      setItemsPerPage(newValue);
                      setCurrentPage(1);
                      saveItemsPerPage(newValue); // Lưu vào localStorage when changing
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

            {/* Movie grid - Updated to use paginatedMovies */}
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
                    {/* Current image */}
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

                    {/* Next image (for fade) */}
                    <img
                      key={`next-${currentImageIndexes[movie._id] || 0}`}
                      src={(() => {
                        if (isFading[movie._id] && !autoChangeImage) {
                          // When fading and auto change is off, show poster
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

                    {/* Overlay for hover effect */}
                    <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-110">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

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

                    {/* 4K badge */}
                    {movie.genre.some(g => g.includes('4K')) && (
                      <div className="absolute top-1 md:top-2 right-1 md:right-2 
                        bg-gradient-to-r from-blue-600 to-purple-600 
                        px-1.5 md:px-1.5 py-0.5 md:py-0.5 rounded-full shadow-lg z-10 backdrop-blur-sm"
                      >
                        <span className={`${isSingleCardMobile ? 'text-[12px]' : 'text-[11px]'} md:text-sm font-bold 
                          text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-500`}>4K</span>
                      </div>
                    )}
                  </div>

                  {/* Movie info */}
                  <div className="p-2 md:p-4 space-y-1 md:space-y-2">
                    {/* Title */}
                    <div
                      id={`movie-${movie._id}`}
                      className="relative group h-auto md:h-[72px]"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const position = rect.left > window.innerWidth / 2 ? 'left' : 'right';
                        setShowTooltip({
                          id: movie._id,
                          text: movie.title,
                          position: position
                        });
                      }}
                      onMouseLeave={() => setShowTooltip(null)}
                    >
                      <h3
                        className={`font-semibold text-gray-800 dark:text-white
                          line-clamp-3
                          ${isSingleCardMobile ? 'text-base leading-5' : 'text-sm leading-4'} md:text-lg md:leading-6`}
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
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-gray-700 dark:text-gray-300 md:text-sm ${isSingleCardMobile ? 'text-base' : 'text-xs'}`}>
                          <Star className={`${isSingleCardMobile ? 'w-4 h-4' : 'w-3 h-3'} md:w-4 md:h-4 text-yellow-500`} fill="currentColor" />
                          {movie.rating || 0}
                        </span>
                        <span className={`flex items-center gap-1 text-gray-600 dark:text-gray-400 ${isSingleCardMobile ? 'text-base' : 'text-xs'} md:text-sm`}>
                          <Download className={`${isSingleCardMobile ? 'w-4 h-4' : 'w-3 h-3'} md:w-4 md:h-4`} />
                          {movie.downloads || 0}
                        </span>
                      </div>
                    </div>

                    {/* Actress and Image count */}
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
                      <div className="flex items-center gap-2">
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
                            title="Click to view all images"
                          >
                            <Image className="w-3 h-3 md:w-4 md:h-4" />
                            <span>{(movie.images?.length || 0) + 1}</span>
                          </button>
                        )}
                        {/* Download button */}
                        {movie.movieUrl && (
                          <button
                            onClick={() => handleDownload(movie._id, movie.movieUrl)}
                            className={`flex items-center gap-1 ${isSingleCardMobile ? 'text-base' : 'text-xs'} bg-blue-500 hover:bg-blue-600 
                              dark:bg-blue-700 dark:hover:bg-blue-600 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg
                              transition-colors duration-200 group cursor-pointer text-white`}
                            title="Download"
                          >
                            <Download className="w-3 h-3 md:w-4 md:h-4" />
                            <span>{movie.downloads || 0}</span>
                          </button>
                        )}
                      </div>
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
                  <span className="hidden md:inline">First</span>
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
                  <span className="hidden md:inline">Previous</span>
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

                    // Show more pages on mobile but keep it compact
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
                  <span className="hidden md:inline">Next</span>
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
                  <span className="hidden md:inline">Last</span>
                  <span className="md:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>

                <span className="w-full md:w-auto text-center text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage}/{totalPages}
                </span>
              </div>
            )}
          </>
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
      </div>
    </div>
  );
} 