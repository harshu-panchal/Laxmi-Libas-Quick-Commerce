const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://laxmart7_db_user:rz9v0DLbXUHLaA1y@ac-iocgabn-shard-00-00.tr8tsvl.mongodb.net:27017,ac-iocgabn-shard-00-01.tr8tsvl.mongodb.net:27017,ac-iocgabn-shard-00-02.tr8tsvl.mongodb.net:27017/NewDatabaseName?ssl=true&replicaSet=atlas-l05o7p-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const hotels = await mongoose.connection.collection('hotels').find({}, { projection: { sellerId: 1, name: 1, status: 1 } }).toArray();
  console.log(JSON.stringify(hotels, null, 2));
  process.exit(0);
}
check();
