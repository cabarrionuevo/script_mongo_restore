const express = require('express');
const app = express();

const dbRoutes = require('./routes/db_routes');

app.set('view engine','pug');

app.use('/db',dbRoutes);

app.listen(3000);