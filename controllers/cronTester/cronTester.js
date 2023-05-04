const express = require('express');
const router = express.Router();
const acl = require('../../bin/aclUtils').getAcl();
const db = { ...require('../../bin/postgresUtils').getDb(), ...require('../../bin/mongoUtils').getDb().models, EstadoLog: require('../../models/EstadoLog'), Estado: require('../../models/Estado'), acl }
const isAllowed = require(`${process.env.PWD}/middlewares/isAllowedApiRest`);
const createLogImportacion = require('../../resolvers/logImportacion/createLogImportacion.resolver')

const runCron = async (cron, req = null, res = null) => {
    console.log(
        `CRON "${cron ? cron.name : ''}" INCIADO MANUALMENTE DESDE CRON TESTER`
    );
    const logImportacion = await createLogImportacion(
        cron.name,
        process.env.USUARIO_SYSTEM,
        1,
        db
    );

    let result = null;

    if (!req) result = await cron.run(logImportacion, db);
    else if (req) {
        if (res) result = await cron.run(logImportacion, db, req, res);
        else result = await cron.run(logImportacion, db, req);
    }

    await db.LogImportacion.actualizarEstado(logImportacion._id);
    return result;
};

// const aniversarioCron = require('../../crons/aniversario.cron');
const cumpleCron = require('../../crons/cumple.cron');
const avisoVencimientoPuntosCron = require('../../crons/avisoVencimientoPuntos.cron');
const vencimientoPuntosCron = require('../../crons/vencimientoPuntos.cron');
const usuarioCLN = require('../../crons/usuariosCLN.cron');
const recordatorioReconocimientos = require('../../crons/recordarReconocimiento.cron');
const tasaRedencion = require('../../crons/tasaRedencion.cron');
const balanceAcumulado = require('../../crons/balanceAcumulado');
const movimientosCero = require('../../crons/movimientosCero.cron');
// const usuariosEdenor = require('../../crons/usuariosEdenor.cron');
const ventasUnilever = require('../../crons/ventasUnilever.cron');
const finCampanaOP = require('../../crons/finalizarCampanaOP.cron');
const avisarCumpleCron = require('../../crons/avisarCumple.cron');
const calculoTargetsUnileverCron = require('../../crons/calculoTargetsUnilever.cron');
const iniciarCampanasUnileverCron = require('../../crons/iniciarCampanasUnilever.cron');
const recordarSupervisoresUnileverCron = require('../../crons/recordarSupervisoresUnilever.cron');
const iniciarCampanasCron = require('../../crons/iniciarCampanas.cron');
const asignarPuntosCampanasCron = require('../../crons/asignarPuntosCampanas.cron');
const calculoPerformanceAliadosMP = require('../../crons/calculoPerformanceAliadosMP.cron');
const calculoPerformanceRindeMas = require('../../crons/calculoPerformanceRindeMas.cron');
const exportarUsuarios = require('../../crons/exportacionUsuarios.cron');
const actualizarTraducciones = require('../../crons/actualizarTraducciones.cron');
const calculoPerformanceNelcord = require('../../crons/calculoPerformanceNelcord.cron');
const calculoPerformanceSerefielesVolumenTotal = require('../../crons/calculoPerformanceSerefielesVolumenTotal.cron');
const calculoPerformanceSerefieles2 = require('../../crons/calculoPerformanceSerefieles2.cron');
const calculoPerformanceJyJ = require('../../crons/calculoPerformanceJyJ.cron');
const ventasRetail = require('../../crons/ventasRetail.cron');
const calculoPerformanceNegofinSemanal = require('../../crons/calculoPerformanceNegofinSemanal.cron');
const calculoPerformanceNegofinMensual = require('../../crons/calculoPerformanceNegofinMensual.cron');
const actualizarCargaCodigos = require('../../crons/actualizarCargaCodigos.cron');
const calculoPerformanceYacyreta = require('../../crons/calculoPerformanceYacyreta.cron');

//*****Importamos script
const dropBackupMongo = require('../../scripts/mongo_restore');

router.use(isAllowed('TEST_CRON'));

router.get('/calculoPerformanceYacyreta', async function (req, res) {
    try {
        await runCron(calculoPerformanceYacyreta, req);
        return res.send(
            `Cron cálculo performance YACYRETA corrió correctamente`
        );
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
});

router.get('/actualizarCargaCodigos', async function (req, res) {
  try {
    const resp = await runCron(actualizarCargaCodigos, req);
    // return res.send("Cron actualizarCargaCodigos corrió correctamente.");
    return res.send(`Cron actualizarCargaCodigos corrió correctamente \n. ${resp}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});

router.get('/calculoPerformanceNegofinMensual', async function (req, res) {
  try {
    const resp = await runCron(calculoPerformanceNegofinMensual, req);
    console.log("resp", resp);
    return res.send("Corrió el cron Mensual");
  } catch (err) {
    console.error('Error ->', err);
    return res.status(500).send(err);
  }
});

router.get('/calculoPerformanceNegofinSemanal', async function (req, res) {
  try {
    await runCron(calculoPerformanceNegofinSemanal);
    return res.send("Cron Negofin corrió correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});

router.get('/calculoPerformanceNelcord', async function (req, res) {
  try {
    await runCron(calculoPerformanceNelcord);
    return res.send("Cron NELCORD corrió correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});

router.get('/calculoPerformanceSerefielesVolumenTotal', async function (req, res) {
  try {
    await runCron(calculoPerformanceSerefielesVolumenTotal);
    return res.send("Cron SEREFIELES Volumen Total corrió correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});

router.get('/calculoPerformanceSerefieles2', async function (req, res) {
  try {
    await runCron(calculoPerformanceSerefieles2);
    return res.send("Cron SEREFIELES 2 % corrió correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});

router.get('/calculoPerformanceJyJ', async function (req, res) {
  try {
    await runCron(calculoPerformanceJyJ);
    return res.send("Cron Jhonson & Jhonson corrió correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});

router.get('/actualizarTraducciones', async function (req, res) {
  try {
    const resp = await runCron(actualizarTraducciones, req);
    return res.send(`
    Cron ACTUALIZAR TRADUCCIONES corrió correctamente.
    ${typeof resp === 'string' && resp}
    `);
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});

router.get('/cumpleanos', async function (req, res) {
  try {
    await runCron(cumpleCron);
    return res.send("Cron cumpleaños corrió correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});


router.get('/vencimientoPuntos', async function (req, res) {
  try {
    await runCron(vencimientoPuntosCron);
    return res.send("Cron vencimiento de puntos corrió correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }

});

router.get('/alertaVencimientoPuntos', async function (req, res) {
  try {
    await runCron(avisoVencimientoPuntosCron);
    return res.send("Cron alerta de vencimiento de puntos corrió correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }

});
router.get('/usuarioCLN', async function (req, res) {
  try {
    await runCron(usuarioCLN);
    return res.send("Cron usuarios CLN corrió correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }

});
router.get('/recordatorioReconocimientos', async function (req, res) {
  try {
    await runCron(recordatorioReconocimientos);
    return res.send("Cron recordatorios reconocimientos corrió correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }

});
router.get('/tasaRedencion', async function (req, res) {
  try {
    await runCron(tasaRedencion);
    return res.send("Cron tasa redencion corrió correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }

});

router.get('/balanceAcumulado', async function (req, res) {
  try {
    await runCron(balanceAcumulado);
    return res.send("Cron balance acumulado corrió correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }

});

router.get('/movimientosCero', async function (req, res) {
  try {
    await runCron(movimientosCero);
    return res.send("Cron movimientos cero corrió correctamente.");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }

});
// router.get('/usuariosEdenor', async function (req, res) {
//   try {
//     return res.send(await runCron(usuariosEdenor));
//   } catch (err) {
//     console.error(err);
//     return res.status(500).send(err);
//   }
// });
router.get('/ventasUnilever', async function (req, res) {
  try {
    await runCron(ventasUnilever)
    return res.send("Cron ventas unilever corrió correctamente");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});
router.get('/finCampanaOP', async function (req, res) {
  try {
    await runCron(finCampanaOP)
    return res.send("Cron finCampanaOP corrió correctamente");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});
router.get('/avisarCumpleanos',async function(req, res) {
	try {
		await runCron(avisarCumpleCron);
		return res.send("Cron aviso de cumpleaños corrió correctamente.");
	} catch (err) {
		console.error(err);
		return res.status(500).send(err);
	}
});
router.get('/calculoTargetsUnilever',async function(req, res) {
	try {
		await runCron(calculoTargetsUnileverCron);
		return res.send("Cron de calculo de targets de Unilever corrió correctamente.");
	} catch (err) {
		console.error(err);
		return res.status(500).send(err);
	}
});
router.get('/iniciarCampanasUnilever',async function(req, res) {
	try {
		await runCron(iniciarCampanasUnileverCron);
		return res.send("Cron de inicio de campañas de Unilever corrió correctamente.");
	} catch (err) {
		console.error(err);
		return res.status(500).send(err);
	}
});
router.get('/recordarSupervisoresUnilever',async function(req, res) {
	try {
		await runCron(recordarSupervisoresUnileverCron);
		return res.send("Cron de recordar supervisores y EDD de Unilever corrió correctamente.");
	} catch (err) {
		console.error(err);
		return res.status(500).send(err);
	}
});
router.get('/iniciarCampanas',async function(req, res) {
	try {
		await runCron(iniciarCampanasCron);
		return res.send("Cron de inicio de campañas corrió correctamente.");
	} catch (err) {
		console.error(err);
		return res.status(500).send(err);
	}
});
router.get('/asignarPuntosCampanas',async function(req, res) {
	try {
		await runCron(asignarPuntosCampanasCron);
		return res.send("Cron de asignar puntos por completar targets y objetivos de campañas corrió correctamente.");
	} catch (err) {
		console.error(err);
		return res.status(500).send(err);
	}
});
router.get('/calculoPerformanceAliadosMP', async function (req, res) {
  try {
    await runCron(calculoPerformanceAliadosMP)
    return res.send("Cron calculo performance alidaso MP corrió correctamente");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});
router.get('/calculoPerformanceRindeMas', async function (req, res) {
  try {
    await runCron(calculoPerformanceRindeMas)
    return res.send("Cron calculo performance Rinde Más corrió correctamente");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});
router.get('/exportarUsuarios', async function (req, res) {
  try {
    await runCron(exportarUsuarios)
    return res.send("Cron calculo performance alidaso MP corrió correctamente");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
});

router.get('/ventasRetail', async function (req, res) {
  try {    
    await runCron(ventasRetail)
    return res.send("Cron ventasRetail corrió correctamente");
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
  
});

router.get('/dropBackupMongo', async function (req, res) {
    try {
      await runCron(balanceAcumulado);
      return res.send("Cron balance acumulado corrió correctamente.");
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  
  });

module.exports = router;