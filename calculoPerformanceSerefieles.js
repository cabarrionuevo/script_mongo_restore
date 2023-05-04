const moment = require('moment');
const aws = require('aws-sdk');
const fs = require('fs');
const es = require('event-stream');
const parse = require('csv-parse/lib/sync');
const sendgridClient = require(`${process.env.PWD}/bin/sendgridClient`);
const template = require(`${process.env.PWD}/templates/fallaS3EnCrons.template`);
const util = require('util');

const CODIGO_EMPRESA = 0;
const EMPRESA = 1;
const USERNAME = 2;
const FECHA = 3;
const CODIGO_PRODUCTO = 4;
const CANTIDAD = 5;
const KILOS = 6;
const IMPORTE = 7;
const CODIGO_CLIENTE = 8;

let performanceCreados = 0;
let performanceActualizados = 0;

async function logSaving(logImportacion, error) {
    console.log(error);
    logImportacion.errores.push({
        error: error.message ? error.message : error,
    });
    await logImportacion.save();
}

async function onEndProcess(
    logImportacion,
    lineas,
    nowDate,
    s3,
    filename,
    uploadBucket,
    inputFolder
) {
    // Esta logica toma en cuenta la primera linea que es el header y el fin del archivo.
    const now = moment.utc();
    const duration = moment.duration(now.diff(nowDate));
    console.log(
        lineas - 2 + ' LINEAS PROCESSADAS EN: ',
        moment.utc(duration.as('milliseconds')).format('HH:mm:ss.SSSSSS')
    );
    console.log('PERFORMANCES CREADOS: ', performanceCreados);
    console.log('PERFORMANCES ACTUALIZADOS: ', performanceActualizados);
    console.log(
        'CRON CALCULO DE PERFORMANCE SEREFIELES VOLUMEN TOTAL TERMINÓ: ',
        now.format('YYYY-DD-MM  HH:mm:ss')
    );
    logImportacion.lineasProcesadas = lineas - 2;
    logImportacion.total = null;
    await logImportacion.save();

    const paramsCopy = {
        Bucket: uploadBucket,
        CopySource: uploadBucket + '/' + inputFolder + filename,
        Key: inputFolder + 'procesados/' + filename,
    };

    await new Promise((resolve, reject) => {
        s3.copyObject(paramsCopy, async (err, data) => {
            if (err) {
                console.log('FALLÓ EL COPY DEL ARCHIVO');
                const templateMail = template(
                    'Serefieles',
                    filename,
                    uploadBucket,
                    inputFolder,
                    'Copiar el archivo procesado a la carpeta procesados',
                    err
                );
                await sendgridClient.send(templateMail);
                reject(err);
            } else {
                console.log('EXITOSO EL COPY DEL ARCHIVO');
                resolve(data);
            }
        });
    }).then(async (res) => {
        const paramsDelete = {
            Bucket: uploadBucket,
            Key: inputFolder + filename,
        };

        await new Promise((resolve, reject) => {
            s3.deleteObject(paramsDelete, async (err, data) => {
                if (err) {
                    console.log('FALLÓ EL DELETE DEL ARCHIVO');
                    const templateMail = template(
                        'Serefieles',
                        filename,
                        uploadBucket,
                        inputFolder,
                        'Borrar el archivo que se pasó a la carpeta procesados',
                        err
                    );
                    await sendgridClient.send(templateMail);
                    reject(err);
                } else {
                    console.log('EXITOSO EL DELETE DEL ARCHIVO');
                    resolve(data);
                }
            });
        });
    });
}

/*
  Return Object: el key es idUsuario, el value es array de ids campañas en las cuales el usuario tiene al menos un target asociado.
  modelo: { idUsuario: [idCampana, idCampana2], idUsuario2: [idCampana2, idCampana3] }
*/
function getTargetsMap(targets) {
    const targetsMap = {};
    targets.map((target) => {
        const idCampana = String(target.idCampana);
        if (targetsMap[target.idUsuario]) {
            if (!targetsMap[target.idUsuario].includes(idCampana)) {
                targetsMap[target.idUsuario].push(idCampana);
            }
        } else {
            targetsMap[target.idUsuario] = [idCampana];
        }
    });
    return targetsMap;
}

/*
  Return Object: el key es username, el value es el idUsuraio.
  Sirve para saber si el username de la linea pertence a un usuario que existe en el sistema.
  modelo: { username: idUsuario, username2: idUsuario2 }
*/
function getUsuariosMap(perfiles) {
    const usuariosMap = {};
    perfiles.map((perfil) => {
        usuariosMap[perfil.username] = perfil.idUsuario;
    });
    return usuariosMap;
}

/* Retorna un objeto con los datos importantes de la linea parseada del csv enviado por Serefieles */
function parseLinea(item) {
    if (item) {
        return {
            codigoEmpresa: parseInt(item[CODIGO_EMPRESA]),
            empresa: item[EMPRESA],
            username: item[USERNAME],
            fecha: moment(item[FECHA], 'DD-MM-YYYY'),
            codigoProducto: item[CODIGO_PRODUCTO],
            cantidad: parseInt(item[CANTIDAD]),
            importe: parseInt(item[IMPORTE]),
            kilos: parseFloat(item[KILOS].replace(',', '.')),
            codigoCliente: item[CODIGO_CLIENTE],
        };
    }
    return null;
}

async function volumenTotal(db, filter, campana, idUsuario, linea) {
    const performance = await db.PerformanceCampana.findOne({ ...filter });
    if (performance) {
        performance.cantidadVentas += parseFloat(parseFloat(linea.kilos).toFixed(2));
        performance.actualizaciones.push(new Date());
        await performance.save();
        performanceActualizados++;
    } else {
        const performance = {
            idPrograma: campana.idPrograma,
            idCampana: campana._id,
            idUsuario: idUsuario,
            cliente: filter.cliente,
            // codigoProducto: linea.codigoProducto,
            cantidadVentas: parseFloat(linea.kilos).toFixed(2),
            cantidad: 0,
            cantidadProductos: 0,
            monto: 0,
        };
        await db.PerformanceCampana.create(performance);
        performanceCreados++;
    }
}

/*
  Procesa cada linea encontrada en el archivo. Posibles resultados:
  - No existe un usuario en Liza con el username
  - Si La linea no pertenece a ninguna campaña por uno de 3 motivos explicados en la función esVentaEnCampana
  - Si La linea pertenece:
  . Se busca un doc PerformanceCampana con indice compuesto idUsuario - idCampana, si existe se actualiza la cantidad de ventas
  . Si no existe se crea con la cantidad en la linea
  - Los Maps sirven para hacer que la logica sea ejecute de manera eficaz y rápida sin tener que hacer "find" queries en cada iteración.
  - usuariosMap, targetsMap y productosCampanaMap están explicadas en sus funciones que las generan respectivamente.
*/
async function processLinea(
    linea,
    logImportacion,
    db,
    campanas,
    usuariosMap,
    targetsMap,
    lineas
) {
    try {
        for (let j = 0; j < campanas.length; j++) {
            const campana = campanas[j];
            let isCampanaTotal = campana.nombre.includes('Volumen total');
            let isDanone = campana.nombre.includes('Danone');
            let isMastellone = campana.nombre.includes('Mastellone');
            // Primero se busca el idUsuario usando el username
            const idUsuario = usuariosMap[linea.username];

            if (idUsuario) {
                let filter = {
                    idCampana: campana._id,
                    idUsuario: idUsuario,
                };
                // La función lineaInCampana chequea que la linea pertenezca a la campaña
                const lineaInCampana = esLineaEnCampana(
                    linea,
                    campana,
                    idUsuario,
                    targetsMap,
                );
                if (lineaInCampana && isCampanaTotal) {
                    // validamos que estamos en una empresa y que la casuistica sea por volumen total
                    if (linea.codigoEmpresa === 1 && isCampanaTotal && isMastellone) {
                        await volumenTotal(
                            db,
                            { ...filter, cliente: 'MHSA' },
                            campana,
                            idUsuario,
                            linea
                        );
                        // validamos que estamos en una empresa y que la casuistica sea por volumen total
                    } 
                    
                    if (linea.codigoEmpresa === 2 && isCampanaTotal && isDanone) {
                        await volumenTotal(
                            db,
                            { ...filter, cliente: 'DASA' },
                            campana,
                            idUsuario,
                            linea
                        );
                    }
                }
            }
        }
    } catch (e) {
        console.error(e);
        var error = {};
        error.error = e.message;
        error.linea = lineas;
        error.idPrograma = 107;
        logImportacion.errores.push(error);
    }
}

function esLineaEnCampana(linea, campana, idUsuario, targetsMap) {
    // Si la fecha de la linea no coincide entonces la linea no es de esta campaña
    if (!campana.fechaInCampana(linea.fecha)) {
        return false;
    }
    const idCampana = String(campana._id);
    const usuarioInCampana = targetsMap[idUsuario]
        ? targetsMap[idUsuario].includes(idCampana)
        : false;
    if (!usuarioInCampana) {
        return false;
    }
    // Si cumplió con todas las reglas entonces la linea es de esta campaña
    return true;
}

module.exports = {
    name: 'CRON CALCULO DE PERFORMANCE SEREFIELES VOLUMEN TOTAL',
    cronExpression: '30 23 * * *',
    run: async (logImportacion, db) => {
        try {
            // Development
            // const credentials = {
            //     accessKeyId: process.env.AWS_ACCESS_KEY,
            //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            // };
            // let s3 = new aws.S3({ ...credentials, apiVersion: '2006-03-01' });
            // const nowDate = moment.utc();
            // const nowStringDate = nowDate.format('YYYYMMDD');
            // const filePath = '/home/deployer/';
            // let inputFolder = 'files/campanas/93/';
            // const uploadBucket = 'stg.liza.ashiwea.com-files';
            // let idPrograma = 93;
            // const filename = `20230419_Serefieles.csv`;

            // Producción:
            let s3 = new aws.S3({ apiVersion: '2006-03-01' });
            const nowDate = moment.utc();
            const nowStringDate = nowDate.format('YYYYMMDD');
            let inputFolder = 'campanas/93/';
            const uploadBucket = process.env.UPLOADS_BUCKET;
            const filePath = '/home/deployer/';
            let idPrograma = 93;
            // const filename = `${nowStringDate}_Serefieles.csv`;
            const filename = `20230418_Serefieles.csv`;

            logImportacion.nombreArchivo = filename;
            logImportacion.lineasProcesadas = 0;
            logImportacion.idPrograma = idPrograma;

            const fileStream = fs.createWriteStream(filePath + filename);
            const s3Stream = s3
                .getObject({
                    Bucket: uploadBucket,
                    Key: inputFolder + filename,
                })
                .createReadStream();

            s3Stream.on('error', async (err) => {
                fs.unlink(filePath + filename, (result) => {
                    console.log(filePath + filename + ' Read successfully and Deleted');
                });
                const templateMail = template(
                    'Serefieles',
                    filename,
                    uploadBucket,
                    inputFolder,
                    'Al intentar leer archivo en el bucket',
                    err
                );
                await sendgridClient.send(templateMail);
                logSaving(logImportacion, err);
                console.log('err', err);
            });

            s3Stream
                .pipe(fileStream)
                .on('error', async (err) => {
                    // capture any errors that occur when writing data to the file
                    fs.unlink(filePath + filename, (result) => {
                        console.log(filePath + filename + ' Read successfully and Deleted');
                    });
                    const templateMail = template(
                        'Serefieles',
                        filename,
                        uploadBucket,
                        inputFolder,
                        'Leyendo el archivo del bucket',
                        err
                    );
                    await sendgridClient.send(templateMail);
                    logSaving(logImportacion, err);
                    console.log('err', err);
                })
                .on('close', async () => {
                    console.log('ARCHIVO COPIADO AL SERVER');

                    // Antes de empezar a procesar el archivo se busca de antemano las campañas, los targets, los prodcutos y los usuarios de Aliados
                    const campanas = await db.Campana.find({
                        idPrograma: idPrograma,
                        estado: 'INICIADA',
                        tipo: 'SIMPLE',
                    });
                    console.log('CANTIDAD CAMPAÑAS ACTIVAS', campanas.length);

                    // Array de los ids de las campañas simples y todavía activas para buscar solo los targets de estas campañas
                    const idsCampanas = campanas.map((campana) => campana._id);
                    const targets = await db.TargetObjetivo.find({
                        idPrograma: idPrograma,
                        idCampana: { $in: idsCampanas },
                        estado: 'ACTIVO',
                    });
                    console.log('CANTIDAD TARGETS DE CAMPAÑAS ACTIVAS', targets.length);

                    const perfiles = await db.Perfil.find({ idPrograma: idPrograma });
                    console.log('CANTIDAD PERFILES', perfiles.length);

                    const gruposProductos = await db.GruposProductosCampana.find({
                        idPrograma: idPrograma,
                    });
                    console.log('CANTIDAD GRUPOS PRODUCTOS', gruposProductos.length);

                    const targetsMap = getTargetsMap(targets);
                    console.log('MAPEÓ LOS TARGETS BIEN');

                    const usuariosMap = getUsuariosMap(perfiles);
                    console.log('MAPEÓ LOS USUARIOS BIEN');

                    await db.PerformanceCampana.deleteMany({
                        idCampana: { $in: idsCampanas },
                        cliente: { $ne: "cliente" },
                    });

                    let lineas = 0;

                    const file = fs
                        .createReadStream(filePath + filename)
                        .pipe(es.split())
                        .pipe(
                            es
                                .mapSync(async function (line) {
                                    try {
                                        // pause the readstream
                                        file.pause();
                                        const fields = parse(line, { delimiter: ';' })[0];
                                        if (lineas % 1000 === 0) {
                                            const now = moment.utc();
                                            const duration = moment.duration(
                                                now.diff(nowDate)
                                            );
                                            console.log(
                                                lineas + ' LINEAS PROCESSADAS EN: ',
                                                moment
                                                    .utc(duration.as('milliseconds'))
                                                    .format('HH:mm:ss.SSSSSS')
                                                    db                    );
                                        }
                                        if (lineas !== 0) {
                                            // Se parsea la linea según el orden acordado con Serefieles
                                            const linea = parseLinea(fields);
                                            if (linea) {
                                                await processLinea(
                                                    linea,
                                                    logImportacion,
                                                    db,
                                                    campanas,
                                                    usuariosMap,
                                                    targetsMap,
                                                    lineas
                                                );
                                            }
                                        }
                                        lineas++;
                                        file.resume();
                                    } catch (error) {
                                        console.log(error);
                                    }
                                })
                                .on('error', async (err) => {
                                    const templateMail = template(
                                        'Serefieles',
                                        filename,
                                        uploadBucket,
                                        inputFolder,
                                        'Error en lectura del archivo en la linea ' + lineas,
                                        err
                                    );
                                    await sendgridClient.send(templateMail);
                                    console.log(
                                        'Error while reading file at line ' + lineas,
                                        err
                                    );
                                    fs.unlink(filePath + filename, (result) => {
                                        console.log(
                                            filePath +
                                                filename +
                                                ' Read successfully and Deleted'
                                        );
                                    });
                                    logSaving(logImportacion, err);
                                    console.log('err', err);
                                })
                                .on('end', async () => {
                                    fs.unlink(filePath + filename, (result) => {
                                        console.log(
                                            filePath +
                                                filename +
                                                ' Read successfully and Deleted'
                                        );
                                    });
                                    await onEndProcess(
                                        logImportacion,
                                        lineas,
                                        nowDate,
                                        s3,
                                        filename,
                                        uploadBucket,
                                        inputFolder
                                    );
                                })
                        );
                });
        } catch (e) {
            console.log('err', err);
            logSaving(logImportacion, e);
        }
    },
};
