import React from 'react'
import { useFileUpload } from '../hooks/usefileupload'
import FileList from '../components/filelist'

const UploadDoc: React.FC = () => {
  const { files, setFiles, progress, msg, handleUpload } = useFileUpload()

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: 'auto',
        textAlign: 'center',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '30px', marginBottom: '15px' }}>Upload Files</h1>

      <div>
        <label
          style={{
            display: 'inline-block',
            fontSize: '14px',
            padding: '10px 15px',
            backgroundColor: 'grey',
            color: 'white',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '5px',
            marginBottom: '10px',
            marginRight: '170px',
          }}
        >
          Choose Files
          <input
            type="file"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFiles(e.target.files)
            }
            accept=".pdf, .docx"
            multiple
            style={{ display: 'none' }}
          />
        </label>

        <button
          onClick={handleUpload}
          style={{
            padding: '10px 15px',
            backgroundColor: 'grey',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '5px',
          }}
        >
          Upload
        </button>

        <FileList files={files} />

        {msg === 'Failed to upload. Please retry.' && (
          <button
            onClick={handleUpload}
            style={{
              padding: '10px 15px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '5px',
            }}
          >
            Retry
          </button>
        )}
      </div>

      {progress.started && (
        <progress
          max="100"
          value={progress.pc}
          style={{ width: '100%', marginBottom: '10px' }}
        />
      )}

      {msg && (
        <span
          style={{
            display: 'block',
            fontWeight: 'bold',
            color: msg.includes('failed') ? 'red' : 'black',
          }}
        >
          {msg}
        </span>
      )}
    </div>
  )
}

export default UploadDoc

