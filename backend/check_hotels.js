const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/laxim-libaas-quick-commerce', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const hotels = await mongoose.connection.collection('hotels').find({}).toArray();
  console.log(JSON.stringify(hotels, null, 2));
  process.exit(0);
}
check();
