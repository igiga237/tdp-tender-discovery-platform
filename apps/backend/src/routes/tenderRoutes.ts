import express, { Router } from 'express';
import { getUserTenders, postUserTenders } from "../controller/tenderController";
import { authenticateUser } from '../middleware/authMiddleware';


const router: Router = express.Router();

// POST API to to submit tender by auth user
router.post("/v1/user/submittender", authenticateUser, postUserTenders )

// GET API to get list of tenders for auth user
router.get("/v1/user/tenders", authenticateUser, getUserTenders);

export default router;