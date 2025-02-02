const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const dialogflow = require("@google-cloud/dialogflow");
const path = require("path");
const config = require("./config"); // Configuration file

const app = express();
app.use(bodyParser.json());

// Extract configurations
const {
  dialogflow: { projectId, serviceAccountKey, languageCode },
  chatwoot: { userApiKey, agentBotApiKey, serverURL, accountId },
  server: { port },
} = config;

// Create Dialogflow session client
const sessionClient = new dialogflow.SessionsClient({
  keyFilename: path.join(__dirname, serviceAccountKey),
});

// Helper function to query Dialogflow
async function queryDialogflow(sessionId, message) {
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: languageCode,
      },
    },
  };

  const [response] = await sessionClient.detectIntent(request);
  return response.queryResult.fulfillmentText;
}

// Webhook endpoint for Chatwoot
app.post("/webhook", async (req, res) => {
  try {
    const { event, payload } = req.body;
    console.log("Received event:", event);
    console.log(" ######################### Message Start ######################################### ")
    console.log("req body is ", req.body);
    console.log(" ############################ Message End  ###################################### ") 
   

    // Handle new incoming messages
    if (event === "message.created" && payload.message_type === "incoming") {
      const userMessage = payload.content;
      const conversationId = payload.conversation.id;
      const senderId = payload.sender.id;

      console.log("User message received:", userMessage);

      // Query Dialogflow for a response
      const dialogflowResponse = await queryDialogflow(senderId, userMessage);

      console.log("Dialogflow response:", dialogflowResponse);

      // Send the Dialogflow response back to Chatwoot
      await axios.post(
        `${serverURL}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
        {
          content: dialogflowResponse,
          message_type: "outgoing",
          private: false, // Change to true if you want to send private notes
        },
        {
          headers: {
            api_access_token: userApiKey, // Use the user API key for authorization
          },
        }
      );

      console.log("Response sent to Chatwoot");
    }

    res.status(200).send("Webhook processed successfully");
  } catch (error) {
    console.error("Error processing webhook:", error.response?.data || error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Start the webhook server
app.listen(port, () => {
  console.log(`Webhook server running on port ${port}`);
});
