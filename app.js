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



//Not Logged in
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
    var firstName = req.body.firstName;
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
          connection.query(iQuery, [firstName, lName, email, hash], function(err, results, fields) {
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
              console.log(results[0].firstName + " logged in.");
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
  //FIX THIS: Add an about page
})
//Dashboard - Without Company
app.get("/dashboard", function(req, res) {
  if (req.cookies.userData) {
    res.render("dashboard", {
      banner: "Workspace: Dashboard",
      fName: req.cookies.userData.fName,
      errorMsg: null
    })
  } else {
    res.redirect("/login");
  }
})
app.route("/dashboard/create")
  .get(function(req, res) {
    if (req.cookies.userData) {
      res.render('createcompany', {
        banner: 'Workspace: Company Creation',
        fName: req.cookies.userData.fName,
        userID: req.cookies.userData.id,
        errorMsg: null
      })
    } else {
      res.redirect("/login");
    }
  })
  .post(function(req, res) {
    if (req.cookies.userData) {
      var iQuery =
        `
      INSERT INTO company (cName) VALUES (?);
      SELECT last_insert_id() as jamble;
      INSERT INTO employeesInCompany(userID,companyID,power) VALUES (?,last_insert_id(),2)
      `;
      connection.query(iQuery, [req.body.cname, req.cookies.userData.id], function(error, results, fields) {
        if (error) {
          res.render('createcompany', {
            banner: 'Workspace: Company Creation',
            fName: req.cookies.userData.fName,
            userID: req.cookies.userData.id,
            errorMsg: error
          })
        } else {
          //get results
          res.redirect("/dashboard/company/" + results[1][0].jamble)
        }
      })
    } else {
      res.redirect("/login");
    }
  })
app.route("/dashboard/join")
  .get(function(req, res) {
    //if not logged in kickem out
    if (req.cookies.userData) {

    } else {
      res.redirect("/login")
    }
  })
  .post()

app.route("/dashboard/company/:cnumber")
  .get(function(req, res) {
    // Display Relevant Information to the company and check they are in that company and that the company exists, and what kind of power they have
    if (req.cookies.userData) {
      var sQuery = `
      select * from employeesInCompany
      left join company
      on company.companyID = employeesInCompany.companyID
      WHERE company.companyID = ?;
      `; // FIX THIS: Query will later need to accomadate a drop down menu for all associated companies
      connection.query(sQuery, [req.params.cnumber], function(error, results, fields) {
        if (error) {
          //redirect to basic dashboard
          res.render('dashboard', {
            banner: "Workspace: Dashboard",
            fName: req.cookies.userData.fName,
            errorMsg: error
          })
        } else {
          var found = false;
          for (let y = 0; y < results.length; y++) {
            if (results[y].userID === req.cookies.userData.id) {
              found = true;
              break;
            }
          }
          if (found == true) {
            res.render('companydashboard', {
              errorMsg: null,
              fName: req.cookies.userData.fName,
              cid: req.params.cnumber,
              cName: results[0].cName,
              banner: 'Workspace: Company Dashboard'
            })
          } else {
            res.render('dashboard', {
              banner: "Workspace: Dashboard",
              fName: req.cookies.userData.fName,
              errorMsg: 'You are not an admin or owner of a company with that ID.'
            })
          }
        }
      })
    } else {
      res.redirect("/")
    }
  })
app.route("/dashboard/company/:cnumber/createjoin")
  .get(function(req, res) {
    //get the name of the company and other details
    //create and insert a join link through randomatic in post
    if (req.cookies.userData) {
      var cNumber = req.params.cnumber;
      var sQuery = `
      select * from employeesInCompany
      left join company
      on company.companyID = employeesInCompany.companyID
      WHERE company.companyID = ? and power = 2
      `; // FIX THIS: Query will later need to accomadate a drop down menu for all associated companies
      connection.query(sQuery, [cNumber], function(error, results, fields) {
        if (error) {
          res.render('dashboard', {
            //FIX THIS: Update Company to actual name
            banner: "Workspace: Dashboard",
            fName: req.cookies.userData.fName,
            errorMsg: error
          })
        } else {
          var found = false;
          for (let y = 0; y < results.length; y++) {
            if (results[y].userID === req.cookies.userData.id) {
              found = true;
              break;
            }
          }
          if (found == true) {
            res.render('createjoinlink', {
              errorMsg: null,
              fName: req.cookies.userData.fName,
              banner: 'Workspace: Create a Join Link',
              cid: req.params.cnumber,
              cName: results[0].cName,
              errorMsg: null,
              posiMsg: null,
              joinCode: null
            })
          } else {
            res.render('dashboard', {
              banner: "Workspace: Dashboard",
              fName: req.cookies.userData.fName,
              errorMsg: 'You are not an admin or owner of a company with that ID.'
            })
          }
        }
      })
    } else {
      res.redirect("/login")
    }
  })
  .post(function(req, res) {
    //FIX THIS: Write a better query ( or a second query ) to determine if user is qualified to create links
    if (req.cookies.userData) {
      var determined = (req.body.toggler === 'no' ? false : true);
      var multi = (req.body.toggler === 'no' ? true : false);
      //randomly generate values
      var rando = randomatic('aA0', 15);
      var iQuery =
        `
    INSERT INTO joinLinks (companyID,link,verify,recency,oneoff,isactive) VALUES (?,?,?,NOW(),?,true);
    `;
      connection.query(iQuery, [req.params.cnumber, rando, determined, multi], function(error, results, fields) {
        if (error) {
          res.render('createjoinlink', {
            errorMsg: null,
            fName: req.cookies.userData.fName,
            banner: 'Workspace: Create a Join Link',
            cid: req.params.cnumber,
            cName: req.body.cName,
            errorMsg: error,
            posiMsg: null,
            joinCode: null
          })
        } else {
          res.render('createjoinlink', {
            errorMsg: null,
            fName: req.cookies.userData.fName,
            banner: 'Workspace: Create a Join Link',
            cid: req.params.cnumber,
            cName: req.body.cName,
            errorMsg: null,
            posiMsg: 'Your link has been created! Tell your employees to use the code below on joining a company.',
            joinCode: rando
          })
        }
      })
    } else {
      res.redirect("/login");
    }
  })

app.route("/dashboard/changeCompany")
  .get(function(req, res) {
    //search for all the companies an employee is a member of
    if (req.cookies.userData) {
      var sQuery =
      `
      select * from employeesInCompany left join company on company.companyID = employeesInCompany.companyID WHERE userID = ?;
      `
      connection.query(sQuery,[req.cookies.userData.id],function(error,results,fields){
        if (error){
          res.redirect('/dashboard');
        }
        else{
          res.render('companyswitch',{
            banner: "Workspace: Select Company",
            fName: req.cookies.userData.fName,
            results: results
          })
        }
      })
    } else {
      res.redirect("/login")
    }
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
