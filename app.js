const express = require('express');
const app = express();

const dbRoutes = require('./routes/db_routes');

app.use('/db',dbRoutes);

app.listen(4000);