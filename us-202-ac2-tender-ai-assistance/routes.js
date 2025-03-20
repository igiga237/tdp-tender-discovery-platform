const express = require("express");
const { documentQueue } = require("./queue"); // Import the Redis-based job queue
const router = express.Router();

/**
 * @route POST /api/v1/documents/insights
 * @desc Processes a document and generates AI-driven insights.
 * - Small documents (<10MB) are processed instantly.
 * - Large documents (10MB-50MB) are processed in the background.
 * @param {string} extractedText - The extracted document text.
 * @param {number} fileSizeMB - The document file size in MB.
 * @returns {Object} - AI-generated insights or a job ID if processed in the background.
 */
router.post("/documents/insights", async (req, res) => {
    const { extractedText, fileSizeMB } = req.body;

    if (!extractedText || !fileSizeMB) {
        return res.status(400).json({ error: "Missing required fields: extractedText and fileSizeMB." });
    }

    // Small document: Process instantly
    if (fileSizeMB < 10) {
        try {
            const insights = await analyzeLargeDocument(extractedText);
            return res.json({ insights });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Large document: Add to background processing queue
    else {
        const job = await documentQueue.add("processLargeDocument", { extractedText });
        return res.json({
            message: "The document is being processed in the background.",
            jobId: job.id
        });
    }
});

/**
 * @route GET /api/v1/documents/insights/status/:jobId
 * @desc Checks the status of a background processing job.
 * @param {string} jobId - The unique ID of the job.
 * @returns {Object} - The current status of the job.
 */
router.get("/documents/insights/status/:jobId", async (req, res) => {
    const { jobId } = req.params;

    try {
        const job = await documentQueue.getJob(jobId);
        if (!job) {
            return res.status(404).json({ error: "Job not found." });
        }

        const state = await job.getState();
        return res.json({ jobId, status: state });
    } catch (error) {
        return res.status(500).json({ error: "Error fetching job status." });
    }
});

module.exports = router;
