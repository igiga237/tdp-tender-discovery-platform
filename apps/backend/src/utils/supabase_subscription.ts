import { Server } from 'socket.io';
import { createSupabaseClient } from './createSupabaseClient';
import {TransformedSubTender} from '../services/submittenderServices';
import {SubmittedBid} from '../services/bid.service';
interface token {
  token: string;
}

export function initSupaBaseSubscription(
  acces_token: token,
  io: Server,
  socketId: string,
  userId: string,
  userTender: TransformedSubTender[],
  userBids: SubmittedBid[]
) {console.log(`User ${userId} connected via socket ${socketId}`);
  const supabase = createSupabaseClient(acces_token.token);
  console.log(">>>>User Tender", userBids);
  // INSERT on submitted_bids
  supabase
    .channel('submitted_bids_insert')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'submitted_bids',
        filter: `user_id=eq.${userId}` // Added filter for specific user
      },
      (payload) => {
        console.log('INSERT on submitted_bids:', payload.new);
        io.to(socketId).emit('bidInserted', { bid: payload.new });
      }
    )
    .subscribe();

  // UPDATE on submitted_bids
  supabase
    .channel('submitted_bids_update')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'submitted_bids',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('UPDATE on submitted_bids:', payload.new);
        io.to(socketId).emit('bidUpdated', { bid: payload.new });
      }
    )
    .subscribe();

  // DELETE on submitted_bids
  supabase
    .channel('submitted_bids_delete')
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'submitted_bids',
      },
      (payload) => {
        console.log('DELETE on submitted_bids:', payload.old);
        const bidId = payload.old.bid_id;
        const existsInUserTender = userBids.some(bid => bid.bid_id === bidId);
        if (existsInUserTender) {
          io.to(socketId).emit('bidDeleted', { bid: payload.old });
        }
        
      }
    )
    .subscribe();

  // INSERT on submitted_tenders
  supabase
    .channel('submitted_tenders_insert')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'submitted_tenders',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('INSERT on submitted_tenders:', payload.new);
        io.to(socketId).emit('tenderInserted', { tender: payload.new });
      }
    )
    .subscribe();

  // UPDATE on submitted_tenders
  supabase
    .channel('submitted_tenders_update')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'submitted_tenders',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('UPDATE on submitted_tenders:', payload.new);
        io.to(socketId).emit('tenderUpdated', { tender: payload.new });
      }
    )
    .subscribe();

  // DELETE on submitted_tenders
  supabase
  .channel('submitted_tenders_delete')
  .on(
    'postgres_changes',
    {
      event: 'DELETE',
      schema: 'public',
      table: 'submitted_tenders',
    },
    (payload) => {
      console.log('DELETE on submitted_tenders:', payload);
      // Check if the payload's submission_id is in the userTender list
      const tenderId = payload.old.submission_id;
      const existsInUserTender = userTender.some(tender => tender.subId === tenderId);
      if (existsInUserTender) {
        io.to(socketId).emit('tenderDeleted', { tender: payload });
      }
    }
  )
  .subscribe();
  }
