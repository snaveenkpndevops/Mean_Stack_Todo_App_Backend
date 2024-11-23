// dbConfig.js

import mongoose from 'mongoose';

// Connection function
export async function connect() {
    try {
        //"mongodb://root:password@mongodb-container:27017/todo_db?authSource=admin"   --> for mongodb-container
        // await mongoose.connect("mongodb://root:password@mongodb-service:27017/todo_db?authSource=admin", {
        await mongoose.connect("mongodb://root:password@mongodb-service:27017/todo_db?authSource=admin", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("DB Connected >>>");
    } catch (err) {
        console.error("Error connecting to DB: ", err);
        process.exit(1); // Exit the process in case of connection failure
    }
}

// Invoke the connect function
connect();
