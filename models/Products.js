const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const Product_schema  = new Schema({
    name : String,
    category : Array,
    logo : String,
    product_link : String,
    description :String,
    upvotes : Number,
    comments : Array
})
const Products = mongoose.model('product' , Product_schema)
module.exports  = Products;
