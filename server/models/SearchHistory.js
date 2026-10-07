import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema({
  query: { type: String, required: true },
  searchedAt: { type: Date, default: Date.now },
  // Optional: Add user reference if implementing auth
  // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

searchHistorySchema.index({ searchedAt: -1 });

export const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);
