import { Route, Routes, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  getCompletion,
  getEmployee,
  getOpenTenderNotices,
  getOpenTenderNoticesFromDB,
} from '../api'
import { table } from 'console'

export interface TenderNotice {
  'title-titre-eng': string
  'tenderStatus-appelOffresStatut-eng': string
  'gsinDescription-nibsDescription-eng': string
  'unspscDescription-eng': string
  'noticeType-avisType-eng': string
  'procurementMethod-methodeApprovisionnement-eng': string
  'selectionCriteria-criteresSelection-eng': string
  'limitedTenderingReason-raisonAppelOffresLimite-eng': string
  'tradeAgreements-accordsCommerciaux-eng': string
  'regionsOfOpportunity-regionAppelOffres-eng': string
  'regionsOfDelivery-regionsLivraison-eng': string
  'contractingEntityName-nomEntitContractante-eng': string
  'contractingEntityAddressLine-ligneAdresseEntiteContractante-eng': string
  'contractingEntityAddressCity-entiteContractanteAdresseVille-eng': string
  'contractingEntityAddressProvince-entiteContractanteAdresseProvince-eng': string
  'contractingEntityAddressCountry-entiteContractanteAdressePays-eng': string
  'endUserEntitiesName-nomEntitesUtilisateurFinal-eng': string
  'endUserEntitiesAddress-adresseEntitesUtilisateurFinal-eng': string
  'contactInfoAddressLine-contactInfoAdresseLigne-eng': string
  'contactInfoCity-contacterInfoVille-eng': string
  'contactInfoProvince-contacterInfoProvince-eng': string
  'contactInfoCountry-contactInfoPays-eng': string
  'noticeURL-URLavis-eng': string
  'attachment-piecesJointes-eng': string
  'tenderDescription-descriptionAppelOffres-eng': string
}

export function App() {
  // const [message, setMessage] = useState('')
  // const [EmployeData, setEmployeeData] = useState<Employee[]>([])

  const [tableData, setTableData] = useState<TenderNotice[]>([])

  useEffect(() => {
    const getOpenTenderNoticesData = async function () {
      setTableData(await getOpenTenderNoticesFromDB())
    }
    getOpenTenderNoticesData()
  }, [])

  const TenderTable = ({ data }: { data: any[] }) => {
    const headers = Object.keys(data[0])

    return (
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {headers.map((header, cellIndex) => (
                <td key={cellIndex}>
                  <div className="max-h-12 overflow-y-auto">{row[header]}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <>
      {tableData && tableData.length > 0 ? (
        <TenderTable data={tableData} />
      ) : null}
    </>
  )
}

export default App
