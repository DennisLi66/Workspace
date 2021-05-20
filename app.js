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
connection.connect();

//logic
function checkValidDay(day, month, year) {
  var months30 = [9, 4, 6, 11];
  if (year < 0) {
    return false;
  } else if (month < 1 || month > 12) {
    return false;
  } else if (day < 1 || day > 31) {
    return false;
  } else if (day < 29) {
    return true;
  } else if (months30.includes(month) && day > 30) {
    return false;
  } else if (month == 2 && day > 29) {
    return false;
  } else if (day == 29 && month == 2) {
    if (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)) {
      return true;
    } else {
      return false;
    }
  } else {
    return true;
  }
}

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
                expires: new Date(10000000 + Date.now())
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
    var employedAt = null;
    var sQuery =
      `
    select userID, company.companyID as companyID, cName as title from employeesInCompany left join company on company.companyID = employeesInCompany.companyID WHERE userid = ?;
    SELECT id,authorID,announcements.companyID,cName,announcements.title,content,recency,firstName,lastName, employeesincompany.userID, power
    FROM announcements left join users on users.userID = announcements.authorID
    left join company on company.companyID = announcements.companyID
    left join employeesInCompany ON announcements.companyID = employeesInCompany.companyID
    WHERE employeesInCompany.userID = ?  ORDER BY id DESC LIMIT 3
    `;
    connection.query(sQuery, [req.cookies.userData.id, req.cookies.userData.id], function(error, results, fields) {
      if (error) {
        console.log(error);
        employedAt = null;
        announcements = null;
        res.render("dashboard", {
          banner: "Workspace: Dashboard",
          fName: req.cookies.userData.fName,
          empl: employedAt,
          errorMsg: null,
          announcements: announcements
        })
      } else {
        employedAt = results[0];
        announcements = results[1];
        res.render("dashboard", {
          banner: "Workspace: Dashboard",
          fName: req.cookies.userData.fName,
          empl: employedAt,
          errorMsg: null,
          announcements: announcements
        })
      }
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
      select companyID, userID from employeesInCompany WHERE userID = ?;
      select companyID, link, verify, oneoff, isactive from joinlinks WHERE isactive = 1 AND link = ?;
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
          if (resu[1].length == 0) {
            res.render('joincompany', {
              banner: 'Workspace: Join a Company',
              fName: req.cookies.userData.fName,
              errorMsg: null,
              posiMsg: 'The code you used was invalid.'
            })
          } else {
            verif = resu[1][0].verify;
            cid = resu[1][0].companyID;
            oneoff = resu[1][0].oneoff;
            for (let o = 0; o < resu[0].length; o++) {
              if (resu[0][o].companyID === cid) {
                found = true;
                break;
              }
            }
            if (found) {
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
              if (oneoff == 0 && verif == 1) {
                console.log('Needs verification and update');
                var iQuery =
                  `
              UPDATE joinLinks SET isactive = 0 WHERE link = ?;
              INSERT INTO joinApproval (companyID,userID,link,recency) VALUES (?,?,?,NOW());
              `;
                connection.query(iQuery, [req.body.code, req.params.cnumber, req.cookies.userData.id, req.body.code], function(error, results, fields) {
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
              else if (oneoff == 0 && verif == 0) {
                console.log('Needs update but insert');
                var iQuery =
                  `
              INSERT INTO employeesInCompany (userID,companyID,title,power) values (?,?,NULL,0);
              UPDATE joinLinks SET isactive = 0 WHERE link = ?;
              `;
                connection.query(iQuery, [req.cookies.userData.id, cid, req.body.code], function(error, results, fields) {
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
              else if (oneoff == 1 && verif == 1) {
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
                connection.query(iQuery, [req.cookies.userData.id, cid, cid], function(error, results, fields) {
                  if (error) {
                    res.render('joincompany', {
                      banner: 'Workspace: Join a Company',
                      fName: req.cookies.userData.fName,
                      errorMsg: error,
                      posiMsg: null
                    })
                  } else {
                    res.redirect("/dashboard/company/" + cid)
                  }
                })
              }
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
      select * from joinApproval left join users on users.userID = joinApproval.userID WHERE companyID = ?;
      SELECT * FROM announcements left join users on users.userID = announcements.authorID WHERE companyID = ? ORDER BY id DESC LIMIT 5;

      `; // FIX THIS: Query will later need to accomadate a drop down menu for all associated companies
      connection.query(sQuery, [req.params.cnumber, req.cookies.userData.id,req.params.cnumber,req.params.cnumber], function(error, results, fields) {
        if (error) {
          //redirect to basic dashboard
          console.log(error);
          res.redirect("/dashboard/company/" + req.params.cnumber);
        } else {
          if (results.length > 0) {
            var power = results[0][0].power;
            res.render('companydashboard', {
              errorMsg: null,
              posiMsg: null,
              power: power,
              fName: req.cookies.userData.fName,
              cid: req.params.cnumber,
              cName: results[0][0].cName,
              banner: 'Workspace: Company Dashboard',
              thoseWhoNeedVerification: results[1].length,
              announcements: results[2]
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
          console.log(error);
          res.redirect("/dashboard/company/" + req.params.cnumber);
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
              joinCode: null,
              cid: req.params.cnumber
            })
          } else {
            res.redirect("/dashboard/company/" + req.params.cnumber);
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
            var determined = (req.body.toggler === 'no' ? true : false);
            var multi = (req.body.toggler2 === 'no' ? true : false);
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
                  joinCode: null,
                  cid: req.params.cnumber
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
                  joinCode: rando,
                  cid: req.params.cnumber
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
          if (results[0].length == 0) {
            console.log("No Admin/Owner Powers");
            res.redirect("/dashboard/company/" + req.params.cnumber + "/verify");
          } else {
            res.render('verifEmployees', {
              fName: req.cookies.userData.fName,
              banner: 'Workspace: Employee Verification',
              cid: req.params.cnumber,
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
  .post(function(req, res) {
    if (req.cookies.userData) {
      //FIX THIS: Check that user has the ability to access this site and in the company
      var cQuery =
        `
        select * from employeesInCompany WHERE (power = 1 or power = 2) AND companyID = ? AND userID = ?;
      `;
      connection.query(cQuery, [req.params.cnumber, req.cookies.userData.id], function(e, r, f) {
        if (e) {
          //FIX THIS: Better error message
          res.redirect("/dashboard/company/" + req.params.cnumber);
        } else {
          if (r.length == 0) {
            //FIX THIS: Better error message
            res.redirect("/dashboard/company/" + req.params.cnumber);
          } else {
            if (req.body.contract === 'delink') {
              var dQuery =
                `
            DELETE FROM joinLinks WHERE link = ?;
            DELETE FROM joinApproval WHERE link = ?;
            `;
              connection.query(dQuery, [req.body.code, req.body.code], function(error, results, fields) {
                if (error) {
                  console.log(error);
                }
              })
              res.redirect("/dashboard/company/" + req.params.cnumber + "/verify");
            } else if (req.body.contract === 'adduser') {
              var iQuery =
                `
              INSERT INTO employeesInCompany (userID,companyID,title,power) VALUES (?,?,null,0);
              DELETE FROM joinApproval WHERE companyID = ? AND userID = ?;
              `
              connection.query(iQuery, [req.cookies.userData.id, req.params.cnumber, req.params.cnumber, req.cookies.userData.id], function(error, results, fields) {
                if (error) {
                  console.log(error)
                }
              })
              res.redirect("/dashboard/company/" + cnumber + "/verify")
            } else if (req.body.contract === 'deluser') {
              var dQuery =
                `
              DELETE from joinApproval WHERE companyID = ? and userID = ?;
              `;
              connection.query(dQuery, [req.params.cnumber, req.body.code], function(error, results, fields) {
                if (error) {
                  console.log(error)
                }
                res.redirect("/dashboard/company/" + req.params.cnumber + "/verify")
              })
            }
          }
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
/// ANNOUNCEMENTS
app.get("/announcements", function(req, res) {
  if (req.cookies.userData) {
    var sQuery =
      `
    SELECT id,authorID,announcements.companyID,announcements.title,content,recency,firstName,lastName, employeesincompany.userID, power
    FROM announcements left join users on users.userID = announcements.authorID
    left join employeesInCompany ON announcements.companyID = employeesInCompany.companyID
    WHERE users.userID = ? ORDER BY id DESC
    `;
    connection.query(sQuery, [req.cookies.userData.id], function(error, results, fields) {
      if (error) {
        console.log(error);
        res.redirect("/dashboard");
      } else if (results.length == 0) { //No Announcements to show
        res.render('myAnnouncements', {
          announcements: null,
          banner: "Workspace: Your Announcements",
          fName: req.cookies.userData.fName
        });
      } else {
        res.render('myAnnouncements', {
          announcements: results,
          banner: "Workspace: Your Announcements",
          fName: req.cookies.userData.fName
        });
      }
    })
  } else {
    res.redirect("/login");
  }
}) //FIX THIS: BUGGY
app.route("/announcements/:cnumber")
  .get(function(req, res) {
    if (req.cookies.userData) {
      var power = 0;
      var sQuery =
        `
      SELECT * FROM employeesInCompany WHERE companyID = ? AND userID = ?;
      SELECT * FROM announcements left join users on users.userID = announcements.authorID WHERE companyID = ? ORDER BY id DESC;
      `;
      connection.query(sQuery, [req.params.cnumber, req.cookies.userData.id, req.params.cnumber], function(error, results, fields) {
        if (error) {
          res.render('companyAnnouncements', {
            fName: req.cookies.userData.fName,
            banner: 'Workspace: Announcements',
            errorMsg: error,
            announcements: null,
            power: 0,
            cid: req.params.cnumber
          })
        } else if (results[0].length == 0) {
          res.redirect("/dashboard");
        } else {
          res.render('companyAnnouncements', {
            fName: req.cookies.userData.fName,
            banner: 'Workspace: Announcements',
            announcements: results[1],
            errorMsg: null,
            power: results[0][0].power,
            cid: req.params.cnumber
          })
        }
      })
    } else {
      res.redirect("/login");
    }
  })
  .post(function(req, res) {
    if (req.cookies.userData) {
      if (req.body.contract !== 'addAnn' && req.body.contract !== 'delAnn') {
        console.log("Invalid Post Request");
        res.redirect("/announcements/" + req.params.cnumber);
      } else {
        var sQuery =
          `
        select * from employeesInCompany left join company on company.companyID = employeesInCompany.companyID
        WHERE(power = 1 or power = 2) AND userID = ? and company.companyID = ?;
        `;
        connection.query(sQuery, [req.cookies.userData.id, req.params.cnumber], function(errors, results, fields) {
          if (results.length == 0) {
            res.redirect("/announcements/" + req.params.cnumber);
          } else {
            if (req.body.contract === 'addAnn') {
              var iQuery =
                `
              INSERT INTO announcements (companyID,authorID,title,content,recency) VALUES (?,?,?,?,NOW());
              `;
              connection.query(iQuery, [req.params.cnumber, req.cookies.userData.id, req.body.title, req.body.content], function(errors, results, fields) {
                if (errors) {
                  console.log(errors);
                }
                res.redirect("/announcements/" + req.params.cnumber);
              })
            } else if (req.body.contract === 'delAnn') {
              var dQuery =
                `
                DELETE FROM announcements WHERE id = ?;
                `;
              connection.query(dQuery, [req.body.aid], function(error, result, field) {
                if (error) {
                  console.log(error);
                }
                res.redirect("/announcements/" + req.params.cnumber);
              })

            }
          }
        })
      }
    } else {
      res.redirect("/login");
    }
  })
app.route("/announcement/:aid")
  .get(function(req, res) {
    //get one very specific announcement
    if (req.cookies.userData) {
      var cQuery =
        `
    SELECT id,authorID,announcements.companyID,announcements.title,content,recency,firstName,lastName, employeesincompany.userID, power
    FROM announcements left join users on users.userID = announcements.authorID
    left join employeesInCompany ON announcements.companyID = employeesInCompany.companyID
    WHERE employeesincompany.userID = ? AND id = ?;
    `;
      connection.query(cQuery, [req.cookies.userData.id, req.params.aid], function(error, results, fields) {
        if (error) {
          console.log(error);
          res.render('specificAnnouncement', {
            banner: 'Workspace: Announcement ID ' + req.params.aid,
            fName: req.cookies.userData.fName,
            result: results,
            truth: null
          });
        } else {
          res.render('specificAnnouncement', {
            banner: 'Workspace: Announcement ID ' + req.params.aid,
            fName: req.cookies.userData.fName,
            result: results,
            truth: null
          });
        }
      })
    } else {
      res.redirect("/login");
    }
  })
  .post(function(req, res) {
    if (req.cookies.userData) {
      var sQuery =
        `
        SELECT id,authorID,announcements.companyID,announcements.title,content,recency,firstName,lastName, employeesincompany.userID, power
        FROM announcements left join users on users.userID = announcements.authorID
        left join employeesInCompany ON announcements.companyID = employeesInCompany.companyID
        WHERE employeesincompany.userID = ? AND id = ? AND (power = 1 or power = 2);
      `;
      connection.query(sQuery, [req.cookies.userData.id, req.params.aid], function(er, re, fi) {
        if (er || re.length == 0) {
          res.render('specificAnnouncement', {
            banner: 'Workspace: Announcement ID ' + req.params.aid,
            fName: req.cookies.userData.fName,
            result: null,
            truth: null
          })
        } else {
          var dQuery =
            `
          DELETE FROM announcements WHERE id = ?;
          `;
          connection.query(dQuery, [req.params.aid], function(error, results, fields) {
            if (error) {
              console.log(error);
              res.redirect("/announcement/" + req.params.aid);
            } else {
              res.render('specificAnnouncement', {
                banner: 'Workspace: Announcement ID ' + req.params.aid,
                fName: req.cookies.userData.fName,
                result: null,
                truth: true
              })
            }
          })
        }
      })
    } else {
      res.redirect("/login");
    }
  })
//. Manage Employees
app.route("/employees/:cnumber")
  .get(function(req, res) {
    if (req.cookies.userData) {
      var sQuery =
        `
      select * from employeesInCompany
      left join company on company.companyID = employeesInCompany.companyID
      WHERE employeesInCompany.companyID = ? AND userID = ?;
      select users.userID as userID, companyID, title, power, firstName, lastName, email from employeesInCompany
      left join users ON users.userID = employeesInCompany.userID WHERE companyID = ?;
      `
      connection.query(sQuery, [req.params.cnumber, req.cookies.userData.id, req.params.cnumber], function(error, result, field) {
        if (error) {
          console.log(error);
          res.render('employeeList', {
            banner: 'Workspace: Employees of ',
            fName: req.cookies.userData.fName,
            employees: null,
            power: null,
            companyName: null,
            cid: req.params.cnumber,
            errorMsg: error
          })
        } else if (result[0].length == 0) {
          res.render('employeeList', {
            banner: 'Workspace: Employees of ',
            fName: req.cookies.userData.fName,
            employees: null,
            power: null,
            companyName: null,
            cid: req.params.cnumber,
            errorMsg: 'You are either not a part of this company, or it does not exist.'
          })
        } else {
          res.render('employeeList', {
            banner: 'Workspace: Employees of ',
            fName: req.cookies.userData.fName,
            employees: result[1],
            power: result[0][0].power,
            companyName: result[0][0].cName,
            cid: req.params.cnumber,
            errorMsg: null
          })
        }
      })
    } else {
      res.redirect("/login");
    }
  })
  .post(function(req, res) {})
app.route("/employee/:userid")
  .get(function(req, res) {
    //employee should only be possible to those with a shared company
    if (req.cookies.userData) {
      if (req.cookies.userData.id == req.params.userid) {
        var meQuery =
          `
        SELECT * FROM users WHERE userID = ?;
        SELECT * from  employeesInCompany
        left join company
        On company.companyID = employeesInCompany.companyID
        WHERE userID = ?;
      `
        connection.query(meQuery, [req.cookies.userData.id, req.cookies.userData.id], function(error, results, fields) {
          if (error) {
            res.render('employee', {
              banner: 'Workspace: Employee',
              fName: req.cookies.userData.fName,
              errorMsg: error,
              data: null,
              profile: null,
              self: null
            })
          } else {
            res.render('employee', {
              banner: 'Workspace: Employee',
              fName: req.cookies.userData.fName,
              errorMsg: null,
              data: results[1],
              profile: results[0],
              self: true
            })
          }
        })
      } else {
        var sQuery =
          `
      SELECT eic.companyID as companyID,cName as cName, employeesInCompany.userID as myID, employeesInCompany.power as myPower ,
      firstName,lastName,email,eic.power as ePower, eic.title as eTitle, eic.userID as eID  FROM employeesInCompany
      LEFT JOIN employeesInCompany as eic
      ON eic.companyID = employeesInCompany.companyID
      LEFT JOIN company ON company.companyID = employeesInCompany.companyID
      left join users ON eic.userID = users.userID
      WHERE employeesInCompany.userID = ? AND eic.userID = ?;
      `;
        connection.query(sQuery, [req.cookies.userData.id, req.params.userid], function(error, results, fields) {
          if (error) {
            res.render('employee', {
              banner: 'Workspace: Employee',
              fName: req.cookies.userData.fName,
              errorMsg: error,
              data: null,
              profile: null,
              self: null
            })
          } else if (results.length == 0) {
            res.render('employee', {
              banner: 'Workspace: Employee',
              fName: req.cookies.userData.fName,
              errorMsg: "You either are not in a company with this user, or they do not exist.",
              self: null
            })
          } else {
            res.render('employee', {
              banner: 'Workspace: Employee',
              fName: req.cookies.userData.fName,
              errorMsg: null,
              self: null,
              data: results
            })
          }
        })
      }

    } else {
      res.redirect("/login")
    }
  })
  .post(function(req, res) {
    if (req.cookies.userData) {
      if (req.body.contract === "leaveCompany") {
        // check the power level
        var sQuery =
        `
        SELECT * FROM employeesInCompany
        WHERE companyID = ? AND userID = ? AND power < 2;
        `;
        connection.query(sQuery,[req.body.cid,req.cookies.userData.id],function(errr,reslts,filds){
          if (errr){
            console.log(errr);
            res.redirect("back");
          } else if (reslts.length == 0){
            console.log("Not A Member/Too Powerful");
            res.redirect("back");
          }else{
            //Deletion Permitted
            var dQuery =
            `
            DELETE FROM employeesInCompany
            WHERE companyID = ? AND userID = ?;
            `;
            connection.query(dQuery,[req.body.cid,req.cookies.userData.id],function(error,results,fields){
              if (error){
                console.log(error);
              }
              res.redirect("back");
            })
          }
        })
      } else {
        var sQuery =
          `
      SELECT * FROM employeesInCompany WHERE power > 0 AND userID = ? AND companyID = ?;
      `;
        connection.query(sQuery, [req.cookies.userData.id, req.body.cid], function(errr, reslts, filds) {
          if (errr) {
            console.log(error);
            res.redirect("back");
          } else if (reslts.length == 0) {
            console.log("Not Authorized.");
            res.redirect("back");
          } else {
            if (req.body.contract === "changeMyTitle") {
              var uQuery =
                `
            UPDATE employeesInCompany
            SET title = ?
            WHERE companyID = ? AND userID = ?;
            `;
              connection.query(uQuery, [req.body.title, req.body.cid, req.params.userid], function(error, results, fields) {
                if (error) {
                  console.log(error);
                }
                res.redirect("back");
              })
            } else if (req.body.contract === "changeHierarchy") {
              //power == 2 and cammt be self
              if (reslts[0].power != 2 || req.cookies.userData.id == req.params.userid) {
                console.log("Invalid Option");
                res.redirect("back");
              } else {
                var setPower = (req.body.ePower == 1 ? 0 : 1);
                var uQuery =
                  `
              Update employeesInCompany
              set power = ?
              WHERE companyID = ? AND userID = ?
              `
                connection.query(uQuery, [setPower, req.body.cid, req.params.userid], function(error, results, fields) {
                  if (error) {
                    console.log(error);
                  }
                  res.redirect("back");
                })
              }
            } else if (req.body.contract === "removeEmployee") {
              // Need to do a query to make sure that the other person is lower in status
              var sQuery1 =
                `
            SELECT * FROM employeesInCompany
            left join employeesInCOmpany as eic
            ON employeesInCompany.companyID = eic.companyID
            WHERE employeesInCompany.power > eic.power
            AND employeesInCompany.userID = ? AND eic.userID = ? AND eic.companyID = ?
            `
              connection.query(sQuery1, [req.cookies.userData.id, req.params.userid, req.body.cid], function(er, re, fd) {
                if (er) {
                  console.log(er);
                  res.redirect("back");
                } else if (re.length == 0) {
                  console.log("Non-Valid Permissions");
                  res.redirect("back");
                } else {
                  var dQuery =
                    `
                DELETE FROM employeesInCompany
                WHERE companyID = ? AND userID = ?;
                `;
                  connection.query(dQuery, [req.body.cid, req.params.userid], function(error, results, fields) {
                    if (error) {
                      console.log(error);
                      res.redirect("back");
                    } else {
                      res.redirect("/employees/" + req.body.cid);
                    }
                  })
                }
              })
            } else if (req.body.contract === "conferOwnership"){
              var nQuery =
              `
              Update employeesInCompany
              SET power = 1
              WHERE userID = ? AND companyID = ?;
              UPDATE employeesInCompany
              SET power = 2
              WHERE userID = ? AND companyID = ?;
              `;
              connection.query(nQuery,[req.cookies.userData.id,req.body.cid,req.params.userid,req.body.cid],function(error,results,fields){
                if (error){
                  console.log(error);
                }
                res.redirect("back");
              })
            }else {
              console.log("Non-Valid Contract");
              res.redirect("back");
            }
          }
        })
      }



    } else {
      res.redirect("/login")
    }
  })
app.get("/employee", function(req, res) {
  if (req.cookies.userData) {
    res.redirect("/employee/" + req.cookies.userData.id);
  } else {
    res.redirect("/login");
  }
}) //redirect to self
app.get("/employees", function(req, res) {
  if (req.cookies.userData) {
    res.redirect("/employee/" + req.cookies.userData.id);
  } else {
    res.redirect("/login");
  }
}) //same as above

app.route("/settings/:cid")
  .get(function(req,res){})
  .post(function(req,res){})

// Calendar
app.route("/addevent")
  .get(function(req,res){
    if (req.cookies.userData){
      var sQuery =
      //check power for companywide Event
      //check affiliated companies
      `
      SELECT userID,company.companyID as companyID, cName FROM employeesInCompany
      LEFT JOIN company ON company.companyID = employeesInCompany.companyID
      WHERE userID = ?;
      SELECT companyID FROM employeesInCompany WHERE userID = ?  AND power > 0;
      `
      connection.query(sQuery,[req.cookies.userData.id,req.cookies.userData.id],function(error,results,fields){
        if (error){
          console.log(error);
          res.redirect("/dashboard");
        }
        else{
          res.render("addevent",{
            banner: 'Workspace: Adding an Event',
            fName: req.cookies.userData.fName,
            pComps: results[1],
            comps: results[0]
          })
        }
      })
    }else{
      res.redirect("/login");
    }
  })
  .post(function(req,res){
    if (req.cookies.userData){
      // check power level, then insert if power level is valid
      //read variables
      //check end date > start date
      //change content to textarea
      if (req.body.end < req.body.start){
        console.log("Invalid Date Combination");
        res.redirect("back");
      }else if (req.body.uses === "personal"){
        var iQuery =
        `
        INSERT INTO events (authorID,title,content,startDate,endDate,recency,forma) VALUES (?,?,?,?,?,NOW(),"PERSONAL");
        `;
        connection.query(iQuery,[req.cookies.userData.id,req.body.title,req.body.content,req.body.start,req.body.end],function(error,results,fields){
          if (error){
            console.log(error);
          }
          res.redirect("back");
        })
      }else{
        //check employee is in company
        if (req.body.range){
          if (req.body.range == 1 || req.body.range === '1'){
            //Personal
            var iQuery =
            `
            INSERT INTO events (authorID,companyID,title,content,startDate,endDate,recency,forma) VALUES (?,?,?,?,?,?,NOW(),"SELF");
            `;
            connection.query(iQuery,[req.cookies.userData.id,req.body.uses,req.body.title,
                                     req.body.content,req.body.start,req.body.end],function(error,results,fields){
              if (error){
                console.log(error);
              }
              if (error){
                console.log(error);
              }
              res.redirect("back");
            })
          } else if (req.body.range == 2 || req.body.range === '2'){
            //WHole Company
            var iQuery =
            `
            INSERT INTO events (authorID,companyID,title,content,startDate,endDate,recency,forma) VALUES (?,?,?,?,?,?,NOW(),"ADMINS");
            `;
            connection.query(iQuery,[req.cookies.userData.id,req.body.uses,req.body.title,
                                     req.body.content,req.body.start,req.body.end],function(error,results,fields){
              if (error){
                console.log(error);
              }
              res.redirect("back");
            })
          }else{
            //Admins and Owners
            var iQuery =
            `
            INSERT INTO events (authorID,companyID,title,content,startDate,endDate,recency,forma) VALUES (?,?,?,?,?,?,NOW(),"COMPANY");
            `;
            connection.query(iQuery,[req.cookies.userData.id,req.body.uses,req.body.title,
                                     req.body.content,req.body.start,req.body.end],function(error,results,fields){
              if (error){
                console.log(error);
              }
              res.redirect("back");
            })
          }
        }else{ //no range
          var iQuery =
          `
          INSERT INTO events (authorID,title,content,startDate,endDate,recency,forma,companyID) VALUES (?,?,?,?,?,NOW(),"PERSONAL",?);
          `;
          connection.query(iQuery,[req.cookies.userData.id,req.body.title,req.body.content,req.body.start,req.body.end,req.body.uses],function(error,results,fields){
            if (error){
              console.log(error);
            }
            res.redirect("back");
          })
        }
      }
    }else{
      res.redirect("/login");
    }
  })

app.route("/todo")
  .get(function(req, res) {
    if (req.cookies.userData){
      if (req.query.year && !req.query.month && !req.query.day){
        var sQuery =
        `
        SELECT id,listings.authorID as authorID, firstName, lastName, listings.companyID,cName, title, content, startDate, endDate, forma, userID, power FROM
        (
        select id, authorID, events.companyID as companyID, events.title, content, startDate, endDate, forma, userID, power
        from events
        left join employeesincompany
        on employeesincompany.companyID = events.companyID
        where (forma = 'PERSONAL' AND authorID = ?)
        OR (forma = "SELF" AND authorID = ? and employeesincompany.userID = ?)
        OR (forma = "ADMINS" AND employeesincompany.userID = ? AND power > 0)
        OR (forma = "COMPANY" AND employeesincompany.userID = ?)
        )
        listings
        left join (select userID as authorID, firstName,lastName from users) users
        on listings.authorID = users.authorID
        left join company
        ON company.companyID = listings.companyID
        WHERE (YEAR(startDate) <= ? AND YEAR(endDate) >= ?)
        ORDER BY startDate DESC
        `;
        connection.query(sQuery,[req.cookies.userData.id,req.cookies.userData.id,req.cookies.userData.id,req.cookies.userData.id,req.cookies.userData.id,
        req.query.year,req.query.year],function(error,results,fields){
          if (error){
            console.log(error);
                          res.redirect("/dashboard");
          }else{
            res.render("readEvents",{
              banner: "Workspace: Events",
              fName: req.cookies.userData.fName,
              data: results,
              cond: "Y",
              condtext: req.query.year
            })
          }
        })
    }
      else if (!req.query.year && req.query.month && !req.query.day){
        var cYear = new Date().getFullYear();
        if (req.query.month < 1 || req.query.month > 12){
          res.redirect("/dashboard");
        }
        else {
          var sQuery =
          `
          SELECT id,listings.authorID as authorID, firstName, lastName, listings.companyID,cName, title, content, startDate, endDate, forma, userID, power FROM
          (
          select id, authorID, events.companyID as companyID, events.title, content, startDate, endDate, forma, userID, power
          from events
          left join employeesincompany
          on employeesincompany.companyID = events.companyID
          where (forma = 'PERSONAL' AND authorID = ?)
          OR (forma = "SELF" AND authorID = ? and employeesincompany.userID = ?)
          OR (forma = "ADMINS" AND employeesincompany.userID = ? AND power > 0)
          OR (forma = "COMPANY" AND employeesincompany.userID = ?)
          )
          listings
          left join (select userID as authorID, firstName,lastName from users) users
          on listings.authorID = users.authorID
          left join company
          ON company.companyID = listings.companyID
          WHERE
          (
          (YEAR(startDate) < ? OR (YEAR(startDate) = ? AND MONTH(startDate) <= ?) )
          AND
          (YEAR(endDate) > ? OR    (YEAR(endDate) = ?   AND Month(endDate)  >= ?)    )
          )
          ORDER BY startDate DESC
          `;
          var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        connection.query(sQuery,[req.cookies.userData.id,req.cookies.userData.id,req.cookies.userData.id,req.cookies.userData.id,req.cookies.userData.id,
        cYear,cYear,req.query.month,cYear,cYear,req.query.month],
          function(error,results,fields){
            if (error){
              console.log(error);
              res.redirect("/dashboard");
            }else{
              res.render("readEvents",{
                banner: "Workspace: Events",
                fName: req.cookies.userData.fName,
                data: results,
                cond: "M",
                condtext: cYear,
                condMonth: months[req.query.month-1]
              })
            }

        })
      }
        //compare days
      }
      else if (req.query.year && req.query.month && !req.query.day){
        var cYear = req.query.year;
        //FIX THIS CHECK MONTH LEGAL
        if (req.query.month < 1 || req.query.month > 12){
          res.redirect("/dashboard");
        }
        else {
          var sQuery =
          `
          SELECT id,listings.authorID as authorID, firstName, lastName, listings.companyID,cName, title, content, startDate, endDate, forma, userID, power FROM
          (
          select id, authorID, events.companyID as companyID, events.title, content, startDate, endDate, forma, userID, power
          from events
          left join employeesincompany
          on employeesincompany.companyID = events.companyID
          where (forma = 'PERSONAL' AND authorID = ?)
          OR (forma = "SELF" AND authorID = ? and employeesincompany.userID = ?)
          OR (forma = "ADMINS" AND employeesincompany.userID = ? AND power > 0)
          OR (forma = "COMPANY" AND employeesincompany.userID = ?)
          )
          listings
          left join (select userID as authorID, firstName,lastName from users) users
          on listings.authorID = users.authorID
          left join company
          ON company.companyID = listings.companyID
          WHERE
          (
          (YEAR(startDate) < ? OR (YEAR(startDate) = ? AND MONTH(startDate) < ?) )
          AND
          (YEAR(endDate) > ? OR    (YEAR(endDate) = ?   AND Month(endDate)  > ?)    )
          )
          OR (YEAR(endDate) = ? AND MONTH(endDate) = ?)
          OR (YEAR(startDate ) = ? AND MONTH(startDate) = ? )
          ORDER BY startDate DESC
          `;
          var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        connection.query(sQuery,[req.cookies.userData.id,req.cookies.userData.id,req.cookies.userData.id,req.cookies.userData.id,req.cookies.userData.id,
        cYear,cYear,req.query.month,cYear,cYear,req.query.month,cYear,req.query.month,cYear,req.query.month],
          function(error,results,fields){
            if (error){
              console.log(error);
              res.redirect("/dashboard");
            }else{
              res.render("readEvents",{
                banner: "Workspace: Events",
                fName: req.cookies.userData.fName,
                data: results,
                cond: "M",
                condtext: cYear,
                condMonth: months[req.query.month-1]
              })
            }

        })
      }
      }
      else if (req.query.year && req.query.month && req.query.day){
        //Specific
        var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        // check month and day is valid include leap years
        if (!checkValidDay(req.query.day,req.query.month,req.query.year)){
          res.redirect("/dashboard");
        }
        else{
        var sQuery =
        `
        SELECT id,listings.authorID as authorID, firstName, lastName, listings.companyID,cName, title, content, startDate, endDate, forma, userID, power FROM
        (
        select id, authorID, events.companyID as companyID, events.title, content, startDate, endDate, forma, userID, power
        from events
        left join employeesincompany
        on employeesincompany.companyID = events.companyID
        where (forma = 'PERSONAL' AND authorID = ?)
        OR (forma = "SELF" AND authorID = ? and employeesincompany.userID = ?)
        OR (forma = "ADMINS" AND employeesincompany.userID = ? AND power > 0)
        OR (forma = "COMPANY" AND employeesincompany.userID = ?)
        )
        listings
        left join (select userID as authorID, firstName,lastName from users) users
        on listings.authorID = users.authorID
        left join company
        ON company.companyID = listings.companyID
        WHERE
        (
        (YEAR(startDate) < ? OR (YEAR(startDate) = ? AND MONTH(startDate) < ?)  OR  (YEAR(startDate) = ? AND MONTH(startDate) = ? AND DAY(startDate) <=  ?            )        )
        AND
        (YEAR(endDate) > ? OR    (YEAR(endDate) = ?   AND Month(endDate)  > ?)  OR   (YEAR(endDate) = ? AND MONTH(endDate) = ? AND DAY(endDate) >=  ?           )       )
        )
        ORDER BY startDate DESC
        `
        connection.query(sQuery,[req.cookies.userData.id,req.cookies.userData.id,req.cookies.userData.id,req.cookies.userData.id,req.cookies.userData.id,
        req.query.year,req.query.year,req.query.month,req.query.year,req.query.month,req.query.day,
        req.query.year,req.query.year,req.query.month,req.query.year,req.query.month,req.query.day],
        function(error,results,fields){
          if (error){
            console.log(error);
            res.redirect("/dashboard");
          }else{
            res.render("readEvents",{
              banner: "Workspace: Events",
              fName: req.cookies.userData.fName,
              data: results,
              cond: "D",
              condtext: req.query.year,
              condMonth: months[req.query.month-1],
              condDay: req.query.day
            })
          }
        })
        }
      }
      else if (!req.query.year && !req.query.month && req.query.day){
        ///Assume this month and year
        var cYear = new Date().getFullYear();
        var cMonth = new Date().getMonth()+1;
        res.redirect("/todo?day=" + req.query.day + "&month=" + cMonth + "&year=" + cYear);
      }
      else if (!req.query.year && req.query.month && req.query.day){
        //Assume this year
        var cYear = new Date().getFullYear();
        res.redirect("/todo?day=" + req.query.day + "&month=" + req.query.month + "&year=" + cYear);
      }
      else if (!req.query.year && !req.query.month && !req.query.day){
        //Assume Today
        var cYear = new Date().getFullYear();
        var cMonth = new Date().getMonth()+1;
        var cDay = new Date().getDate();
        res.redirect("/todo?day=" + cDay + "&month=" + cMonth + "&year=" + cYear);
      }
      else{
        // invalid combination: year and day
        res.redirect("/dashboard"); //change to today
      }
    }else{
      res.redirect("/login");
    }
  })

// For All Companies
app.get("/calendar", function(req, res) {
  res.render("calendar");
})
//For the company with the cid
app.get("/calendar/:cid",function(req,res){

})

app.get("/messages", function(req, res) {})

app.get("/messages/:userid", function(req, res) {})

app.listen(3000, function() {
  console.log("Server Started.")
});
