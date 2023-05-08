const aws = require('aws-sdk');
const fs = require('fs');
const config = require('../config/config');
const path = require('path');
const { spawn } = require('child_process');

module.exports = {
    dropBackupMongo: async function (req,res) {
        try {
            const credentials = {
                accessKeyId: config.AWS_ACCESS_KEY,
                secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
            };

            let inputFolder =    config.FOLDER_IN_BUCKET
            const filename = config.FILE_IN_BUCKET;            
            const filePath = config.PATH_LOCAL;

            const params = {
                Bucket: config.BUCKET_BKP_MONGO,
                Key: inputFolder + filename,
            };            
            let s3 = new aws.S3({ ...credentials, apiVersion: '2006-03-01' });
            const s3Stream = await s3.getObject(params, (error, data) => {                                
                if (error) {
                    console.log(error);
                    res.send('Proceso finalizado con errores');                    
                } else {                    
                    const file = path.join(filePath, filename);                    
                    fs.writeFileSync(file, data.Body);                                        
                    console.log('Objeto descargado y guardado en:', file);
                    res.send('Proceso Finalizado correctamente');                    
                }
            });
        } catch (error) {
            console.log(error);
            res.send('Proceso finalizado con errores');
        }
    },
    shellRestore: async function(req,res){
        let result = {
            path:config.PATH_LOCAL+config.FILE_IN_BUCKET,
            filename:config.FOLDER_IN_BUCKET
        }
        
        // Comando para hacer un dump de la base de datos
        const cmd = 'mongorestore' ;
        const args = ['--gzip' ,`--archive=${result.path}` ,'--excludeCollection', 'filebeatlogs'];
        
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
}