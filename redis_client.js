// redis_client.js
// Handles Redis operations

const redis = require('redis');

class RedisClient {
    constructor() {
        this.client = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });
        this.client.on('error', (err) => console.error('Redis Client Error', err));
    }

    async connect() {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }

    async disconnect() {
        if (this.client.isOpen) {
            await this.client.disconnect();
        }
    }

    async get(key) {
        await this.connect();
        const value = await this.client.get(key);
        await this.disconnect();
        return value;
    }

    async set(key, value, expiry = 3600) {
        await this.connect();
        await this.client.set(key, value, { EX: expiry });
        await this.disconnect();
    }
}

module.exports = new RedisClient();