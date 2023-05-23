const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const config = require('../config/config');
const path = require('path');
const { spawn } = require('child_process');
const {Pool} = require('pg');
<<<<<<< HEAD
const { ifError } = require('assert');
const { MongoClient } = require('mongodb');
=======
const {MongoClient} = require('mongodb');
>>>>>>> 7b8d0a5aadf9f8f03219f762f969bf4e884fde06

const pgStrCon={
                'host':config.PG_HOST,
                'database':config.PG_DBNAME,
                'port':config.PG_PORT,
                'user':'postgres',
                'password':'postgres'
            };


<<<<<<< HEAD
// const pgClient={
//     query: async(pgStrCon,strQuery)=>{
//         let pgPool = new Pool(pgStrCon);
//         let client = await pgPool.connect();
//         let result= await client.query(strQuery);
//         client.release();
//         await pgPool.end();
//         return result;
//     }
// }
=======
/*const pgClient={
    query: async(pgStrCon,strQuery)=>{
        let pgPool = new Pool(pgStrCon);
        let client = await pgPool.connect();
        let result= await client.query(strQuery);
        client.release();
        await pgPool.end();
        return result;
    }
}*/
>>>>>>> 7b8d0a5aadf9f8f03219f762f969bf4e884fde06

const prefix = config.PREFIX_LOCALHOST_URL;
const hostsDoc="hosts.txt";

let pathWorkSpace="/home/gleegstra/Escritorio/Trabajo/";

async function openDbConnection(StrConecction){
    let pgPool = new Pool(pgStrCon);
    
    return pgClient = await pgPool.connect();
}

async function closeDbConnection(pgClient,pgPool){
    pgClient.release();
    await pgPool.end();
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
        let mask = {
            postgres:{
                tablas:[
                    {
                    nombre: "programas",
                    campos:["emailContacto","emailRemitente","emailsExportacionUsuarios"]
                    },
                    {
                    nombre:"proveedores",
                    campos:["emailContacto","emailCanjes"]
                    }
                ]
            },
            mongo:{
                coleccions:[
                {
                    nombre:"perfils",
                    selector:'{"username":{"$nin":["admin","admin_ashiwea"]}}',
                    query:'{"$set":{"otros.email":"otro@email.com"}}'
                },
                {
                    nombre:"canalretails",
                    selector:'{"email":{"$exists":true}}',
                    query:'{"$set":{"email":"otro@email.com"}}'
                },
                {
                    nombre:"clienteretails",
                    selector:'{"email":{"$exists":true}}',
                    query:'{"$set":{"email":"otro@email.com"}}'
                }
                ]
            
            }	
        }
        
        const client = new MongoClient(config.MONGO_URL,{monitorCommands:true});

        let mjs = '';

        await client.connect();

        for (col of mask.mongo.coleccions){
            let coleccion = client.db().collection(col.nombre);
            let selector = JSON.parse(col.selector);
            let query = JSON.parse(col.query);
            let results = await coleccion.updateMany(selector,query);
            
            mjs += `Cantidad Documentos modificados de la coleccion ${col.nombre}: ${results.modifiedCount}\n`;
        }    

        client.close();
        
        res.send(mjs);
    },
    hosts: async function(req,res){
        try {
            let msjeResponse = "";
            let pgPool = new Pool(pgStrCon);
            let pgClient = await pgPool.connect();
            let query = `SELECT "idPrograma",url FROM programas;`;
            let results = await pgClient.query(query);
            pgClient.release();
            await pgPool.end();
            if (results.rows.length > 0);{

                let updateQuery = `UPDATE programas SET url=CONCAT('${prefix}',url)`;

                if(pathWorkSpace===""){
                    pathWorkSpace="/";
                }
                
                let pathDoc=`${pathWorkSpace}`+`${hostsDoc}`;  
                let stream = fs.createWriteStream(pathDoc);
                results.rows.forEach(async (row)=>{
                    try{
                        stream.write(`127.0.0.1     ${prefix}${row.url}\n`);
                        stream.write(`127.0.0.1     api.${prefix}${row.url}\n\n`);

                    }catch(error){
                        console.log(error);
                    }
                });

                try{
                    let pgPool= new Pool(pgStrCon); 
                    let pgClient = await pgPool.connect();

                    let cantRegistrosAfectados = (await pgClient.query(updateQuery)).rowCount;

                    // let cantRegistrosAfectados= await pgClient.query(pgStrCon,updateQuery);

                    pgClient.release();
                    await pgPool.end();

                    // closeDbConnection(pgClient,pgPool);
                    
                    msjeResponse =`El archivo ${hostsDoc} fue creado se encuentra en la ruta ${pathWorkSpace}\n Las rutas actualizadas son ${cantRegistrosAfectados}`; 

                    stream.end();
                    stream.on('close',()=>{
                        res.send(msjeResponse);
                    });  
                }catch(error){
                    console.log(error);
                }

              
            } 
        } catch (error) {
         console.log(error);   
        }
    }
}

