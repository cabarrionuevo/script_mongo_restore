const { exec } = require('child_process');

let result = {
    path:'/home/charly2790/Documentos/prd-mongo-backend-db-dump.gz',
    filename:'prd-mongo-backend-db-dump.gz'
}

// Comando para hacer un dump de la base de datos
// const cmd = 'mongodump --db mydatabase';
const cmd = 'mongorestore --gzip --archive=prd-mongo-backend-db-dump.gz --excludeCollection filebeatlogs';

// Ejecutar el comando
exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error(`Error ejecutando el comando: ${err}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
});