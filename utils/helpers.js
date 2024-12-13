import redisClient from './redis';
import dbClient from './db';

/**
 * Retrieves the authentication token from the request header.
 * @param {Object} request - The request object.
 * @returns {string} - The token with 'auth_' prefix.
 */
async function getAuthToken(request) {
  const token = request.headers['x-token'];
  if (!token) {
    throw new Error('Token is missing');
  }
  return `auth_${token}`;
}

/**
 * Checks authentication and returns the userId of the authenticated user.
 * @param {Object} request - The request object.
 * @returns {string|null} - The userId if the user is authenticated, otherwise null.
 */
async function findUserIdByToken(request) {
  const key = await getAuthToken(request);
  const userId = await redisClient.get(key);
  return userId || null;
}

/**
 * Retrieves the user by their userId.
 * @param {string} userId - The userId of the user to retrieve.
 * @returns {Object|null} - The user document if found, otherwise null.
 */
async function findUserById(userId) {
  if (!userId) {
    throw new Error('UserId is required');
  }

  const user = await dbClient.users.findOne({ _id: userId });

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  return user;
}

export {
  findUserIdByToken,
  findUserById,
};
