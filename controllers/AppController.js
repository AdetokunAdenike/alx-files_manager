import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * Should return if Redis is alive and if the DB is alive too.
   * @return {Object} - JSON object with status of Redis and DB
   */
  static async getStatus(request, response) {
    try {
      const redisAlive = await redisClient.isAlive();
      const dbAlive = await dbClient.isAlive();

      if (!redisAlive) {
        console.error('Redis server is down');
      }
      if (!dbAlive) {
        console.error('MongoDB server is down');
      }

      const status = {
        redis: redisAlive,
        db: dbAlive,
      };

      response.status(200).json(status);
    } catch (error) {
      console.error('Error checking system status:', error.message);
      response.status(500).json({ error: 'Unable to check system status' });
    }
  }

  /**
   * Should return the number of users and files in DB.
   * @return {Object} - JSON object with counts of users and files
   */
  static async getStats(request, response) {
    try {
      const usersCount = await dbClient.nbUsers();
      const filesCount = await dbClient.nbFiles();

      const stats = {
        users: usersCount,
        files: filesCount,
      };

      response.status(200).json(stats);
    } catch (error) {
      console.error('Error fetching system stats:', error.message);
      response.status(500).json({ error: 'Unable to fetch system stats' });
    }
  }
}

export default AppController;
