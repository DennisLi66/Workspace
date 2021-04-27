use workspaceDB;

-- Basic Details
select * from users;
select * from company;
select * from employeesInCompany;
select * from joinLinks;

-- Company Creation Query
INSERT INTO company (cName)
VALUES("Bob's Fried Rice");
      SELECT last_insert_id() as jamble;
INSERT INTO employeesInCompany(userID,companyID,power) VALUES (1,last_insert_id(),True)
;
-- Check that a company exists and that the employee is a member of that company
select * from employeesInCompany left join company on company.companyID = employeesInCompany.companyID
