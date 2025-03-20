const { Queue, Worker } = require("bullmq");
const { analyzeLargeDocument } = require("./backgroundProcessor");
const Redis = require("ioredis");

// Connect to Redis instance
const redisConnection = new Redis({
    host: "127.0.0.1", // Ensure Redis is running on localhost
    port: 6379,        // Default Redis port
    maxRetriesPerRequest: null // REQUIRED to avoid BullMQ error
});

// Create a queue for processing large documents
const documentQueue = new Queue("documentQueue", { connection: redisConnection });

/**
 * Worker: Processes queued document jobs asynchronously.
 * - Calls `analyzeLargeDocument` to analyze documents.
 */
const worker = new Worker(
    "documentQueue",
    async (job) => {
        console.log(`Processing document ID: ${job.id}`);

        try {
            // Perform AI analysis on the document
            const insights = await analyzeLargeDocument(job.data.extractedText);

            // Log successful processing
            console.log(`Analysis completed for document ID: ${job.id}`);
            return { insights, documentId: job.id };
        } catch (error) {
            console.error(`Failed to process document ID: ${job.id}`, error);
            throw error;
        }
    },
    { connection: redisConnection }
);

module.exports = { documentQueue };