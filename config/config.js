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
    AWS_REGION: process.env.AWS_REGION,
    BUCKET_BKP: process.env.BUCKET_BKP,
    PATH_LOCAL: process.env.PATH_LOCAL,
    FILE_IN_BUCKET_MONGO: process.env.FILE_IN_BUCKET_MONGO,
    FILE_IN_BUCKET_POSTGRES: process.env.FILE_IN_BUCKET_POSTGRES,
    FOLDER_IN_BUCKET_MONGO: process.env.FOLDER_IN_BUCKET_MONGO,
    FOLDER_IN_BUCKET_POSTGRES: process.env.FOLDER_IN_BUCKET_POSTGRES,
    PG_HOST: process.env.PG_HOST,
    PG_DBNAME: process.env.PG_DBNAME,
    PG_PORT: process.env.PG_PORT,
    PREFIX_LOCALHOST_URL: process.env.PREFIX_LOCALHOST_URL,
    MONGO_URL:process.env.MONGO_URL
}