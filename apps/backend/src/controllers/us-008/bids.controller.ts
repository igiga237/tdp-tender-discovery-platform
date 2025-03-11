// apps/backend/src/controllers/us-008/bids.controller.ts
import { Request, Response } from 'express';
import * as bidService from '../../../services/bid.service';

/**
 * GET /api/v1/bids
 * Fetch all bids for the logged-in user, with pagination and optional filters.
 */
export async function getBidsHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Use req.user.email as the user identifier.
    const userId = req.user.email;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort_by = (req.query.sort_by as string) || 'last_updated';
    const filters = {
      bid_status: req.query.bid_status as string | undefined,
      // Add additional filters here if needed.
    };

    const result = await bidService.getBidsForUser(userId, { page, limit, sort_by, filters });
    return res.json(result);
  } catch (error: any) {
    console.error('Error fetching bids:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/v1/bids/:id
 * Fetch a single bid by its ID (only if it belongs to the logged-in user).
 */
export async function getSingleBidHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user.email;
    const { id } = req.params;
    const bid = await bidService.getBidById(userId, id);
    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }
    return res.json({ bid });
  } catch (error: any) {
    console.error('Error fetching single bid:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * PATCH /api/v1/bids/:id
 * Update the bid status (or other fields) for a given bid.
 * Broadcasts the update via WebSocket for real-time notifications.
 */
export async function updateBidStatusHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user.email;
    const { id } = req.params;
    const { newStatus } = req.body;
    if (!newStatus) {
      return res.status(400).json({ error: 'newStatus is required' });
    }

    const updatedBid = await bidService.updateBidStatus(userId, id, newStatus);
    if (!updatedBid) {
      return res.status(404).json({ error: 'Bid not found or not updated' });
    }

    // If using req.app.get('io') to access the Socket.IO instance:
    const io = req.app.get('io');
    if (io) {
      io.emit('bidStatusUpdated', { bid: updatedBid });
    }

    return res.json({ bid: updatedBid });
  } catch (error: any) {
    console.error('Error updating bid status:', error);
    return res.status(500).json({ error: error.message });
  }
}
