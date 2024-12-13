import { ObjectID } from 'mongodb';
import fs from 'fs';
import mime from 'mime-types'; // Import the mime-types module
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { findUserIdByToken } from '../utils/helpers';

class FilesController {
  /**
   * GET /files/:id/data
   * Should return the content of the file if accessible
   */
  static async getFile(request, response) {
    const { id } = request.params;  // Get the file ID from the request parameters
    const token = request.headers['x-token'];  // Get the user's token from the request headers

    // Retrieve the user based on the token
    if (!token) return response.status(401).json({ error: 'Unauthorized' });

    const keyID = await redisClient.get(`auth_${token}`);
    if (!keyID) return response.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.db.collection('users').findOne({ _id: ObjectID(keyID) });
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    // Retrieve the file from the database
    const fileDocument = await dbClient.db.collection('files').findOne({ _id: ObjectID(id) });
    if (!fileDocument) return response.status(404).json({ error: 'Not found' });

    // Check if the file is public or if the user is the owner
    if (!fileDocument.isPublic && fileDocument.userId.toString() !== user._id.toString()) {
      return response.status(404).json({ error: 'Not found' });
    }

    // Ensure that the file is not a folder
    if (fileDocument.type === 'folder') {
      return response.status(400).json({ error: "A folder doesn't have content" });
    }

    // Check if the file exists locally
    const filePath = fileDocument.localPath;
    if (!fs.existsSync(filePath)) {
      return response.status(404).json({ error: 'Not found' });
    }

    // Determine the MIME type of the file based on its extension
    const mimeType = mime.lookup(fileDocument.name);
    if (!mimeType) {
      return response.status(400).json({ error: 'Unable to determine MIME type' });
    }

    // Return the file's content with the appropriate MIME type
    response.setHeader('Content-Type', mimeType);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(response);
  }

  // Other methods (getShow, postUpload, etc.) remain unchanged
}

export default FilesController;
