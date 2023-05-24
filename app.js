const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const dbRoutes = require('./routes/db_routes');

app.set('view engine','pug');

app.use(bodyParser.urlencoded({extended: true}));

app.use('/db',dbRoutes);

app.get('/',function(req,res){
    res.render('home')
})

app.listen(4000);