const uuidv4 = require('uuid').v4;
const sha1 = require('sha1');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
  /**
   * Should sign-in the user by generating a new authentication token
   */
  static async getConnect(request, response) {
    const Authorization = request.header('Authorization') || '';
    const credentials = Authorization.split(' ')[1];
    if (!credentials) return response.status(401).send({ error: 'Unauthorized' });

    const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf-8');
    const [email, password] = decodedCredentials.split(':');

    if (!email || !password) return response.status(401).send({ error: 'Unauthorized' });

    const sha1Password = sha1(password);

    try {
      const finishedCreds = { email, password: sha1Password };
      const user = await dbClient.users.findOne(finishedCreds);

      if (!user) return response.status(401).send({ error: 'Unauthorized' });

      const token = uuidv4();
      const key = `auth_${token}`;
      const hoursForExpiration = 24;

      await redisClient.set(key, user._id.toString(), hoursForExpiration * 3600);

      return response.status(200).send({ token });
    } catch (error) {
      console.error('Error during login process:', error.message);
      return response.status(500).send({ error: 'Internal server error' });
    }
  }

  /**
   * Should sign-out the user based on the token
   */
  static async getDisconnect(request, response) {
    const token = request.headers['x-token'];
    if (!token) return response.status(401).send({ error: 'Unauthorized' });

    try {
      const user = await redisClient.get(`auth_${token}`);
      if (!user) return response.status(401).send({ error: 'Unauthorized' });

      await redisClient.del(`auth_${token}`);
      return response.status(204).end();
    } catch (error) {
      console.error('Error during logout process:', error.message);
      return response.status(500).send({ error: 'Internal server error' });
    }
  }
}

module.exports = AuthController;
