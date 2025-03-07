import express from 'express';
import { searchTenders } from '../controller/tenderSearchController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/search', authenticateUser, searchTenders);

export default router;

