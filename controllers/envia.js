
const fetch = require("node-fetch");
const { urlToPdfBase64, segmentarString, estandarizarFecha, actualizarMovimientos, actualizarEstado } = require("../extends/funciones");
const credentials = require("../keys/envia");
const { estadosGuia, detectaNovedadEnElHistorialDeEstados, modificarEstadoGuia } = require("../extends/manejadorMovimientosGuia");


exports.cotizar = async (req, res) => {
    const {type} = req.params;
    const body = req.body;
    console.log("CREDENCIALES => ", credentials);
    const esPagoContraentrega = body.type === "PAGO CONTRAENTREGA";

    // si es de pago a destino, el código de cuenta pasa a ser 7
    const cod_formaPago = body.type === "PAGO DESTINO" ? 7 : 4;

    // Si la guía es de pago contraentrega, se efectúa un código diferente al que comparten "PAGO DESTINO" y "CONVENCIONAL"
    const cod_cuenta = esPagoContraentrega ? credentials.cod_cuenta_rec : credentials.cod_cuenta;
    
    // El valor de producto pasa a ser cero cuando la guía no es de pago contraentrega
    const valorProducto = esPagoContraentrega ? body.valor : 0;

    const data = {
        "ciudad_origen": body.ciudad_origen,
        "ciudad_destino": body.ciudad_destino,
        "cod_formapago": cod_formaPago, // crédito = 4, contraentrega = 7
        "cod_servicio": body.peso >= 9 ? 3 : 12, // 3 (mercacía terrestre) si supera los 9 kilos, 12 (paquete terrestre) si el peso 1-8kg
        "cod_regional_cta": 1,
        "cod_oficina_cta": 1,
        "cod_cuenta": cod_cuenta,
        "info_cubicacion": [
            {
                "cantidad": 1,
                "largo": body.largo,
                "ancho": body.ancho,
                "alto": body.alto,
                "peso": body.peso,
                "declarado": body.declarado
            }
        ],
        "mca_docinternacional": 0,
        "con_cartaporte": "0",
        "info_contenido": {
            // "num_documentos": "12345-67890",
            "valorproducto": valorProducto
        }
    }

    console.log(data);

    const response = await fetch(credentials.endpoint + "/Liquidacion", {
        method: "POST",
        headers: {
            "authorization": credentials.authentication
        },
        body: JSON.stringify(data)
    })
    .then(d => {
        console.log("status => ", d.status);
        if(d.status >= 400) return {respuesta: "Error de servidor"}
        return d.json();
    })
    .catch(e => {
        console.log(e.message);
    })

    console.log(response);

    res.send(response);
}

exports.crearGuia = async (req, res) => {
    const guia = req.body;
    console.log(guia);
    const esPagoContraentrega = guia.type === "PAGO CONTRAENTREGA";

    // si es de pago a destino, el código de cuenta pasa a ser 7
    const cod_formaPago = guia.type === "PAGO DESTINO" ? 7 : 4;

    // Si la guía es de pago contraentrega, se efectúa un código diferente al que comparten "PAGO DESTINO" y "CONVENCIONAL"
    const cod_cuenta = esPagoContraentrega ? credentials.cod_cuenta_rec : credentials.cod_cuenta;
    
    // El valor de producto pasa a ser cero cuando la guía no es de pago contraentrega
    const valorProducto = esPagoContraentrega ? guia.valor : 0;
    const data = {
        "ciudad_origen": guia.dane_ciudadR,
        "ciudad_destino": guia.dane_ciudadD,
        "cod_formapago": cod_formaPago, // 4: Crédito,6:Contado,7:Contraentrega
        "cod_servicio": guia.peso >= 9 ? 3 : 12,
        "info_cubicacion": [{
            "cantidad": 1,
            "largo": guia.largo,
            "ancho": guia.ancho,
            "alto": guia.alto,
            "peso": guia.peso,
            "declarado": guia.seguro
        }],
        "mca_nosabado": 0, //Indica si el sabado el destinatario podrá recibir el pedido
        "mca_docinternacional": 0, //Para exterior
        "cod_regional_cta": 1, 
        "cod_oficina_cta": 1,
        "cod_cuenta": cod_cuenta,
        "con_cartaporte": 0,
        "info_origen": {
            "nom_remitente": guia.nombreR,
            "dir_remitente": guia.direccionR,
            "tel_remitente": guia.celularR,
            "ced_remitente": 1072497419
        },
        "info_destino": {
            "nom_destinatario": guia.nombreD,
            "dir_destinatario": guia.direccionD,
            "tel_destinatario": guia.telefonoD,
            "ced_destinatario": guia.identificacionD
        },
        "info_contenido": {
            "dice_contener": guia.dice_contener,
            "texto_guia": "",
            "accion_notaguia": "",
            "num_documentos": "12345-67890",
            "centrocosto": "",
            valorproducto: valorProducto
        },
        "numero_guia": "",
        "generar_os": guia.recoleccion_esporadica ? "S" : "N" // Para solicitar recolección S/N => Si/No
    }

    const response = await fetch(credentials.endpoint + "/Generacion", {
        method: "POST",
        headers: {
            "authorization": credentials.authentication
        },
        body: JSON.stringify(data)
    })
    .then(d => d.json());

    console.log(response);

    res.send(response);

}

exports.obtenerStickerGuia = async (req, res) => {
    const {numeroGuia, url} = req.body;

    const rutaBase = `http://200.69.100.66/2impresionGuias/Guia3.aspx?Usuario=${credentials.usuario}&Guia=${numeroGuia}`;

    const ruta = url ? url : rutaBase;
    const base64 = await urlToPdfBase64(ruta);

    if(!base64.includes("JVBERi0xLjQKJ")) return res.json([]);

    const base64Segmented = segmentarString(base64, 500000);
    res.json(base64Segmented);
}

exports.actualizarMovimientos = async (doc) => {
    const numeroGuia = doc.data().numeroGuia;
    const numeroGuiaConsult = numeroGuia.length < 12 ? "0"+numeroGuia : numeroGuia;
    try {
        const respuesta = await fetch(credentials.consultEndpoint + "ConsultaGuia/" + numeroGuiaConsult)
        .then(res => {
            return res.json()
        })
        .catch(err => {
            return {
                status: "error",
                message: err.message
            }
        });

        if(["Falla", "Error", "error"].includes(respuesta.status)) {

            const finalizar_seguimiento = doc.data().prueba ? true : false;
            if(finalizar_seguimiento) {
                await funct.actualizarEstado(doc, {
                    estado: "Finalizado",
                    ultima_actualizacion: new Date(),
                    seguimiento_finalizado: finalizar_seguimiento
                });
            }
    
            return [{
                estado: "Error",
                guia: doc.id + " / " + doc.data().numeroGuia + " " + respuesta.message,
                causa: respuesta.message || "Error desconocido ENVIA"
            }];
        }
        
        const movimientos = desglozarMovimientos(respuesta);
        const ultimo_estado = movimientos[movimientos.length - 1];
        const guia = doc.data();

        console.log(respuesta);
        // let estadoActual = respuesta.estado ? respuesta.estado.replace(/(?:EN\s|DESDE)[\s\w]+/g, "") : "NO APLICA";
        let estadoActual = respuesta.estado ? respuesta.estado.split(" ").slice(0, -2).join(" ") : "NO APLICA";
        // if(movimientos) {
        //     estadoActual = movimientos.some(m => m.estado == "Entregado") 
        //         ? "Entregado" : estadoActual;
        // }
    
        const estado = {
            numeroGuia: respuesta.guia, //guia devuelta por la transportadora
            fechaEnvio: respuesta.fec_despacho,
            ciudadD: respuesta.ciudad_destino,
            nombreD: respuesta.nombre_destinatario,
            direccionD:  respuesta.direccion_destinatario,
            estadoActual: respuesta.estado,
            fecha: ultimo_estado ? ultimo_estado.fechaMov : estandarizarFecha(new Date(), "DD/MM/YYYY HH:mm"), //fecha del estado
            id_heka: doc.id,
            movimientos
        };   

        updte_movs = {
            estado: "Mov.N.A",
            guia: doc.id + " / " + doc.data().numeroGuia + " No contiene movimientos aún."
        }        

        // return [updte_estados, updte_movs];
    
        if(movimientos.length) {
            updte_movs = await actualizarMovimientos(doc, estado);
        }
        
        guia.estadoTransportadora = estadoActual;
            
        // Función encargada de actualizar el estado, como va el seguimiento, entre cosas base importantes
        const actualizaciones = modificarEstadoGuia(guia);

        actualizaciones.enNovedad = detectaNovedadEnElHistorialDeEstados(updte_movs);

        // Función encargada de actualizar el estado, como va el seguimiento, entre cosas base importantes
        modificarEstadoGuia(actualizaciones);
    
        const updte_estados = await actualizarEstado(doc, actualizaciones);
    
        return [updte_estados, updte_movs]
    } catch(error) {
        console.log(error);
        return [{
            estado: "Error",
            guia: doc.id + " / " + doc.data().numeroGuia + " " + error.message,
            causa: error.message || "Error desconocido ENVIA"
        }]
    }
   
}

exports.imprimirMaifiesto = (req, res) => {
    const guiasPerPage = 12;
    const guias = req.body;

    if(!guias) return res.send("No se recibieron las guías");

    // const insertarImagen = guias.map(async g => {
    //     const imagen = await fetch(`https://barcode.tec-it.com/barcode.ashx?data=${g.numeroGuia}&code=Code25IL`)
    //     .then(d => {
    //         console.log(d);
            
    //         return d.arrayBuffer();
    //     });
    
    //     const buff = Buffer.from(imagen, "utf8");
    //     const base64 = buff.toString("base64");
        
    //     g.codBarra = "data:image/jpeg;charset=utf-8;base64," + base64;
    //     g;
    // });

    // await Promise.all(insertarImagen);

    const numberOfPages = Math.ceil(guias.length / guiasPerPage);
  
    let organizatorGuias = new Array();
    let pageNumber = 1;

    while(pageNumber <= numberOfPages) {
        const guiaInicial = (pageNumber - 1) * guiasPerPage;
        const guiaFinal = pageNumber * guiasPerPage;
        const page = guias.slice(guiaInicial, guiaFinal);
        page.forEach((guia, i) => {
            guia.vol = guia.alto * guia.ancho * guia.largo;
        });

        console.log(page);
        const totales = {
            unidades: page.length,
            peso: page.reduce((a,b) => a + b.peso, 0),
            vol: page.reduce((a,b) => a + b.vol, 0),
            declarado: page.reduce((a,b) => a + b.seguro, 0),
            flete: page.reduce((a,b) => a + b.costo_envio, 0)
        }

        organizatorGuias.push({page, info: page[0], totales});

        pageNumber++
    }

    res.render("printManifiesto", {organizatorGuias, layout:"printer"});
}

function desglozarMovimientos(respuesta) {
    // console.log(respuesta);
    const estadosArmado = {
        'fec_recoleccion': "Recogida",
        'fec_despacho': "En despacho",
        'fec_bodegadestino': "En bodega",
        'fec_reparto': "En reparto",
        fecha_entrega: "Entregado",
        fecha_produccion: "Generada"
    }

    const novedades = respuesta.novedad ? respuesta.novedad : [];

    novedades.map(n =>{
        n.estado = n.novedad;
        n.novedad = n.aclaracion;
        n.observacion = n.comentario;
        n.fechaMov = n.fec_novedad.split("/").reverse().join("/");
        return n;
    });

    const titulos = Object.keys(respuesta)
    .filter(r => /^fec/.test(r))

    const movimientos = titulos
    .map(t => {
        const jsonArmado = {
            estado: estadosArmado[t],
            fechaMov: respuesta[t],
            observacion: "",
            novedad: ""
        };

        if(t === "fecha_entrega") {
            jsonArmado.fechaMov = respuesta[t] + " " + respuesta.hora;
        }


        return jsonArmado;
    })
    .concat(novedades)
    .filter(t => t.estado && t.fechaMov.trim())
    .filter(t => t.novedad)
    .sort((a,b) => {
        if(!a.fechaMov) return -1;
        const i = new Date(a.fechaMov).getTime()
        const f = new Date(b.fechaMov).getTime()
        
        return f > i ? -1 : 1;
    });

    if(!movimientos.length) {
        movimientos.push({
            estado: "SIN NOVEDAD",
            fechaMov: estandarizarFecha(new Date(), "DD/MM/YYYY HH:mm"),
            observacion: "",
            novedad: ""
        })
    }

    return movimientos;
    // return [];
}