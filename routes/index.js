var express = require('express');
//const { use } = require('passport');
var router = express.Router();
//here i have to require user model
const userModel = require('./users');
const PostModel = require('./post');
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require('./multer');
passport.use(new localStrategy(userModel.authenticate()));

router.get('/', function(req, res, next) {
  res.render('index', { nav: false });
});
router.get('/register', function(req, res, next) {
  res.render('register',{ nav: false });
});
router.get('/add',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({ username:req.session.passport.user});
  //here i sended the the ddata of user who is loggedin and this will help profile.ejs page show diff data for diff page
  res.render('add',{user,nav:true});
});
router.post('/createpost',isLoggedIn,upload.single("postimage") ,async function(req, res, next) {
  const user = await userModel.findOne({ username:req.session.passport.user});
  const post = await PostModel.create({
    //here we already have user variable so just use that to get id
    user:user._id,
    title:req.body.title,
    description:req.body.description,
    image:req.file.filename
  })
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

router.get('/profile',isLoggedIn, async function(req, res, next) {
  const user = await
             userModel
              .findOne({ username:req.session.passport.user})
              .populate("posts")
  //here i sended the the ddata of user who is loggedin and this will help profile.ejs page show diff data for diff page
  res.render('profile',{user,nav:true});
});
//we have given name mimage in single(ima) becz form me img ka name image he rkhe hai

router.get('/feed',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({ username:req.session.passport.user})
  const posts = await PostModel.find().populate("user");
  res.render("feed",{user,posts,nav:true});
});


router.get('/show/posts',isLoggedIn, async function(req, res, next) {
  const user = await
             userModel
              .findOne({ username:req.session.passport.user})
              .populate("posts")
  //here i sended the the ddata of user who is loggedin and this will help profile.ejs page show diff data for diff page
  res.render('show',{user,nav:true});
});

router.get('/bigimage/:postId', isLoggedIn, async function(req, res, next) {
  try {
    const post = await PostModel.findById(req.params.postId).populate('user');
    if (!post) {
      return res.status(404).send('Post not found');
    }
    res.render('bigimage', { post, nav: true });
  } catch (error) {
    next(error);
  }
});



router.post('/fileupload',isLoggedIn,upload.single("image"), async function(req, res, next) {
 //now we have link this imag with ou database
 //when ever we are login req.session.passport.user contains username
 const user = await userModel.findOne({ username:req.session.passport.user});
 //jo file uplaod hui hai uska name hita ghai req.file.filename
 user.profileImage = req.file.filename;
 await user.save();
 res.redirect('/profile');
});
//register.get route get data from user but now we create post route  which can actually create user in our data base
router.post('/register', function(req, res, next) {
  const data = new userModel({
    //left side name must match user.js and right side name must be avalble on form field and match
    username:req.body.username,
    email:req.body.email,
    contact:req.body.contact,
    name:req.body.fullname
  })
userModel.register(data,req.body.password)
.then(function(){
  passport.authenticate("local")(req,res,function(){
   res.redirect ("/profile"); 
  })
})
});
router.post('/login',passport.authenticate("local",{
  failureRedirect:"/",
  successRedirect:"/profile",}),
function(req, res, next){ 
});
router.get('/logout',function(req,res,next){ 
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });
 function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/");
 } 
module.exports = router;
