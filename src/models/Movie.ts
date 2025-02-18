import mongoose from 'mongoose';

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true },
  poster: { type: String, required: true },
  releaseDate: { type: Date, required: true },
  actress: { type: String, required: true },
  year: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  genre: [String],
  isFavorite: { type: Boolean, default: false },
  isSeen: { type: Boolean, default: false, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Movie || mongoose.model('Movie', MovieSchema); 