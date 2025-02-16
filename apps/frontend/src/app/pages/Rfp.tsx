
import { get_sentences_rfp } from '../../api'
import { useEffect, useState } from 'react'
const Rfp = () => {
    const [data, setData] = useState(null)

    useEffect(() => {
        const getData = async () => {
            setData(await get_sentences_rfp())
        }
        getData()
    }, [])
  return (
      <div>
          {data ? data.map((sentence, index) => {
              return <div className="m-4 font-bold" key={index}>{sentence}</div>
          }): 'No data'}
      
    </div>
  )
}

export default Rfp
