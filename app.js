//jshint esversion:6

require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const Schema = mongoose.Schema;


mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new Schema ({
    email: String,
    password: String
});

const secret = process.env.SECRET
console.log(secret);

userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.post("/register", (req, res)=>{

    const password = req.body.password;
    const email = req.body.email;

    const newUser = new User({
        email: email,
        password: password
    });

    User.findOne({email: email}, (err, foundUser)=>{
        if(!err){
            if(foundUser){
                console.log("The corresponding user has already registered an account.");
                res.render("login");
            } else {
                newUser.save((err)=>{
                    if(!err){
                        res.render("secrets");
                    } else {
                        res.send(err);
                    };
                });
            }
        } else {
            res.send(err);
            console.log(err);
        }
    });

    

});

app.post("/login", (req, res)=>{

    const password = req.body.password;
    const email = req.body.email;

    User.findOne({email: email}, (err, foundUser)=>{
        if(!err){
            if(foundUser){
                if(foundUser.password === password) {
                    console.log("Successfully logged in!");
                    res.render("secrets");
                } else {
                    console.log("Wrong password.");
                    res.render("login");
                }
            } else {
                res.render("register");
                console.log("No matching email found. Please register first.");
            };
        } else {
            console.log(err);
        };
    });
});

app.listen(3000, ()=>{
    console.log("Server started on port 3000");
});