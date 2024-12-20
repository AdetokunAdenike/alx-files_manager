import sha1 from "sha1";
import Queue from "bull";
import { findUserById, findUserIdByToken } from "../utils/helpers";
import dbClient from "../utils/db";

const userQueue = new Queue("userQueue", {
  redis: { host: "localhost", port: 6379 },
});

class UsersController {
  /**
   * Creates a user using email and password
   */
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) return response.status(400).send({ error: "Missing email" });
    if (!password)
      return response.status(400).send({ error: "Missing password" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return response.status(400).send({ error: "Invalid email format" });
    }

    const emailExists = await dbClient.users.findOne({ email });
    if (emailExists)
      return response.status(400).send({ error: "Already exist" });

    const sha1Password = sha1(password);
    let result;
    try {
      result = await dbClient.users.insertOne({
        email,
        password: sha1Password,
      });
    } catch (err) {
      console.error("Error creating user:", err.message);
      await userQueue.add({ error: err.message, email });
      return response.status(500).send({ error: "Error creating user" });
    }

    const user = {
      id: result.insertedId,
      email,
    };

    await userQueue.add({
      userId: result.insertedId.toString(),
    });

    return response.status(201).send(user);
  }

  /**
   * Retrieves the user based on the token used
   */
  static async getMe(request, response) {
    const token = request.headers["x-token"];
    if (!token) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const userId = await findUserIdByToken(request);
    if (!userId) return response.status(401).send({ error: "Unauthorized" });

    const user = await findUserById(userId);

    if (!user) return response.status(401).send({ error: "Unauthorized" });

    const processedUser = { id: user._id, ...user };
    delete processedUser._id;
    delete processedUser.password;

    return response.status(200).send(processedUser);
  }
}

module.exports = UsersController;
