use workspaceDB;

select * from users;
select * from company;
select * from employeesInCompany;

INSERT INTO company (cName)
VALUES("Bob's Fried Rice");
      SELECT last_insert_id() as jamble;
INSERT INTO employeesInCompany(userID,companyID,power) VALUES (1,last_insert_id(),True)


-- SELECT LAST_INSERT_ID();