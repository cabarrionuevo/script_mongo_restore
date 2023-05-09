const {S3Client, GetObjectCommand} = require('@aws-sdk/client-s3');
const fs = require('fs');
const config = require('../config/config');
const path = require('path');
const { spawn } = require('child_process');


function restore(cmd,args) {
            // Ejecutar el comando
            const restore = spawn(cmd,args);
        
            restore.stdout.on('data', (data) => {
              console.log(data.toString());
            });
            
            restore.stderr.on('data', (data) => {
              console.error(data.toString());
            });
            
            restore.on('exit', (code) => {
              console.log(`Child exited with code ${code}`);
            }); 
}

module.exports = {
    new: async function (req,res){
        res.render('config');
    },
    download: async function (req,res) {
        try {
            //credenciales las pide por formulario
            const credentials = {
                accessKeyId: config.AWS_ACCESS_KEY,
                secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
            };

            //se recibe por formulario            
            const filePath =    config.PATH_LOCAL;

            //variables bucket se defiene en archivo env depende del checkbox elegido
            let inputFolder =   config.FOLDER_IN_BUCKET
            const filename =    config.FILE_IN_BUCKET;
            //se tiene que crear 2 variables mas para la otra base a descargar

            const params = {
                Bucket: config.BUCKET_BKP_MONGO,
                Key: inputFolder + filename,
            };
            
            let client = new S3Client({
                region: config.AWS_REGION,
                credentials
            })

            let data = await client.send(new GetObjectCommand(params));
            let inputStream = data.Body;
            const downloadPath = path.join(filePath, filename); 
            const outStream = fs.createWriteStream(downloadPath);
            inputStream.pipe(outStream);

            outStream.on('finish',()=>{
                console.log('Objeto descargado y guardado en:', downloadPath);
                res.send(`Objeto descargado y guardado en: ${downloadPath}`);
            });                           

        } catch (error) {
            console.log(error);
            res.send('Proceso finalizado con errores');
        }
    },
    restore: async function(req,res){

        let result = {
            path:config.PATH_LOCAL+config.FILE_IN_BUCKET,
            filename:config.FOLDER_IN_BUCKET
        }

        let cmd,args ='';

        if (filename.incluide('mongo')) {
         // Comando para hacer un dump de la base de datos
         cmd = 'mongorestore' ;
         args = ['--gzip' ,'--drop','-d','mongo-backend',`--archive=${result.path}` ,'--excludeCollection', 'filebeatlogs'];           
        }else{
         cmd = 'psql';
         args=['-U', 'postgres', '-d', 'backend', '-1', '-f',`${result.path}`]; 
        }
        restore(cmd,args);
    }
}