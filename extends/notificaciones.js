const firebase = require("../keys/firebase");
const db = firebase.firestore();
const {estandarizarFecha, notificarNovedad} = require("./funciones");
const { guiaEnNovedad, traducirMovimientoGuia } = require("./manejadorMovimientosGuia");

exports.notificarGuiaOficina = async (options) => {
    //Este es el patrón utilizado para el objeto que se ingresa en las notificaciones
    let example_data = {
        visible_admin: false,
        visible_user: false,
        visible_office: true,
        icon: ["exclamation", "danger"],
        detalles: "arrErroresUsuario", //mostrar una lista de posibles causas
        user_id: "vinculo.id_user",
        office_id: "identificador de una oficina",
        mensaje: "Mensaje a mostrar en la notificación",
        href: "id destino",
        fecha: "dd/mm/aaaa",
        timeline: "new Date().getTime()", // ej. 125645584895
        id_heka: "id_heka"
    }

    let fecha = estandarizarFecha();
    let hora = new Date().getHours();
    let minutos = new Date().getMinutes();    
    if(hora <= 9) hora = "0" + hora;
    if(minutos <= 9) minutos = "0" + minutos;
    fecha += ` - ${hora}:${minutos}`;;
    let notificacion = {
        visible_office: true,
        fecha,
        timeline: new Date().getTime(),
        mensaje: "Se ha creado una nueva guía que se dirige a tu oficina."
    };

    Object.assign(notificacion, options);

    db.collection("notificaciones").add(notificacion);
}

exports.estructuraBaseNotificacion = (options) => {
    //Este es el patrón utilizado para el objeto que se ingresa en las notificaciones
    let example_data = {
        visible_admin: false,
        visible_user: false,
        visible_office: true,
        icon: ["exclamation", "danger"],
        detalles: "arrErroresUsuario", //mostrar una lista de posibles causas
        user_id: "vinculo.id_user",
        office_id: "identificador de una oficina",
        mensaje: "Mensaje a mostrar en la notificación",
        href: "id destino",
        fecha: "dd/mm/aaaa",
        timeline: "new Date().getTime()", // ej. 125645584895
        id_heka: "id_heka"
    }

    let fecha = estandarizarFecha(null, "DD/MM/YYYY - HH:MM", true);
    
    let notificacion = {
        fecha,
        timeline: new Date().getTime(),
        mensaje: ""
    };

    Object.assign(notificacion, options);

    return notificacion;
}

let novedadesMensajeria = [], usuariosExcepcion = [];
exports.notificarNovedadEncontrada = async (guia, movimientos) => {
    let {novedadesNotificadas, transportadora} = guia;
    if(novedadesNotificadas && novedadesNotificadas.length > 2) return novedadesNotificadas;

    if(!novedadesMensajeria.length) {
        await db.collection("infoHeka")
        .doc("novedadesMensajeria").get().then(d => {
            novedadesMensajeria = d.data().lista;
            usuariosExcepcion = d.data().excepciones || [];
        });
    }

    if(!novedadesNotificadas) novedadesNotificadas = [];
    if(!movimientos || !movimientos.length || usuariosExcepcion.includes(guia.centro_de_costo)) return novedadesNotificadas;

    return novedadesNotificadas; // se cancela el servicio de mensajería paranovedades

    const {novedad, enNovedad} = guiaEnNovedad(movimientos, transportadora);
    const traductor = traducirMovimientoGuia(transportadora);

    if(!enNovedad) return novedadesNotificadas;

    let mensajeNovedad = novedad[traductor.novedad]
    const mensaje = novedadesMensajeria.find(n => n.novedad.trim() === mensajeNovedad.trim());
    if(!mensaje) return novedadesNotificadas;

    const mensajeTraducido = mensaje.mensaje;
    if(mensajeTraducido 
        && mensajeTraducido.trim() 
        && mensaje.notificar_ws
        && !novedadesNotificadas.includes(mensajeTraducido.trim())
    ) {
        novedadesNotificadas.push(mensajeTraducido.trim());
        notificarNovedad(guia, mensaje.mensaje);
    }

    return novedadesNotificadas;
}