const aws = require('aws-sdk');
const fs = require('fs');


const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

let s3 = aws.s3({...credentials, apiVersion: '2006-03-01'});
let inputFolder = 'daily/';
const filename = `prd-mongo-backed-db-dump.gz`;
const filePath = process.env.PATH_LOCAL


const params = {
    bucket: process.env.BUCKET_BKP_MONGO,
    key: inputFolder + filename   
}

const s3Stream = s3.getObject(params,(error,data)=>{

    if(error){
        console.log(error);
    }else{
        const file = path.join(filePath,filename);
        fs.writeFileSync(file,data.Body);
        console.log('Objeto descargado y guardado en:',file);
    }
});


//Path donde se guardará localmente el archivo del dump
