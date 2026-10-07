import express from 'express';
import { SearchHistory } from '../models/SearchHistory.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const history = await SearchHistory.find().sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newHistory = await SearchHistory.create({ query: req.body.query });
    res.json({ success: true, data: newHistory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;