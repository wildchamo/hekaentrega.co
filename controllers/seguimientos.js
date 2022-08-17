const firebase = require("../keys/firebase");
const db = firebase.firestore();
const cron = require("node-cron");

const servientregaCtrl = require("./servientrega");
const interrapidisimoCtrl = require("./inter");
const aveoCtrl = require("./aveonline");
const enviaCtrl = require("./envia");

const referenciaGuias = db.collectionGroup("guias");
const maxPagination = 5e3;

async function actualizarMovimientosGuiasAntiguo(d, general) {
    let inicio_func = new Date().getTime();
    let referencePpal = firebase.firestore().collectionGroup("guias")

    //Comenzamos con la selección del tipo de consulta y/o filtrado a generar
    if(general) {
        //Para aactualizar las guías de 7 días de antiguedad sin importar el estado
        referencePpal = referencePpal.orderBy("timeline").startAt(d.getTime() - 69.12e7)
        .endAt(d.getTime())
    } else {
        referencePpal = referencePpal
        .where("seguimiento_finalizado", "!=", true)
        // .orderBy("estado")
        // .where("estado", "not-in", ["ENTREGADO", "ENTREGADO A REMITENTE"])
        // .where("transportadora", "==", "INTERRAPIDISIMO")
        // .where("centro_de_costo", "==", 'SellerNatalia')
        // .where("numeroGuia", "in", ["532956261"])
        // .limit(10)
    }
        
    try {
        let resultado = await referencePpal.get()
    
        console.log(resultado.size);
        let faltantes = resultado.size
        // throw "no babe"

        //Objeto que se va llenando paral luego mostrarme los detalles del proceso
        let consulta = {
            guias_est_actualizado: [],
            guias_mov_actualizado: [],
            guias_sin_mov: [],
            guias_con_errores: [],
            usuarios: [],
            total_consulta: resultado.size,
            fecha: d,
            servientrega: 0,
            interrapidisimo: 0,
            aveonline: 0
        }
        
        //Aquí se alamcenarán la respuesta obtenida de cada proceso de actualización
        let resultado_guias = new Array();
        
        //Itero entre todos los registros de guías encontrados
        for await (let doc of resultado.docs) {
            //Verifico que exista un número de guía
            if (doc.data().numeroGuia) {
                if (consulta.usuarios.indexOf(doc.data().centro_de_costo) == -1) {
                    consulta.usuarios.push(doc.data().centro_de_costo);
                }
                
                let guia;
                if(doc.data().transportadora === "INTERRAPIDISIMO") {
                    consulta.interrapidisimo ++;
                    // continue;
                    guia = await interrapidisimoCtrl.actualizarMovimientos(doc);
                } else if(doc.data().transportadora === "ENVIA" || doc.data().transportadora === "TCC") {
                    consulta.aveonline ++;
                    guia = await aveoCtrl.actualizarMovimientos(doc);
                } else {
                    consulta.servientrega ++
                    // continue
                    guia = await servientregaCtrl.actualizarMovimientos(doc);
                }

                /* Es IMPORTANTE que "guia" me devuelva un arreglo de objeto con longitud de 2
                -si devuelte un arreglo de longitud 1 es porque hubo un error 
                -el primer arreglo me devuelve el estado de la actualización de la guía
                -el segundo el estado de la actualizacion del movimiento
                - Los estados que debería devolver son: Est.A (estado actualizado), Mov.A (movimiento actualizado),
                    Sn.Mov (Sin movimiento), en el objeto este es el campo importante que me categoriza las estadísticas
                    y la revisión de los estados que se actualizan*/
                
                if(guia) resultado_guias.push(guia);
            }

            faltantes--;
            console.log(faltantes);
        }
        
        let guias_procesadas = Promise.all(resultado_guias);
        console.log("Resultado actualización => ", guias_procesadas)
        for(let guia of guias_procesadas) {
            if(guia.length == 1) {
                consulta.guias_con_errores.push(guia[0].guia);
            } else {
                let modo_estado = guia[0], modo_movimientos = guia[1];
                if(modo_estado.estado == "Est.A") {
                    consulta.guias_est_actualizado.push(guia[0].guia)
                } 
        
                if(modo_movimientos.estado == "Mov.A") {
                    consulta.guias_mov_actualizado.push(modo_movimientos.guia);
                } else if (modo_movimientos.estado == "Sn.Mov") {
                    consulta.guias_sin_mov.push(modo_movimientos.guia);
                }
            }
        }
        
        
        let final_func = new Date().getTime();
        consulta.tiempo_ejecucion  = (final_func - inicio_func) + "ms";
        
        consulta.mensaje = `Se han actualizado: los estados de ${consulta.guias_est_actualizado.length} Guias, 
        los movimientos de ${consulta.guias_mov_actualizado.length} Guias.
        Hubo errores en ${consulta.guias_con_errores.length} Guias.
        De un total de ${consulta.total_consulta} registradas cuyo proceso no haya
        sido finalizado en ${consulta.usuarios.length} usuarios.
        Tiempo de ejecución: ${consulta.tiempo_ejecucion}`;
        
        // console.log("246",consulta);
        delete consulta.guias_est_actualizado
        delete consulta.guias_mov_actualizado
        
        return consulta;
    } catch (error) {
        console.log(error);
        firebase.firestore().collection("reporte").add({
            error,
            mensaje: "Hubo un error al actualizar."
        })
        console.log("Hubo un error,es probable que no se haya actualizado nada.")
        return error;
    }
}

async function actualizarMovimientosGuias(querySnapshot) { 
    let consulta = {
        guias_est_actualizado: 0,
        guias_mov_actualizado: 0,
        guias_sin_mov: 0,
        guias_con_errores: 0,
        usuarios: [],
        total_consulta: querySnapshot.size,
        servientrega: 0,
        interrapidisimo: 0,
        aveonline: 0,
        envia: 0
    }

    try { 
        let inicio_func = new Date().getTime();

        console.log(querySnapshot.size);
        let faltantes = querySnapshot.size
        // throw "no babe"

        //Objeto que se va llenando paral luego mostrarme los detalles del proceso
        
        
        //Aquí se alamcenarán la respuesta obtenida de cada proceso de actualización
        let resultado_guias = new Array();
        
        //Itero entre todos los registros de guías encontrados
        console.log("ejecutando procesos");
        for (let doc of querySnapshot.docs) {
            //Verifico que exista un número de guía
            if (doc.data().numeroGuia) {
                if (consulta.usuarios.indexOf(doc.data().centro_de_costo) == -1) {
                    consulta.usuarios.push(doc.data().centro_de_costo);
                }
                
                let guia;
                if(doc.data().transportadora === "INTERRAPIDISIMO") {
                    consulta.interrapidisimo ++;
                    // continue;
                    guia = interrapidisimoCtrl.actualizarMovimientos(doc);
                } else if (doc.data().transportadora === "ENVIA") {
                    // continue;
                    consulta.envia++
                    guia = enviaCtrl.actualizarMovimientos(doc);
                } else if(doc.data().transportadora === "TCC") {
                    continue;
                    consulta.aveonline ++;
                    // guia = aveoCtrl.actualizarMovimientos(doc);
                } else {
                    consulta.servientrega ++
                    // continue
                    guia = servientregaCtrl.actualizarMovimientos(doc);
                }

                /* Es IMPORTANTE que "guia" me devuelva un arreglo de objeto con longitud de 2
                -si devuelte un arreglo de longitud 1 es porque hubo un error 
                -el primer arreglo me devuelve el estado de la actualización de la guía
                -el segundo el estado de la actualizacion del movimiento
                - Los estados que debería devolver son: Est.A (estado actualizado), Mov.A (movimiento actualizado),
                    Sn.Mov (Sin movimiento), en el objeto este es el campo importante que me categoriza las estadísticas
                    y la revisión de los estados que se actualizan*/
                
                if(guia) resultado_guias.push(guia);
            }

            faltantes--;
        }
        
        let guias_procesadas = await Promise.all(resultado_guias);
        console.log("Finalizó la ejecución de procesos");
        for(let guia of guias_procesadas) {
            if(guia.length == 1) {
                consulta.guias_con_errores ++
            } else {
                let modo_estado = guia[0], modo_movimientos = guia[1];
                if(modo_estado.estado == "Est.A") {
                    consulta.guias_est_actualizado++
                } 
        
                if(modo_movimientos.estado == "Mov.A") {
                    consulta.guias_mov_actualizado++
                } else if (modo_movimientos.estado == "Sn.Mov") {
                    consulta.guias_sin_mov++
                }
            }
        }
        
        
        let final_func = new Date().getTime();
        consulta.tiempo_ejecucion  = final_func - inicio_func;
                
        return consulta;
    } catch (error) {
        console.log(error);
        firebase.firestore().collection("reporte").add({
            error: error.message,
            mensaje: "Hubo un error al actualizar.",
            fecha: new Date()
        });
        console.log("Hubo un error,es probable que no se haya actualizado nada.")
        return consulta;
    }
}

async function busquedaPaginada(ref, next, segmento = 0) {
    segmento++
    let consulta = ref;
    if(next) {
        consulta = ref.startAfter(next);
    }

    return await consulta
    .get().then(async q => {
        const t = q.size;
        let analisis = await actualizarMovimientosGuias(q);

        let historia = [analisis];
        if(t === maxPagination) {
            const siguiente = q.docs[t - 1];
            const interno = await busquedaPaginada(ref, siguiente, segmento);
            historia = historia.concat(interno);
        }

        return historia;
    });
}

function normalizarReporte(reporte) {
    return reporte.reduce((a, b) => {
        let contadores = [
            "guias_est_actualizado", "guias_mov_actualizado", "guias_sin_mov", "guias_con_errores", 
            "total_consulta", "servientrega", "interrapidisimo", "aveonline", "envia", "tiempo_ejecucion"
        ];

        const contar = param => (a[param] || 0) + b[param]

        console.log("Ates del quiebre  => ", a, b);
        const usuarios = a.usuarios;
        
        b.usuarios.forEach(user => {
            if(!usuarios.includes(user)) usuarios.push(user);
        });

        a.tiempo_segmentado_ejecucion.push(b.tiempo_ejecucion);
 
        contadores.forEach(counter => {
            a[counter] = contar(counter);
        });

        return a;

    }, {
        usuarios: [],
        fecha: new Date(),
        tiempo_segmentado_ejecucion: []
    });
}

async function actualizarMovimientos() {
    const referencia = referenciaGuias
    .where("seguimiento_finalizado", "!=", true)
    .limit(maxPagination);

    const historia = await busquedaPaginada(referencia);

    return normalizarReporte(historia);
}

async function actualizarMovimientosSemanales() {
    const d = new Date();

    const referencia = referenciaGuias.orderBy("timeline").startAt(d.getTime() - 69.12e7)
    .endAt(d.getTime())
    .limit(maxPagination);

    const historia = await busquedaPaginada(referencia);
    return normalizarReporte(historia);
}

// actualizarMovimientosPorComparador("numeroGuia", 'in', ["094020617255"])
// .then(resultado => {
//     console.log(resultado);
//     process.exit();
// });
async function actualizarMovimientosPorComparador(comparador, comparando, campo) {
    const referencia = referenciaGuias
    // .where("seguimiento_finalizado", "!=", true)
    .where(comparador, comparando, campo)
    .limit(maxPagination);

    const historia = await busquedaPaginada(referencia);

    return normalizarReporte(historia);
}

async function actualizarMovimientosPorUsuario(user_id, type, argumento) {
    const referencePpal = db.collection("usuarios")
    .doc(user_id).collection("guias");

    let referencia;
    switch(type) {
        case "novedad":
            referencia = referencePpal.where("enNovedad", "==", true);
            break;
        
        case "seguimiento":
            referencia = referencePpal.where("seguimiento_finalizado", "!=", true);
            break;

        default:
            referencia = referencePpal.where(type, "==", argumento);
            break;
    }

    const historia = await busquedaPaginada(referencia);

    return normalizarReporte(historia);
}

const actualizarMovimientoCtrl = (req, res) => {
    const {user_id, argumento} = req.body;
    const {type} = req.params;

    try {
        actualizarMovimientosPorUsuario(user_id, type, argumento)
        // .then(respuesta => {
        //     respuesta.mensaje = "Controlado por el usuario";
        //     db.collection("reporte").add(respuesta)
        // });
        res.send("Actualizando");
    } catch(e) {
        res.statusCode(400).send("Error al actualizar")
    }
}

const ocultarOficinas = () => {
    db.collection("oficinas").get()
    .then(querySnapshot => {
        querySnapshot.forEach(doc => {
            doc.ref.update({visible: false});
        });
    })
}

module.exports = {actualizarMovimientos, actualizarMovimientosSemanales, actualizarMovimientoCtrl, ocultarOficinas}