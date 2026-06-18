const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://localhost:27017/rms';
const ATLAS_URI = 'mongodb://kevin:kevin321@ac-9qn6otc-shard-00-00.mgh7dy5.mongodb.net:27017,ac-9qn6otc-shard-00-01.mgh7dy5.mongodb.net:27017,ac-9qn6otc-shard-00-02.mgh7dy5.mongodb.net:27017/rms?tls=true&authSource=admin&retryWrites=true&w=majority&serverSelectionTimeoutMS=15000';

async function migrate() {
  console.log('Conectando a MongoDB local...');
  const local = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('Local conectado');

  console.log('Conectando a MongoDB Atlas...');
  const atlas = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log('Atlas conectado');

  const collections = await local.db.listCollections().toArray();
  const names = collections.map(c => c.name).sort();
  console.log(`\nColecciones a migrar (${names.length}): ${names.join(', ')}\n`);

  for (const col of collections) {
    const docs = await local.db.collection(col.name).find({}).toArray();
    if (docs.length > 0) {
      await atlas.db.collection(col.name).deleteMany({});
      await atlas.db.collection(col.name).insertMany(docs);
      console.log(`  ✓ ${col.name}: ${docs.length} documentos`);
    } else {
      console.log(`  - ${col.name}: vacía`);
    }
  }

  console.log('\n✅ Migración completa');
  await local.close();
  await atlas.close();
  process.exit(0);
}

migrate().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
