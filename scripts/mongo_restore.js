const aws = require('aws-sdk');


const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

const params = {
    bucket: process.env.BUCKET_BKP_MONGO   
}

//Path donde se guardará localmente el archivo del dump
const filePath = process.env.PATH_LOCAL

let s3 = aws.s3({...credentials, apiVersion: '2006-03-01'});
const nowDate = moment.utc();
const nowStringDate = nowDate.format('YYYYMMDD');
let inputFolder = 'campanas/93/';
const uploadBucket = process.env.UPLOADS_BUCKET;
// 
let idPrograma = 93;
// const filename = `${nowStringDate}_Serefieles.csv`;
const filename = `20230418_Serefieles.csv`;




// module.exports