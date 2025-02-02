// chatwoot_client.js
// Handles interaction with the Chatwoot API

const axios = require('axios');
require('dotenv').config();
class ChatwootClient {
    constructor() {
        this.baseURL = process.env.CHATWOOT_URL || 'http://localhost:3000';
        this.apiToken = process.env.AGENT_BOT_TOKEN;
        console.log("CHATWOOT_URL:",this.baseURL);
        console.log("AGENT_BOT_TOKEN:",this.apiToken);

    }

    async sendMessage(account, conversation, message) {
        
        return this.post(`/api/v1/accounts/${account}/conversations/${conversation}/messages`, {
            content: message
        });
    }

    async sendOptionsMessage(account, conversation, message, items) {
        return this.post(`/api/v1/accounts/${account}/conversations/${conversation}/messages`, {
            content: message,
            content_type: 'input_select',
            content_attributes: {
                items: items
            }
        });
    }

    async sendFormMessage(account, conversation, message, items) {
        return this.post(`/api/v1/accounts/${account}/conversations/${conversation}/messages`, {
            content: message,
            content_type: 'form',
            content_attributes: {
                items: items
            }
        });
    }

    async sendCardsMessage(account, conversation, message, items) {
        return this.post(`/api/v1/accounts/${account}/conversations/${conversation}/messages`, {
            content: message,
            content_type: 'cards',
            content_attributes: {
                items: items
            }
        });
    }

    async handoffConversation(account, conversation, status = 'open') {
        return this.post(`/api/v1/accounts/${account}/conversations/${conversation}/toggle_status`, {
            status: status
        });
    }

    async post(url, payload) {
        try {
            const response = await axios.post(`${this.baseURL}${url}`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'api_access_token': this.apiToken
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error posting to Chatwoot: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new ChatwootClient();