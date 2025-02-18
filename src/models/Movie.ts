import mongoose, { Schema } from 'mongoose';

const MovieSchema = new Schema({
  title: { type: String, required: true },
  code: { type: String, required: true },
  poster: { type: String, required: true },
  releaseDate: { type: Date, required: true },
  actress: { type: String, required: true },
  year: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  genre: [String],
  images: {
    type: [{ type: String }],
    default: undefined,
    required: true
  },
  isFavorite: { type: Boolean, default: false },
  isSeen: { type: Boolean, default: false, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Thêm middleware để đảm bảo images luôn là mảng
MovieSchema.pre('save', function (next) {
  if (!this.images) {
    this.images = [];
  }
  next();
});

export default mongoose.models.Movie || mongoose.model('Movie', MovieSchema); 