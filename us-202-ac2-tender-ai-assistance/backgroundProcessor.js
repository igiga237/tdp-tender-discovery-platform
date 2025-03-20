const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

/**
 * @function analyzeLargeDocument
 * @desc Sends document text to OpenAI and retrieves AI-generated insights.
 * @param {string} extractedText - The document text to analyze.
 * @returns {Promise<string>} - AI-generated insights.
 */
async function analyzeLargeDocument(extractedText) {
    console.log("Analyzing large document...");

    try {
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: "gpt-4",
                messages: [
                    { role: "system", content: "You are an AI that analyzes tender documents." },
                    { role: "user", content: `Analyze this document:\n${extractedText}` }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        throw new Error("Failed to analyze the document.");
    }
}

module.exports = { analyzeLargeDocument };