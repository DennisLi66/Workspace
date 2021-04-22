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
  //FIX THIS: Add logged in checking
  if (req.cookies.userData) {
    res.redirect("/dashboard")
  } else {
    res.render('home', {
      banner: 'Workspace: Welcome to Workspace!',
      posiMsg: null,
      fName: null
    })
  }
})

app.get("/dashboard", function(req, res) {
  if (req.cookies.userData) {
    res.render("dashboard", {
      banner: "Workspace: Dashboard",
      fName: req.cookies.userData.fName
    })
  } else {
    res.redirect("/");
  }
})

app.route("/register")
  .get(function(req, res) {
    // FIX THIS: Add features to box
    if (req.cookies.userData) {
      res.redirect("/dashboard")
    } else {
      res.render("register", {
        banner: 'Workspace: Registration',
        errorMsg: null,
        posiMsg: null,
        fName: null
      })
    }
  })
  .post(function(req, res) {
    var fName = req.body.fName;
    var lName = req.body.lname;
    var email = req.body.email;
    var password = req.body.password;
    var cPassword = req.body.cPassword;
    if (password !== cPassword) {
      res.render("register", {
        banner: 'Workspace: Registration',
        errorMsg: 'Your passwords did not match.',
        posiMsg: null,
        fName: null
      })
    } else {
      bcrypt.hash(password, 10, function(e2rr, hash) {
        if (e2rr) {
          res.render("register", {
            banner: 'Workspace: Registration',
            errorMsg: e2rr,
            posiMsg: null,
            fName: null
          });
        } else {
          // FIX THIS: Add a better error message div
          var iQuery = 'INSERT INTO users (firstName,lastName,email,pswrd) VALUES (?,?,?,?)';
          connection.query(iQuery, [fName, lName, email, hash], function(err, results, fields) {
            if (err) {
              res.render("register", {
                banner: 'Workspace: Registration',
                errorMsg: err, //FIX THIS: Read error and make it more human legible
                posiMsg: null,
                fName: null
              });
            } else {
              res.render("login", {
                banner: 'Workspace: Login',
                errorMsg: null,
                posiMsg: "You've created a new Workspace account! You can now use it to sign in.",
                fName: null
              })
            }
          })
        }
      })
    }
  })

app.route("/login")
  .get(function(req, res) {
    //FIX THIS: Add logged in checking
    if (req.cookies.userData) {
      res.redirect("/dashboard")
    } else {
      res.render("login", {
        banner: 'Workspace: Login',
        errorMsg: null,
        posiMsg: null,
        fName: null
      })
    }
  })
  .post(function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var sQuery = "select * from users WHERE email = ?";
    connection.query(sQuery, [email], function(err, results, fields) {
      if (err) {
        res.render("login", {
          banner: 'Workspace: Login',
          errorMsg: err,
          posiMsg: null,
          fName: null
        })
      } else {
        if (results.length == 0) {
          res.render("login", {
            banner: 'Workspace: Login',
            errorMsg: 'That email and password combination do not exist.',
            posiMsg: null,
            fName: null
          })
        } else {
          var resPass = results[0].pswrd;
          bcrypt.compare(password, resPass, function(err3, rresult) {
            if (err3) {
              console.log(err3);
              res.render("login", {
                banner: "MoviesMan: Login",
                errorMsg: err3,
                posiMsg: null,
                fName: null
              })

            } else if (rresult) {
              console.log(results[0].username + " logged in.");
              let cookieObj = {
                fName: results[0].firstName,
                lname: results[0].lastName,
                id: results[0].userID,
                temporary: false
              }
              res.cookie("userData", cookieObj, {
                expires: new Date(900000 + Date.now())
              });
              res.redirect("/dashboard");
            } else {
              console.log("Logging in failed.")
              res.render("login", {
                banner: 'Workspace: Login',
                errorMsg: 'That email and password combination do not exist.',
                posiMsg: null,
                fName: null
              })

            }
          });
        }
      }
    })
  })

app.get("/about", function(req, res) {

})

app.get("/logout", function(req, res) {
  if (req.cookies.userData) {
    res.clearCookie('userData');
    res.render('home', {
      banner: 'Workspace: Welcome to Workspace!',
      posiMsg: 'You have successfully logged out.',
      fName: null
    })
  } else {
    console.log("User isn't even logged in.");
    res.redirect("/");
  }
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
