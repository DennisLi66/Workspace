drop database if exists workspaceDB; 
create database workspaceDB;
use workspaceDB;

create table users(
	userID int NOT NULL auto_increment primary key,
    firstName varchar(255) NOT NULL,
    lastName varchar(255) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    pswrd varchar(255) NOT NULL
);

create table company(
	companyID int NOT NULL auto_increment primary key,
    cName varchar(255) NOT NULL,
    category varchar(255)
);

create table employeesInCompany(
	userID int NOT NULL,
    companyID int NOT NULL,
    title varchar(255),
	power boolean NOT NULL, -- Employee or Admin
	CONSTRAINT LL PRIMARY KEY (userID,companyID)
)