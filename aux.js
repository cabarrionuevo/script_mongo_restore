const { spawn } = require('child_process');

// Ruta del archivo comprimido
const filePath = '/ruta/al/archivo.zip';

// Comando para descomprimir el archivo
const unzipCommand = 'unzip';
const unzipArgs = ['-p', filePath];

// Comando para realizar el restore
const pgRestoreCommand = 'pg_restore';
const pgRestoreArgs = ['-U', 'nombre_de_usuario', '-d', 'nombre_de_base_de_datos'];

const unzipProcess = spawn(unzipCommand, unzipArgs);
const pgRestoreProcess = spawn(pgRestoreCommand, pgRestoreArgs);

// Conectamos la salida del proceso de unzip a la entrada del proceso de pg_restore
unzipProcess.stdout.pipe(pgRestoreProcess.stdin);


pgRestoreProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('La base de datos se ha restaurado correctamente.');
  } else {
    console.error(`Error al restaurar la base de datos. Código de salida: ${code}`);
  }
});

unzipProcess.on('error', (error) => {
  console.error(`Error al descomprimir el archivo: ${error}`);
});

pgRestoreProcess.on('error', (error) => {
  console.error(`Error al restaurar la base de datos: ${error}`);
});
