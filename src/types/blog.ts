export interface Post {
  _id?: string;
  title: string;
  content: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  tags: string[];
  category: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published';
} 