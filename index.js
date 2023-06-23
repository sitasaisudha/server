const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const ejs = require("ejs");
const app = express();
const Users = require("./models/Users");
const Products = require("./models/Products");

dotenv.config();
app.use(cors());
app.use(express.static("./public"));
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({extended:false}))
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// user Authenication
const isAuthenticated = (req,res,next)=>{
  try{
    console.log(req.headers.token)
     jwt.verify(req.headers.token , process.env.PRIVATE_KEY)
     console.log('authenicated')
     next()
  }catch(error){
    console.log(error)
    res.json({error :error})
  }
}


app.get('/',(req,res)=>{
  res.send('hey sita dont worry you can do it')
})
//SIGN IN API
app.post("/api/login", (req, res) => {
  const { mail, pass_word } = req.body;
  const user = Users.findOne({ mail }).then((data) => {
    let pass_match = bcrypt.compare(pass_word, data.password);
    if (pass_match) {
      const token = jwt.sign({ mail }, process.env.PRIVATE_KEY, {
        expiresIn: 60 * 60,
      });
      res.json({
        message: "successfully logged in",
        name: data.name,
        token: token,
      });
    }
  }).catch((error) => {res.json({status : "fsiled" , message :"either mail or password is incorrect"})});
});

// REGISTER API
app.post('/api/register' , async (req,res)=>{
    const {name , mail , mobile , pass_word} = req.body ;
   
    try{
       
        const user = await Users.findOne({mail})
        if(user){
            return res.json({message:"user already exist"})
            
        }
        const password = await bcrypt.hash(pass_word ,4)
        // console.log(password)
    

        Users.create({name,mail,mobile,password}).then(()=>{
            const token =  jwt.sign({ mail }, process.env.PRIVATE_KEY ,  { expiresIn: 60 * 60 });
           
            res.json({status :"success", name : name ,token : token  })
        }).catch((errro) =>{
            res.json({status :"failed to register"})
        })
    }
    catch(error){
        res.json({status: "failed to register"})
    }
   
})


// Add Products API

app.post('/api/add-products' ,isAuthenticated, async (req,res)=>{
  console.log(req.body)
  const {name , category , logo , product_link , description} = req.body; 
  const categorys = category.split(',')
  try{
    const product = await Products.findOne({name})
    if(product){
    return  res.json({message : "product already exist"})
   
    } 
    
    const upvotes  = 0;
    const comments = '';
    Products.create({name , category:categorys , logo , product_link, description , upvotes , comments}).then(()=>{
      res.json({status :"success" , message :"product successfully created"})
    }).catch((err) => res.json({status : "faileds  to create"}))

  }catch(error){
      res.json({status :"failed to create"})
  }
})

// get-products
app.get('/api/get-products' , (req,res)=>{
   Products.find().then((products) => {
    res.json(products)
    console.log("called")
   }).catch((error) => res.json({status :"failed to get products"}))


})

//get categories api 
app.get('/api/get-categories' ,async (req, res) =>{
  try{
    const products =await Products.find()
    const all_categories = await products.flatMap(products => products.category)
    unique = [...new Set(all_categories)]
    res.send(unique)
  }catch(error){
    res.json({status :"failed to get categories"})
  }
 
})



//category wise selection 
app.get(`/api/products/`,async (req, res)=>{
  let categories = req.query.category;
    let sort = req.query.sort;
    // console.log(sort)
    let search = req.query.search || "";
    try {
        let Product = await Products.find();
        let prod = "";
        if (categories == "All" && sort==undefined) {
            prod = (await Products.find().sort('upvotes')).reverse();
        }
        else if(categories == "All" && sort){
            
            prod = (await Products.find().sort(sort));
        }
        else {
            if (sort == null) {
                prod = await Products.find({ category: { $regex: search, $options: "i" } })
                    .where('category')
                    .in(categories)
            }
            else{
                prod = (await Products.find({ category: { $regex: search, $options: "i" } })
                .where('category')
                .in(categories).sort(sort)).reverse()
            }
            
        }
       res.json({status :"product fetched successfully" , product:prod})
    }
    catch (err) {
        res.send({status :"failed"})
    }
} )

//upvotes increment
app.patch('/api/upvotes' , async(req,res)=>{
  const {name, upvotes} = req.body;
  
  try{
    const updated = await Products.findOne({name:name})
    updated.upvotes = upvotes;
    // console.log(upvote,updated.upvotes)
    const updatedProduct = await updated.save();
    return res.json({upvote:upvotes,message:"success"})

  }
  catch(err){
    res.json({
      error:err
    })
  }
})


// adding comments
app.patch('/api/comments' , async (req,res)=>{
  const {name , comments} = req.body;
 
  try {
    const cmnt = await Products.findOneAndUpdate({name}, {$push: {comments: comments}}, {
        new: true
    })
    console.log(cmnt)
    res.json(cmnt)
} catch(e) {
    res.json({
        error: 'cant update',
    })
}
})
 
// edit products 
app.patch('/api/edit-products' ,isAuthenticated, async (req,res)=>{
  const {id,name , categorys , logo , product_link , description} = req.body;
  console.log(req.body.id)
  console.log(id)
  let category;
  if(categorys){
     category = categorys.split(',')
  }else{
     category = categorys;
  }
 
  
    // console.log(category)
  try{
    const product = await Products.findById(id)
    
    
   if(product){
    product.name = name || product.name;

            product.logo = logo || product.logo;

            product.category = category || product.category;

            product.product_link = product_link || product.product_link;

            product.description =  description|| product.description;

            const updatedproduct = await product.save().then(()=> console.log("yeahoo"))

            return res.json({status :'200' , message:'updated successfully'})
   }
   else{
    res.json({status :"404" , message:"failed to update bro"})
   }


  }catch(error){
      res.json({status :"failed to create"})
  }
})



app.listen(process.env.PORT, () => {
  mongoose
    .connect(process.env.MONGO_URL, {
      useNewUrlParser: true,

      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("server running on port :" + process.env.PORT);
    })
    .catch((error) => {
      console.log(error);
    
    });
});
