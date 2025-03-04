'use client';

import { useState, useRef, useEffect } from 'react';
import { Folder, Search, RefreshCw, Check, X, AlertCircle, Film, Calendar, Star, FileText, Trash2, CheckCircle, Download, Copy } from 'lucide-react';
import Image from 'next/image';
import Swal from 'sweetalert2';

interface MovieInfo {
  _id: string;
  title: string;
  code: string;
  poster: string;
  releaseDate?: string;
  rating?: number;
  actress?: string;
  genre?: string[];
  createdAt?: string;
}

interface FileInfo {
  name: string;
  size: number;
  exists?: boolean;
  loading?: boolean;
  movie?: MovieInfo;
  searchName?: string;
}

interface CheckResponse {
  exists: boolean;
  movie: MovieInfo | null;
}

interface ExportFileInfo {
  originalName: string;
  cleanName: string;
  size: number;
}

// Thêm type cho webkitdirectory
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
    mozdirectory?: string;
    nwdirectory?: string;
  }
}

const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

export default function CheckMovies() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFiles, setExportFiles] = useState<ExportFileInfo[]>([]);
  const [duplicateFiles, setDuplicateFiles] = useState<string[]>([]);
  const [isLoadingDatabase, setIsLoadingDatabase] = useState(false);
  const [movieDatabase, setMovieDatabase] = useState<Map<string, MovieInfo>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportInputRef = useRef<HTMLInputElement>(null);

  // Thêm hàm fetch toàn bộ database
  const fetchMovieDatabase = async () => {
    try {
      setIsLoadingDatabase(true);
      const response = await fetch('/api/movies/all');
      const data: MovieInfo[] = await response.json();

      // Lưu vào Map để tìm kiếm nhanh hơn
      const movieMap = new Map<string, MovieInfo>();
      data.forEach(movie => {
        // Lưu theo code không có dấu gạch ngang
        const cleanCode = movie.code.replace('-', '').toLowerCase();
        movieMap.set(cleanCode, movie);
      });

      setMovieDatabase(movieMap);
      setIsLoadingDatabase(false);
    } catch (error) {
      console.error('Lỗi khi tải database:', error);
      setIsLoadingDatabase(false);
      Toast.fire({
        icon: 'error',
        title: 'Không thể tải dữ liệu phim'
      });
    }
  };

  // Thêm useEffect để fetch database khi component mount
  useEffect(() => {
    fetchMovieDatabase();
  }, []);

  // Sửa lại hàm kiểm tra phim
  const checkMovie = (file: FileInfo): FileInfo => {
    if (!file.searchName) return file;

    // Tìm trong database đã cache
    const movie = movieDatabase.get(file.searchName.toLowerCase());

    return {
      ...file,
      exists: !!movie,
      loading: false,
      movie: movie || undefined
    };
  };

  // Sửa lại hàm kiểm tra tất cả
  const checkAllMovies = () => {
    if (isLoadingDatabase) {
      Toast.fire({
        icon: 'info',
        title: 'Đang tải dữ liệu phim, vui lòng đợi'
      });
      return;
    }

    setFiles(prev => prev.map(file => checkMovie(file)));
  };

  // Hàm để chọn thư mục
  const handleSelectFolder = () => {
    fileInputRef.current?.click();
  };

  // Xử lý tên file để tìm kiếm
  const cleanFileName = (filename: string): string => {
    // Loại bỏ phần mở rộng file và chuyển về chữ thường
    let cleanName = filename.toLowerCase()
      .replace(/\.(mp4|mkv|avi|mov|wmv)$/, '');

    // Loại bỏ "4k" ở đầu hoặc cuối tên file (có thể có dấu gạch ngang hoặc khoảng trắng)
    cleanName = cleanName
      .replace(/^4k[-\s]*/i, '') // 4K ở đầu
      .replace(/[-\s]*4k$/i, '') // 4K ở cuối
      .trim();

    // Tìm mã phim trong tên file đã làm sạch
    const codeMatch = cleanName.match(/([a-zA-Z]+)[-]?(\d+)/i);
    if (codeMatch) {
      // Trả về mã phim đã tìm thấy
      return `${codeMatch[1]}${codeMatch[2]}`;
    }

    // Nếu không tìm thấy mã phim, tiếp tục làm sạch tên file
    return cleanName
      // Loại bỏ các ký tự đặc biệt và thay thế bằng khoảng trắng
      .replace(/[._\-\[\]()]/g, ' ')
      // Loại bỏ các từ không cần thiết
      .replace(/(480p|720p|1080p|2160p|bluray|x264|x265|hevc|aac|web-dl)/gi, '')
      // Loại bỏ khoảng trắng thừa
      .trim();
  };

  // Thêm hàm clear dữ liệu
  const clearData = () => {
    if (files.length > 0) {
      setFiles([]);
      setCurrentFolder('');
      setPasteContent('');
      Toast.fire({
        icon: 'success',
        title: 'Đã xóa tất cả dữ liệu'
      });
    }
  };

  // Thêm hàm kiểm tra file trong thùng rác
  const isRecycleBinFile = (filename: string, path: string): boolean => {
    // Kiểm tra tên file bắt đầu bằng $R
    const isRecycledName = /^\$R[A-Z0-9]{6,}$/i.test(filename.replace(/\.[^/.]+$/, ''));

    // Kiểm tra đường dẫn có chứa $RECYCLE.BIN
    const isInRecycleBin = path.includes('$RECYCLE.BIN');

    return isRecycledName || isInRecycleBin;
  };

  // Sửa lại hàm xử lý chọn thư mục
  const handleFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;

      if (isLoadingDatabase) {
        Toast.fire({
          icon: 'info',
          title: 'Đang tải dữ liệu phim, vui lòng đợi'
        });
        return;
      }

      setIsScanning(true);
      clearData();

      const newFiles: FileInfo[] = [];
      const MIN_FILE_SIZE = 50 * 1024 * 1024; // 50MB

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (isVideoFile(file.name) &&
          !isSystemFile(file.name) &&
          !isRecycleBinFile(file.name, file.webkitRelativePath) &&
          file.size >= MIN_FILE_SIZE) {
          const searchName = cleanFileName(file.name);
          newFiles.push({
            name: file.name,
            size: file.size,
            exists: false,
            loading: false,
            searchName
          });
        }
      }

      // Sắp xếp theo tên file
      newFiles.sort((a, b) => a.searchName?.localeCompare(b.searchName || '') || 0);

      if (newFiles.length === 0) {
        Toast.fire({
          icon: 'info',
          title: 'Không tìm thấy file phim nào'
        });
      } else {
        // Kiểm tra ngay lập tức với database đã cache
        const checkedFiles = newFiles.map(file => checkMovie(file));
        setFiles(checkedFiles);

        Toast.fire({
          icon: 'success',
          title: `Đã tìm thấy ${newFiles.length} file phim`
        });
      }

      setIsScanning(false);
      event.target.value = '';

    } catch (error) {
      console.error('Lỗi khi quét thư mục:', error);
      setIsScanning(false);
      Toast.fire({
        icon: 'error',
        title: 'Có lỗi xảy ra khi quét thư mục'
      });
    }
  };

  // Sửa lại hàm xử lý xuất file
  const handleExportFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;

      setIsScanning(true);
      const allFiles: ExportFileInfo[] = [];
      const duplicateSet = new Set<string>();

      // Tạo map để kiểm tra trùng lặp
      const fileMap = new Map<string, { count: number; files: ExportFileInfo[] }>();

      const MIN_FILE_SIZE = 50 * 1024 * 1024; // 50MB

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (isVideoFile(file.name) &&
          !isSystemFile(file.name) &&
          !isRecycleBinFile(file.name, file.webkitRelativePath) &&
          file.size >= MIN_FILE_SIZE) {
          const cleanName = cleanFileName(file.name);
          const fileInfo: ExportFileInfo = {
            originalName: file.name,
            cleanName: cleanName,
            size: file.size
          };

          const existingEntry = fileMap.get(cleanName);
          if (existingEntry) {
            existingEntry.count += 1;
            existingEntry.files.push(fileInfo);
            duplicateSet.add(cleanName);
          } else {
            fileMap.set(cleanName, { count: 1, files: [fileInfo] });
          }

          allFiles.push(fileInfo);
        }
      }

      // Sắp xếp file theo tên đã làm sạch
      allFiles.sort((a, b) => a.cleanName.localeCompare(b.cleanName));

      setExportFiles(allFiles);
      setDuplicateFiles(Array.from(duplicateSet));
      setShowExportModal(true);
      setIsScanning(false);
      event.target.value = '';

      if (allFiles.length === 0) {
        Toast.fire({
          icon: 'info',
          title: 'Không tìm thấy file phim nào'
        });
      } else {
        Toast.fire({
          icon: 'success',
          title: `Đã tìm thấy ${allFiles.length} file phim`
        });
      }

    } catch (error) {
      console.error('Lỗi khi quét thư mục:', error);
      setIsScanning(false);
      Toast.fire({
        icon: 'error',
        title: 'Có lỗi xảy ra khi quét thư mục'
      });
    }
  };

  // Kiểm tra có phải file video không
  const isVideoFile = (filename: string) => {
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  // Thêm hàm kiểm tra file hệ thống
  const isSystemFile = (filename: string) => {
    const systemPatterns = [
      /^\./, // File bắt đầu bằng dấu chấm
      /^desktop\.ini$/i,
      /^thumbs\.db$/i,
      /^\.ds_store$/i,
      /^~\$/, // File tạm của Office
    ];
    return systemPatterns.some(pattern => pattern.test(filename));
  };

  // Thêm hàm format kích thước file
  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  // Lọc files theo search term
  const filteredFiles = files.filter(file =>
    file.searchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.movie?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.movie?.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Thêm hàm format mã phim
  const formatMovieCode = (code: string): string => {
    // Nếu mã phim chưa có dấu gạch ngang, thêm vào
    if (!code.includes('-')) {
      const match = code.match(/([A-Z]+)(\d+)/);
      if (match) {
        return `${match[1]}-${match[2]}`;
      }
    }
    return code;
  };

  // Sửa lại hàm xử lý paste danh sách
  const handlePasteList = () => {
    if (!pasteContent.trim()) return;

    if (isLoadingDatabase) {
      Toast.fire({
        icon: 'info',
        title: 'Đang tải dữ liệu phim, vui lòng đợi'
      });
      return;
    }

    clearData();

    const fileList = pasteContent
      .split('\n')
      .filter(line => line.trim())
      .map(filename => ({
        name: filename.trim(),
        size: 0,
        exists: false,
        loading: false,
        searchName: cleanFileName(filename.trim())
      }));

    if (fileList.length === 0) {
      Toast.fire({
        icon: 'info',
        title: 'Không có dữ liệu hợp lệ'
      });
      return;
    }

    // Kiểm tra ngay với database đã cache
    const checkedFiles = fileList.map(file => checkMovie(file));
    setFiles(checkedFiles);
    setPasteContent('');

    Toast.fire({
      icon: 'success',
      title: `Đã kiểm tra ${fileList.length} phim`
    });
  };

  // Thêm hàm xử lý xuất tên file
  const handleExportFiles = () => {
    exportInputRef.current?.click();
  };

  // Sửa lại hàm copy danh sách
  const copyToClipboard = async () => {
    try {
      if (!navigator.clipboard) {
        // Fallback cho trường hợp không có clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = exportFiles.map(file => file.originalName).join('\n');
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        Toast.fire({
          icon: 'success',
          title: 'Đã copy danh sách vào clipboard'
        });
      } else {
        // Sử dụng Clipboard API nếu có
        await navigator.clipboard.writeText(exportFiles.map(file => file.originalName).join('\n'));
        Toast.fire({
          icon: 'success',
          title: 'Đã copy danh sách vào clipboard'
        });
      }
    } catch (error) {
      console.error('Lỗi khi copy:', error);
      Toast.fire({
        icon: 'error',
        title: 'Không thể copy danh sách'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFolderSelect}
        webkitdirectory=""
        directory=""
        mozdirectory=""
        nwdirectory=""
      />
      <input
        ref={exportInputRef}
        type="file"
        className="hidden"
        onChange={handleExportFolderSelect}
        webkitdirectory=""
        directory=""
        mozdirectory=""
        nwdirectory=""
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold animate-gradient-slow bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent bg-300% hover:bg-pos-100">
                Kiểm tra phim
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {currentFolder ? `Thư mục: ${currentFolder}` : 'Chọn thư mục hoặc paste danh sách để bắt đầu'}
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <button
                onClick={handleSelectFolder}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all duration-200
                  bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600 hover:from-emerald-600 hover:via-teal-600 hover:to-teal-700
                  transform hover:scale-105 active:scale-95"
                disabled={isScanning}
              >
                <Folder className="w-5 h-5" />
                <span>Chọn thư mục</span>
              </button>

              <button
                onClick={handleExportFiles}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all duration-200
                  bg-gradient-to-r from-violet-500 via-purple-500 to-purple-600 hover:from-violet-600 hover:via-purple-600 hover:to-purple-700
                  transform hover:scale-105 active:scale-95"
                disabled={isScanning}
              >
                <Download className="w-5 h-5" />
                <span>Xuất tên file</span>
              </button>

              {files.length > 0 && (
                <>
                  <button
                    onClick={checkAllMovies}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all duration-200
                      bg-gradient-to-r from-blue-500 via-blue-500 to-blue-600 hover:from-blue-600 hover:via-blue-600 hover:to-blue-700
                      transform hover:scale-105 active:scale-95"
                    disabled={isScanning}
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Kiểm tra lại tất cả</span>
                  </button>

                  <button
                    onClick={clearData}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all duration-200
                      bg-gradient-to-r from-rose-500 via-red-500 to-red-600 hover:from-rose-600 hover:via-red-600 hover:to-red-700
                      transform hover:scale-105 active:scale-95"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Xóa tất cả</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Paste area Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-2">
            <FileText className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Hoặc paste danh sách tên phim (mỗi phim một dòng)</span>
          </div>
          <div className="flex gap-4">
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="VD: DASS-094&#10;ABF-004&#10;..."
              className="flex-1 h-24 px-3 py-2 rounded-lg border dark:border-gray-700
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
            />
            <button
              onClick={handlePasteList}
              disabled={!pasteContent.trim()}
              className="flex items-center gap-2 px-4 py-2 h-fit rounded-lg text-white transition-all duration-200
                bg-gradient-to-r from-blue-500 via-blue-500 to-blue-600 hover:from-blue-600 hover:via-blue-600 hover:to-blue-700
                transform hover:scale-105 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Kiểm tra</span>
            </button>
          </div>
        </div>

        {/* Search bar Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm tên file, tên phim hoặc mã phim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-700
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
            />
          </div>
        </div>

        {/* File list */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {isScanning ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Đang quét thư mục...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>Chưa có file nào được tìm thấy</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredFiles.map((file, index) => (
                <div
                  key={`${file.searchName}-${index}`}
                  className="flex items-center justify-between p-4 rounded-lg
                    bg-gray-50 dark:bg-gray-700/50 border dark:border-gray-700"
                >
                  <div className="flex gap-4 flex-1 min-w-0 items-center">
                    <div className="flex-shrink-0 w-8 text-center font-medium text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </div>

                    {file.exists && file.movie?.poster ? (
                      <div className="relative w-[270px] h-[175px] flex-shrink-0">
                        <Image
                          src={file.movie.poster}
                          alt={file.movie.title}
                          fill
                          unoptimized
                          className="object-cover rounded-lg"
                          sizes="270px"
                        />
                      </div>
                    ) : (
                      <div className="w-[270px] h-[175px] flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg
                        flex items-center justify-center">
                        <Film className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium animate-gradient-slow bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent bg-300% hover:bg-pos-100">
                        {file.searchName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                        {file.movie?.code && (
                          <span className="px-2 py-0.5 text-sm font-medium rounded-full
                            bg-gradient-to-r from-purple-500/10 to-purple-600/10 
                            text-purple-700 dark:text-purple-300">
                            {formatMovieCode(file.movie.code)}
                          </span>
                        )}
                      </div>
                      {file.exists && file.movie && (
                        <div className="mt-2 space-y-1">
                          <div className="text-blue-500 dark:text-blue-400 font-medium">
                            {file.movie.title}
                          </div>
                          {file.movie.actress && (
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Diễn viên: {file.movie.actress}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            {file.movie.releaseDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(file.movie.releaseDate).toLocaleDateString('vi-VN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                })}
                              </div>
                            )}
                            {file.movie.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400" />
                                {file.movie.rating}
                              </div>
                            )}
                            {file.movie.createdAt && (
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-gray-400">Thêm:</span>
                                {new Date(file.movie.createdAt).toLocaleDateString('vi-VN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                })}
                              </div>
                            )}
                          </div>
                          {file.movie.genre && file.movie.genre.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {file.movie.genre.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 text-xs rounded-full
                                    bg-gradient-to-r from-blue-500/10 to-blue-600/10
                                    text-blue-700 dark:text-blue-300"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    {file.loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    ) : file.exists === undefined ? (
                      <button
                        onClick={() => checkMovie(file)}
                        className="flex items-center gap-2 px-3 py-1 text-sm rounded-lg text-white transition-all duration-200
                          bg-blue-500 hover:bg-blue-600"
                      >
                        <Search className="w-4 h-4" />
                        <span>Kiểm tra</span>
                      </button>
                    ) : (
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg
                        ${file.exists
                          ? 'bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-700 dark:text-green-300'
                          : 'bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {file.exists ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Đã có</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            <span>Chưa có</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold animate-gradient-slow bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent bg-300% hover:bg-pos-100">
                  Xuất tên file
                </h2>
                {duplicateFiles.length > 0 && (
                  <div className="text-sm text-red-500 dark:text-red-400">
                    Có {duplicateFiles.length} file trùng lặp
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto">
                <div className="grid grid-cols-[auto,1fr,1fr] gap-4 px-4 py-2 font-medium text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <div className="w-12 text-center">#</div>
                  <div>Tên gốc</div>
                  <div>Mã phim</div>
                </div>
                {exportFiles.map((file, index) => (
                  <div
                    key={`${file.cleanName}-${index}`}
                    className={`grid grid-cols-[auto,1fr,1fr] gap-4 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200
                      border-b dark:border-gray-700/50 last:border-0
                      ${duplicateFiles.includes(file.cleanName)
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    <div className="w-12 text-center font-medium text-gray-400 dark:text-gray-500">
                      {index + 1}
                    </div>
                    <div className="truncate">
                      {file.originalName}
                    </div>
                    <div className="font-medium">
                      {file.cleanName}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t dark:border-gray-700 flex justify-end gap-4">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all duration-200
                    bg-gradient-to-r from-blue-500 via-blue-500 to-blue-600 hover:from-blue-600 hover:via-blue-600 hover:to-blue-700
                    transform hover:scale-105 active:scale-95"
                >
                  <Copy className="w-5 h-5" />
                  <span>Copy danh sách</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300
                    hover:text-gray-800 dark:hover:text-white transition-all duration-200
                    transform hover:scale-105 active:scale-95"
                >
                  <X className="w-5 h-5" />
                  <span>Đóng</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 