hullabaloo
==========

storing text based fuss with syntax highlighting

Install Procedure
-----------------

[Install mongodb](http://docs.mongodb.org/manual/installation/)

[Install nodejs](http://nodejs.org/)

Clone repository and install npm modules
```
git clone https://github.com/holymoly/hullabaloo
cd hullabaloo
npm install
```
Run hullabaloo
```
node sever.js
```

Set user as admin from mongo cli
--------------------------

Users can be locked or set as admin from profile page (Account Settings).
```
db.users.update({"local.email":"user@email.com"},{$set : {"local.admin":true}})
```

Unlock user from mongo cli
--------------------------

```
db.users.update({"local.email":"user@email.com"},{$set : {"local.locked":false}})
```
