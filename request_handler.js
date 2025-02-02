const AuthHandler = require('./auth_handler');
const BookingHandler = require('./booking_handler');
const ChatwootClient = require('./chatwoot_client');
const DialogflowClient = require('./dialogflow_client');
const RedisClient = require('./redis_client');
class RequestHandler {
    constructor(params) {
        this.params = params;
        this.event = params['event'];
        this.account = params?.account?.id;
        this.conversation = params?.conversation?.id;
    }

    async process() {
        try {
            console.log(`[RequestHandler] Processing event: ${this.event}`);
           
            console.log("*********************  START  *******************************")
            console.log(this.params)
            console.log("***********************  END *****************************")
            await this.handleEvent();
        } catch (error) {
            console.error(`[RequestHandler] Error processing event: ${error.message}`, error);
        }
    }

    async handleEvent() {
        try {
            switch (this.event) {
                case 'message_created':
                    if (this.params['message_type'] === 'incoming' && this.params?.conversation?.status === 'pending') {
                        console.log("[RequestHandler] Handling incoming message...");
                        await this.handleMessageCreated();
                    }
                    break;

                case 'message_updated':
                    console.log("[RequestHandler] Handling message update...");
                    await this.handleMessageUpdated();
                    break;

                default:
                    console.log("[RequestHandler] Event not handled.");
            }
        } catch (error) {
            console.error(`[RequestHandler] Error in handleEvent: ${error.message}`, error);
        }
    }

    async handleMessageCreated() {
        try {
            const sourceId = this.params?.conversation?.contact_inbox?.source_id;
            if (!sourceId) {
                console.warn("[RequestHandler] Missing source ID. Ignoring message.");
                return;
            }

            console.log("[RequestHandler] Source ID:", sourceId);

            // Check authentication status from Redis
            // const authStatus = await RedisClient.client.hget(sourceId, 'auth_status');
            // if (authStatus !== 'authenticated') {
            //     console.log("[RequestHandler] User not authenticated. Initiating authentication process.");
            //     const authHandler = new AuthHandler({ params: this.params, authStatus, sourceId });
            //     await authHandler.process();
            //     return;
            // }

            await this.sendResponseForContent(sourceId, this.params.content);
        } catch (error) {
            console.error(`[RequestHandler] Error in handleMessageCreated: ${error.message}`, error);
        }
    }

    async sendResponseForContent(sourceId, content) {
        try {
            // if (!content) {
            //     console.warn("[RequestHandler] Empty or undefined content. Skipping processing.");
            //     return;
            // }

            // console.log("[RequestHandler] sendResponseForContent:", content);
            console.log("[RequestHandler] sendResponseForContent:", content);
            const response = await DialogflowClient.getResponse(sourceId, content);
            console.log("[RequestHandler] Response from Dialogflow:", response);

            switch (response) {
                case '__handoff__':
                    await ChatwootClient.sendMessage(this.account, this.conversation, 'Transferring the conversation to an agent. You will get a response shortly.');
                    await ChatwootClient.handoffConversation(this.account, this.conversation);
                    break;

                case '__booking__':
                    console.log("[RequestHandler] Initiating booking process.");
                    await ChatwootClient.sendMessage(this.account, this.conversation, 'Initiating a booking');
                    const bookingHandler = new BookingHandler(this.params);
                    await bookingHandler.process();
                    break;

                default:
                    console.log("[RequestHandler] Sending response to Chatwoot:", response);
                    await ChatwootClient.sendMessage(this.account, this.conversation, response);
            }
        } catch (error) {
            console.error(`[RequestHandler] Error in sendResponseForContent: ${error.message}`, error);
        }
    }

    async handleMessageUpdated() {
        try {
            console.log("[RequestHandler] Processing message update...");

            const bookingHandler = new BookingHandler(this.params);
            await bookingHandler.process();
        } catch (error) {
            console.error(`[RequestHandler] Error in handleMessageUpdated: ${error.message}`, error);
        }
    }
}

module.exports = RequestHandler;
