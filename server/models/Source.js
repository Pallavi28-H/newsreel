import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema({
  sourceName: { type: String, required: true },
  sourceType: { type: String }, // e.g. 'News', 'Reddit'
  headline: { type: String, required: true },
  url: { type: String, required: true },
  publishedAt: { type: Date },
  author: { type: String },
  imageUrl: { type: String },
  content: { type: String },
  snippet: { type: String },
}, { timestamps: true });

export const Source = mongoose.model('Source', sourceSchema);
