// dialogflow_client.js
// Handles interaction with the Dialogflow API

const dialogflow = require('@google-cloud/dialogflow');
const path = require('path');
require('dotenv').config(); // Load environment varia
class DialogflowClient {
    constructor() {
        if (!process.env.SERVICE_ACCOUNT_KEY) {
            throw new Error("SERVICE_ACCOUNT_KEY is not defined in the .env file.");
        }
        this.projectId = process.env.DIALOGFLOW_PROJECT_ID;
        this.sessionClient = new dialogflow.SessionsClient({
            keyFilename: path.resolve(process.env.SERVICE_ACCOUNT_KEY),
        });
    }

    async getResponse(sessionId, message) {
        console.log(" Inside getResponse")
        const sessionPath = this.sessionClient.projectAgentSessionPath(this.projectId.toString(), sessionId.toString());
        console.log("Session path is ",sessionPath)
        const queryInput = {
            text: {
                text: message,
                languageCode: 'en-US',
            },
        };

        try {
            const request = {
                session: sessionPath,
                queryInput: queryInput,
            };
            const [response] = await this.sessionClient.detectIntent(request);
            console.log("getResponse........",response)
            return response.queryResult.fulfillmentText;
        } catch (error) {
            console.error('Error communicating with Dialogflow:', error);
            throw error;
        }
    }
}

module.exports = new DialogflowClient();
