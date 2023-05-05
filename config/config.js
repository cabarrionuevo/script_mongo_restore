const dotenv =require('dotenv');
const path = require('path');


//configuro la ruta donde estan los archivos con las variables de entorno
dotenv.config({
    path: path.resolve(__dirname, process.env.NODE_ENV + '.env')
});

//exporto las variables para poder utilizar
module.exports = {
    AWS_ACCESS_KEY : process.env.AWS_ACCESS_KEY,
    AWS_SECRET_ACCESS_KEY:  process.env.AWS_SECRET_ACCESS_KEY,
    BUCKET_BKP_MONGO: process.env.BUCKET_BKP_MONGO,
    PATH_LOCAL: process.env.PATH_LOCAL
}