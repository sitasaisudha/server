const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const Users_schema = new Schema({
    name :String,
    mail : String,
    mobile:String,
    password :String
})
const Users = mongoose.model('user' , Users_schema)
module.exports = Users