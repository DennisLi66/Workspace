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
var connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  multipleStatements: true
})
connection.connect(); //FIX THIS: write dotenv file



//homepage
app.get("/", function(req, res) {
  //if user logged in redirect to dashboard
  res.render('home', {
    banner: 'Workspace: Welcome to Workspace!'
  })
})

app.get("/dashboard", function(req, res) {
  res.render("dashboard", {
    banner: "Workspace: Dashboard"
  })
})

app.route("/register")
  .get(function(req, res) {
    // FIX THIS: Add features to box
    res.render("register", {
      banner: 'Workspace: Registration',
      errorMsg: null
    })
  })
  .post(function(req, res) {
    var fName = req.body.fname;
    var lName = req.body.lname;
    var email = req.body.email;
    var password = req.body.password;
    var cPassword = req.body.cPassword;
    if (password !== cPassword) {
      res.render("register", {
        banner: 'Workspace: Registration',
        errorMsg: 'Your passwords did not match.'
      })
    } else {
      bcrypt.hash(password, 10, function(e2rr, hash) {
        if (e2rr) {
          res.render("register", {
            banner: 'Workspace: Registration',
            errorMsg: e2rr
          });
        } else {
          // FIX THIS: Add a better error message div
          var iQuery = 'INSERT INTO users (firstName,lastName,email,pswrd) VALUES (?,?,?,?)';
          connection.query(iQuery, [fName,lName,email,hash] ,function(err, results, fields) {
            if (err){
              res.render("register", {
                banner: 'Workspace: Registration',
                errorMsg: err //FIX THIS: Read error and make it more human legible
              });
            }
            else{
              res.redirect("/login");
            }
          })
        }
      })
    }
  })

app.route("/login")
  .get(function(res, res) {
    res.render("login", {
      banner: 'Workspace: Login'
    })
  })
  .post()

app.get("/about", function(req, res) {

})


app.get("/profile/:userid", function(req, res) {})

app.get("/messages", function(req, res) {})

app.get("/messages/:userid", function(req, res) {})

app.get("/calendar", function(req, res) {})

app.get("/todo/", function(req, res) {})

app.get("/todo/:year/:month/:day", function(req, res) {})

app.get("/todo/:year/:month", function(req, res) {})

app.get("/todo/:year", function(req, res) {})

app.listen(3000, function() {
  console.log("Server Started.")
});
