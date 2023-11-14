const fetch = require("node-fetch");
const MaquetadorXML = require("../extends/maquetadorXML");
const credentials = require("../keys/coordinadora");
const xml2js = require("xml2js");
const {DOMParser} = require("xmldom");
const { transformarDatosDestinatario, segmentarString, estandarizarFecha, actualizarMovimientos, actualizarEstado } = require("../extends/funciones");

const { estadosGuia, guiaEnNovedad, detectaNovedadEnElHistorialDeEstados, modificarEstadoGuia } = require("../extends/manejadorMovimientosGuia");


function normalizarValoresNumericos(valores) {
    const ks = Object.keys(valores);
    const expInt = /^-?\d+$/;
    const expDbl = /^-?\d+(\.\d+)?$/;

    ks.forEach(k => {
        if(expInt.test(valores[k])) valores[k] = parseInt(valores[k]);
        if(expDbl.test(valores[k])) valores[k] = parseFloat(valores[k]);
    });

    return valores
}

function retornarArray(rec) {
    if(!rec) return [];

    return Array.isArray(rec) ? rec : [rec];
}

exports.cotizar = async (req, res) => {
    const {type} = req.params;
    const body = req.body;
    console.log("CREDENCIALES => ", credentials);
    const maquetador = new MaquetadorXML("./estructura/cotizar.cord.xml");

    const {v15, nit, div} = credentials;
    const peticion = Object.assign({
        nit: nit,
        div: div,
        apikey: v15.apikey,
        clave: v15.clave,
        unidades: 1,
        ubl: 0,
        cuenta: 2 // Codigo de la cuenta, 1 = Cuenta Corriente, 2 = Acuerdo semanal, 3 = Flete Pago
    }, body)

    const itemXml = maquetador.maqueta("ITEMS").fill(peticion);

    peticion.items = itemXml;

    const structure = maquetador.maqueta("COTIZADOR").fill(peticion);


    try {
        const response = await fetch(v15.endpoint, {
            method: "POST",
            Headers: {"Content-Type": "text/xml"},
            body: structure
        })
        .then(d => {
            console.log("status => ", d.status);
            // if(d.status >= 400) return {respuesta: "Error de servidor"}
            return d.text();
        })
        .catch(e => {
            console.log(e.message);
        })
    
        let xmlResponse = new DOMParser().parseFromString(response, "text/xml");
        const resCotizar = xmlResponse.documentElement.getElementsByTagName("Cotizador_cotizarResult");
        
        let responseJson = await xml2js.parseStringPromise(resCotizar, {
            explicitArray: false,
            ignoreAttrs: true
        });

        if(responseJson) {
            responseJson = normalizarValoresNumericos(responseJson.Cotizador_cotizarResult);
        }
    
        console.log(response);
    
        res.send(responseJson || {
            error: true,
            message: "Problemas de comunicación"
        });
    } catch (e){
        res.send({
            error: true,
            message: e.message
        })
    }
}

exports.crearGuia = async (req, res) => {
    const guia = req.body;
    const maquetador = new MaquetadorXML("./estructura/crearGuia.cord.xml");
    const datos_destinatario = transformarDatosDestinatario(guia);

    const esConvencional = datos_destinatario.type === "CONVENCIONAL";
    if(esConvencional) {
        guia.referencia = undefined;
        guia.valor = undefined;
    } else {
        guia.forma_pago = 1;
    }

    const {v16, nit, div} = credentials;
    const peticion = Object.assign({
        nit: nit,
        div: div,
        usuario: v16.usuario,
        clave: v16.clave,
        id_cliente: v16.id_cliente,
        codigo_cuenta: 2 // Codigo de la cuenta, 1 = Cuenta Corriente, 2 = Acuerdo semanal (siempre), 3 = Flete Pago
    }, guia, datos_destinatario);

    const structure = maquetador
    .maqueta("CREADOR")
    .fill(peticion);

    console.log(structure);
    try {
        const response = await fetch(v16.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "text/xml"
            },
            body: structure
        })
        .then(d => d.text());

        let xmlResponse = new DOMParser().parseFromString(response, "text/xml");
        const resCrearGuia = xmlResponse.documentElement.getElementsByTagName("return");
        const resError = xmlResponse.documentElement.getElementsByTagName("faultstring");
        
        const conv = async xml => await xml2js.parseStringPromise(xml, {
            explicitArray: false,
            ignoreAttrs: true
        });

        let responseJson = await conv(resCrearGuia);
    
        if(responseJson) {
            responseJson = responseJson.return;
            
        } else {
            responseJson = await conv(resError);
            if(responseJson) {
                responseJson.error = true;
                responseJson.message = responseJson.faultstring;
            }
        }
    
    
        res.send(responseJson || {
            error: true,
            message: "Problemas de comunicación"
        });

    } catch (e) {
        res.send({
            error: true,
            message: e.message
        })
    }


}

exports.crearStickerGuia = async (req, res) => {
    const guia = req.body;
    const maquetador = new MaquetadorXML("./estructura/crearSticker.coord.xml");

    const {v16} = credentials;
    const peticion = Object.assign({
        usuario: v16.usuario,
        clave: v16.clave,
    }, guia);

    const structure = maquetador.fill(peticion);

    try {
        const response = await fetch(v16.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "text/xml"
            },
            body: structure
        })
        .then(d => d.text());

        const valorRetorno = "return";
        let xmlResponse = new DOMParser().parseFromString(response, "text/xml");
        const resCrearSticker = xmlResponse.documentElement.getElementsByTagName(valorRetorno);
        const resError = xmlResponse.documentElement.getElementsByTagName("faultstring");
        
        const conv = async xml => await xml2js.parseStringPromise(xml, {
            explicitArray: false,
            ignoreAttrs: true
        });

        let responseJson = await conv(resCrearSticker);
    
        if(responseJson) {
            responseJson = responseJson[valorRetorno];
            const base64 = responseJson.rotulos;
            // if(!base64.startsWith("JVBERi0xLjQKJ")) return res.json([]);

            const base64Segmented = segmentarString(base64, 500000);
            responseJson.base64GuiaSegmentada = base64Segmented;
            responseJson.error = false;
        } else {
            responseJson = await conv(resError);
            if(responseJson) {
                responseJson.error = true;
                responseJson.message = responseJson.faultstring;
            }
        }
    
        console.log(response, responseJson);
    
        res.send(responseJson || {
            error: true,
            message: "Problemas de comunicación"
        });

    } catch (e) {
        res.send({
            error: true,
            message: e.message
        })
    }
}

exports.actualizarMovimientos = async (docs) => {
    const numerosGuia = docs.map(d => d.data().numeroGuia || undefined).filter(Boolean);
    const maquetador = new MaquetadorXML("./estructura/seguimiento.coord.xml");
    console.log("Numero guía =>", numerosGuia)
    
    const itemXml = numerosGuia.map(n => maquetador.maqueta("ITEM").fill({numeroGuia: n})).join("");
    const {v16} = credentials;
    const peticion = Object.assign({
        usuario: v16.usuario,
        clave: v16.clave,
        items: itemXml
    });

    const structure = maquetador.maqueta("SEGUIMIENTO").fill(peticion);
    try {
        const response = await fetch(v16.endpoint, {
            method: "POST",
            Headers: {"Content-Type": "text/xml"},
            body: structure
        })
        .then(d => {
            console.log("status => ", d.status);
            // if(d.status >= 400) return {respuesta: "Error de servidor"}
            return d.text();
        })
        .catch(e => {
            console.log(e.message);
        })

        let xmlResponse = new DOMParser().parseFromString(response, "text/xml");
        const resSeguimiento = xmlResponse.documentElement.getElementsByTagName("return");
        
        let responseJson = await xml2js.parseStringPromise(resSeguimiento, {
            explicitArray: false,
            ignoreAttrs: true
        });

        if(responseJson) {
            const items = responseJson.return.item;

            responseJson = Array.isArray(items) ? items.map(normalizarValoresNumericos) : [items];
        } else {
            throw new Error("Hubo un error en la lectura del formato.");
        }

        console.log(responseJson);

        const resultadoActualizacion = [{
            estado: "Est.M",
            actualizadas: 0,
            errores: 0,
            causas: []
        }, {
            estado: "Mov.M",
            actualizadas: 0,
        }]

        for await (const d of docs) {
            const numeroGuia = d.data().numeroGuia;
            const reporte = responseJson.find(rep => rep.codigo_remision == numeroGuia);

            if(!reporte) continue;

            const [est, mov, error] = await actualizarMovimientoIndividual(d, reporte);

            if(est) resultadoActualizacion[0].actualizadas++;
            if(mov) resultadoActualizacion[1].actualizadas++;
            if(error) {
                resultadoActualizacion[0].errores++;
                resultadoActualizacion[0].causas.push(error);
            }

        }

        return resultadoActualizacion;
        
    } catch(error) {
        console.log(error);
        return [{
            estado: "Error",
            guia: "Segmento de guías: " + error.message,
            causa: error.message || "Error desconocido COORDINADORA"
        }]
    }
   
}

async function actualizarMovimientoIndividual(doc, respuesta) {
    
    try {
        const guia = doc.data();
        const estados = respuesta.detalle_estados ? retornarArray(respuesta.detalle_estados.item) : [];
        const novedades = respuesta.detalle_novedades ? retornarArray(respuesta.detalle_novedades.item) : [];
    
        estados.forEach(e => e.codigo_novedad = "");

        const gTime = (fecha, hora) => new Date(fecha + "T" + (hora || "00:00")).getTime();
        const movimientos = estados.concat(novedades)
        .filter(Boolean)
        .sort((a,b) => {
            return gTime(a.fecha, a.hora) - gTime(b.fecha, b.hora);
        });

        movimientos.forEach(m => {
            m.fecha_completa = m.fecha + " " + m.hora;
        })
    
        console.log("BREAK", estados, novedades, movimientos);
        const ultimo_estado = movimientos[movimientos.length - 1];
    
        const estadoActual = respuesta.descripcion_estado;
    
        const estado = {
            numeroGuia: respuesta.codigo_remision.toString(), //guia devuelta por la transportadora
            fechaEnvio: respuesta.fecha_recogida,
            ciudadD: respuesta.nombre_destino,
            nombreD: guia.nombreD,
            direccionD:  guia.direccionD,
            estadoActual: respuesta.descripcion_estado,
            fecha: ultimo_estado ? ultimo_estado.fecha + " " + ultimo_estado.hora : estandarizarFecha(new Date(), "DD/MM/YYYY HH:mm"), //fecha del estado
            id_heka: doc.id,
            movimientos
        };
    
        // return [updte_estados, updte_movs];
    
        let updte_movs;
        if(movimientos.length) {
            console.log("SE ACTUALIZARÁN LOS MOVIMIENTOS", doc.ref.path);
            updte_movs = await actualizarMovimientos(doc, estado);
        }
    
        let novedad = !!novedades.length && guiaEnNovedad(movimientos, "COORDINADORA");
    
        
        guia.estadoTransportadora = estadoActual;
            
        // Función encargada de actualizar el estado, como va el seguimiento, entre cosas base importantes
        const actualizaciones = modificarEstadoGuia(guia);

        actualizaciones.enNovedad = novedad ? novedad.enNovedad : false;

        console.log("Actualización generada => ", actualizaciones);
    
        const updte_estados = await actualizarEstado(doc, actualizaciones);
    
        return [updte_estados.estado === "Est.A", updte_movs.estado === "Mov.A"];
    } catch (e) {
        console.log(e.message);
        return [null, null, e.message];
    }
}