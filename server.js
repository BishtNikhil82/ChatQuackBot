const express = require("express");
const bodyParser = require("body-parser");
const RequestHandler = require("./request_handler"); // Import the RequestHandler
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Webhook endpoint for Chatwoot
app.post("/webhook", async (req, res) => {
  try {
    console.log(" got webhook event")
    const requestHandler = new RequestHandler(req.body); // Initialize with request body
    await requestHandler.process(); // Process the event and handle it
    res.status(200).send("Webhook processed successfully");
  } catch (error) {
    console.error("Error processing webhook:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Start the webhook server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
