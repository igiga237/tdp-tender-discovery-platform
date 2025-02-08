
import * as path from 'path'
import express from 'express'
import OpenAI from 'openai'
import cors from 'cors'
import { Pool } from 'pg'
import axios from 'axios'
import { from as copyFrom } from 'pg-copy-streams'
import { stringify } from 'csv-stringify'
import csvParser from 'csv-parser'
import { Transform } from 'stream'
const host = process.env.HOST ?? 'localhost'
const port = process.env.PORT ? Number(process.env.PORT) : 3000

const targetColumns = [
  'title-titre-eng',
  'tenderStatus-appelOffresStatut-eng',
  'gsinDescription-nibsDescription-eng',
  'unspscDescription-eng',
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
  'contractingEntityAddressProvince-entiteContractanteAdresseProvince-eng',
  'contractingEntityAddressCountry-entiteContractanteAdressePays-eng',
  'endUserEntitiesName-nomEntitesUtilisateurFinal-eng',
  'endUserEntitiesAddress-adresseEntitesUtilisateurFinal-eng',
  'contactInfoAddressLine-contactInfoAdresseLigne-eng',
  'contactInfoCity-contacterInfoVille-eng',
  'contactInfoProvince-contacterInfoProvince-eng',
  'contactInfoCountry-contactInfoPays-eng',
  'noticeURL-URLavis-eng',
  'attachment-piecesJointes-eng',
  'tenderDescription-descriptionAppelOffres-eng',
]

const app = express()

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: 5432,
})

app.use(cors({ origin: '*' })) // Allow all origins

app.use(express.json())

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Root endpoint, returns a welcome message
app.get('/', (req, res) => {
  res.send({ message: 'Welcome to TDP BACKEND.' })
})

// Endpoint for generating OpenAI GPT-4 completions based on a predefined prompt.
app.post('/api/completion', async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'developer', content: 'You are a helpful assistant.' },
        {
          role: 'user',
          content:
            'say Hello. thats it. dont say anything else other than that',
        },
      ],
    })
    console.log(completion)
    res.json(completion.choices[0].message.content) // Sends back the generated response from OpenAI.
  } catch (error) {
    console.log(error)
  }
})

// Endpoint to fetch all employees from the database
app.get('/getEmployees', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM employee')
    res.json(rows) // Returns the employee data as JSON
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
    process.env.OPEN_TENDER_NOTICES_URL ||
    'https://canadabuys.canada.ca/opendata/pub/openTenderNotice-ouvertAvisAppelOffres.csv'

  try {
    const response = await axios.get(openTenderNoticesURL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      responseType: 'stream',
    })
    const client = await pool.connect()
    try {
      // Prepare a COPY command to insert the filtered CSV data into the database
      const copyQuery =
        'COPY open_tender_notices FROM STDIN WITH (FORMAT csv, HEADER true)'
      const dbStream = client.query(copyFrom(copyQuery))

      const filterColumns = new Transform({
        objectMode: true,
        transform(row, encoding, callback) {
          // Filter columns from the CSV to match the target database schema
          const filtered: Record<string, any> = {}
          targetColumns.forEach((col) => {
            filtered[col] = row[col] || ''
          })
          callback(null, filtered)
        },
      })

      const csvStringifier = stringify({
        header: true,
        columns: targetColumns,
      })

      response.data
        .pipe(csvParser())
        .pipe(filterColumns)
        .pipe(csvStringifier)
        .pipe(dbStream)
        .on('finish', () => {
          client.release()
          res.status(200).send('CSV data imported successfully via COPY!')
        })
        .on('error', (err: Error) => {
          client.release()
          console.error('COPY stream error:', err)
          res.status(500).send('Error during CSV import via COPY')
        })
    } catch (dbError: any) {
      client.release()
      console.error('Database error:', dbError.message)
      res.status(500).send('Error preparing COPY stream')
    }
  } catch (downloadError: any) {
    console.error('Download error:', downloadError.message)
    res.status(500).send('Error downloading CSV')
  }
})

// Endpoint to fetch all open tender notices from the database
app.get('/getOpenTenderNoticesFromDB', async (req, res) => {
  try {
    const client = await pool.connect()

    const response = await client.query('SELECT * FROM open_tender_notices')
    await client.release()
    res.json(response.rows) // Returns the tender notices data as JSON
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
