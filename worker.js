import Bull from 'bull';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs-extra';
import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue', {
  redis: { host: 'localhost', port: 6379 }
});

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const fileDocument = await dbClient.db.collection('files').findOne({ _id: fileId, userId });
  if (!fileDocument) throw new Error('File not found');

  if (fileDocument.type !== 'image') throw new Error('File is not an image');

  const filePath = fileDocument.localPath;

  const sizes = [500, 250, 100];
  for (const size of sizes) {
    try {
      const thumbnail = await imageThumbnail(filePath, { width: size });
      const thumbnailPath = `${filePath}_${size}`;
      
      await fs.writeFile(thumbnailPath, thumbnail);
    } catch (error) {
      console.error(`Error generating thumbnail for size ${size}:`, error);
      throw new Error('Failed to generate thumbnails');
    }
  }

  console.log(`Thumbnails for file ${fileId} created successfully!`);
});

console.log('Thumbnail worker is running...');
