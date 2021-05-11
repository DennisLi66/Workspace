use workspaceDB;

-- Basic Details
select * from users;
select * from company;
select * from employeesInCompany;
select * from joinLinks;

-- Company Creation Query
-- INSERT INTO company (cName)
-- VALUES("Bob's Fried Rice");
--       SELECT last_insert_id() as jamble;
-- INSERT INTO employeesInCompany(userID,companyID,power) VALUES (1,last_insert_id(),True)
;
-- Check that a company exists and that the employee is a member of that company
select * from employeesInCompany left join company on company.companyID = employeesInCompany.companyID;
-- Check that a company exists and that the employee is a member of that company and has power of 1 or 2
select * from employeesInCompany left join company on company.companyID = employeesInCompany.companyID WHERE(power = 1 or power = 2);
-- Check that a company has a valid link and that the user isn't already in the company
-- select 'eic' as Identity, companyID, userID, null as link, null as verify, null as oneoff, null as isactive from employeesInCompany WHERE userID = ? AND companyID = ?;
-- select 'code' as Identity, companyID, null as userID, link, verify, oneoff, isactive from joinlinks WHERE isactive = 1 AND link = ?

-- Confirm that an employee has power
-- select * from employeesInCompany WHERE (power = 1 or power = 2) AND companyID = ? AND userID = ?;

-- Show Join Links
-- select * from joinLinks where companyID = ?;

-- Show those needing verification
-- select * from joinApproval left join users on users.userID = joinApproval.userID
-- WHERE companyID = ?;

-- select * from users where userId >= 0
-- Search for announcements for a specific employee


-- SELECT id,authorID,announcements.companyID,announcements.title,content,recency,firstName,lastName, employeesincompany.userID, power
-- FROM announcements left join users on users.userID = announcements.authorID
-- left join employeesInCompany ON announcements.companyID = employeesInCompany.companyID
-- WHERE employeesincompany.userID = ? AND id = ?;

-- select * from employeesInCompany 
-- left join company on company.companyID = employeesInCompany.companyID;

-- select users.userID as userID, companyID, title, power, firstName, lastName, email from employeesInCompany
-- left join users ON users.userID = employeesInCompany.userID


-- SELECT * from  employeesInCompany
-- left join company
-- On company.companyID = employeesInCompany.companyID



-- SELECT eic.companyID as companyID,cName as cName, employeesInCompany.userID as myID, employeesInCompany.power as myPower ,
-- firstName,lastName,email,eic.power as ePower, eic.title as eTitle, eic.userID as eID  FROM employeesInCompany
-- LEFT JOIN employeesInCompany as eic
-- ON eic.companyID = employeesInCompany.companyID
-- LEFT JOIN company ON company.companyID = employeesInCompany.companyID
-- left join users ON eic.userID = users.userID

      SELECT * FROM employeesInCompany
      LEFT JOIN company 
      ON company.companyID = employeesInCompany.companyID;



-- Confirm that the person im trying to remove has less power than me
SELECT * FROM employeesInCompany 
left join employeesInCOmpany as eic
ON employeesInCompany.companyID = eic.companyID
WHERE employeesInCompany.power > eic.power