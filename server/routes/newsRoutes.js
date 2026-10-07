import express from 'express';
import { processNewsSearch, getTrendingNews, getLiveIndiaCoverage } from '../controllers/newsController.js';

const router = express.Router();

router.post('/search', processNewsSearch);
router.get('/trending', getTrendingNews);
router.get('/live-india', getLiveIndiaCoverage);

export default router;