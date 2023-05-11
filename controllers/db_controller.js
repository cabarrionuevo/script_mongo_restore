const {S3Client, GetObjectCommand} = require('@aws-sdk/client-s3');
const fs = require('fs');
const config = require('../config/config');
const path = require('path');
const { spawn } = require('child_process');


async function runInShell(cmd,args) {
            // Ejecutar el comando
            let restore = spawn(cmd,args);
            let status;
        
            restore.stdout.on('data', (data) => {
              console.log(data.toString());
            });
            
            restore.stderr.on('data', (data) => {
              console.error(data.toString());
              status=false;
            });
            
            restore.on('exit', (code) => {
              console.log(`Child exited with code ${code}`);
              status=true;
            }); 

            return status;
}

module.exports = {
    download: async function (req,res) {
        if (req.method == "GET") {
            return res.render('download');
        }

        try {            
            let dbSelection = req.body.backup_selection;        
            let inputFolder="", filename="";
            
            //credenciales las pide por formulario
            let credentials = {
                accessKeyId: req.body.access_key,
                secretAccessKey: req.body.secret_key
            };

            //se recibe por formulario            
            let filePath = req.body.path_local;

            //variables bucket se defiene en archivo env depende del checkbox elegido
            dbSelection == 'mongo'? inputFolder = config.FOLDER_IN_BUCKET_MONGO : inputFolder =   config.FOLDER_IN_BUCKET_POSTGRES
            dbSelection == 'mongo'? filename    = config.FILE_IN_BUCKET_MONGO   : filename    =   config.FILE_IN_BUCKET_POSTGRES

            let params = {
                Bucket: config.BUCKET_BKP,
                Key: inputFolder + filename,
            };
            
            let client = new S3Client({
                region: config.AWS_REGION,
                credentials
            })

            let data = await client.send(new GetObjectCommand(params));
            let inputStream = data.Body;
            let downloadPath = path.join(filePath, filename); 
            let outStream = fs.createWriteStream(downloadPath);
            inputStream.pipe(outStream);

            outStream.on('finish',()=>{
                console.log('Objeto descargado y guardado en:', downloadPath);
                context={
                    downloadPath,
                    filename,
                    dbSelection
                }
                return res.render('restore', {context});
            });                         

        } catch (error) {
            console.log(error);
            res.send('Process finished with errors');
        }
    },
    restore: async function(req,res){
        try{
            let cmd,args ='';
            if (req.body.dbSelection == 'mongo') {
             // Comando para hacer un dump de la base de datos
             cmd = 'mongorestore' ;
             args = ['--gzip' ,'--drop','-d','mongo-backend',`--archive=${req.body.downloadPath}` ,'--excludeCollection', 'filebeatlogs'];           
            }else{
             cmd = 'ps_restore';
             args=['-U', 'postgres', '-d', 'backend', '-1', '-f',`${req.body.downloadPath}`]; 
            }
            let result = await runInShell(cmd,args);
            result? res.send('Restore successful'): res.send('Upps it was a problem');
        }catch (error){
            console.log(error);
            res.send('Uppps something was wrong');
        }
    }
}