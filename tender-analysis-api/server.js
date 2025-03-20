const axios = require("axios");
const express = require("express");
const dotenv =  require("dotenv");

const analyzeRoutes = require("./routes/analyze");

dotenv.config();
const app = express();
app.use(express.json());
app.use("/api/v1/documents", analyzeRoutes)

const PORT = process.env.PORT || 5001;
app.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Trying another port...`);
      app.listen(0);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
})

