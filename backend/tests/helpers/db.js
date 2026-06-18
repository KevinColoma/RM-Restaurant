const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

const setupDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
};

const teardownDB = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

module.exports = { setupDB, teardownDB };
