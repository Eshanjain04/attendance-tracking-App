const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const subjectSchema = new Schema({
    name:{type:String},
    attendance:{type:Number},
    totalClass:{type:Number},
    percentage:{type:String}
})

const subject = mongoose.model("subject",subjectSchema);

module.exports = subject;