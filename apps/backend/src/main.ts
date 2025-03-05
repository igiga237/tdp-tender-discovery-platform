import * as path from 'path'
import express from 'express'
import OpenAI from 'openai'
import cors from 'cors'
import axios from 'axios'
import Papa from 'papaparse'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

// Define the target columns to filter the tender notices
// We need to do this because in our database, the names are forcefully truncated
// So we define the actual database column names here
const targetColumns = [
  'title-titre-eng',
  'referenceNumber-numeroReference',
  'amendmentNumber-numeroModification',
  'solicitationNumber-numeroSollicitation',
  'publicationDate-datePublication',
  'tenderClosingDate-appelOffresDateCloture',
  'amendmentDate-dateModification',
  'expectedContractStartDate-dateDebutContratPrevue',
  'expectedContractEndDate-dateFinContratPrevue',
  'tenderStatus-appelOffresStatut-eng',
  'gsin-nibs',
  'gsinDescription-nibsDescription-eng',
  'unspsc',
  'unspscDescription-eng',
  'procurementCategory-categorieApprovisionnement',
  'noticeType-avisType-eng',
  'procurementMethod-methodeApprovisionnement-eng',
  'selectionCriteria-criteresSelection-eng',
  'limitedTenderingReason-raisonAppelOffresLimite-eng',
  'tradeAgreements-accordsCommerciaux-eng',
  'regionsOfOpportunity-regionAppelOffres-eng',
  'regionsOfDelivery-regionsLivraison-eng',
  'contractingEntityName-nomEntitContractante-eng',
  'contractingEntityAddressLine-ligneAdresseEntiteContractante-eng',
  'contractingEntityAddressCity-entiteContractanteAdresseVille-eng',
  'contractingEntityAddressProvince-entiteContractanteAdresseProvi',
  'contractingEntityAddressPostalCode-entiteContractanteAdresseCod',
  'contractingEntityAddressCountry-entiteContractanteAdressePays-e',
  'endUserEntitiesName-nomEntitesUtilisateurFinal-eng',
  'endUserEntitiesAddress-adresseEntitesUtilisateurFinal-eng',
  'contactInfoName-informationsContactNom',
  'contactInfoEmail-informationsContactCourriel',
  'contactInfoPhone-contactInfoTelephone',
  'contactInfoFax',
  'contactInfoAddressLine-contactInfoAdresseLigne-eng',
  'contactInfoCity-contacterInfoVille-eng',
  'contactInfoProvince-contacterInfoProvince-eng',
  'contactInfoPostalcode',
  'contactInfoCountry-contactInfoPays-eng',
  'noticeURL-URLavis-eng',
  'attachment-piecesJointes-eng',
  'tenderDescription-descriptionAppelOffres-eng',
]

const app = express()
app.use(cors({ origin: '*' })) // Allow all origins
app.use(express.json({ limit: '10mb' })) // Limit is 1mb so can parse more tenders
app.use(cors({
  origin: 'http://localhost:4200', 
  methods: 'GET,POST,PUT,DELETE,OPTIONS', // Allow common methods
  allowedHeaders: 'Content-Type,Authorization', // Allow headers
  credentials: true // Allow credentials
  }));


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
app.get('/api/v1/tenders/search', async (req, res) => {
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
    let dbQuery = supabase
      .from('open_tender_notices')
      // MAYBE: might want to make it .select('*', { count: 'exact' }) to get all fields in future
      .select(
        'title-titre-eng, referenceNumber-numeroReference, tenderStatus-appelOffresStatut-eng, tenderClosingDate-appelOffresDateCloture, expectedContractStartDate-dateDebutContratPrevue, expectedContractEndDate-dateFinContratPrevue, procurementCategory-categorieApprovisionnement, regionsOfDelivery-regionsLivraison-eng',
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
        break;
    }

    // Execute query
    const { data, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to fetch tender notices: ${error.message}`);
    }

    // Return JSON response
    res.json({
      tenders: data,
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
});


// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: process.env.GEMINI_BASE_URL,
  apiKey: process.env.GEMINI_API_KEY,
})

/**
 * Root endpoint
 * @route GET /
 * @returns {Object} Welcome message
 */
app.get('/', (req, res) => {
  res.send({ message: 'Welcome to TDP BACKEND.' })
})

/**
 * Generates AI completions based on a predefined prompt
 * @route POST /generateLeads
 * @param {string} req.body.prompt - The prompt to generate completion for
 * @returns {string} AI generated completion
 */
app.post('/generateLeads', async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL_ID || '',
      messages: [
        { role: 'developer', content: 'You are a helpful assistant.' },
        { role: 'user', content: req.body.prompt },
      ],
    })
    res.json(completion.choices[0].message.content)
  } catch (error) {
    console.error('Error generating leads:', error)
    res.status(500).json({ error: 'Failed to generate leads' })
  }
})

/**
 * Analyzes RFP data using AI and stores the analysis
 * @route POST /getRfpAnalysis
 * @param {Object} req.body - The RFP data to analyze
 * @returns {string} AI generated analysis
 */
app.post('/getRfpAnalysis', async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.GEMINI_AI_MODEL_ID || '',
      messages: [
        { role: 'assistant', content: 'You are an AI that summarizes data' },
        { role: 'user', content: JSON.stringify(req.body) },
      ],
    })

    const response = completion.choices[0].message.content
    const { error } = await supabase
      .from('rfp_analysis')
      .insert({ data: response })

    if (error) {
      console.error('Error storing RFP analysis:', error)
      res.status(500).json({ error })  // REMOVED: removed return keyword, got rid of overload issues
    }

    res.json(response || '{}')
  } catch (error) {
    console.error('Error analyzing RFP:', error)
    res.status(500).json({ error: 'Failed to analyze RFP' })
  }
})

/**
 * Filters tenders using AI based on a prompt
 * @route POST /filterTendersWithAI
 * @param {string} req.body.prompt - The filtering criteria
 * @param {Object[]} req.body.data - The tender data to filter
 * @returns {Object} JSON object containing matching reference IDs
 */
app.post('/filterTendersWithAI', async (req, res) => {
  try {
    const { prompt, data } = req.body
    const completion = await openai.chat.completions.create({
      model: process.env.GEMINI_AI_MODEL_ID || '',
      messages: [
        {
          role: 'assistant',
          content: `You are an AI that helps users filter a database of government tenders. 
You MUST return a valid JSON response matching this exact format:
{
  "matches": ["REF1", "REF2"]
}

You are provided with tender objects containing:
- 'referenceNumber-numeroReference' (the ID)
- 'tenderDescription-descriptionAppelOffres-eng' (the description)

Your task:
1. Read each tender description
2. Find matches for this request: "${prompt}"
3. Return ONLY valid JSON with matching reference IDs

The tender data to analyze is: `,
        },
        { role: 'user', content: JSON.stringify(data) },
      ],
      response_format: { type: 'json_object' },
    })
    res.json(completion.choices[0].message.content || '{}')
  } catch (error) {
    console.error('Error filtering tenders:', error)
    res.status(500).json({ error: 'Failed to filter tenders' })
  }
})

/**
 * Downloads open tender notices as CSV
 * @route GET /getOpenTenderNotices
 * @returns {File} CSV file containing tender notices
 */
app.get('/getOpenTenderNotices', async (req, res) => {
  try {
    const openTenderNoticesURL = process.env.OPEN_TENDER_NOTICES_URL || ''
    const response = await axios.get(openTenderNoticesURL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      responseType: 'stream',
    })

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=newTenderNotice.csv'
    )
    response.data.pipe(res)
    console.log('Successfully downloaded newest tender notice!')
  } catch (error) {
    console.error('Error downloading tender notices:', error)
    res.status(500).json({ error: 'Failed to download tender notices' })
  }
})

/**
 * Filters open tender notices and saves to database
 * @route POST /filterOpenTenderNotices
 * @param {string} req.body.prompt - The filtering criteria
 * @returns {Object[]} Filtered tender notices
 */
app.post('/filterOpenTenderNotices', async (req, res) => {
  try {
    // Clear existing filtered notices
    const { error: deleteError } = await supabase
      .from('filtered_open_tender_notices')
      .delete()
      .neq('referenceNumber-numeroReference', 0)

    if (deleteError) {
      console.error('Failed to delete existing filtered notices:', deleteError)
    }

    // Fetch tender notices
    const { data, error } = await supabase
      .from('open_tender_notices')
      .select(
        'referenceNumber-numeroReference, tenderDescription-descriptionAppelOffres-eng'
      )

    if (error) {
      throw new Error(`Failed to fetch tender notices: ${error.message}`)
    }

    // Filter tenders using AI
    const response = await axios.post(
      'http://localhost:3000/filterTendersWithAI',
      {
        prompt: req.body.prompt,
        data: data,
      }
    )

    const filteredIDs = response.data.matches

    // Get full data for matched tenders
    const { data: matchedData, error: matchError } = await supabase
      .from('open_tender_notices')
      .select('*')
      .in('referenceNumber-numeroReference', filteredIDs)

    if (matchError) {
      throw new Error(`Failed to fetch matched data: ${matchError.message}`)
    }

    // Insert filtered results
    const { error: insertError } = await supabase
      .from('filtered_open_tender_notices')
      .insert(matchedData)

    if (insertError) {
      throw new Error(`Failed to insert filtered data: ${insertError.message}`)
    }

    // Return filtered results
    const { data: fetchFilteredData, error: fetchFilteredDataError } =
      await supabase.from('filtered_open_tender_notices').select('*')

    if (fetchFilteredDataError) {
      throw new Error(
        `Failed to fetch filtered data: ${fetchFilteredDataError.message}`
      )
    }

    res.json(fetchFilteredData)
  } catch (error: any) {
    console.error('Error filtering open tender notices:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Fetches filtered tender notices from the database
 * @route GET /getFilteredTenderNoticesFromDB
 * @returns {Object[]} Array of filtered tender notices
 */
app.get('/getFilteredTenderNoticesFromDB', async (req, res) => {
  try {
    const { data, error: fetchError } = await supabase
      .from('filtered_open_tender_notices')
      .select('*')

    if (fetchError) {
      throw new Error(`Failed to fetch filtered notices: ${fetchError.message}`)
    }

    res.json(data)
  } catch (error: any) {
    console.error('Error fetching filtered notices:', error)
    res.status(500).json({ error: error.message })
  }
});

/**
 * Downloads and imports tender notices CSV into database
 * @route POST /getOpenTenderNoticesToDB
 * @returns {string} Success message
 */
app.post('/getOpenTenderNoticesToDB', async (req, res) => {
  const openTenderNoticesURL = process.env.OPEN_TENDER_NOTICES_URL || ''

  const filterToTargetColumns = (row: any) =>
    Object.entries(row).reduce((acc, [csvKey, value]) => {
      // Try to find an exact match for the CSV key in targetColumns
      let match = targetColumns.find((target) => target === csvKey)
      if (!match) {
        // If no exact match, check if the target column starts with the CSV key
        match = targetColumns.find((target) => csvKey.startsWith(target))
      }
      if (match) {
        acc[match] = value
      }
      return acc
    }, {} as Record<string, any>)

  try {
    // Clear existing notices
    const { error: deleteError } = await supabase
      .from('open_tender_notices')
      .delete()
      .neq('referenceNumber-numeroReference', 0)

    if (deleteError) {
      throw new Error(
        `Failed to clear existing notices: ${deleteError.message}`
      )
    }

    // Download CSV
    const response = await axios.get(openTenderNoticesURL, {
      headers: {
        'User-Agent': process.env.USER_AGENT || '',
      },
    })

    // Parse CSV and filter columns
    const results = await Papa.parse(response.data, {
      header: true,
      skipEmptyLines: true,
    })

    const filteredData = results.data.map(filterToTargetColumns)

    // Insert filtered data
    const { error: insertError } = await supabase
      .from('open_tender_notices')
      .insert(filteredData)

    if (insertError) {
      throw new Error(`Failed to insert notices: ${insertError.message}`)
    }

    res.json({ message: 'Data imported successfully!' })
  } catch (error: any) {
    console.error('Error importing tender notices:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Fetches all open tender notices from database
 * @route GET /getOpenTenderNoticesFromDB
 * @returns {Object[]} Array of all tender notices
 */
app.get('/getOpenTenderNoticesFromDB', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('open_tender_notices')
      .select('*')

    if (error) {
      throw new Error(`Failed to fetch tender notices: ${error.message}`)
    }

    res.json(data)
  } catch (error: any) {
    console.error('Error fetching tender notices:', error)
    res.status(500).json({ error: error.message })
  }
})

// Serve static files from the 'assets' folder
app.use('/assets', express.static(path.join(__dirname, 'assets')))

const server = app.listen(process.env.PORT, () => {
  console.log(`Listening at http://localhost:${process.env.PORT}`)
})
server.on('error', console.error)
