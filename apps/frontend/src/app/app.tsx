import { Route, Routes, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCompletion, getEmployee, getOpenTenderNotices } from '../api'

interface Employee {
  employee_id: number;
  first_name: string;
}

export function App() {
  const [message, setMessage] = useState('')
  const [EmployeData, setEmployeeData] = useState<Employee[]>([])

  useEffect(() => {
    async function fetchMessage() {
      // const data = await getCompletion()
      const employeeResponse = await getEmployee()
      setEmployeeData(employeeResponse.data);
      // setMessage(data)
    }
    fetchMessage()
  }, [])

  return (
    <>
      <button onClick={() => getOpenTenderNotices()}>
        Click here to get tender download
      </button>
      {/* <h1>{message}</h1> */}
      {/* <p>{EmployeData.map((employee, index) => (
    <div key={index}>  {employee.first_name}</div>
      ))}
      </p> */}
    </>
  )
}

export default App
