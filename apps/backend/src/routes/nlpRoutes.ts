import { Router } from 'express';
import { extractDocumentData, getExtractedData } from '../controllers/us-012/nlpController';
import { authenticateUser } from '../middleware/auth.Middleware';

const router = Router();

// Protect routes as needed
router.post('/documents/extract', authenticateUser, extractDocumentData);
router.get('/documents/:id/data', authenticateUser, getExtractedData);

export default router;

