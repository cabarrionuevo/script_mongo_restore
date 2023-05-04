const express = require('express');
const app = express();

const routeCronTester= require('./controllers/cronTester/cronTester');

app.use('/cronTester',routeCronTester);

app.listen(3000);
