const express = require('express');
const axios = require('axios');


const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

async function analyzeDocuments(text) {
    try{
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model:'gpt-4',
                messages: [
                    {role: "system", content: "You are an expert in analyzing tender documents"},
                    {role: "user", content: `Extract key references, technical requirements, and eligibility criteria from the following document:\n${text}`},
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data.choices[0].content;
    } 
    catch (error) {
        console.error("Error calling OpenAI API:", error);
        throw new Error("Unable to analyze document. Please try again later.");
    }
}

express.Router().post("/analyze", async (req,res) => {
    const {extractedText} = req.body;

    if (!extractedText) {
        return res.status(400).json({error:"Extracted text is required."});
    }

    try{
        const analysis = await analyzeDocuments(extractedText);
        return res.json({message: "Analysis Successful", insights : analysis});
    } catch (error){
        return res.status(500).json({error: error.message});
    }
});

module.exports = express.Router();