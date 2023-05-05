const aws = require('aws-sdk');
const fs = require('fs');
const config = require('../config/config');
const path = require('path');
const { exec } = require('child_process');

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
            path:'/home/charly2790/Documentos/prd-mongo-backend-db-dump.gz',
            filename:'prd-mongo-backend-db-dump.gz'
        }
        
        // Comando para hacer un dump de la base de datos
        // const cmd = 'mongodump --db mydatabase';
        // const cmd = `mongorestore --gzip --archive=prd-mongo-backend-db-dump.gz --excludeCollection filebeatlogs`;
        const cmd = `mongorestore --gzip --archive=${result.path} --excludeCollection filebeatlogs`;
        
        // Ejecutar el comando
        await exec(cmd, (err, stdout, stderr) => {
          if (err) {
            console.error(`Error ejecutando el comando: ${err}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
        });
    }
}