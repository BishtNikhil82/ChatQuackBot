const ChatwootClient = require('./chatwoot_client');

class BookingHandler {
    constructor(params) {
        this.params = params;
        this.event = params['event'];
        this.account = params?.account?.id;
        this.conversation = params?.conversation?.id;

        // Initialize a user session to store booking details
        if (!global.userSessions) {
            global.userSessions = {};
        }
        this.userSession = global.userSessions[this.conversation] || {}; // Store user data per conversation
    }

    async process() {
        if (this.event === "message_created") {
            await this.triggerBooking();
        } else {
            await this.handleBooking();
        }
    }

    async triggerBooking() {
        await ChatwootClient.sendOptionsMessage(
            this.account,
            this.conversation,
            'Select your hotel',
            this.generateHotels()
        );
    }

    async handleBooking() {
        try {
            const contentAttributes = this.params?.content_attributes;
            const submittedValues = contentAttributes?.submitted_values;

            if (!submittedValues || !Array.isArray(submittedValues) || submittedValues.length === 0) {
                console.warn("[BookingHandler] No valid submitted_values found. Waiting for user input.");
                return;
            }

            const content = submittedValues[0]?.value;
            if (!content) {
                console.warn("[BookingHandler] No valid selection detected.");
                return;
            }

            console.log(`[BookingHandler] User selected: ${content}`);

            switch (this.params["content"]) {
                case "Select your hotel":
                    this.userSession.hotel = content; // ✅ Store selected hotel
                    global.userSessions[this.conversation] = this.userSession;
                    
                    await ChatwootClient.sendFormMessage(
                        this.account,
                        this.conversation,
                        'Fill your details',
                        this.generateForm()
                    );
                    break;

                case "Fill your details":
                    // ✅ Capture check-in, check-out dates, name, and email correctly
                    this.userSession.checkInDate = submittedValues.find(f => f.name === "date1")?.value;
                    this.userSession.checkOutDate = submittedValues.find(f => f.name === "date2")?.value;
                    this.userSession.name = submittedValues.find(f => f.name === "name")?.value;
                    this.userSession.email = submittedValues.find(f => f.name === "email")?.value;
                    this.userSession.comments = submittedValues.find(f => f.name === "text_area")?.value || "No comments";

                    // Ensure the session is updated
                    global.userSessions[this.conversation] = this.userSession;

                    // ✅ Send Final Confirmation Message
                    const finalMessage = `
                                        ✅ **Booking Confirmed!**
                                        🏨 **Hotel:** ${this.userSession.hotel || "Not selected"}
                                        📅 **Check-in Date:** ${this.userSession.checkInDate || "Not provided"}
                                        📅 **Check-out Date:** ${this.userSession.checkOutDate || "Not provided"}
                                        👤 **Guest Name:** ${this.userSession.name || "Not provided"}
                                        📧 **Email:** ${this.userSession.email || "Not provided"}
                                        📝 **Comments:** ${this.userSession.comments}

                                        Thank you for booking with us! Let us know if you need further assistance.
                                        `;

                    await ChatwootClient.sendMessage(this.account, this.conversation, finalMessage);
                    await ChatwootClient.sendMessage(this.account, this.conversation, 'Transferring the conversation to an agent. You will get a response shortly.');
                    await ChatwootClient.handoffConversation(this.account, this.conversation);
                    break;
            }
        } catch (error) {
            console.error(`[BookingHandler] Error in handleBooking: ${error.message}`, error);
        }
    }

    generateHotels() {
        return ["Ritz-Carlton", "Marriott", "Hyatt", "Four Seasons", "St Regis"].map(val => ({ title: val, value: val }));
    }

    generateForm() {
        return [
            { name: "date1", placeholder: "Check-In Date", type: "text", label: "Check-In Date" },
            { name: "date2", placeholder: "Check-Out Date", type: "text", label: "Check-Out Date" },
            { name: "name", placeholder: "Name", type: "text", label: "Name" },
            { name: "email", placeholder: "Email", type: "email", label: "Email" },
            { name: "text_area", placeholder: "Please enter comments", type: "text_area", label: "Comments" }
        ];
    }
}

module.exports = BookingHandler;
