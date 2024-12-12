import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * Should return if Redis is alive and if the DB is alive too.
   * @return {Object} - JSON object with status of Redis and DB
   */
  static async getStatus(request, response) {
    try {
      const status = {
        redis: await redisClient.isAlive(),
        db: await dbClient.isAlive(),
      };
      response.status(200).json(status);
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  }

  /**
   * Should return the number of users and files in DB.
   * @return {Object} - JSON object with counts of users and files
   */
  static async getStats(request, response) {
    try {
      const stats = {
        users: await dbClient.nbUsers(),
        files: await dbClient.nbFiles(),
      };
      response.status(200).json(stats);
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  }
}

export default AppController;
