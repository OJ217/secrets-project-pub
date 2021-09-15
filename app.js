//jshint esversion:6

// require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const passportLocal = require("passport-local");

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
    password: String
});

userSchema.plugin(passportLocalMongoose);

// const secret = process.env.SECRET;

// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/secrets", (req, res)=>{
    
    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    };
    
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