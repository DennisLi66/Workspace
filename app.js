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
      res.render('joincompany', {
        banner: 'Workspace: Join a Company',
        fName: req.cookies.userData.fName,
        errorMsg: null,
        posiMsg: null
      })
    } else {
      res.redirect("/login")
    }
  })
  .post(function(req, res) {
    if (req.cookies.userData) {
      var sQuery =
        `
      select 'eic' as Identity, companyID, userID, null as link, null as verify, null as oneoff, null as isactive from employeesInCompany WHERE userID = ?
      UNION ALL
      select 'code' as Identity,companyID, null as userID, link, verify, oneoff, isactive from joinlinks WHERE isactive = 1 AND link = ?
      `
      connection.query(sQuery, [req.cookies.userData.id, req.body.code], function(er, resu, fiels) {
        if (er) {
          res.render('joincompany', {
            banner: 'Workspace: Join a Company',
            fName: req.cookies.userData.fName,
            errorMsg: er,
            posiMsg: null
          })
        } else if (resu) {
          var found = false;
          var verif;
          var cid;
          var oneoff;
          for (let o = 0; o < resu.length; o++) {
            if (resu[o].Identity === 'code') {
              console.log(resu[o])
              verif = resu[o].verify;
              cid = resu[o].companyID;
              oneoff = resu[o].oneoff;
            } else {
              if (resu[o].Identity === 'eic' && resu[o].companyID === cid) {
                found = true;
                break;
              }
            }
          }
          if (resu.length == 0) {
            res.render('joincompany', {
              banner: 'Workspace: Join a Company',
              fName: req.cookies.userData.fName,
              errorMsg: null,
              posiMsg: 'The code you used was invalid.'
            })
          } else if (found) {
            res.render('joincompany', {
              banner: 'Workspace: Join a Company',
              fName: req.cookies.userData.fName,
              errorMsg: null,
              posiMsg: 'You are already a member of that company.'
            })
          } else if (!cid) {
            res.render('joincompany', {
              banner: 'Workspace: Join a Company',
              fName: req.cookies.userData.fName,
              errorMsg: null,
              posiMsg: 'The code you used was invalid.'
            })
          } else {
            //if both
            if (oneoff == 1 && verif == 1) {
              console.log('Needs verification and update');
              var iQuery =
                `
              UPDATE joinLinks SET isactive = 0 WHERE link = ?;
              INSERT INTO joinApproval (companyID,userID,link,recency) VALUES (?,?,?,NOW());
              `;
              connection.query(iQuery, [], function(error, results, fields) {
                if (error) {
                  res.render('joincompany', {
                    banner: 'Workspace: Join a Company',
                    fName: req.cookies.userData.fName,
                    errorMsg: error,
                    posiMsg: null
                  })
                } else {
                  res.render('joincompany', {
                    banner: 'Workspace: Join a Company',
                    fName: req.cookies.userData.fName,
                    errorMsg: null,
                    posiMsg: 'You have submitted your code, but must wait for manual verification by an admin before joining.'
                  })
                }
              })
            }
            // if  is one off
            else if (oneoff == 1 && verif == 0) {
              console.log('Needs update but insert');
              var iQuery =
                `
              INSERT INTO employeesInCompany (userID,companyID,title,power) values (?,?,NULL,0);
              UPDATE joinLinks SET isactive = 0 WHERE link = ?;
              `;
              connection.query(iQuery, [], function(error, results, fields) {
                if (error) {
                  res.render('joincompany', {
                    banner: 'Workspace: Join a Company',
                    fName: req.cookies.userData.fName,
                    errorMsg: error,
                    posiMsg: null
                  })
                } else {
                  res.render('companydashboard', {
                    errorMsg: null,
                    posiMsg: null,
                    power: 0,
                    fName: req.cookies.userData.fName,
                    cid: req.params.cnumber,
                    cName: results[0].cName,
                    banner: 'Workspace: Company Dashboard'
                  })
                }
              })
            }
            //if needs verification
            else if (oneoff == 0 && verif == 1) {
              console.log('Needs verification');
              var iQuery =
                `
              INSERT INTO joinApproval (companyID,userID,link,recency) VALUES (?,?,?,NOW());
              `;
              connection.query(iQuery, [cid, req.cookies.userData.id, req.body.code], function(error, results, fields) {
                if (error) {
                  res.render('joincompany', {
                    banner: 'Workspace: Join a Company',
                    fName: req.cookies.userData.fName,
                    errorMsg: error,
                    posiMsg: null
                  })
                } else {
                  res.render('joincompany', {
                    banner: 'Workspace: Join a Company',
                    fName: req.cookies.userData.fName,
                    errorMsg: null,
                    posiMsg: 'You have submitted your code, but must wait for manual verification by an admin before joining.'
                  })
                }
              })
            }
            // if neither
            else {
              console.log('Immediate Employee Insertion')
              var iQuery =
                `
              INSERT INTO employeesInCompany (userID,companyID,title,power) values (?,?,NULL,0);
              `;
              connection.query(iQuery, [req.cookies.userData.id, cid], function(error, results, fields) {
                if (error) {
                  res.render('joincompany', {
                    banner: 'Workspace: Join a Company',
                    fName: req.cookies.userData.fName,
                    errorMsg: error,
                    posiMsg: null
                  })
                } else {
                  res.render('companydashboard', {
                    errorMsg: null,
                    posiMsg: null,
                    power: 0,
                    fName: req.cookies.userData.fName,
                    cid: req.params.cnumber,
                    cName: results[0].cName,
                    banner: 'Workspace: Company Dashboard'
                  })
                }
              })
            }
          }
        }
      })
    } else {
      res.redirect("/login");
    }
  })
app.route("/dashboard/company/:cnumber")
  .get(function(req, res) {
    // Display Relevant Information to the company and check they are in that company and that the company exists, and what kind of power they have
    if (req.cookies.userData) {
      var sQuery = `
      select * from employeesInCompany
      left join company
      on company.companyID = employeesInCompany.companyID
      WHERE company.companyID = ? AND userID = ?;
      `; // FIX THIS: Query will later need to accomadate a drop down menu for all associated companies
      connection.query(sQuery, [req.params.cnumber, req.cookies.userData.id], function(error, results, fields) {
        if (error) {
          //redirect to basic dashboard
          res.render('dashboard', {
            banner: "Workspace: Dashboard",
            fName: req.cookies.userData.fName,
            errorMsg: error
          })
        } else {
          if (results.length > 0) {
            var power = results[0].power;
            res.render('companydashboard', {
              errorMsg: null,
              posiMsg: null,
              power: power,
              fName: req.cookies.userData.fName,
              cid: req.params.cnumber,
              cName: results[0].cName,
              banner: 'Workspace: Company Dashboard'
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
      WHERE company.companyID = ? and (power = 2 or power = 1)
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
      var sQuery =
        `
      select * from employeesInCompany left join company on company.companyID = employeesInCompany.companyID
      WHERE(power = 1 or power = 2) AND userID = ? and company.companyID = ?
      `;
      connection.query(sQuery, [req.cookies.userData.id, req.params.cnumber], function(er, resu, fiels) {
        if (er) {
          console.log(er)
          res.redirect("/dashboard/company/" + req.params.cnumber)
        } else {
          if (resu.length == 0) {
            res.redirect("/dashboard/company/" + req.params.cnumber)
          } else {
            var determined = (req.body.toggler === 'no' ? false : true);
            var multi = (req.body.toggler === 'no' ? true : false);
            //randomly generate values
            var rando = randomatic('aA0', 15);
            var iQuery =
              `
          INSERT INTO joinLinks (companyID,link,verify,recency,oneoff,isactive) VALUES (?,?,?,NOW(),?,true)
          on duplicate key Update companyID = values(companyID),verify = values(verify), recency = values(recency), oneoff=values(oneoff), isactive=values(isactive);
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
          }
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
      connection.query(sQuery, [req.cookies.userData.id], function(error, results, fields) {
        if (error) {
          res.redirect('/dashboard');
        } else {
          res.render('companyswitch', {
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
app.route("/dashboard/company/:cnumber/verify")
  .get(function(req, res) {
    if (req.cookies.userData) {
      var sQuery =
        `
        select * from employeesInCompany WHERE (power = 1 or power = 2) AND companyID = ? AND userID = ?;
        select * from joinLinks where companyID = ?;
        select * from joinApproval left join users on users.userID = joinApproval.userID WHERE companyID = ?;
      `;
      connection.query(sQuery, [req.params.cnumber, req.cookies.userData.id, req.params.cnumber, req.params.cnumber], function(error, results, fields) {
        if (error) {
          console.log(error);
          res.redirect("/dashboard/company/" + req.params.cnumber + "/verify");
        } else {
          console.log(results);
          if (results[0].length == 0) {
            console.log("No Admin/Owner Powers");
            res.redirect("/dashboard/company/" + req.params.cnumber + "/verify");
          } else {
            res.render('verifEmployees', {
              fName: req.cookies.userData.fName,
              banner: 'Workspace: Employee Verification',
              ndAppr: results[2],
              links: results[1]
            })
          }
        }
      })
    } else {
      res.redirect("/login");
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
