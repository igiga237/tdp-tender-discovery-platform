const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const routes = require("./routes");

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json()); // Middleware to parse JSON requests
app.use(cors()); // Enable CORS to allow external API requests

// Register routes
app.use("/api/v1", routes);


/**
 * Start the Express server and listen for incoming API requests.
 */
/**
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
*/

// Prevent Jest from starting multiple instances of the server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app; // Export the app for testing