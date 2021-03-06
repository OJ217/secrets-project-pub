//jshint esversion:6

require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const passportLocal = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String,
    secret: String 
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// const secret = process.env.SECRET;

// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/auth/google", 
    passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets",
    passport.authenticate("google", {failureFlash: "/login"}),
    (req, res)=>{
        res.redirect("/secrets");
    } 
);

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/secrets", (req, res)=>{
    
    User.find({"secret": {$ne: null}}, (err, foundUsers)=>{
        if(err){
            console.log(err);
        } else {
            res.render("secrets", {usersWithSecrets: foundUsers});
        }
    })
    
});

app.get("/logout", (req, res)=>{
    req.logout();
    res.redirect("/");
});

app.post("/register", (req, res)=>{
    
    User.register({username: req.body.username}, req.body.password, (err, registeredUser)=>{
        if(!err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets");
            });
        }
    });

});

app.post("/login", (req, res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err)=>{
        if(err){
            console.log(err);
            res.redirect("login");
        } else {
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets");
            });
        };
    });
});

app.get("/submit", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", (req, res)=>{
    const submittedSecret = req.body.secret;
    if(req.user == undefined){
        res.redirect("login");
    } else {
        User.findById(req.user.id, (err, foundUser)=>{
            if(err){
                console.log(err);
            } else {
                foundUser.secret = submittedSecret;
                foundUser.save(()=> {
                    res.redirect("/secrets");
                });
            }
        });
    };
});

app.listen(3000, ()=>{
    console.log("Server started on port 3000");
});

//OLDER VERSION WITH HASHING AND SALTING (BRCYPT)

// app.post("/register", (req, res)=>{

//     bcrypt.hash(req.body.password, saltRounds, (err, hash)=>{
//         if(!err){

//             const email = req.body.email;

//             const newUser = new User({
//                 email: email,
//                 password: hash
//             });

//             User.findOne({email: email}, (err, foundUser)=>{
//                 if(!err){
//                     if(foundUser){
//                         console.log("The corresponding user has already registered an account.");
//                         res.render("login");
//                     } else {
//                         newUser.save((err)=>{
//                             if(!err){
//                                 res.render("secrets");
//                             } else {
//                                 res.send(err);
//                             };
//                         });
//                     }
//                 } else {
//                     res.send(err);
//                     console.log(err);
//                 }
//             });

//         } else {
//             console.log(err);
//         };
//     });    

// });

// app.post("/login", (req, res)=>{

//     const enteredPassword = req.body.password;
//     const email = req.body.email;

//     User.findOne({email: email}, (err, foundUser)=>{
//         if(!err){
//             if(foundUser){
//                 bcrypt.compare(enteredPassword, foundUser.password, (err, result)=>{
//                     if(result === true){
//                         console.log("Successfully logged in!");
//                         res.render("secrets");
//                     } else {
//                         console.log("Wrong password!");
//                         res.render("login");
//                     };
//                 });
//             } else {
//                 console.log("No matching email found. Please register first.");
//                 res.render("register");
//             };
//         } else {
//             console.log(err);
//         };
//     });
    
// });