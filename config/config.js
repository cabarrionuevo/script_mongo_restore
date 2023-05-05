const dotenv = require('dotenv');

dotenv.config({
    path: path.resolve(__dirname, proces.env.NODE_ENV + '.env')
});

module.export = {
    AWS_ACCESS_KEY : process.env.AWS_ACCESS_KEY,
    AWS_SECRET_ACCESS_KEY : process.env.AWS_SECRET_ACCESS_KEY,
    BUCKET_BKP_MONGO : process.BUCKET_BKP_MONGO,
    PATH_LOCAL : process.PATH_LOCAL
}