const express = require('express');
const app = express();

<<<<<<< HEAD
const routeCronTester = require('./controllers/cronTester/cronTester');

app.use('/cronTester',routeCronTester);
app.listen(3000);
=======
const routeCronTester= require('./controllers/cronTester/cronTester');

app.use('/cronTester',routeCronTester);

app.listen(3000);
>>>>>>> 3562ce4a548cf414bfa2211200968fcf245cc71a
