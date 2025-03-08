'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trash2, Loader2, Filter, MessageSquare, AlertCircle, CheckCircle2, Clock, Search, MoreVertical } from 'lucide-react';
import { Toast } from '@/lib/toast.helper';
import Swal from 'sweetalert2';

interface Feedback {
  _id: string;
  type: 'feedback' | 'request';
  title: string;
  content: string;
  movieCode?: string;
  contact?: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed';
}

type FilterType = 'all' | 'feedback' | 'request';
type StatusType = 'all' | 'pending' | 'processing' | 'completed';

export default function ManageFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<StatusType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Click outside to close status menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showStatusMenu && !(event.target as Element).closest('.status-menu')) {
        setShowStatusMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showStatusMenu]);

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch('/api/feedback');
      if (!response.ok) throw new Error('Failed to fetch feedbacks');
      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      Toast.fire({
        icon: 'error',
        title: 'Không thể tải danh sách feedback'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: StatusType) => {
    if (newStatus === 'all') return;
    setUpdating(id);
    setShowStatusMenu(null);

    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setFeedbacks(feedbacks.map(f =>
        f._id === id ? { ...f, status: newStatus } : f
      ));

      Toast.fire({
        icon: 'success',
        title: 'Đã cập nhật trạng thái'
      });
    } catch (error) {
      console.error('Error updating status:', error);
      Toast.fire({
        icon: 'error',
        title: 'Không thể cập nhật trạng thái'
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: 'Bạn không thể hoàn tác sau khi xóa!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#dc2626',
      position: 'center',
      customClass: {
        popup: 'dark:bg-gray-800 dark:text-white',
        title: 'text-lg font-medium text-gray-900 dark:text-white',
        htmlContainer: 'text-gray-600 dark:text-gray-300',
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg',
        cancelButton: 'bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg',
      }
    });

    if (!result.isConfirmed) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete feedback');

      setFeedbacks(feedbacks.filter(f => f._id !== id));
      Toast.fire({
        icon: 'success',
        title: 'Đã xóa feedback'
      });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      Toast.fire({
        icon: 'error',
        title: 'Không thể xóa feedback'
      });
    } finally {
      setDeleting(null);
    }
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks
      .filter(feedback => {
        const matchesType = filterType === 'all' || feedback.type === filterType;
        const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus;
        const matchesSearch = searchTerm === '' ||
          feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (feedback.movieCode && feedback.movieCode.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesType && matchesStatus && matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [feedbacks, filterType, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const feedbackCount = feedbacks.filter(f => f.type === 'feedback').length;
    const requestCount = feedbacks.filter(f => f.type === 'request').length;
    const pendingCount = feedbacks.filter(f => f.status === 'pending').length;
    const processingCount = feedbacks.filter(f => f.status === 'processing').length;
    const completedCount = feedbacks.filter(f => f.status === 'completed').length;

    return {
      total,
      feedbackCount,
      requestCount,
      pendingCount,
      processingCount,
      completedCount
    };
  }, [feedbacks]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-6 text-center animate-gradient">
          Quản lý Feedback & Yêu cầu
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Tổng số</span>
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-semibold mt-2 text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Feedback</span>
              <MessageSquare className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-semibold mt-2 text-gray-900 dark:text-white">{stats.feedbackCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Request</span>
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-semibold mt-2 text-gray-900 dark:text-white">{stats.requestCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Đang chờ</span>
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-2xl font-semibold mt-2 text-gray-900 dark:text-white">{stats.pendingCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Đang xử lý</span>
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-semibold mt-2 text-gray-900 dark:text-white">{stats.processingCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Hoàn thành</span>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-semibold mt-2 text-gray-900 dark:text-white">{stats.completedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, nội dung hoặc mã phim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tất cả loại</option>
              <option value="feedback">Feedback</option>
              <option value="request">Request</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as StatusType)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Đang chờ</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="grid gap-4">
        {filteredFeedbacks.map((feedback) => (
          <div
            key={feedback._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transition-all duration-200
              hover:shadow-md border border-gray-100 dark:border-gray-700"
          >
            {/* Header Section */}
            <div className="flex flex-col gap-2">
              {/* Top Row: Movie Code, Type, Status, Date and Actions */}
              <div className="flex items-center justify-between gap-4">
                {/* Left side: Movie Code and Type */}
                <div className="flex items-center gap-2 min-w-0">
                  {/* Movie Code */}
                  {feedback.movieCode && (
                    <span className="shrink-0 inline-flex items-center px-2 py-1 bg-red-100 dark:bg-red-900 
                      text-red-700 dark:text-red-300 rounded-md text-xs font-medium">
                      {feedback.movieCode}
                    </span>
                  )}

                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium
                    ${feedback.type === 'feedback'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                    {feedback.type === 'feedback' ? 'Feedback' : 'Request'}
                  </span>
                </div>

                {/* Right side: Status, Date and Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Status */}
                  <div className="relative status-menu">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStatusMenu(showStatusMenu === feedback._id ? null : feedback._id);
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer
                        ${feedback.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : feedback.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                      {getStatusIcon(feedback.status)}
                      {feedback.status === 'completed' ? 'Hoàn thành' :
                        feedback.status === 'processing' ? 'Đang xử lý' : 'Đang chờ'}
                      <MoreVertical className="w-3 h-3" />
                    </button>

                    {showStatusMenu === feedback._id && (
                      <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-gray-800 
                        rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-10">
                        {['pending', 'processing', 'completed'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(feedback._id, status as StatusType)}
                            disabled={updating === feedback._id}
                            className={`w-full px-4 py-2 text-left text-sm first:rounded-t-lg last:rounded-b-lg
                              hover:bg-gray-50 dark:hover:bg-gray-700
                              ${feedback.status === status ? 'bg-gray-50 dark:bg-gray-700' : ''}
                              ${status === 'completed' ? 'text-green-600 dark:text-green-400' :
                                status === 'processing' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-gray-600 dark:text-gray-400'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              {getStatusIcon(status)}
                              <span>
                                {status === 'completed' ? 'Hoàn thành' :
                                  status === 'processing' ? 'Đang xử lý' : 'Đang chờ'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Created Date */}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(feedback.createdAt).toLocaleString('vi-VN')}
                  </span>

                  {/* Actions */}
                  {updating === feedback._id && (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  )}
                  <button
                    onClick={() => handleDelete(feedback._id)}
                    disabled={deleting === feedback._id || updating === feedback._id}
                    className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 
                      dark:hover:text-red-300 transition-colors rounded-lg
                      hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {deleting === feedback._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Title Row */}
              <h3 className="text-base font-medium text-gray-800 dark:text-white">
                {feedback.title}
              </h3>
            </div>

            {/* Content and Contact */}
            <div className="space-y-2">
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {feedback.content}
              </div>

              {feedback.contact && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Liên hệ: {feedback.contact}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredFeedbacks.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Không tìm thấy feedback nào
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 