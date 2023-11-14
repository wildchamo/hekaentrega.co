const request = require("request");
const requestP = require("request-promise")
const extsFunc = require("../extends/funciones");
const puppeteer = require("puppeteer");
// const Handlebars = require("express-handlebars");
const {Credenciales, UsuarioPrueba, CredencialesEmpresa} = require("../keys/interCredentials");
const urlEstados = "https://www3.interrapidisimo.com/ApiservInter/api/Mensajeria/ObtenerRastreoGuias?guias=";

const firebase = require("../keys/firebase");
const { notificarNovedadEncontrada } = require("../extends/notificaciones");
const { estadosGuia, detectaNovedadEnElHistorialDeEstados, modificarEstadoGuia, atributosAdicionalesEnActualizacion } = require("../extends/manejadorMovimientosGuia");
const db = firebase.firestore();

//FUNCIONES REGULARES
// Estas funciones actualmente no están siendo utilizadas
function retornarEstado() {
    let info = new Object();
    const tds = document.querySelectorAll("#TabContainer2_TabPanel8 table table td");
    tds.forEach(td => {
        const label = td.firstElementChild.textContent;
        const input = td.getElementsByTagName("input")[0].value;
        info[label] = input;
    })
    return info;
};

function retornarDetalles(idTablaPanel) {
    let info = new Array();
    const rows = document.querySelectorAll(idTablaPanel + " tr");
    if(!rows.length) return "Empty Data";

    const titles = new Array();
    const headTab = rows[0].children;

    for(let i = 0; i < headTab.length; i++) {
        titles.push(headTab[i].textContent);
    }



    for(let i = 1; i < rows.length; i++) {
        let mov = new Object()
        const bodyTab = rows[i].children;

        for(let j = 0; j < bodyTab.length; j++) {
            const value = bodyTab[j].textContent;
            mov[titles[j]] = value.trim();
        };

        info.push(mov);
    }

    return info;
};

async function scrapEstados(numeroGuia, tipoconsulta) {
    const url = "http://reportes.interrapidisimo.com/Reportes/ExploradorEnvios/ExploradorEnvios.aspx?keyInter=1)";

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disabled-setuid-sandbox"]
    });

    try {
        const page = await browser.newPage();
        console.log("accediendo a la página");
        await page.goto(url, {
            waitUntil: "load"
        });

        await page.waitForSelector("#tbxNumeroGuia");
        
        console.log("Escribiendo el numero de guia");
        await page.type("#tbxNumeroGuia", numeroGuia.toString());
        console.log("presionando el botón de buscar");
        await page.click("#btnShow");

        const tab = "#TabContainer2_body"
        await page.waitForSelector(tab);
        await page.waitForTimeout(1000);
        page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

        const estado = await page.evaluate(retornarEstado);
        const flujo = await page.evaluate(retornarDetalles, "#TabContainer2_TabPanel7_gvFlujoGuia");
        const novedades = await page.evaluate(retornarDetalles, "#TabContainer2_TabPanel18_gvNovedadesGuia");
        const caja = await page.evaluate(retornarDetalles, "#TabContainer2_TabPanel21_GridViewAfectCaja")


        await browser.close();
        console.log("Navegador cerrado")
        
        let respuesta = {
            estado, flujo, novedades, caja
        };

        switch(tipoconsulta) {
            case "estado":
                respuesta = estado
                break;
            case "flujo":
                respuesta = flujo
                break;
            case "novedades":
                respuesta = novedades
                break;
            case "caja":
                respuesta = caja
                break;
            default: 
                break;

        }

        return respuesta;
    } catch (e) {
        await browser.close();
        
        console.log("Hubo un error con puppeteer")
        console.log(numeroGuia)
        console.log(e);

        return false;
    }  
}

const actualizarMovimientosScrapp = async function(doc) {
    console.log("consultando inter")
    const consulta = await scrapEstados(doc.data().numeroGuia);
    let updte_estados, updte_movs;
    try {
        if(!consulta) throw " Hubo un error en el scrap de estados"
        if(consulta.flujo === "Empty Data") throw " No presenta movimientos aún."
        const estados_finalizacion = ["Documento Anulado", "Entrega Exitosa", "Devuelto al Remitente"];
        const ultimo_estado = consulta.flujo[consulta.flujo.length - 1];
        const movimientos = {
            numeroGuia: doc.data().numeroGuia, //guia devuelta por la transportadora
            fechaEnvio: consulta.estado["Fecha Asignación"], 
            ciudadD: doc.data().ciudadD,
            nombreD: doc.data().nombreD,
            direccionD: doc.data().direccionD,
            estadoActual: consulta.estado['Ultimo Estado'],
            fecha: ultimo_estado["Fecha Cambio Estado"], //fecha del estado
            id_heka: doc.id,
            movimientos: consulta.flujo // movimientos registrados por la transportadora
        };

        let finalizar_seguimiento = doc.data().prueba ? true : false
        const seguimiento_finalizado = estados_finalizacion.some(v => consulta.estado["Gestion del Envio"] === v)
        || finalizar_seguimiento;
        updte_estados = await extsFunc.actualizarEstado(doc, {
            estado: consulta.estado["Gestion del Envio"] || consulta.estado['Ultimo Estado'],
            ultima_actualizacion: new Date(),
            seguimiento_finalizado,
            estadoActual: seguimiento_finalizado ? estadosGuia.finalizada : estadosGuia.proceso
        });
        
        updte_movs = await extsFunc.actualizarMovimientos(doc, movimientos);

        return [updte_estados, updte_movs]
    } catch (e) {
        return [{
            estado: "error",
            guia: doc.id + " / " + doc.data().numeroGuia + e
          }]
    }
}
// Fin de las funciones inutilizadas

const actualizarMovimientos = async function(doc) {
    console.log(doc.data().numeroGuia);
    const respuesta = await requestP.get(urlEstados + doc.data().numeroGuia)
    .then(res => JSON.parse(res))
    .catch(err => {
        return {
            error:true,
            message: err.body
        }
    });

    if(respuesta.error || !respuesta.length) {
        const finalizar_seguimiento = doc.data().prueba ? true : false;
        if(finalizar_seguimiento) {
            await extsFunc.actualizarEstado(doc, {
                estado: "Finalizado",
                ultima_actualizacion: new Date(),
                seguimiento_finalizado: finalizar_seguimiento
            });
        }
        
        return [{
            estado: "Error",
            guia: doc.id + " / " + doc.data().numeroGuia + " Hubo un error desconocido.",
            causa: respuesta.message || "Error desconocido INTERRAPIDISMO"
        }];
    }

    const guia = doc.data();

    let entrega_oficina_notificada = guia.entrega_oficina_notificada || false;
    
    const movimientos = respuesta[0].EstadosGuia.map(estado => {
        const est = estado.EstadoGuia;
        const movimiento = {
            Ciudad: est.Ciudad,
            "Descripcion Estado": est.DescripcionEstadoGuia,
            "Fecha Cambio Estado": extsFunc.estandarizarFecha(est.FechaGrabacion, "MM/DD/YYYY HH:mm:ss"),
            "Motivo": estado.Motivo.Descripcion || "",
        }

        console.log(est.DescripcionEstadoGuia);
        if(est.DescripcionEstadoGuia == "Para Reclamar en Oficina" && !entrega_oficina_notificada) {
            extsFunc.notificarEntregaEnOficina(guia);
            entrega_oficina_notificada = true;
        }
        
        return movimiento;
    });
    
    const ultimo_estado = movimientos[movimientos.length - 1];
    let finalizar_seguimiento = doc.data().prueba ? true : false


    const estado = {
        entrega_oficina_notificada,
        numeroGuia: respuesta[0].Guia.NumeroGuia.toString(), //guia devuelta por la transportadora
        fechaEnvio: extsFunc.estandarizarFecha(respuesta[0].TrazaGuia["FechaAdmisionGuia"], "MM/DD/YYYY HH:mm:ss"), 
        ciudadD: doc.data().ciudadD,
        nombreD: doc.data().nombreD,
        direccionD:  respuesta[0].Guia.DireccionDestinatario,
        estadoActual: respuesta[0].TrazaGuia['DescripcionEstadoGuia'],
        fecha: extsFunc.estandarizarFecha(ultimo_estado["Fecha Cambio Estado"], "MM/DD/YYYY HH:mm:ss"), //fecha del estado
        id_heka: doc.id,
        movimientos
    };
    
    updte_movs = await extsFunc.actualizarMovimientos(doc, estado);
    

    guia.estadoTransportadora = estado.estadoActual;
            
    // Función encargada de actualizar el estado, como va el seguimiento, entre cosas base importantes
    const actualizaciones = modificarEstadoGuia(guia);

    actualizaciones.enNovedad = detectaNovedadEnElHistorialDeEstados(updte_movs);

    // Esto me llena un arreglo de todas las novedades que han sido notificadas, para consultarlo y evitar duplicar notificaciones
    actualizaciones.novedadesNotificadas = await notificarNovedadEncontrada(guia, movimientos);
    
    // Esto pasa una serie de argumentos, que detecta que haya alguna información para actualizar
    // en caso de que los valores del segundo parametros sean falsos, undefined o null, no los toma en cuenta para actualizar
    atributosAdicionalesEnActualizacion(actualizaciones, {
        seguimiento_finalizado: finalizar_seguimiento, entrega_oficina_notificada
    });

    updte_estados = await extsFunc.actualizarEstado(doc, actualizaciones);

    return [updte_estados, updte_movs];
    
}

const encontrarId_heka = async function(numeroGuia) {
    const respuesta = await requestP.get(urlEstados + numeroGuia)
    .then(res => JSON.parse(res));
    const id_heka = respuesta[0].Guia.Observaciones
    console.log(respuesta[0].Guia.Observaciones);
    return id_heka.toString().trim();
}

function getCredentials(cuenta_responsable, prueba) {
    if(prueba) return UsuarioPrueba;

    switch(cuenta_responsable) {
        case "EMPRESA":
            return CredencialesEmpresa;
        default:
            return Credenciales;
    }
}

// FUNCIONES A EXPORTAR 
exports.crearGuia = (req, res) => {
    const guia = req.body;
    const credentials = getCredentials(guia.cuenta_responsable, guia.prueba);
    const url =  credentials.endpoint;
    const nombreTipoEnvio = guia.peso < 3 ? "PAQUETE PEQUEÑO" : "PAQUETE";
    const idTipoEnvio = guia.peso < 3 ? 3 : 9;
    const idServicio = guia.peso < 6 ? 3 : 6;
    const tiempoInicial = Date.now();

    const dest = extsFunc.transformarDatosDestinatario(guia);

    let data = {
        "IdClienteCredito": credentials.idCliente, //Codigo cliente
        "CodigoConvenioRemitente": guia.codigo_sucursal, //Codigo sucursal
        "IdTipoEntrega": guia.id_tipo_entrega || 1, // 1 ENTREGA EN DIRECCIÓN; 2: RECLAMO EN OFICINA
        "AplicaContrapago": dest.type !== "CONVENCIONAL",
        "IdServicio": idServicio, 
        "Peso": guia.peso, //En kilogramos
        "Largo":guia.largo, //En centimetros
        "Ancho":guia.ancho,
        "Alto":guia.alto, 
        "DiceContener": guia.dice_contener,
        "ValorDeclarado": guia.seguro,
        "IdTipoEnvio": idTipoEnvio,
        "IdFormaPago":2,
        "NumeroPieza":1,
        "Destinatario":{
            "tipoDocumento": dest.tipo_documento === 1 ? "NIT" : "CC",
            "numeroDocumento": dest.numero_documento,
            "nombre": dest.nombre,
            "primerApellido":  " ", //Si se debe enviar si es un cliente persona natural, es obligatorio
            "segundoApellido": "",
            "telefono": dest.telefono,
            "direccion": dest.direccion,
            "idDestinatario":0, "idRemitente":0, //Campos opcionales. Dejarlos en 0
            "idLocalidad": guia.dane_ciudadD, //Codigo DANE ciudad destinatario
            "CodigoConvenio":0, //Enviar valor 0 si no es cliente convenio
            "ConvenioDestinatario":0, //Enviar valor 0 si no es cliente convenio
            "correo": dest.correo //Obligatorio si es cliente convenio
        },
        "DescripcionTipoEntrega":"",
        "NombreTipoEnvio": nombreTipoEnvio,
        "CodigoConvenio":0, //Enviar valor 0 si no es cliente convenio
        "IdSucursal":0, //Enviar valor 0 si no es cliente convenio
        "IdCliente":0, //Enviar valor 0 si no es cliente convenio
        "Notificacion":null,
        "RapiRadicado":{
        }, //Enviar solo si el servicio es id 16 RapiRadicado
        "Observaciones": guia.id_heka + " - " + guia.dice_contener
    }
    console.log(JSON.stringify(data), null, "\t");

    // db.collection("errores")
    // .add({identificador:guia.dice_contener ,type: "InterLogs", data, respuesta: "", momento: Date.now(),Fase:"inicio", tiempo: tiempoInicial-Date.now()});

    request.post(url + "/InsertarAdmision", {
        headers: {
            "x-app-signature": credentials.x_app_signature,
            "x-app-security_token":  credentials.x_app_security_token,
            "Content-type": "application/json"
        },
        body: JSON.stringify(data)
    }, (error, response, body) => {
        // db.collection("errores")
        // .add({identificador:guia.dice_contener ,type: "InterLogs", data, respuesta: body, momento: Date.now(),Fase:"respuesta",tiempo: tiempoInicial-Date.now()});
        if(error) res.send({
            error: true,
            message: "Hubo un error " + error,
            detalles: error
        });

        console.log("Body: ", body);
        if(typeof body === "string") {
            try {
                const respuesta = JSON.parse(body);
                if(!respuesta.idPreenvio) {
                    console.log("error");
                    db.collection("errores")
                    .add({type: "INTER", data, respuesta})
                }

            } catch (e) {
                console.log("Error al comprobar => ", e);
                
            }
        }
        // db.collection("errores")
        // .add({identificador:guia.dice_contener ,type: "InterLogs", data, respuesta: body, momento: Date.now(),Fase:"final",tiempo: tiempoInicial-Date.now()});
        res.json(body);
    })
};

exports.crearStickerGuia = (req, res) => {
    const prueba = req.query.prueba;
    const cuenta_responsable = req.query.cuenta_responsable;
    const credentials = getCredentials(cuenta_responsable, prueba);
    const url = credentials.endpoint;
    request.get(url + "/ObtenerBase64PdfPreGuia/" + req.params.id, {
        headers: {
            "x-app-signature": credentials.x_app_signature,
            "x-app-security_token": credentials.x_app_security_token
        }
    }, (error, response, body) => {
        if(error) res.send("Hubo un error => "+error);

        let base64 = JSON.parse(body);
        
        let segmentar = parseInt(req.query.segmentar);
        if(segmentar) {
            const segementado = Math.min(segmentar, 1000000)
            res.json(extsFunc.segmentarString(base64, segementado))
        } else {
            res.send(base64);
        }
    })
};

exports.consultarGuia = async (req, res) => {   
    const respuesta = await scrapEstados(req.query.guia, req.query.type);
    
    res.json(respuesta);

}

exports.imprimirManifiesto = (req, res) => {
    const guiasPerPage = 20;
    const guias = req.params.guias.split(",");
    
    const numberOfPages = Math.ceil(guias.length / guiasPerPage);

    
    let organizatorGuias = new Array();
    let pageNumber = 1;

    while(pageNumber <= numberOfPages) {
        const guiaInicial = (pageNumber - 1) * guiasPerPage;
        const guiaFinal = pageNumber * guiasPerPage;
        const page = guias.slice(guiaInicial, guiaFinal);
        organizatorGuias.push(page);

        pageNumber++
    }

    res.render("printManifiestoInter", {organizatorGuias, layout:"printer"});
}

exports.utilidades = async (req, res) => {
    const numeroGuia = req.params.numeroGuia.toString();
    try {
        const id_heka = await encontrarId_heka(numeroGuia);
    
        res.json({
            ok: true,
            message: "Proceso finalizado",
            id_heka,
            numeroGuia
        })
    } catch (e) {
        res.json({
            ok: false,
            message: e.message,
            numeroGuia
        })
    }
}

exports.actualizarMovimientos = actualizarMovimientos;