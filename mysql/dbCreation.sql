drop database if exists workspaceDB; 
create database workspaceDB;
use workspaceDB;

create table users(
	userID int NOT NULL auto_increment primary key,
    firstName varchar(255) NOT NULL,
    lastName varchar(255) NOT NULL,
    title varchar(255) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    pswrd varchar(255) NOT NULL,
    power boolean NOT NULL -- Employee or Admin
);

create table company(
	companyID int NOT NULL auto_increment primary key,
    cName varchar(255) NOT NULL,
    category varchar(255)
);

create table employeesInCompany(
	userID int NOT NULL,
    companyID int NOT NULL,
	CONSTRAINT LL PRIMARY KEY (userID,companyID)
)