import sha1 from 'sha1';
import Queue from 'bull';
import { findUserById, findUserIdByToken } from '../utils/helpers';
import dbClient from '../utils/db';

const userQueue = new Queue('userQueue');

class UsersController {
  /**
   * Creates a user using email and password
   */
  static async postNew(request, response) {
    const { email, password } = request.body;

    // Check for missing email or password
    if (!email) return response.status(400).send({ error: 'Missing email' });
    if (!password) return response.status(400).send({ error: 'Missing password' });

    // Basic validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return response.status(400).send({ error: 'Invalid email format' });
    }

    // Check if the email already exists in the database
    const emailExists = await dbClient.users.findOne({ email });
    if (emailExists) return response.status(400).send({ error: 'Already exist' });

    // Hash the password using SHA1
    const sha1Password = sha1(password);
    let result;
    try {
      // Insert the new user into the database
      result = await dbClient.users.insertOne({
        email,
        password: sha1Password,
      });
    } catch (err) {
      // Log any errors and add them to the queue for further analysis
      console.error('Error creating user:', err.message);
      await userQueue.add({ error: err.message, email });
      return response.status(500).send({ error: 'Error creating user' });
    }

    // Prepare the user object with only the email and id
    const user = {
      id: result.insertedId,
      email,
    };

    // Add a task to the userQueue for the created user
    await userQueue.add({
      userId: result.insertedId.toString(),
    });

    // Respond with the created user object (id and email)
    return response.status(201).send(user);
  }

  /**
   * Retrieves the user based on the token used
   */
  static async getMe(request, response) {
    const token = request.headers['x-token'];
    if (!token) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve the user ID based on the token
    const userId = await findUserIdByToken(request);
    if (!userId) return response.status(401).send({ error: 'Unauthorized' });

    const user = await findUserById(userId);

    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    // Prepare the user object and remove sensitive information (password, _id)
    const processedUser = { id: user._id, ...user };
    delete processedUser._id;
    delete processedUser.password;

    // Return the user object (email and id only)
    return response.status(200).send(processedUser);
  }
}

module.exports = UsersController;
