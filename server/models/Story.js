import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  clusterId: { type: String, required: true, unique: true },
  headline: { type: String, required: true },
  summary: { type: String, required: true, maxlength: 500 }, // approx 60 words
  whyItMatters: { type: String },
  imageUrl: { type: String },
  imagePrompt: { type: String },
  category: { type: String, default: 'General' },
  publishedAt: { type: Date, default: Date.now },
  sources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Source' }],
  keywords: [{ type: String }],
}, { timestamps: true });

// Add index for fast querying by keywords and category
storySchema.index({ keywords: 1 });
storySchema.index({ category: 1 });
storySchema.index({ publishedAt: -1 });

export const Story = mongoose.model('Story', storySchema);
