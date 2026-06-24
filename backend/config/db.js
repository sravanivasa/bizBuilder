const mongoose = require("mongoose");
const connectDB = async() =>{
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MONGODB connected",mongoose.connection.db.databaseName);
    }catch(error){
        console.error(error);
        process.exit(1);
    }
};
module.exports = connectDB;