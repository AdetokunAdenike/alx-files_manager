import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

/**
 * Class to interact with the MongoDB database.
 */
class DBClient {
  constructor() {
    this.db = null;
    this.users = null;
    this.files = null;

    // Connect to the database asynchronously
    this.connect();
  }

  /**
   * Connect to the MongoDB server and initialize collections.
   */
  async connect() {
    try {
      const client = await MongoClient.connect(url, { useUnifiedTopology: true });
      this.db = client.db(DB_DATABASE);
      this.users = this.db.collection('users');
      this.files = this.db.collection('files');
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error(`MongoDB connection error: ${err.message}`);
      this.db = null;
    }
  }

  /**
   * Checks if the database is connected.
   * @return {boolean} - true if connected, false otherwise
   */
  isAlive() {
    return this.db !== null;
  }

  /**
   * Get the number of users in the database.
   * @return {Promise<number>} - The number of users
   */
  nbUsers() {
    if (!this.db) {
      throw new Error('Database is not connected');
    }
    return this.users.countDocuments(); // No need to `await` here
  }

  /**
   * Get the number of files in the database.
   * @return {Promise<number>} - The number of files
   */
  nbFiles() {
    if (!this.db) {
      throw new Error('Database is not connected');
    }
    return this.files.countDocuments(); // No need to `await` here
  }

  /**
   * Get a user based on the query.
   * @param {Object} query - The query to search for the user
   * @return {Promise<Object|null>} - The user document or null if not found
   */
  getUser(query) {
    if (!this.db) {
      throw new Error('Database is not connected');
    }
    return this.users.findOne(query); // No need to `await` here
  }
}

const dbClient = new DBClient();

export default dbClient;
