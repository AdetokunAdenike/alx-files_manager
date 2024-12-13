const supertest = require('supertest');
const app = require('../src/app'); // Assuming your Express app is exported from this path
const { expect } = require('chai');

describe('API Endpoints', function () {
  it('should GET /status', async () => {
    const res = await supertest(app).get('/status');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('status');
  });

  it('should GET /stats', async () => {
    const res = await supertest(app).get('/stats');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('files_count');
  });

  it('should POST /users', async () => {
    const user = { username: 'test', password: 'password' };
    const res = await supertest(app).post('/users').send(user);
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('userId');
  });

  it('should GET /connect', async () => {
    const res = await supertest(app).get('/connect');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');
  });

  it('should GET /disconnect', async () => {
    const res = await supertest(app).get('/disconnect');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message').that.equals('Disconnected');
  });

  it('should GET /users/me', async () => {
    const res = await supertest(app).get('/users/me').set('X-Token', 'yourTokenHere');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('userId');
  });

  it('should POST /files', async () => {
    const fileData = {
      file: 'fileData',
      userId: 'user1',
      parentId: 'parent1'
    };
    const res = await supertest(app).post('/files').send(fileData);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('id');
  });

  it('should GET /files/:id', async () => {
    const res = await supertest(app).get('/files/1');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('name');
  });

  it('should GET /files with pagination', async () => {
    const res = await supertest(app).get('/files?page=1&limit=10');
    expect(res.status).to.equal(200);
    expect(res.body.files).to.be.an('array');
  });

  it('should PUT /files/:id/publish', async () => {
    const res = await supertest(app).put('/files/1/publish');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('isPublic').that.equals(true);
  });

  it('should PUT /files/:id/unpublish', async () => {
    const res = await supertest(app).put('/files/1/unpublish');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('isPublic').that.equals(false);
  });

  it('should GET /files/:id/data', async () => {
    const res = await supertest(app).get('/files/1/data');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('data');
  });

  it('should return Not Found if file does not exist in GET /files/:id/data', async () => {
    const res = await supertest(app).get('/files/invalidId/data');
    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('error').that.equals('Not found');
  });
});
