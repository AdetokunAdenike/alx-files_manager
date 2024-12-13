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
    const { id } = request.params;
    const token = request.headers['x-token'];

    if (!token) return response.status(401).json({ error: 'Unauthorized' });

    try {
      const keyID = await redisClient.get(`auth_${token}`);
      if (!keyID) return response.status(401).json({ error: 'Unauthorized' });

      const user = await dbClient.db.collection('users').findOne({ _id: ObjectID(keyID) });
      if (!user) return response.status(401).json({ error: 'Unauthorized' });

      const fileDocument = await dbClient.db.collection('files').findOne({ _id: ObjectID(id) });
      if (!fileDocument) return response.status(404).json({ error: 'Not found' });

      if (!fileDocument.isPublic && fileDocument.userId.toString() !== user._id.toString()) {
        return response.status(404).json({ error: 'Not found' });
      }

      if (fileDocument.type === 'folder') {
        return response.status(400).json({ error: "A folder doesn't have content" });
      }

      if (!fileDocument.isPublic && fileDocument.userId.toString() !== user._id.toString()) {
        return response.status(403).json({ error: 'Forbidden - Unpublished file' });
      }

      const filePath = fileDocument.localPath;
      if (!fs.existsSync(filePath)) {
        return response.status(404).json({ error: 'File not found locally' });
      }

      const mimeType = mime.lookup(fileDocument.name);
      if (!mimeType) {
        return response.status(400).json({ error: 'Unable to determine MIME type' });
      }

      response.setHeader('Content-Type', mimeType);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(response);
    } catch (error) {
      console.error('Error while processing file request:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default FilesController;
