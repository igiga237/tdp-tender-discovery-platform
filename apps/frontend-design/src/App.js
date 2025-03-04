import {useState} from "react";
import axios from "axios";
function App() {
  const[files,setFiles]=useState(null);
  const[progress,setProgress]=useState({started : false,pc:0});
  const[msg,setMsg]=useState(null);
  const [uploadedFiles, setUploadedFiles] = useState(new Set());

  function handleUpload(){
    if(!files){
      setMsg("No file selected");
      return;
      
    }
    const fd= new FormData();
      for (let i=0; i<files.length;i++){
        const file = files[i];

      if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
        setMsg("Unsupported file format. Please upload a PDF or DOCX file.");
        return;
      }
      if (uploadedFiles.has(file.name)) {
        setMsg(`File "${file.name}" has already been processed.`);
        return;
      }

      fd.append(`file${i + 1}`, file);
    }

      
      setMsg("Pending");
      setProgress(prevState => {
        return {...prevState,started:true}
      })
      axios.post("http://httpbin.org/post",fd,{
        onUploadProgress: (progressEvent) => {setProgress(prevState =>{
          return { ...prevState, pc: progressEvent.progress*100}
        })},

        headers:{
          "Custom-header": "value",
        }
      })
      .then((res) => {
        if (res.data.success) {
          setMsg("Completed");
          setUploadedFiles((prev) => new Set([...prev, ...Array.from(files).map(f => f.name)]));
        } else {
          setMsg("Text extraction failed. Please try again.");
        }
      })
      .catch((err) => {
        console.error(err);
        setMsg("Failed to upload. Please retry.");
      });
        } 
          

  
  return(
    <div className="App" style={{ maxWidth: "400px", margin: "auto", textAlign: "center", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "30px", marginBottom: "15px" }}>Upload Files</h1>

<div>
      <label style={{ display: "inline-block",fontSize: "14px", padding: "10px 15px", backgroundColor: "grey", color: "white", justifyContent: "center", cursor: "pointer", borderRadius: "5px", marginBottom: "10px", marginRight:"170px", }}>
        Choose Files
        <input type="file" onChange={(e) =>setFiles(e.target.files)} accept=".pdf, .docx" multiple style={{ display: "none" }} />
      </label>
      <button onClick={handleUpload} style={{ padding: "10px 15px", backgroundColor: "grey", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>
          Upload
        </button>

      {files && (
        <div style={{ marginBottom: "10px", fontSize: "14px", color: "#555" }}>
          {Array.from(files).map((file) => (
            <div key={file.name}>{file.name}
            </div>
          ))}
        </div>
      )}

  
      {/* <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "10px" }}> */}
       
        {msg === "Failed to upload. Please retry." && (
          <button onClick={handleUpload} style={{ padding: "10px 15px", backgroundColor: "#dc3545", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>
            Retry
          </button>
        )}
        </div>
      {/* </div> */}

  
      {progress.started && (
        <progress max="100" value={progress.pc} style={{ width: "100%", marginBottom: "10px" }}></progress>
      )}

  
      {msg && <span style={{ display: "block", fontWeight: "bold", color: msg.includes("failed") ? "red" : "black" }}>{msg}</span>}
    </div>
  );


}
export default App;

