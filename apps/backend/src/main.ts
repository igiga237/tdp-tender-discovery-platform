import * as path from 'path'
import express from 'express'
import OpenAI from 'openai'
import cors from 'cors'
import axios from 'axios'
import Papa from 'papaparse'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)
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

app.use(express.json())

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Root endpoint, returns a welcome message
app.get('/', (req, res) => {
  res.send({ message: 'Welcome to TDP BACKEND.' })
})

// Endpoint for generating OpenAI GPT-4 completions based on a predefined prompt.
app.post('/generateLeads', async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL_ID || '',
      messages: [
        { role: 'developer', content: 'You are a helpful assistant.' },
        {
          role: 'user',
          content: req.body.prompt,
        },
      ],
    })
    console.log(completion)
    res.json(completion.choices[0].message.content) // Sends back the generated response from OpenAI.
  } catch (error) {
    console.log(error)
  }
})

// Endpoint to filter the tenders
app.post('/filterTendersWithAI', async (req, res) => {
  try {
    const prompt = req.body.prompt
    // const content = req.body.data.map((element: Record<string, any>) => {
    //   return {
    //     role: 'user',
    //     content: [
    //       {
    //         type: 'text',
    //         text: JSON.stringify(element), // Send JSON as a single text message
    //       },
    //     ],
    //   }
    // })
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL_ID || '',
      messages: [
        {
          role: 'assistant',
          content: `You are an AI that helps users filter a databse of government tenders. You are provided with an array of tender objects. Each object contains two keys: 'referenceNumber-numeroReference', which is the reference ID, and 'tenderDescription-descriptionAppelOffres-eng', which is the description of the tender.

Your task:
1. Read each tender description
2. The user is asking this: "${prompt}"
3. If the description of the tender relates to what the user wants, include its reference ID
4. Return a JSON array object with matched reference numbers

Example response format if matches found:
{
  "matches": ["REF123", "REF456"]
}

The tender data to analyze is: `,
        },
        {
          role: 'user',
          content: JSON.stringify(req.body.data),
        },
      ],
      response_format: {
        type: 'json_object',
      },
    })
    res.json(completion.choices[0].message.content)
  } catch (error) {
    console.log(error)
  }
})

// Endpoint to fetch open tender notices from an external URL and return as a CSV file
app.get('/getOpenTenderNotices', async (req, res) => {
  const openTenderNoticesURL = process.env.OPEN_TENDER_NOTICES_URL || ''

  try {
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
    ) // Sets the response as a downloadable CSV file
    response.data.pipe(res) // Streams the downloaded CSV data to the response
    console.log('Successfully downloaded newest tender notice!')
  } catch (error) {
    console.log(
      'Error downloading the new tender notices, please see this error:',
      error
    )
  }
})

app.post('/filterOpenTenderNotices', async (req, res) => {
  try {
    const prompt = req.body.prompt
    const { data, error } = await supabase
      .from('open_tender_notices')
      .select(
        'referenceNumber-numeroReference, tenderDescription-descriptionAppelOffres-eng'
      )
      .limit(10)

    const response = data

    try {
      const filteredIDs: Array<String> = (
        await axios.post('http://localhost:3000/filterTendersWithAI', {
          prompt: prompt,
          data: response,
        })
      ).data.matches

      const { data: matchedData, error: matchError } = await supabase
        .from('open_tender_notices')
        .select('*')
        .in('referenceNumber-numeroReference', filteredIDs)

      // Changed to add proper error handling and data validation
      if (matchError) {
        console.log('Failed to fetch matched data:', matchError)
        return res.status(500).json({ error: matchError.message })
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('filtered_open_tender_notices')
        .insert(data)

      if (insertError) console.log('Failed to insert data', insertError)
      else console.log('Inserted data successfully')
    } catch (error) {
      console.log(error)
    }

    const { data: fetchFilteredData, error: fetchFilteredDataError } =
      await supabase.from('filtered_open_tender_notices').select('*')

    if (fetchFilteredDataError)
      console.log('Failed to fetch data', fetchFilteredDataError)
    else console.log('Fetched data successfully')

    const filteredData = fetchFilteredData

    res.json(fetchFilteredData)

    // let filteredData = {};

    // data
  } catch (error: any) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

// Endpoint to fetch filtered tender notices from the database
app.get('/getFilteredTenderNoticesFromDB', async (req, res) => {
  try {
    const { data, error: fetchError } = await supabase
      .from('filtered_open_tender_notices')
      .select('*')
    if (fetchError) console.log('Failed to fetch data', fetchError)
    else console.log('Fetched data successfully', data)
    res.json(data)
  } catch (error: any) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

// Endpoint to download the open tender notices CSV and import it into the database
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
    const { error: deleteError } = await supabase
      .from('open_tender_notices')
      .delete()
      .neq('referenceNumber-numeroReference', 0)

    if (deleteError) console.log('Failed to delete all rows', deleteError)
    else console.log('Deleted all rows successfully')

    const response = await axios.get(openTenderNoticesURL, {
      headers: {
        'User-Agent': process.env.USER_AGENT || '',
      },
    })

    // Parse CSV string into array of objects
    const results = await Papa.parse(response.data, {
      header: true,
      skipEmptyLines: true,
    })

    const filteredData = results.data.map(filterToTargetColumns)

    const { error: insertError } = await supabase
      .from('open_tender_notices')
      .insert(filteredData)

    if (insertError) throw insertError

    res.status(200).send('Data imported succesfully!')
  } catch (error: any) {
    console.log('Error importing data:', error)
    res.status(500).send(error.message)
  }
})

// Endpoint to fetch all open tender notices from the database
app.get('/getOpenTenderNoticesFromDB', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('open_tender_notices')
      .select('*')
    const response = data
    res.json(response) // Returns the tender notices data as JSON
  } catch (error) {
    console.log(error)
  }
})

// Serve static files from the 'assets' folder
app.use('/assets', express.static(path.join(__dirname, 'assets')))

const server = app.listen(process.env.PORT, () => {
  console.log(`Listening at http://localhost:${process.env.PORT}`)
})
server.on('error', console.error)
