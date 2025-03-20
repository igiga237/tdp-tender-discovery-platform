const request = require("supertest");
const app = require("../server"); // Import the API server

describe("Tender AI Assistance API", () => {
    // Test if API is running
    it("should return 404 for an unknown route", async () => {
        const res = await request(app).get("/unknown");
        expect(res.status).toBe(404);
    });

    // Test for small document insights
    it("should return AI-generated insights for a small document", async () => {
        const res = await request(app)
            .post("/api/v1/documents/insights")
            .send({
                extractedText: "This is a short test document.",
                fileSizeMB: 5
            });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("insights");
    });

    // Test for background processing (large document)
    it("should queue a large document for background processing", async () => {
        const res = await request(app)
            .post("/api/v1/documents/insights")
            .send({
                extractedText: "Large document requiring background processing.",
                fileSizeMB: 15
            });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("jobId");
    });

    // Test job status tracking
    it("should return status of a background job", async () => {
        const jobId = "test-job-id"; // Replace with an actual jobId from a test run
        const res = await request(app).get(`/api/v1/documents/insights/status/${jobId}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("status");
    });
});
