import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const newUri = "mongodb://laxmart7_db_user:rz9v0DLbXUHLaA1y@ac-iocgabn-shard-00-00.tr8tsvl.mongodb.net:27017,ac-iocgabn-shard-00-01.tr8tsvl.mongodb.net:27017,ac-iocgabn-shard-00-02.tr8tsvl.mongodb.net:27017/test?ssl=true&replicaSet=atlas-l05o7p-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function renameDb() {
    const sourceClient = new MongoClient(newUri);
    await sourceClient.connect();
    const sourceDb = sourceClient.db("test");
    const destDb = sourceClient.db("NewDatabaseName"); // using exact name from old db

    const collections = await sourceDb.listCollections().toArray();
    for (const collInfo of collections) {
        if (collInfo.name.startsWith("system.")) continue;
        console.log(`Copying collection ${collInfo.name}...`);
        const docs = await sourceDb.collection(collInfo.name).find({}).toArray();
        if (docs.length > 0) {
            await destDb.collection(collInfo.name).deleteMany({}); // clear first
            await destDb.collection(collInfo.name).insertMany(docs);
        }
    }

    try {
        for (const collectionInfo of collections) {
            if (collectionInfo.name.startsWith("system.")) continue;
            const indexes = await sourceDb.collection(collectionInfo.name).listIndexes().toArray();
            for (const index of indexes) {
                if (index.name !== "_id_") {
                    const indexObj = Object.assign({}, index);
                    delete indexObj.v;
                    delete indexObj.ns;
                    const keys = indexObj.key;
                    delete indexObj.key;
                    try {
                        await destDb.collection(collectionInfo.name).createIndex(keys, indexObj);
                    } catch (e) { }
                }
            }
        }
    } catch (e) { }

    console.log("Copied to NewDatabaseName db successfully");
    process.exit(0);
}

renameDb().catch(console.error);
