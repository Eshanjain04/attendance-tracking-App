const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
    firstname:{type:String,required:true},
    lastname:{type:String,required:true},
    subjects:{type:ObjectId,ref:"subject"},
})

const user = mongoose.model("user",userSchema);

module.exports = user;