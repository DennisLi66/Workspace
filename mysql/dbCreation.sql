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
	power int NOT NULL, -- Employee or Admin -- 0 Employee 1 Admin 2 Owner
	CONSTRAINT LL PRIMARY KEY (userID,companyID)
);

create table joinLinks (
	companyID int NOT NULL,
    link varchar(255) NOT NULL,
    verify boolean -- 0 automatically join 1 verify joining
)