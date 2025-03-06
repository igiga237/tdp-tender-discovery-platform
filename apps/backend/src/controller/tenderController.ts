import {Request, Response }  from 'express';
import { supabase } from "../utils/supabaseClient";

// Post the tender details with user details in submitted tender table 
export const postUserTenders = async (req: Request, res: Response) => {
    try {

        // Extracting tender reference number
        const tenderRef  = req.params; //'cb-10-49073374';
        
        // Extract user id
        const user_id = req.user?.id;
        if(!user_id) {
           return res.status(401).json({ success: false, message: 'Unauthorized: User id not found'})
        }

        
        // Fetch tender details from 'open_tender_notices
        const {data: tender, error: fetchError } = await supabase
            .from('open_tender_notices')
            .select('tenderRef, title')
            .eq('id' , tenderRef) 
            .single();

        if(fetchError || !tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        //Insert into 'submitted_tenders
        const { data: submitted_tender, error: insertError } = await supabase
            .from('submitted_tenders')
            .insert([{
                tender_ref: tenderRef, 
                user_id: user_id, 
                title: tender.title,
                submission_date: Date().toString(),
                status: 'submitted',
                updated_at: Date().toString()
            }]);

        if(insertError) {
            return res.status(500).json({ message: 'Failed to submit tender', error: insertError});
        }

        // Remove from 'open_tender_notices' implemente later
        // await supabase.from('open_tender_notices).delete().eq('id', tenderId)

        res.status(200).json({message: 'Tender submitted successfully!', submitted_tender });

    } catch (error) {
        res.status(500).json({message: 'Server error' , error})
    }

};


// Fetch list of tenders for authenticated users
export const getUserTenders = async (req: Request, res: Response) => {
    try {
        
        // Extract user id
        const user_id = req.user?.id;
        if(!user_id) {
           return res.status(401).json({ success: false, message: 'Unauthorized: User id not found'})
        }

        // Getting list of tenders for authenticated user
        let tendersList = supabase
            .from("submitted tender")
            .select("id, title, submission_date, status, updated_at")
            .eq("user_id", user_id);

        const { data, error } = await tendersList;

        // Getting tenders for authenticcated user
        // const {data, error} = await supabase
        //     .from('submitted_tenders')
        //     .select('id, title, submission_date, status, updated_at')
        //     .eq("user_id", user_id);

        if (error) throw error;

        return res.status(200).json({ success: true, data});

    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message || "Internal Server Error"});
    }        
};
