import { Story } from '../models/Story.js';

export const getStories = async (req, res, next) => {
  try {
    const { limit = 10, page = 1, category } = req.query;
    const skip = (page - 1) * limit;
    const query = category ? { category } : {};

    const stories = await Story.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sources');

    res.json({ success: true, data: stories });
  } catch (error) {
    next(error);
  }
};

export const getStoryById = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id).populate('sources');
    if (!story) {
      return res.status(404).json({ success: false, error: { message: 'Story not found' } });
    }
    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
};

export const deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findByIdAndDelete(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, error: { message: 'Story not found' } });
    }
    res.json({ success: true, data: { message: 'Story deleted' } });
  } catch (error) {
    next(error);
  }
};
