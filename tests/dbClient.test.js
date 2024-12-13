const dbClient = require('../src/utils/dbClient'); // Assuming your DB client is in this path
const sinon = require('sinon');
const { expect } = require('chai');

describe('Database Client', function () {
  let dbMock;

  beforeEach(() => {
    dbMock = sinon.stub(dbClient.db.collection('files'), 'findOne').resolves({ id: 'file1' });
  });

  afterEach(() => {
    dbMock.restore();
  });

  it('should get a file document from the database', async () => {
    const response = await dbClient.db.collection('files').findOne({ id: 'file1' });
    expect(response.id).to.equal('file1');
  });

  it('should throw an error when file is not found', async () => {
    dbMock.rejects(new Error('File not found'));
    try {
      await dbClient.db.collection('files').findOne({ id: 'fileNotFound' });
    } catch (err) {
      expect(err.message).to.equal('File not found');
    }
  });
});
