const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const config = require('../config/config');
const path = require('path');
const { spawn } = require('child_process');
const {Pool} = require('pg');
const { ifError } = require('assert');

const pgStrCon={
                'host':config.PG_HOST,
                'database':config.PG_DBNAME,
                'port':config.PG_PORT,
                'user':'postgres',
                'password':'postgres'
            };

const prefix = 'dev-';
const hostsDoc="hosts.txt";

let pathWorkSpace="/home/gleegstra/Escritorio/Trabajo/";

const pgClient={
    query: async(pgStrCon,strQuery)=>{
        let pgPool = new Pool(pgStrCon);
        let client = await pgPool.connect();
        let result= await client.query(strQuery);
        client.release();
        await pgPool.end();
        return result;
    }
}



function runInShell(cmd, args, env = null) {
    return new Promise((resolve, reject) => {
        let e, restore;
        e='close';
        cmd === 'pg_restore' ? e = 'close' : e = 'exit';
        !env ? restore = spawn(cmd, args) : restore = spawn(cmd, args, { env });
        restore.on('error', (err) => {
            console.error(`Error al ejecutar proceso ${cmd}`);
        });

        restore.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        restore.stderr.on('data', (data) => {
            console.log(data.toString());
        });

        restore.on(`${e}`, (code) => {
            console.log(`proceso ${cmd} termino con codigo: ${code}`);
            if (code === 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

module.exports = {
    download: async function (req, res) {
        if (req.method == "GET") {
            return res.render('download');
        }

        try {
            let dbSelection = req.body.backup_selection;
            let inputFolder = "", filename = "";

            //credenciales las pide por formulario
            let credentials = {
                accessKeyId: req.body.access_key,
                secretAccessKey: req.body.secret_key
            };

            //se recibe por formulario            
            let filePath = req.body.path_local;

            pathWorkSpace=filePath;

            //variables bucket se defiene en archivo env depende del checkbox elegido
            dbSelection == 'mongo' ? inputFolder = config.FOLDER_IN_BUCKET_MONGO : inputFolder = config.FOLDER_IN_BUCKET_POSTGRES
            dbSelection == 'mongo' ? filename = config.FILE_IN_BUCKET_MONGO : filename = config.FILE_IN_BUCKET_POSTGRES

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

            outStream.on('finish', () => {
                console.log('Objeto descargado y guardado en:', downloadPath);
                context = {
                    downloadPath,
                    filename,
                    dbSelection
                }
                return res.render('restore', { context });
            });

        } catch (error) {
            console.log(error);
            res.send('Process finished with errors');
        }
    },
    restore: async function (req, res) {
        try {
            let cmd, args = '';
            let result;
            if (req.body.dbSelection == 'mongo') {

                cmd = 'mongorestore';
                args = ['--gzip', '--drop', '-d', 'mongo-backend', `--archive=${req.body.downloadPath}`, '--excludeCollection', 'filebeatlogs'];

                result = await runInShell(cmd, args);

            } else {

                let pathUnzip = req.body.downloadPath;
                let ultimoSlash = pathUnzip.lastIndexOf("/");

                pathUnzip = pathUnzip.substring(0, ultimoSlash + 1);

                cmd = 'unzip';
                
                args = ['-o',req.body.downloadPath,'-d', pathUnzip];

                result =  await runInShell(cmd, args);

                cmd = 'pg_restore';
                pathUnzip = pathUnzip + req.body.downloadPath.substring(ultimoSlash + 1, req.body.downloadPath.lastIndexOf("."));

                args = [
                    '--host', 'localhost',
                    '--dbname', 'backend',                                    
                    '--username',`${req.body.usuario_postgres}`,
                    '--if-exists', '-c',
                    '-e',
                    '--verbose', pathUnzip
                ];

                let env = {
                    PGPASSWORD: `${req.body.pass_postgres}`                    
                };

                pgStrCon.user=`${req.body.usuario_postgres}`;
                pgStrCon.password = `${req.body.pass_postgres}`;

                result = await runInShell(cmd, args,env);
            }

            result ? res.send('Restore successful') : res.send('Upps it was a problem');
        } catch (error) {
            console.log(error);
            res.send('Uppps something was wrong');
        }
    },
    mask: async function(req,res){
        res.send('desde mask');
    },
    hosts: async function(req,res){
        try {
            let updates = 0;
            let pgPool = new Pool(pgStrCon);
            let pgClient = await pgPool.connect();
            let query = `SELECT "idPrograma",url FROM programas;`;
            let results = await pgClient.query(query);
            pgClient.release();
            await pgPool.end();
            if (results.rows.length > 0);{
                let updateQuery='UPDATE programas SET url=$1 WHERE url = $2';

                if(pathWorkSpace===""){
                    pathWorkSpace="/";
                }
                let pathDoc=`${pathWorkSpace}`+`${hostsDoc}`;  
                let stream = fs.createWriteStream(pathDoc);
                results.rows.forEach(async (row)=>{
                    try{
                        stream.write(`127.0.0.1     ${prefix}${row.url}\n`);
                        stream.write(`127.0.0.1     api.${prefix}${row.url}\n\n`);
                        let pgPool= new Pool(pgStrCon); 
                        let pgClient = await pgPool.connect();
                        updates+=(await pgClient.query(updateQuery,[`${prefix}${row.url}`,`${row.url}`])).rowCount;
                        pgClient.release();
                        await pgPool.end();

                    }catch(error){
                        console.log(error);
                    }
                });

                stream.end();
                stream.on('close',()=>{
                    res.send(`El archivo ${hostsDoc} fue creado se encuentra en la ruta ${pathWorkSpace}\n Las rutas actualizadas son ${updates}`);
                });  
            } 
        } catch (error) {
         console.log(error);   
        }
    }
}

