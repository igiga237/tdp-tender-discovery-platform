import { useState } from 'react'
import { generateLeads } from '../../api'
const LeadGenChat = () => {
    const [formData, setFormData] = useState({ prompt: '' })
    const [response, setResponse] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    setResponse(await generateLeads(formData))
  }


  return (
   <>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="prompt"
            value={formData.prompt}
            onChange={handleChange}
            placeholder="Tell what kind of tenders you want"
            className="border-2 border-black w-96 h-24"
          />
          <button type="submit">Generate Leads</button>
          </form>
          {response && <div>{response}</div>}
   </>
  )
}

export default LeadGenChat
