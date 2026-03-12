const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // We use the MONGO_URI from the .env file
        const conn = await mongoose.connect(process.env.MONGO_URI ||"mongodb://localhost:27017/karibu-project", {
           
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;