'use client';

import { useState } from 'react';
import { Send, Loader2, Smile } from 'lucide-react';
import { Toast } from '@/lib/toast.helper';

interface FeedbackForm {
  type: 'feedback' | 'request';
  title: string;
  content: string;
  movieCode: string;
  contact?: string;
}

// Định nghĩa giới hạn ký tự và số lần gửi
const LIMITS = {
  title: 100,
  content: 1000,
  movieCode: 20,
  contact: 100,
  requestsPerHour: 10
};

// Helper function để kiểm tra giới hạn gửi
const checkRequestLimit = () => {
  const now = new Date().getTime();
  const oneHourAgo = now - (60 * 60 * 1000);

  // Lấy lịch sử gửi từ localStorage
  const requestHistory = JSON.parse(localStorage.getItem('requestHistory') || '[]');

  // Lọc ra các request trong 1 giờ qua
  const recentRequests = requestHistory.filter((timestamp: number) => timestamp > oneHourAgo);

  // Cập nhật lại lịch sử
  localStorage.setItem('requestHistory', JSON.stringify(recentRequests));

  return recentRequests.length < LIMITS.requestsPerHour;
};

// Helper function để thêm request mới vào lịch sử
const addRequestToHistory = () => {
  const requestHistory = JSON.parse(localStorage.getItem('requestHistory') || '[]');
  requestHistory.push(new Date().getTime());
  localStorage.setItem('requestHistory', JSON.stringify(requestHistory));
};

export default function Feedback() {
  const [form, setForm] = useState<FeedbackForm>({
    type: 'feedback',
    title: '',
    content: '',
    movieCode: '',
    contact: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra giới hạn số lần gửi
    if (!checkRequestLimit()) {
      Toast.fire({
        icon: 'error',
        title: 'Bạn đã vượt quá giới hạn 10 lần gửi trong 1 giờ. Vui lòng thử lại sau.'
      });
      return;
    }

    // Kiểm tra độ dài trước khi submit
    if (form.title.length > LIMITS.title ||
      form.content.length > LIMITS.content ||
      form.movieCode.length > LIMITS.movieCode ||
      (form.contact && form.contact.length > LIMITS.contact)) {
      Toast.fire({
        icon: 'error',
        title: 'Input length exceeds limit'
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      // Thêm request vào lịch sử nếu thành công
      addRequestToHistory();

      setForm({
        type: 'feedback',
        title: '',
        content: '',
        movieCode: '',
        contact: ''
      });

      Toast.fire({
        icon: 'success',
        title: 'Successfully submitted!'
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Toast.fire({
        icon: 'error',
        title: 'Unable to submit. Please try again later.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper để hiển thị số ký tự còn lại
  const remainingChars = (field: keyof typeof LIMITS, value: string) => {
    return LIMITS[field] - value.length;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center animate-gradient">
          Feedback & Movie Request
          <br />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Only for feedback and requests for <strong className="text-blue-500">Subjectivity, POV, Prostitution</strong> genres movies.
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            <br />
            Request will take <strong className="text-blue-500">2-7 days</strong> to be processed. Please be patient!
          </span>
        </h1>


        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Request Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.type === 'feedback'}
                    onChange={() => setForm({ ...form, type: 'feedback' })}
                    className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Feedback</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.type === 'request'}
                    onChange={() => setForm({ ...form, type: 'request' })}
                    className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Movie Request</span>
                </label>
              </div>
            </div>

            {/* Movie Code */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Movie Code <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${remainingChars('movieCode', form.movieCode) < 5 ? 'text-red-500' : 'text-gray-500'}`}>
                  {remainingChars('movieCode', form.movieCode)} characters remaining
                </span>
              </div>
              <input
                type="text"
                value={form.movieCode}
                onChange={(e) => {
                  if (e.target.value.length <= LIMITS.movieCode) {
                    setForm({ ...form, movieCode: e.target.value });
                  }
                }}
                required
                maxLength={LIMITS.movieCode}
                placeholder={form.type === 'feedback'
                  ? "Enter movie code you want to feedback"
                  : "Enter movie code you want to request"}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${remainingChars('title', form.title) < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                  {remainingChars('title', form.title)} characters remaining
                </span>
              </div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => {
                  if (e.target.value.length <= LIMITS.title) {
                    setForm({ ...form, title: e.target.value });
                  }
                }}
                required
                maxLength={LIMITS.title}
                placeholder={form.type === 'feedback' ? 'Feedback title' : 'Movie title'}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Content <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${remainingChars('content', form.content) < 100 ? 'text-red-500' : 'text-gray-500'}`}>
                  {remainingChars('content', form.content)} characters remaining
                </span>
              </div>
              <textarea
                value={form.content}
                onChange={(e) => {
                  if (e.target.value.length <= LIMITS.content) {
                    setForm({ ...form, content: e.target.value });
                  }
                }}
                required
                maxLength={LIMITS.content}
                placeholder={form.type === 'feedback'
                  ? 'Your feedback content...'
                  : 'Movie details (actress, release year, etc...)'}
                rows={5}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contact Information
                </label>
                <span className={`text-xs ${remainingChars('contact', form.contact || '') < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                  {remainingChars('contact', form.contact || '')} characters remaining
                </span>
              </div>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => {
                  if (e.target.value.length <= LIMITS.contact) {
                    setForm({ ...form, contact: e.target.value });
                  }
                }}
                maxLength={LIMITS.contact}
                placeholder="Email or other contact information (optional)"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2
                ${submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition-colors`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 