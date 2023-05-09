const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const dbRoutes = require('./routes/db_routes');

app.set('view engine','pug');

app.use(bodyParser.urlencoded({extended: true}));

app.use('/db',dbRoutes);

app.listen(3000);