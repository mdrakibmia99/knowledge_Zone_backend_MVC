const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
function dbConnect(){
    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.drzmd.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: ServerApiVersion.v1,
    });
    return client;
}
module.exports =dbConnect;