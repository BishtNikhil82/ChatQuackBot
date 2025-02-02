// auth_handler.js
// Handles authentication logic

const RedisClient = require('./redis_client');
const ChatwootClient = require('./chatwoot_client');

class AuthHandler {
    constructor({ params, sourceId, authStatus }) {
        this.params = params;
        this.sourceId = sourceId;
        this.authStatus = authStatus;
        this.account = params.account?.id;
        this.conversation = params.conversation?.id;
    }

    async process() {
        switch (this.authStatus) {
            case null:
                await this.promptAuthViaPhone();
                break;
            case 'pending':
                await this.setUpAndSendOtp();
                break;
            case 'otp_generated':
                await this.validateOtp();
                break;
        }
    }

    async promptAuthViaPhone() {
        await RedisClient.set(`${this.sourceId}:auth_status`, 'pending');
        await ChatwootClient.sendMessage(this.account, this.conversation, 'Please enter your mobile number to start the conversation');
    }

    async setUpAndSendOtp() {
        await ChatwootClient.sendMessage(this.account, this.conversation, `Please enter the OTP sent to ${this.params.content}`);
        await RedisClient.set(`${this.sourceId}:auth_status`, 'otp_generated');
        // TODO: Generate dynamic OTP and send it via Twilio
        await RedisClient.set(`${this.sourceId}:auth_code`, '0000');
    }

    async validateOtp() {
        const authCode = await RedisClient.get(`${this.sourceId}:auth_code`);
        if (authCode === this.params.content) {
            await ChatwootClient.sendMessage(this.account, this.conversation, 'You have been verified. How can I help?');
            await RedisClient.set(`${this.sourceId}:auth_status`, 'authenticated');
        } else {
            await ChatwootClient.sendMessage(this.account, this.conversation, 'Invalid OTP. Please Enter the correct One');
        }
    }
}

module.exports = AuthHandler;
