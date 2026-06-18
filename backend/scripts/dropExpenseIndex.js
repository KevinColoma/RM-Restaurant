require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
mongoose.connect(process.env.LOCAL_URI || 'mongodb://localhost:27017/rms').then(async () => {
  const db = mongoose.connection.db;
  try {
    await db.collection('expenses').dropIndex('invoiceNumber_1');
    console.log('Dropped invoiceNumber_1 unique index');
  } catch (e) {
    console.log('No invoiceNumber_1 index found, trying alternate name...');
  }
  // Also clean existing null/empty invoiceNumber docs
  const r = await db.collection('expenses').updateMany(
    { $or: [{ invoiceNumber: null }, { invoiceNumber: '' }] },
    { $unset: { invoiceNumber: '' } }
  );
  console.log('Cleaned ' + r.modifiedCount + ' docs');
  mongoose.disconnect();
}).catch(e => { console.error(e); process.exit(1); });
