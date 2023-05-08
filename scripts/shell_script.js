
const { spawn } = require('child_process');

let result = {
    path:'/home/gleegstra/Escritorio/Trabajo/prd-mongo-backend-db-dump.gz',
    filename:'prd-mongo-backend-db-dump.gz'
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