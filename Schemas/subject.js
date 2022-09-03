const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subjectSchema = new Schema({
    name:{type:String},
    attendance:{type:Number},
    totalClass:{type:Number},
    percentage:{type:String},
    users:{type:Schema.Types.ObjectId,ref:"user"}
})

const subject = mongoose.model("subject",subjectSchema);

module.exports = subject;