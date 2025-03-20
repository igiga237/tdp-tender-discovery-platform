const request = require("supertest");
const app = require("../server"); // Import the Express server

describe("API Tests for Tender Analysis", () => {
  
  test("POST /api/v1/documents/insights should return insights", async () => {
    const response = await request(app)
      .post("/api/v1/documents/insights")
      .send({ extractedText: "Test document content", fileSizeMB: 5 })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("insights");
  });

});
