import axios from 'axios'
const API_BASE_URL = 'http://localhost:3000'

export const getEmployee = async () => {
  const response = await axios.get('${API_BASE_URL}/getEmployees')
  return response.data
}
export const getCompletion = async () => {
  const response = await axios.post(`${API_BASE_URL}/api/completion`)
  return response.data
}

export const getOpenTenderNoticesFromDB = async () => {
  const response = await axios.get(`${API_BASE_URL}/getOpenTenderNoticesFromDB`)
  return response.data
}

export const generateLeads = async (FormData: any) => {
  const response = await axios.post(`${API_BASE_URL}/generateLeads`, FormData)
  return response.data
}
export const getOpenTenderNotices = async () => {
  window.location.href = `${API_BASE_URL}/getOpenTenderNotices`
  // const response = await axios.get('${API_BASE_URL}/getNewTenderNotices')
  // return response.data;
}

export const getFilteredTenderNoticesFromDB = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/getFilteredTenderNoticesFromDB`
  )
  return response.data
}

export const filterOpenTenderNotices = async (prompt: String) => {
  const response = await axios.post(`${API_BASE_URL}/filterOpenTenderNotices`, {
    prompt: prompt,
  })
  return response.data
}

export const upload_pdf = async (formData: FormData) => {
  const response = await axios.post(
    `http://localhost:4500/analyze_pdf`,
    formData
  )
  return response.data
}

export interface TenderNoticeInterface {
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
