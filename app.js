require('dotenv').config(); //INSTALL THIS ONE
const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//homepage
app.get("/",function(req,res){

})

app.get("/about",function(req,res){

})

app.route("/register")
  .get()
  .post()

app.route("/login")
  .get()
  .post()

app.get("/profile/:userid",function(req,res){})

app.get("/messages",function(req,res){})

app.get("/messages/:userid",function(req,res){})

app.get("/dashboard",function(req,res))

app.get("/calendar",function(req,res))

app.get("/todo/",function(req,res))

app.get("/todo/:year/:month/:day",function(req,res))

app.get("/todo/:year/:month",function(req,res))

app.get("/todo/:year",function(req,res))
