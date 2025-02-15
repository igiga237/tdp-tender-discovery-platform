import { useState } from 'react'
import { filterOpenTenderNotices } from '../../api'
import { FilteredTenderData } from './FilteredTenderData'


const LeadGenChatV2 = () => {
    const [formData, setFormData] = useState({ prompt: '' })
    const [showData, setShowData] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setShowData(false)
        e.preventDefault()
        try {
            await filterOpenTenderNotices(formData.prompt);
            setShowData(true)
        } catch (e) {
            console.error(e);
        }
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
          className="border-2 text-2xl border-black w-full h-24"
        />
        <button
          type="submit"
          className="text-white bg-black w-96 h-36 text-5xl font-bold"
        >
          Generate Leads
        </button>
          </form>
          {showData && <FilteredTenderData />}
    </>
  )
    }
    
export default LeadGenChatV2
