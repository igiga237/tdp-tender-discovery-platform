import axios from 'axios'

export const numberbro = process.env.PORT;

export const getEmployee = async () => {
  const response = await axios.get('http://localhost:3000/getEmployees')
  return response.data
}
export const getCompletion = async () => {
  const response = await axios.post(`http://localhost:3000/api/completion`)
  return response.data
}

export const getOpenTenderNoticesFromDB = async () => {
  const response = await axios.get(
    `http://localhost:3000/getOpenTenderNoticesFromDB`
  )
  return response.data
}

export const generateLeads = async (FormData: any) => {
  const response = await axios.post(
    'http://localhost:3000/generateLeads', FormData
  )
  return response.data
}
export const getOpenTenderNotices = async () => {
  window.location.href = 'http://localhost:3000/getOpenTenderNotices'
  // const response = await axios.get('http://localhost:3000/getNewTenderNotices')
  // return response.data;
}

export const getFilteredTenderNoticesFromDB = async () => {
  const response = await axios.get(
    `http://localhost:3000/getFilteredTenderNoticesFromDB`
  );
  return response.data;
}


