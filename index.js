const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const port = 3000;
const Book = require("./models/bookModel");
const cookieParser = require("cookie-parser");
const secretKey = 'Krishn@invraj8'; 
const user = require("./models/User");


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Route Protection
const checkAuth = (req,res,next)=>{
  const token = req.cookies.token;
  if(!token){
   return res.redirect("/login");
  }
  try{
  const verified = jwt.verify(token,secretKey);
  req.user=verified;
  next();
  }
  catch(err){
    return res.redirect("/login");
  }
}

mongoose.connect("mongodb+srv://vraj_10:Atlas123@vrajcluster.f25aaog.mongodb.net/Book?retryWrites=true&w=majority&appName=vrajcluster")
  .then(() => console.log("MongoDB Connection Sucessfull"))
  .catch(err => console.log(err));

app.listen(port,()=>{
    console.log(`app is listining on port ${port}`);
});

app.get('/',  (req, res) => {
  res.render('index');
});



app.get('/displayBooks',checkAuth,async (req, res) => {
  try {
    const books = await Book.find();           
    res.render('displayBooks', { books });     
  } catch (err) {
    res.send(" Error is occured ");
  }
});


app.get('/books/new',checkAuth,(req, res) => {
  res.render('new');
});

app.post('/books', async (req, res) => {
  try {
    await Book.create(req.body);
    res.redirect('/displayBooks'); 
  } catch (err) {
    res.send("Error");
  }
});


// Edit form
app.get('/books/:id/edit',checkAuth,async (req, res) => {
  const book = await Book.findById(req.params.id);
  res.render('edit', { book });
});

// Update
app.post('/books/:id',checkAuth,async (req, res) => {
  await Book.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/displayBooks'); //changed
});

// Delete
app.post('/books/:id/delete',checkAuth,async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  res.redirect('/');
});

//Register

app.get('/register',(req, res) => {
  res.render('register');
});

app.post('/register', async(req,res)=>{
  // console.log("Form Data:", req.body);
  const {username,email,password} = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  await user.create({ username,email, password: hashedPassword });
  res.redirect("/displayBooks");
});

//login 

app.get('/login',(req,res)=>{
  res.render('login');
});

app.post('/login',async(req,res)=>{
  const{email,password} = req.body;
  const existeduser = await user.findOne({ email });
    if (!existeduser) {
    return res.send('User not found',);
  }
  const userPwd = await bcrypt.compare(password, existeduser.password);
    if (!userPwd) {
    return res.send('Invalid password');
  }

    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
    res.cookie('token', token);
    res.redirect('/displayBooks');
});

// logout
app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});