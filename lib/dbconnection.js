const mongoose = require("mongoose");

const connectBD = async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}`)
        console.log("Successfully Connect MongoDb");
    }catch(err){
        console.log(err.message);
    }
}


module.exports = connectBD;