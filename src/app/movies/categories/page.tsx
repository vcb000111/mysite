'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { GradientGenerator } from '@/app/utils/gradients';
import Swal from 'sweetalert2';

interface Genre {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

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

function Categories() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [genreInput, setGenreInput] = useState('');
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [deletingGenre, setDeletingGenre] = useState<Genre | null>(null);
  const [buttonClasses, setButtonClasses] = useState('');

  useEffect(() => {
    fetchGenres();
    setButtonClasses(GradientGenerator.getButtonClasses());
  }, []);

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/genres');
      if (response.ok) {
        const data = await response.json();
        setGenres(data);
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const handleAddGenre = async () => {
    try {
      if (!genreInput.trim()) {
        Toast.fire({
          icon: 'error',
          title: 'Vui lòng nhập tên thể loại'
        });
        return;
      }

      const response = await fetch('/api/genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: genreInput.trim() }),
      });

      if (!response.ok) throw new Error('Failed to add genre');

      const newGenre = await response.json();
      setGenres(prev => [newGenre, ...prev]);
      setShowModal(false);
      setGenreInput('');
      Toast.fire({
        icon: 'success',
        title: 'Thêm thể loại thành công'
      });
    } catch (error) {
      console.error('Error adding genre:', error);
      Toast.fire({
        icon: 'error',
        title: 'Có lỗi xảy ra khi thêm thể loại'
      });
    }
  };

  const handleEditGenre = async () => {
    if (!editingGenre) return;

    try {
      const response = await fetch(`/api/genres/${editingGenre._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: genreInput.trim() }),
      });

      if (!response.ok) throw new Error('Failed to update genre');

      const updatedGenre = await response.json();
      setGenres(prev => prev.map(genre =>
        genre._id === updatedGenre._id ? updatedGenre : genre
      ));
      setShowModal(false);
      setEditingGenre(null);
      setGenreInput('');
      Toast.fire({
        icon: 'success',
        title: 'Cập nhật thể loại thành công'
      });
    } catch (error) {
      console.error('Error updating genre:', error);
      Toast.fire({
        icon: 'error',
        title: 'Có lỗi xảy ra khi cập nhật thể loại'
      });
    }
  };

  const handleDeleteGenre = async (genreId: string) => {
    try {
      const response = await fetch(`/api/genres/${genreId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete genre');

      setGenres(prev => prev.filter(genre => genre._id !== genreId));
      setDeletingGenre(null);
      Toast.fire({
        icon: 'success',
        title: 'Xóa thể loại thành công'
      });
    } catch (error) {
      console.error('Error deleting genre:', error);
      Toast.fire({
        icon: 'error',
        title: 'Có lỗi xảy ra khi xóa thể loại'
      });
    }
  };

  return (
    <div className="w-full md:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold animate-gradient">Quản lý thể loại</h1>
          <button
            onClick={() => {
              setShowModal(true);
              setEditingGenre(null);
              setGenreInput('');
            }}
            className={buttonClasses || 'flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all duration-200 bg-blue-500 hover:bg-blue-600'}
          >
            <Plus className="w-5 h-5" />
            Thêm thể loại
          </button>
        </div>

        {/* Genre list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {genres.map(genre => (
            <div
              key={genre._id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4
                border border-gray-100 dark:border-gray-700 
                hover:shadow-lg transition-all duration-200
                group relative overflow-hidden"
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 
                dark:from-blue-500/20 dark:to-purple-500/20 opacity-0 group-hover:opacity-100 
                transition-opacity duration-200"
              />

              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 
                    bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200"
                  >
                    {genre.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingGenre(genre);
                        setGenreInput(genre.name);
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-500 dark:text-gray-500 
                        dark:hover:text-blue-400 transition-colors duration-200
                        hover:scale-110 active:scale-95"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeletingGenre(genre)}
                      className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 
                        dark:hover:text-red-400 transition-colors duration-200
                        hover:scale-110 active:scale-95"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <span className="font-bold">Tạo lúc:</span>
                    <span className="font-medium">{new Date(genre.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  {genre.updatedAt && (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <span className="font-bold">Cập nhật:</span>
                      <span className="font-medium">{new Date(genre.updatedAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingGenre ? 'Sửa thể loại' : 'Thêm thể loại mới'}
              </h2>

              <input
                type="text"
                placeholder="Tên thể loại"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border dark:border-gray-700
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingGenre(null);
                    setGenreInput('');
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                    dark:hover:text-gray-200 transition-all duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={editingGenre ? handleEditGenre : handleAddGenre}
                  className={buttonClasses}
                >
                  {editingGenre ? 'Lưu' : 'Thêm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {deletingGenre && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Xác nhận xóa thể loại
              </h2>

              <p className="text-gray-600 dark:text-gray-300">
                Bạn có chắc chắn muốn xóa thể loại <span className="font-medium">{deletingGenre.name}</span>?
                <br />
                Hành động này không thể hoàn tác.
              </p>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeletingGenre(null)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                    dark:hover:text-gray-200 transition-all duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDeleteGenre(deletingGenre._id)}
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

export default Categories; 