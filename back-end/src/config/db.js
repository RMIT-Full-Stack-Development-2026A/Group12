// const {MongoClient} = require('mongodb');
// const uri = process.env.MONGO_URI;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// const uri = "mongodb+srv://s4080210_db_user:Q150605a@demo-database.lc9rpq1.mongodb.net/myDatabase?retryWrites=true&w=majority";
// const client = new MongoClient(uri);

// async function connectToDatabase() {
//     try {
//         await client.connect();
//         console.log('Connected to MongoDB');

//         return client.db();
//     } catch (error) {
//         console.error('Error connecting to MongoDB:', error);
//         throw error;
//     }
// }

// module.exports = connectToDatabase;