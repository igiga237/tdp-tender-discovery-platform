import * as path from 'path'
import express from 'express'
import OpenAI from 'openai'
import cors from 'cors'
import axios from 'axios'
import { stringify } from 'csv-stringify'
import csvParser from 'csv-parser'

import Papa from 'papaparse'
const host = process.env.HOST ?? 'localhost'
const port = process.env.PORT ? Number(process.env.PORT) : 3000

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
      model: 'gpt-4o',
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

// Endpoint to download the open tender notices CSV and import it into the database
app.post('/getOpenTenderNoticesToDB', async (req, res) => {
  const openTenderNoticesURL =
    process.env.OPEN_TENDER_NOTICES_URL || ""

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

    const { error } = await supabase
      .from('open_tender_notices')
      .insert(filteredData)

    if (error) throw error

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

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
server.on('error', console.error)
