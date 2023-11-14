const firebase = require("../keys/firebase");
const db = firebase.firestore();
const {
  traducirMovimientoGuia,
  guiaEnNovedad,
} = require("../extends/manejadorMovimientosGuia");
const { actualizarMovimientosPorComparador } = require("./seguimientos");
const ciudades = require("../data/ciudades.js");
const { estructuraBaseNotificacion } = require("../extends/notificaciones");
const busqueda = ciudades;

const _collEstadoGuia = "estadoGuias";
const _collGuia = "guias";

const tituloPorNovedad = {
  DIRECCION: "¿Te gustaría reparto?",
  REUSADO: "Nuevo intento.",
};

const referenciaNovedades = db
  .collection("infoHeka")
  .doc("novedadesMensajeria");

function cargarMensajeAleatorio() {
  const titulos = ["DIRECCION", "REUSADO"];
  const seleccionado = titulos[Math.floor(Math.random() * titulos.length)];

  return { tipo: seleccionado, titulo: tituloPorNovedad[seleccionado] };
}

exports.consultarGuia = async (req, res) => {
  const { n } = req.query;

  try {
    // if (!process.env.DEVELOPMENT)
    //   await actualizarMovimientosPorComparador("numeroGuia", "==", n);
    // console.log("REPORTE", reporte);

    const { lista, formularios } = await referenciaNovedades.get().then((d) => {
      if (d.exists) return d.data();

      return {};
    });

    const docMovimiento = await buscarGuia(n, _collEstadoGuia);

    if (!docMovimiento) return res.send("GUIA NO ENCONTRADA");
    let movimientosEncontrado = docMovimiento.data();
    let ciudadOrigen = busqueda.find(
      (element) => element.dane_ciudad === movimientosEncontrado.daneOrigen
    );
    let ciudadDestino = busqueda.find(
      (element) => element.dane_ciudad === movimientosEncontrado.daneDestino
    );

    // console.log(ciudadOrigen.nombre)
    // console.log(ciudadDestino.nombre)

    const tradMov = traducirMovimientoGuia(
      movimientosEncontrado.transportadora
    );

    const traduccion = (mov) => {
      const titulos = Object.keys(tradMov);
      const res = {};
      titulos.forEach((t) => (res[t] = mov[tradMov[t]]));
      return res;
    };

    const traducirMovimientos = movimientosEncontrado.movimientos
      .map(traduccion)
      .reverse();

    const { novedad } = guiaEnNovedad(
      movimientosEncontrado.movimientos,
      movimientosEncontrado.transportadora
    );
    const novedadActual = novedad ? traduccion(novedad) : {};
    let novedadDireccion = false;

    let formularioNovedad;
    let tituloSolucion;
    if (novedad) {
      const msjNovedad = novedadActual.novedad;
      const novedadLista = lista.find((l) => l.novedad === msjNovedad);

      // console.log(novedadActual, novedadLista);
      if (novedadLista && novedadLista.formulario)
        formularioNovedad = formularios[novedadLista.formulario];

      if(novedadLista) {
        tituloSolucion = novedadLista.mensaje || msjNovedad;
      }

      if (
        novedadActual.novedad.includes(
          "DIRECCION ERRADA" || "DIRECCION INCOMPLETA"
        )
      ) {
        novedadDireccion = true;
      }
    }

    console.log(novedadDireccion);

    const guia = {
      movimientos: traducirMovimientos,
      estado: movimientosEncontrado.estadoActual.toUpperCase(),
      numeroGuia: movimientosEncontrado.numeroGuia,
      fechaEnvio: movimientosEncontrado.fechaEnvio,
      enNovedad: movimientosEncontrado.enNovedad,
      tituloSolucion,
      novedadActual,
      formularioNovedad,
      ciudadDestino: ciudadOrigen.nombre,
      ciudadOrigen: ciudadDestino.nombre,
      formularioStr: JSON.stringify(formularioNovedad),
      novedadDireccion: novedadDireccion,
    };

    // res.json(movimientosEncontrado);
    res.render("guias/historicoGuia", {
      guia,
      novedadActual,
      layout: "general",
    });

    // res.render("productos", {productos, tienda: req.params.storeInfo});
  } catch (e) {
    console.log(e.message);
    res.send(e.message);
  }
};

exports.plantearSolucion = async (req, res) => {
  console.log(req.body);
  const { numeroGuia, gestion, fechaMovimiento } = req.body;

  const doc = await buscarGuia(numeroGuia, _collGuia);
  if (!doc) return res.status(400).send("GUÍA NO ENCONTRADA");

  const gest = {
    gestion,
    fecha: new Date(),
    type: "EXTERNO",
    fechaMovimiento,
  };

  
  
  try {
    const guia = doc.data();
    let batch = db.batch();
    batch.update(doc.ref, { seguimiento: firebase.firestore.FieldValue.arrayUnion(gest) });

    const referenciaNotificacion = db.collection("notificaciones").doc(guia.id_heka);

    const notificacion = estructuraBaseNotificacion({
      mensaje: `Solución externa para la guía: ${numeroGuia}`,
      guia: numeroGuia, // Esto es importante cuando se lee en el evento oclick de administrador
      id_heka: guia.id_heka, // Esto es importante cuando se lee en el evento oclick de administrador
      type: "novedad", // Para que redirecciones a los que son las novedades
      seguimiento: guia.seguimiento || [], // Esto es importante cuando se lee en el evento oclick de administrador
      usuario: guia.centro_de_costo,
      visible_admin: true,
    });

    batch.set(referenciaNotificacion, notificacion);
    
    await batch.commit();
    res.json({
      error: false,
      message: "Información actualizada correctamente"
    });
  } catch (e) {
    res.status(409).json({
      error: true,
      message: e.message
    });
  }
};

async function buscarGuia(numeroGuia, coll) {
  return await db
    .collectionGroup(coll)
    .where("numeroGuia", "==", numeroGuia)
    .limit(1)
    .get()
    .then((querySnapshot) => {
      const doc = querySnapshot.docs[0];

      return doc;
    });
}
