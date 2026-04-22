const mongoose = require('mongoose');

async function fixSellerIds() {
  await mongoose.connect('mongodb://laxmart7_db_user:rz9v0DLbXUHLaA1y@ac-iocgabn-shard-00-00.tr8tsvl.mongodb.net:27017,ac-iocgabn-shard-00-01.tr8tsvl.mongodb.net:27017,ac-iocgabn-shard-00-02.tr8tsvl.mongodb.net:27017/NewDatabaseName?ssl=true&replicaSet=atlas-l05o7p-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  const db = mongoose.connection.collection('hotels');
  const hotels = await db.find({}).toArray();
  
  for (const hotel of hotels) {
    if (typeof hotel.sellerId === 'string') {
      console.log(`Fixing hotel ${hotel.name}`);
      await db.updateOne(
        { _id: hotel._id },
        { $set: { sellerId: new mongoose.Types.ObjectId(hotel.sellerId) } }
      );
    }
  }
  
  console.log('Done fixing sellerIds');
  process.exit(0);
}
fixSellerIds();
