const redisClient = require('../src/utils/redisClient'); // Assuming your Redis client is in this path
const sinon = require('sinon');
const { expect } = require('chai');

describe('Redis Client', function () {
  let redisMock;

  beforeEach(() => {
    redisMock = sinon.stub(redisClient, 'get').resolves('mocked response');
  });

  afterEach(() => {
    redisMock.restore();
  });

  it('should get a value from Redis', async () => {
    const response = await redisClient.get('someKey');
    expect(response).to.equal('mocked response');
  });

  it('should set a value in Redis', async () => {
    const setMock = sinon.stub(redisClient, 'set').resolves('OK');
    const response = await redisClient.set('someKey', 'someValue');
    expect(response).to.equal('OK');
    setMock.restore();
  });

  it('should throw an error if Redis connection fails', async () => {
    redisMock.rejects(new Error('Redis connection failed'));
    try {
      await redisClient.get('someKey');
    } catch (err) {
      expect(err.message).to.equal('Redis connection failed');
    }
  });
});
