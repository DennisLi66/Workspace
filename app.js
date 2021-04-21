require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const randomatic = require('randomatic');

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
// var connection = mysql.createConnection({
//   host: process.env.HOST,
//   user: process.env.USER,
//   password: process.env.PASSWORD,
//   database: process.env.DATABASE,
//   multipleStatements: true
// })
// connection.connect(); //FIX THIS: write dotenv file
//


//homepage
app.get("/",function(req,res){
  //if user logged in redirect to dashboard
  console.log("J");
  res.render('home',{banner: 'Workspace: Welcome to Workspace!'})
})

app.get("/dashboard",function(req,res){

})

app.route("/register")
  .get(function(req,res){
    res.render("register",{banner: 'Workspace: Registration'})
  })
  .post()

app.route("/login")
  .get(function(res,res){
    res.render("login",{banner:'Workspace: Login'})
  })
  .post()

app.get("/about",function(req,res){

})


app.get("/profile/:userid",function(req,res){})

app.get("/messages",function(req,res){})

app.get("/messages/:userid",function(req,res){})

app.get("/calendar",function(req,res){})

app.get("/todo/",function(req,res){})

app.get("/todo/:year/:month/:day",function(req,res){})

app.get("/todo/:year/:month",function(req,res){})

app.get("/todo/:year",function(req,res){})

app.listen(3000, function() {
  console.log("Server Started.")
});
