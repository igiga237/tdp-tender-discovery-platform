import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';

// Define tender data
interface RawTenderData {
    'title-titre-eng': string;
    'referenceNumber-numeroReference': string;
    'unspscDescription-eng':string,
    'tenderStatus-appelOffresStatut-eng': string;
    'tenderClosingDate-appelOffresDateCloture': string;
    'expectedContractStartDate-dateDebutContratPrevue': string;
    'expectedContractEndDate-dateFinContratPrevue': string;
    'procurementCategory-categorieApprovisionnement': string;
    'regionsOfDelivery-regionsLivraison-eng': string;
}


/**
 * @route GET /api/v1/tenders/search
 * @desc Search tenders with filters and pagination
 * @query 
 *   - query: string (search term)
 *   - category: string
 *   - location: string
 *   - status: string
 *   - deadline_from: string (ISO date)
 *   - deadline_to: string (ISO date)
 *   - budget_min: number  // UNSURE: not in database
 *   - budget_max: number  // UNSURE: not in database
 *   - sort_by: string (column name)
 *   - page: number (default 1)
 *   - limit: number (default 10)
 */
/** */
// app.get('/api/v1/tenders/search', async (req, res) => 
export const searchTenders = async (req: Request, res: Response) =>    {
    try {
      console.log('Request received at /api/v1/tenders/search');
  
      // Extract query parameters and explicitly convert them
      const query = typeof req.query.query === 'string' ? req.query.query : undefined;
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const location = typeof req.query.location === 'string' ? req.query.location : undefined;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      
      const deadline_from = typeof req.query.deadline_from === 'string' ? req.query.deadline_from : undefined;
      const deadline_to = typeof req.query.deadline_to === 'string' ? req.query.deadline_to : undefined;
  
      // Below are potentially not needed:
      // const budget_min = typeof req.query.budget_min === 'string' ? Number(req.query.budget_min) : undefined;
      // const budget_max = typeof req.query.budget_max === 'string' ? Number(req.query.budget_max) : undefined;
  
      // UNSURE: not sure what 'criteria' is specifically supposed to be
      const sort_by = typeof req.query.sort_by === 'string' ? req.query.sort_by : 'publicationDate-datePublication';
  
      const page = typeof req.query.page === 'string' ? Number(req.query.page) : 1;
      const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 10;
      const offset = (page - 1) * limit;


      // Base query selecting relevant fields 
      // long description variable  'tenderDescription-descriptionAppelOffres-eng'
      let dbQuery = supabase
        .from('open_tender_notices')
        // MAYBE: might want to make it .select('*', { count: 'exact' }) to get all fields in future
        .select(
          'title-titre-eng, referenceNumber-numeroReference, unspscDescription-eng, tenderStatus-appelOffresStatut-eng, tenderClosingDate-appelOffresDateCloture, expectedContractStartDate-dateDebutContratPrevue, expectedContractEndDate-dateFinContratPrevue, procurementCategory-categorieApprovisionnement, regionsOfDelivery-regionsLivraison-eng',
          { count: 'exact' }
        )
        .range(offset, offset + limit - 1);
  
      // **Apply Filters Based on Query Parameters**
      if (query) {
        dbQuery = dbQuery.ilike('title-titre-eng', `%${query}%`);
      }
      if (category) {
        dbQuery = dbQuery.eq('procurementCategory-categorieApprovisionnement', category);
      }
      if (location) {
        dbQuery = dbQuery.ilike('regionsOfDelivery-regionsLivraison-eng', `%${location}%`);
      }
      if (status) {
        dbQuery = dbQuery.eq('tenderStatus-appelOffresStatut-eng', status);
      }
      if (deadline_from) {
        dbQuery = dbQuery.gte('tenderClosingDate-appelOffresDateCloture', deadline_from);
      }
      if (deadline_to) {
        dbQuery = dbQuery.lte('tenderClosingDate-appelOffresDateCloture', deadline_to);
      }
      // Below are potentially not needed:
      // if (budget_min && !isNaN(Number(budget_min))) {
      //   dbQuery = dbQuery.gte('budget_min', Number(budget_min));
      // }
      // if (budget_max && !isNaN(Number(budget_max))) {
      //   dbQuery = dbQuery.lte('budget_max', Number(budget_max));
      // }   
  
      // sort by button conditions
      switch (sort_by) {
        case 'newest':
          dbQuery = dbQuery.order('publicationDate-datePublication', { ascending: false });
          break;
        case 'oldest':
          dbQuery = dbQuery.order('publicationDate-datePublication', { ascending: true });
          break;
        // Below are potentially not needed:
        // case 'highest_budget':
        //   dbQuery = dbQuery.order('budget_max', { ascending: true });
        //   break;
        // case 'lowest_budget':
        //   // INCOMPLETE: take in user input min budget
        //   break;
        default:
          // Default: relevance (do not explicitly order)
          dbQuery = dbQuery
            .order('tenderStatus-appelOffresStatut-eng', { ascending: false }) // Open tenders first
            .order('tenderClosingDate-appelOffresDateCloture', { ascending: true }) // Closest deadlines next
            .order('procurementCategory-categorieApprovisionnement', { ascending: true }); // Arbitrary tie-breaker
        break;
      }
  
      // Execute query
      const { data, error, count } = await dbQuery;
  
      if (error) {
        throw new Error(`Failed to fetch tender notices: ${error.message}`);
      }

      // Transforming data 
      const transformedTenders = (data as unknown as RawTenderData[]).map(tender => ({
        title: tender['title-titre-eng'],
        referenceNumber: tender['referenceNumber-numeroReference'],
        description:tender['unspscDescription-eng'],
        status: tender['tenderStatus-appelOffresStatut-eng'],
        closingDate: tender['tenderClosingDate-appelOffresDateCloture'],
        contractStartDate: tender['expectedContractStartDate-dateDebutContratPrevue'],
        contractEndDate: tender['expectedContractEndDate-dateFinContratPrevue'],
        category: tender['procurementCategory-categorieApprovisionnement'],
        regions: tender['regionsOfDelivery-regionsLivraison-eng'],
  
      }));

  
      // Return JSON response
      res.status(200).json({
        tenders: transformedTenders,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });

    } catch (error) {
      
      console.error('Error fetching tenders:', error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  };

  