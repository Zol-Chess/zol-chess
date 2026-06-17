import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

function runDB() {
  if (!global._mongoClientPromise) {
    client = client = new MongoClient(uri, { tls: true });
    global._mongoClientPromise = client.connect();
  }

  clientPromise = global._mongoClientPromise;

  return clientPromise;
}

runDB();

export { client, clientPromise };
