const mongoose = require('mongoose');

jest.mock('mongoose');

const connectDB = require('../db');

describe('db', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connects to MongoDB successfully and logs', async () => {
    mongoose.connect.mockResolvedValue();
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URI);
    expect(logSpy).toHaveBeenCalledWith('MongoDB connected');
    logSpy.mockRestore();
  });

  it('logs error when connection fails', async () => {
    const error = new Error('connection refused');
    mongoose.connect.mockRejectedValue(error);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();

    await connectDB();

    expect(errorSpy).toHaveBeenCalledWith('Error connecting to MongoDB:', 'connection refused');
    errorSpy.mockRestore();
  });
});
