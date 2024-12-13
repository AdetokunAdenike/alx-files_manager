import redis from 'redis';
import { promisify } from 'util';

/**
 * Class for performing operations with Redis service
 */
class RedisClient {
  constructor() {
    this.client = redis.createClient();

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setexAsync = promisify(this.client.setex).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);

    this.client.on('error', (error) => {
      console.log(`Redis client not connected to the server: ${error.message}`);
    });

    this.client.on('connect', () => {

    });
  }

  /**
   * Checks if connection to Redis is alive
   * @return {Promise<boolean>} true if connection is alive, false otherwise
   */
  async isAlive() {
    try {
      const response = await promisify(this.client.ping).bind(this.client)();
      return response === 'PONG';
    } catch (error) {
      console.error('Error pinging Redis:', error.message);
      return false;
    }
  }

  /**
   * Gets the value corresponding to a key in Redis
   * @param {string} key - The key to search for in Redis
   * @return {Promise<string|null>} The value of the key, or null if not found
   */
  async get(key) {
    try {
      const value = await this.getAsync(key);
      return value || null;
    } catch (error) {
      console.error(`Error fetching key ${key} from Redis:`, error.message);
      return null;
    }
  }

  /**
   * Creates a new key in Redis with a specific TTL
   * @param {string} key - The key to be saved in Redis
   * @param {string} value - The value to be assigned to the key
   * @param {number} duration - TTL of the key in seconds
   * @return {Promise<void>} Resolves when the key is set
   */
  async set(key, value, duration) {
    try {
      await this.setexAsync(key, duration, value);
    } catch (error) {
      console.error(`Error setting key ${key} in Redis:`, error.message);
    }
  }

  /**
   * Deletes a key in Redis
   * @param {string} key - The key to be deleted
   * @return {Promise<void>} Resolves when the key is deleted
   */
  async del(key) {
    try {
      await this.delAsync(key);
    } catch (error) {
      console.error(`Error deleting key ${key} from Redis:`, error.message);
    }
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
