let user_id = localStorage.user_id,
  usuarioDoc;
const usuarioAltDoc = (id) =>
  firebase
    .firestore()
    .collection("usuarios")
    .doc(id || user_id);

if (localStorage.getItem("acceso_admin")) {
  window.onload = () => revisarNotificaciones();
  listarNovedadesServientrega();
  listarSugerenciaMensajesNovedad();
  $("#descargar-informe-usuarios").click(descargarInformeUsuariosAdm);
} else if (localStorage.user_id) {
  window.onload = () => {
    usuarioDoc = firebase.firestore().collection("usuarios").doc(user_id);
    cargarDatosUsuario().then(() => {
      revisarNotificaciones();
      cargarPagoSolicitado();
    });
  };
} else {
  alert("La sesión ha expirado, por favor inicia sesión nuevamente");
  location.href = "ingreso.html";
}

window.addEventListener("storage", (e) => {
  const { key, newValue } = e;

  if (!key || (key === "user_id" && newValue && newValue !== user_id)) {
    location.reload();
  }
});

//Administradara datos basicos del usuario que ingresa
let datos_usuario = {},
  //Almacena los costos de envios (nacional, urbano...) y el porcentaje de comision
  datos_personalizados = {
    costo_zonal1: 8650,
    costo_zonal2: 13300,
    costo_zonal3: 2800,
    costo_nacional1: 11500,
    costo_nacional2: 20400,
    costo_nacional3: 3400,
    costo_especial1: 25550,
    costo_especial2: 39000,
    costo_especial3: 6300,
    comision_servi: 3.1,
    comision_heka: 1.5,
    constante_convencional: 800,
    constante_pagoContraentrega: 1700,
    comision_punto: 10,
    saldo: 0,
  };

const bodegasWtch = new Watcher();

class ControlUsuario {
  static get esPuntoEnvio() {
    return datos_usuario.type === "PUNTO";
  }

  static get esUsuarioPunto() {
    return datos_usuario.type === "USUARIO-PUNTO";
  }
}
const puntoEnvio = () => datos_usuario.type === "PUNTO";

// ANTERIOR HASTA EL 6 de septiebre del 2022
// datos_personalizados = {
//   costo_zonal1: 8250,
//   costo_zonal2: 12650,
//   costo_zonal3: 2800,
//   costo_nacional1: 10950,
//   costo_nacional2: 19450,
//   costo_nacional3: 3400,
//   costo_especial1: 24450,
//   costo_especial2: 37200,
//   costo_especial3: 6300,
//   comision_servi: 3.1,
//   comision_heka: 1,
//   constante_convencional: 800,
//   constante_pagoContraentrega: 1500,
//   saldo: 0
// };

function revisarModoPrueba() {
  const paramFinded = new URLSearchParams(location.search.split("?")[1]).has(
    "modoPrueba"
  );
  if (paramFinded) localStorage.estado_prueba = paramFinded;

  if (localStorage.estado_prueba) {
    $("#cargador-content").before(
      "<p class='alert alert-danger mx-4 text-center text-danger'>Actualmente estás en modo prueba, para salir de este modo, debes cerrar sesion y volver a iniciar</p>"
    );
  }
  return localStorage.estado_prueba;
}

let estado_prueba = revisarModoPrueba();
let listaNovedadesServientrega = [];

//funcion principal del Script que carga todos los datos del usuario
async function cargarDatosUsuario() {
  let proceso = 0;
  const contentCharger = $("#cargador-content");
  const content = $("#content");
  const percentage = () => {
    proceso += Math.min(Math.round(Math.random() * 40), 95);
    return proceso + "%";
  };

  const buttonMostrarFormDatosBancarios = $(
    "#mostrar-registro-datos-bancarios"
  );
  buttonMostrarFormDatosBancarios.click(activarFormularioCrearDatosBancarios);

  const showPercentage = $("#porcentaje-cargador-inicial");
  //Carga la informacion personal en un objeto y se llena el html de los datos del usuario
  showPercentage.text(percentage());

  datos_usuario = await consultarDatosDeUsuario();

  mostrarReferidos(datos_usuario);

  //  console.log( datos_usuario)

  limitarAccesoSegunTipoUsuario();

  //Se enlistan las novedades de servientrega
  showPercentage.text(percentage());
  await listarNovedadesServientrega();

  //Modifica los costos de envio si el usuario tiene costos personalizados
  showPercentage.text(percentage());

  // console.log(location);
  if (location.hash === "") {
    pagosPendientesParaUsuario();
  }

  contentCharger.hide();
  content.show("fast");
}

async function cargarPagoSolicitado() {
  const ref = db.collection("infoHeka").doc("manejoUsuarios");
  const data = await ref.get().then((d) => d.data().diarioSolicitado);
  const centro_de_costo = datos_usuario.centro_de_costo;
  const soliciado = data.includes(centro_de_costo);
  $("#saldo-solicitado").text(
    soliciado ? "Pago solicitado ✅" : "Pago aún no solicitado ❌"
  );
}

async function listarNovedadesServientrega() {
  listaNovedadesServientrega = await db
    .collection("infoHeka")
    .doc("novedadesRegistradas")
    .get()
    .then((d) => {
      if (d.exists) {
        return d.data().SERVIENTREGA;
      }

      return [];
    });
}

let listaRespuestasNovedad;

function listarSugerenciaMensajesNovedad() {
  const refRespuestasNovedad = db
    .collection("infoHeka")
    .doc("respuestasNovedad");

  refRespuestasNovedad.get().then((d) => {
    if (d.exists) {
      listaRespuestasNovedad = d.data().respuestas;
    }
  });
}

async function consultarDatosDeUsuario() {
  const actualizador = (doc) => {
    if (doc.exists) {
      const datos = doc.data();
      const datos_bancarios = datos.datos_bancarios || null;
      const datos_personalizados = datos.datos_personalizados;
      const bodegas = datos.bodegas
        ? datos.bodegas.filter((b) => !b.inactiva)
        : [];

      datos_usuario = {
        nombre_completo:
          datos.nombres.split(" ")[0] + " " + datos.apellidos.split(" ")[0],
        direccion: datos.direccion + " " + datos.barrio,
        celular: datos.celular,
        correo: datos.correo,
        numero_documento: datos.numero_documento,
        centro_de_costo: datos.centro_de_costo,
        objetos_envio: datos.objetos_envio,
        tipo_documento: datos.tipo_documento,
        bodegasCompletas: datos.bodegas || [],
        type: datos.type || "NATURAL",
        nombre_empresa: datos.nombre_empresa,
        datos_bancarios,
        bodegas,
      };

      bodegasWtch.change(bodegas);

      datos.nombre_completo = datos_usuario.nombre_completo;
      mostrarDatosUsuario(datos);
      mostrarDatosPersonalizados(datos_personalizados);
      mostrarDatosBancarios(datos_bancarios);
      mostrarBodegas(bodegas);

      return datos_usuario;
    }
  };

  usuarioDoc.onSnapshot(actualizador);
  return await usuarioDoc.get().then(actualizador);
}

function limitarAccesoSegunTipoUsuario() {
  let quitarVistas = [];

  if (ControlUsuario.esUsuarioPunto) {
    quitarVistas = [
      "cotizar_envio",
      "tienda",
      "buscar_guia",
      "documentos",
      "manifiestos",
      "crear_guia",
      "deudas",
    ];
  }

  quitarVistas.forEach((id) => {
    $("#" + id).remove();
    $(`[href="#${id}"]`).remove();
  });
}

function mostrarDatosUsuario(datos) {
  const referal = document.getElementById("referal");
  referal.value = `https://www.hekaentrega.co/ingreso.html?rf=${datos.centro_de_costo}#registrar`;
  const mostradores = [
    ".mostrar-nombre_completo",
    ".mostrar-nombre_empresa",
    ".mostrar-numero_documento",
    ".mostrar-tipo_documento",
  ];
  mostradores.forEach((mostrador) => {
    const campo = mostrador.replace(".mostrar-", "");
    $(mostrador).text(datos[campo]);
  });

  const formularioUser = $("#form-datos-usuario");
  $("[name]", formularioUser).each((i, el) => {
    const campo = el.getAttribute("name");
    $(el).val(datos[campo]);
  });
}

async function consultarDatosBasicosUsuario() {
  await firebase
    .firestore()
    .collection("usuarios")
    .doc(user_id)
    .get()
    .then((doc) => {
      if (doc.exists) {
        datos_usuario.centro_de_costo = doc.data().centro_de_costo;
        datos_usuario.objetos_envio = doc.data().objetos_envio;
      }
    });
}

async function mostrarDatosPersonalizados(datos) {
  if (!datos) return;
  for (let precio in datos) {
    const value = datos[precio];
    if (value === "" || value === null) continue;
    if (!/[^\d+.]/.test(value.toString())) {
      datos_personalizados[precio] = parseFloat(value);
    } else {
      datos_personalizados[precio] = value;
    }
  }

  // const importants = ["id_agente_aveo", "codigo_sucursal_inter"];
  // const importantData = new Object();
  // importants.forEach(val => importantData[val] = datos_personalizados[val]);
  // localStorage.setItem("datos_personalizados", JSON.stringify(importantData));

  $(".mostrar-saldo").html("$" + convertirMiles(datos_personalizados.saldo));

  //Si la traida de datos en tiempo real me falla,
  //voy a descomentar, para traerlo también a la primera carga
  // await informacion.doc("heka").get(updateData);
}

function mostrarDatosBancarios(datos) {
  const visorDatos = $("#visor-datos-bancarios");
  const sinDatos = $("#sin-datos-bancarios");
  const formDatosBancarios = $("#form-datos-bancarios");
  const buttonAgregarDatosBancarios = document.createElement("button");
  buttonAgregarDatosBancarios.setAttribute(
    "class",
    "btn btn-block btn-primary"
  );
  buttonAgregarDatosBancarios.setAttribute("type", "submit");
  buttonAgregarDatosBancarios.textContent = "Agregar datos bancarios";

  if (!datos) {
    visorDatos.addClass("d-none");
    sinDatos.removeClass("d-none");
    if (!formDatosBancarios.find("[type='submit']").length) {
      formDatosBancarios.append(buttonAgregarDatosBancarios);
      buttonAgregarDatosBancarios.onclick = (e) => {
        e.preventDefault();
        agregarDatosBancarios(new FormData(formDatosBancarios[0]));
      };
    }

    return;
  } else {
    formDatosBancarios.remove();
    visorDatos.removeClass("d-none");
    sinDatos.addClass("d-none");
  }

  const mostradores = [
    ".mostrar-banco",
    ".mostrar-tipo_de_cuenta",
    ".mostrar-numero_cuenta",
    ".mostrar-nombre_banco",
    ".mostrar-tipo_documento_banco",
    ".mostrar-numero_iden_banco",
  ];
  mostradores.forEach((mostrador) => {
    const campo = mostrador.replace(".mostrar-", "");
    $(mostrador).text(datos[campo]);
  });
}

function mostrarBodegas(bodegas) {
  const template = $("#bcl_bodegas");

  // se clona con el booleano true para que el no perder el data ni eventemitter del mismo;
  const crearBodega = $("#agregar-bodega").clone(true);
  const parent = template.parent();
  parent.empty();

  if (bodegas) {
    bodegas.forEach((bodega, i) => {
      const newEl = template.clone();
      const text = newEl.find("[data-bcl_content]");
      text.each((i, el) => {
        const name = $(el).attr("data-bcl_content");
        $(el).text(bodega[name]);
      });
      newEl.removeAttr("id");
      newEl.removeClass("d-none");
      newEl.find(".mostrador-transp").html(mostrarTranspEnBodega(bodega));
      parent.append(newEl);
    });
  }

  template.addClass("d-none");
  parent.append(template, crearBodega);
}

function mostrarTranspEnBodega(bodega) {
  const revisarTranps = ["SERVIENTREGA", "INTERRAPIDISIMO", "ENVIA", "TCC"];
  let res = "";

  revisarTranps.forEach((t, i) => {
    const transp = transportadoras[t];
    const habilitada = transp.habilitada();
    const exeption = "INTERRAPIDISIMO";
    const disponible =
      (t === exeption && bodega.codigo_sucursal_inter) || t !== exeption;

    if (habilitada && disponible)
      res +=
        '<img src="' +
        transp.logoPath +
        '" alt="Logo Servientrega" width="25px">';
  });

  return res;
}

function activarFormularioCrearDatosBancarios() {
  $("#form-datos-bancarios").show("fast");
}

function agregarDatosBancarios(informacion) {
  const datos_bancarios = new Object();

  for (let data of informacion) {
    datos_bancarios[data[0]] = data[1].trim();
  }

  datos_bancarios.fecha_agregado = new Date();

  console.log(datos_bancarios);
  usuarioDoc.update({ datos_bancarios }).then(() => {
    Toast.fire({
      icon: "success",
      title: "Datos bancarios agregados correctamente.",
    });
  });
}

/* Función que me carga los datos bancarios del usuario en el perfil.
la idea es que se cargue automáticamente cuando esté viendo en su perfil,
o cuando se presione una sola vez el botón que lleva al perfil del usuario */
function consultarInformacionBancariaUsuario() {
  const datosBanc = $("#mostrar-ocultar-registro-bancario");
  datosBanc.before(
    '<div class="text-center" id="cargador-datos-bancarios"><h2>Cargando Datos bancarios </h2><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div></div>'
  );

  const informacion = firebase
    .firestore()
    .collection("usuarios")
    .doc(user_id)
    .collection("informacion");

  informacion
    .doc("bancaria")
    .get()
    .then((doc) => {
      if (doc.exists) {
        let datos = doc.data();
        ////datos bancarios
        if (document.getElementById("CPNbanco") && datos.banco != "") {
          document.getElementById("CPNbanco").value = datos.banco;
        }
        if (
          document.getElementById("CPNnombre_representante") &&
          datos.nombre_banco != ""
        ) {
          document.getElementById("CPNnombre_representante").value =
            datos.nombre_banco;
        }
        if (
          document.getElementById("CPNtipo_de_cuenta") &&
          datos.tipo_de_cuenta != ""
        ) {
          document.getElementById("CPNtipo_de_cuenta").value =
            datos.tipo_de_cuenta;
        }
        if (
          document.getElementById("CPNnumero_cuenta") &&
          datos.numero_cuenta != ""
        ) {
          document.getElementById("CPNnumero_cuenta").value =
            datos.numero_cuenta;
        }
        if (
          document.getElementById("CPNconfirmar_numero_cuenta") &&
          datos.numero_cuenta != ""
        ) {
          document.getElementById("CPNconfirmar_numero_cuenta").value =
            datos.numero_cuenta;
        }
        if (
          document.getElementById("CPNtipo_documento_banco") &&
          datos.tipo_documento_banco != ""
        ) {
          document.getElementById("CPNtipo_documento_banco").value =
            datos.tipo_documento_banco;
        }
        if (
          document.getElementById("CPNnumero_identificacion_banco") &&
          datos.numero_iden_banco != ""
        ) {
          document.getElementById("CPNnumero_identificacion_banco").value =
            datos.numero_iden_banco;
        }
        if (
          document.getElementById("CPNconfirmar_numero_identificacion_banco") &&
          datos.numero_iden_banco != ""
        ) {
          document.getElementById(
            "CPNconfirmar_numero_identificacion_banco"
          ).value = datos.numero_iden_banco;
        }
      }
    });

  $("#cargador-datos-bancarios").remove();
}

function descargarInformeUsuariosAdm(e) {
  const datosDescarga = {
    nombres: "Nombres",
    apellidos: "Apellidos",
    tipo_documento: "Tipo de documento",
    numero_documento: "Número documento",
    contacto: "Celular 1",
    celular2: "Celular 2",
    centro_de_costo: "Centro de costo",
    correo: "Correo",
    nombre_empresa: "Nombre de la empresa",
    "datos_bancarios.banco": "Banco",
    "datos_bancarios.nombre_banco": "Representante banco",
    "datos_bancarios.tipo_de_cuenta": "Tipo de cuenta bancaria",
    "datos_bancarios.numero_cuenta": "Número de cuenta",
    "datos_bancarios.tipo_documento_banco": "Tipo documento bancario",
    "datos_bancarios.numero_iden_banco": "Número identificación banco",
    "datos_personalizados.sistema_interrapidisimo": "Sistema inter",
    "datos_personalizados.sistema_servientrega": "Sistema servi",
    "datos_personalizados.sistema_servientrega": "Sistema servi",
    "datos_personalizados.sistema_envia": "Sistema envia",
    "datos_personalizados.sistema_tcc": "Sistema tcc",
    "bodega_principal.direccion": "Dirección",
    "bodega_principal.ciudad": "Ciudad",
    "bodega_principal.departamento": "Departamento",
  };

  const normalizeObject = (campo, obj) => {
    if (!obj) return "No aplica";
    return obj[campo];
  };

  const transformDatos = (obj) => {
    const res = {};

    obj.bodega_principal = {};
    if (obj.bodegas && obj.bodegas.length) {
      obj.bodega_principal = obj.bodegas[0];
      const bdg = obj.bodega_principal;
      bdg.direccion = `${bdg.direccion.split()}, ${bdg.barrio}`;
      console.log;
      const cdep = bdg.ciudad.slice(0, -1).split("(");
      bdg.ciudad = cdep[0];
      bdg.departamento = cdep[1];
    }

    for (let campo in datosDescarga) {
      const resumen = campo.split(".");
      if (resumen.length > 1) {
        let resultante = obj;

        resumen.forEach((r) => {
          resultante = normalizeObject(r, resultante);
        });

        res[datosDescarga[campo]] = resultante;
      } else {
        res[datosDescarga[campo]] = obj[campo];
      }
    }

    if (obj.objetos_envio) res["Cosas que envía"] = obj.objetos_envio.join();

    return res;
  };

  const loader = new ChangeElementContenWhileLoading(e.target);
  loader.init();

  db.collection("usuarios")
    .get()
    .then((querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push(transformDatos(doc.data()));
      });

      crearExcel(data, "informe Usuarios");
      loader.end();
    });
}

//invocada por el boton para buscar guias
function cambiarFecha() {
  if ($("#contenedor-tabla-historial-guias").css("display") === "none") {
    historialGuias();
  }
}

function limitarSeleccionGuias(limit = 50) {
  $("#tabla-guias")
    .find(".check-guias")
    .change((e) => {
      const checked = $(".check-guias:checked");
      if (checked.length > limit) {
        $(e.target).prop("checked", false);
        Toast.fire({
          icon: "error",
          text:
            "Puede seleccionar como máximo " + limit + " guías por documento",
        });
      }
    });
}

function numberWithCommas(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(".");
}

function mostrarReferidos(datos) {
  let userid = localStorage.getItem("user_id");

  const topeReferidos = document.getElementById("tope-referido");

  firebase
    .firestore()
    .collection("usuarios")
    .doc(userid)
    .get()
    .then((doc) => {
      datos_saldo_usuario = doc.data().datos_personalizados;
      topeUsuario = parseInt(datos_saldo_usuario.tope_referido) || 100000;
      console.log(
        "tope" + topeUsuario,
        "recibo" + datos_saldo_usuario.recibidoReferidos
      );
      topeReferidos.innerHTML = `$${numberWithCommas(topeUsuario) || 100.0}`;

      if (topeUsuario < datos_saldo_usuario.recibidoReferidos) {
        throw new Error(
          "Condición cumplida. No se ejecutará el resto de la función."
        );
      }
    })
    .then(() => {
      let referidos = [];

      firebase
        .firestore()
        .collection("referidos")
        .where("sellerReferente", "==", datos.centro_de_costo)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            if (doc.data().reclamado !== true) referidos.push(doc.data());
          });
        })
        .finally(() => {
          console.log(referidos);
          if (referidos.length > 0) despliegueReferidos(referidos);
        });
    })
    .catch((err) => {
      let mostradorReferidos = document.getElementById("mostrador-referidos");
      mostradorReferidos.classList.remove("d-none");
      mostradorReferidos.innerHTML = `<h3 class="text-center mt-2">¡Felicidades! Has reclamado todos los premios por referir usuarios que teníamos disponibles. ¡Gracias por tu apoyo!</h3>`;
    });
}

function despliegueReferidos(referidos) {
  console.log(referidos);

  let mostradorReferidos = document.getElementById("mostrador-referidos");
  let tituloreferidos = document.getElementById("titulo-referidos");

  mostradorReferidos.classList.remove("d-none");
  tituloreferidos.classList.remove("d-none");

  for (referido of referidos) {
    const htmlCard = `
    <div class="col-md-4 mb-4" >
    <div class="card border-bottom-primary" shadow="h-100 py-2">

    <div class="card-body">
    <div class="row no-gutters align-items-center">
    <div class="h7 font-weight-bold text-primary text-uppercase mb-2">${
      referido.nombreApellido
    }</div>
    <div class="row no-gutters align-items-center">
    <div class="h6 mb-0 mr-3 font-weight-bold">
        <p>Número de envíos: <small>${
          referido.cantidadEnvios < 10 ? referido.cantidadEnvios : "10"
        }</small></p>       
    </div>
    <div>
    
    </div>
    <button class="btn btn-primary text-centered" id="btn-${
      referido.sellerReferido
    }" ${
      referido.cantidadEnvios < 10 ? "disabled" : ""
    }  onclick="agregarSaldo('${referido.cantidadEnvios}','${
      referido.sellerReferente
    }' , '${referido.sellerReferido}')">Reclamar recompensa</button>
</div>

    </div>
    </div>
    </div>
    `;
    mostradorReferidos.innerHTML += htmlCard;
  }

  //
}
function agregarSaldo(envios, referente, referido) {
  //referente
  if (envios < 10) {
    avisar(
      "Error",
      "Este referido aún no cumple con los requisitos para reclamar su recompensa"
    );
    return;
  }

  firebase
    .firestore()
    .collection("referidos")
    .where("sellerReferente", "==", referente)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        console.log(doc.data());
        if (doc.data().sellerReferido == referido) {
          console.log(doc.data());
          doc.ref.update({
            reclamado: true,
          });
        }
      });
    })
    .finally(() => {
      reclamarReferido(referido, referente);

      let boton = document.getElementById(`btn-${referido}`);
      boton.disabled = true;
      avisar("Recompensa reclamada", "Recompensa reclamada con éxito!");
    });
}

/**{@link genFecha}; */

function reclamarReferido(referido, referente) {
  console.log(referente);
  let userid = localStorage.getItem("user_id");
  let fecha = genFecha();
  let datos_saldo_usuario = {};

  const objetoSaldo = {
    saldo: "Aquí muestra como va a quedar el saldo",
    saldo_anterior: "Saldo anterior",
    fecha: fecha,
    diferencia: 0,
    mensaje: `saldo del usuario ${referente} reclamado por referir al usuario ${referido} `,

    //si alguno de estos datos es undefined podría generar error al subirlos
    momento: new Date().getTime(),
    user_id: userid,
    guia: null,
    medio: `Usuario reclama saldo del referido ${referido}`,
    numeroGuia: null,
    type: "REFERIDO",
  };

  let recibidoReferidos;

  firebase
    .firestore()
    .collection("usuarios")
    .doc(userid)
    .get()
    .then((doc) => {
      datos_saldo_usuario = doc.data().datos_personalizados;
      recibidoReferidos = datos_saldo_usuario.recibidoReferidos;

      console.log(recibidoReferidos);

      recibidoReferidos +=
        parseInt(datos_saldo_usuario.premio_referido) || 5000;

      console.log(recibidoReferidos);

      console.log(datos_saldo_usuario);

      objetoSaldo.saldo_anterior = datos_saldo_usuario.saldo;
      objetoSaldo.saldo =
        objetoSaldo.saldo_anterior +
        (parseInt(datos_saldo_usuario.premio_referido) || 5000);
      objetoSaldo.diferencia = objetoSaldo.saldo - objetoSaldo.saldo_anterior;

      const datos = doc.data();

      // Creamos un nuevo objeto con los datos anteriores y el nuevo valor
      const nuevosDatosPersonalizados = {
        ...datos.datos_personalizados, // Mantenemos las propiedades anteriores
        recibidoReferidos: recibidoReferidos, // Agregamos la nueva propiedad con su valor
      };

      console.log(nuevosDatosPersonalizados);

      // Actualizamos el documento con los nuevos datos
      return firebase.firestore().collection("usuarios").doc(userid).update({
        datos_personalizados: nuevosDatosPersonalizados,
      });
    })

    .finally(() => {
      console.log(objetoSaldo);
      actualizarSaldo(objetoSaldo);
    });
}

function copiarData() {
  let textoACopiar = document.getElementById("referal").value;
  navigator.clipboard.writeText(textoACopiar).then(() => {
    avisar(
      "Información copiada con éxito",
      "Se ha copiado el link de referido exitosamente"
    );
  });
}

//Habilitado por una función en Manejador guias, me envia un excel al /excel_to_json en index.js y me devuelve un Json
function cargarPagos() {
  document.querySelector("#cargador-pagos").classList.remove("d-none");
  let data = new FormData(document.getElementById("form-pagos"));
  console.log(data);
  console.log(data.get("documento"));
  fetch("/excel_to_json", {
    method: "POST",
    body: data,
  })
    .then((res) => {
      if (!res.ok) {
        throw Error(
          "Lo sentimos, no pudimos cargar su documento, reviselo y vuelvalo a subir"
        );
      }
      res
        .json()
        .then((datos) => {
          // Me realiza un filtro desde los inputs de admin.html en la pestaña de pagos
          let transportadoras = [],
            numero_flotante = 0;
          let filtro_transportadoras = document.getElementsByName(
            "filtro-trasnportadoras"
          );
          for (let transp of filtro_transportadoras) {
            if (transp.checked) {
              transportadoras.push(transp.value.toLowerCase());
            }
          }
          let filtroInputs = datos.filter(async (data) => {
            let fechaI, fechaF, guia, permitir_transportadora;
            if (
              !Number.isInteger(data["ENVÍO TOTAL"]) ||
              !Number.isInteger(data.RECAUDO) ||
              !Number.isInteger(data["TOTAL A PAGAR"])
            ) {
              numero_flotante += 1;
            }
            if (
              data.TRANSPORTADORA &&
              transportadoras.indexOf(data.TRANSPORTADORA.toLowerCase()) !=
                -1 &&
              transportadoras.length != 0
            ) {
              permitir_transportadora = true;
            } else if (transportadoras.length == 0) {
              permitir_transportadora = true;
            }

            if ($("#filtro-pago-guia").val()) {
              guia = $("#filtro-pago-guia").val();
              return permitir_transportadora && data.GUIA == guia;
            } else {
              fechaI = new Date($("#filtro-fechaI").val()).getTime();
              fechaF = new Date($("#filtro-fechaF").val()).getTime();
              fechaObtenida = fechaI;
              if (data.FECHA != undefined) {
                fechaObtenida = new Date(
                  data.FECHA.split("-").reverse().join("-")
                ).getTime();
              }
              remitente = $("#filtro-pago-usuario").val();
              if (
                $("#fecha-pagos").css("display") != "none" &&
                $("#filtro-pago-usuario").val()
              ) {
                return (
                  permitir_transportadora &&
                  fechaI <= fechaObtenida &&
                  fechaF >= fechaObtenida &&
                  data.REMITENTE.indexOf(remitente) != -1
                );
              } else if ($("#fecha-pagos").css("display") != "none") {
                return (
                  permitir_transportadora &&
                  fechaI <= fechaObtenida &&
                  fechaF >= fechaObtenida
                );
              } else if ($("#filtro-pago-usuario").val()) {
                return (
                  permitir_transportadora &&
                  data.REMITENTE.indexOf(remitente) != -1
                );
              } else {
                return permitir_transportadora;
              }
            }
          });

          if (numero_flotante) {
            alert(
              "He registrado " +
                numero_flotante +
                " fila(s) con números decimales y los he transformado en enteros, revíselo con cuidado"
            );
          }
          // se insertan los datos filtrados
          mostrarPagos(filtroInputs);
        })
        .then(() => {
          let fecha = document.querySelectorAll(
            "td[data-funcion='cambiar_fecha']"
          );
          let todas_fechas = document.querySelectorAll("th[data-id]");
          let botones_pago = document.querySelectorAll(
            "button[data-funcion='pagar']"
          );
          let row_guias = document.querySelectorAll("tr[id]");
          let usuarios = document.querySelectorAll("div[data-usuario]");
          comprobarBoton(fecha);

          //me habilita un evento escucha para cambiar la fecha clickeada
          for (let f of fecha) {
            f.addEventListener("click", (e) => {
              alternarFecha(e.target);
              comprobarBoton(
                e.target.parentNode.parentNode.querySelectorAll(
                  "td[data-funcion='cambiar_fecha']"
                )
              );
            });
          }

          //me habilita un evento para cambiar todas las fechas del seller a la actual
          todas_fechas.forEach((conjunto) => {
            conjunto.addEventListener("click", (e) => {
              let idenficador = e.target.getAttribute("data-id");
              let body = document.getElementById(idenficador);
              let fechas = body.querySelectorAll(
                "td[data-funcion='cambiar_fecha']"
              );
              fechas.forEach((fecha) => {
                alternarFecha(fecha);
              });
              comprobarBoton(fechas);
            });
          });

          //Habilita un evento excucha para cado botón de pagar, que manda toda la info a firebase.collection("pagos")
          botones_pago.forEach((btn) => {
            btn.addEventListener("click", async (e) => {
              const cargador = new ChangeElementContenWhileLoading(e.target);
              cargador.init();
              let guia = e.target.parentNode.querySelectorAll("tr[id]");
              const numero = e.target.parentNode.getAttribute("data-numero");
              const remitente =
                e.target.parentNode.getAttribute("data-usuario");
              const comprobante_bancario = $(
                "#comprobante_bancario" + remitente
              ).val();
              let pagado = 0;
              for await (let g of guia) {
                let celda = g.querySelectorAll("td");
                const FECHA = celda[6].textContent;
                let identificador = g.getAttribute("id");
                await firebase
                  .firestore()
                  .collection("pagos")
                  .doc(celda[1].textContent.toLowerCase())
                  .collection("pagos")
                  .doc(identificador)
                  .set({
                    REMITENTE: celda[0].textContent,
                    TRANSPORTADORA: celda[1].textContent,
                    GUIA: celda[2].textContent,
                    RECAUDO: celda[3].textContent,
                    "ENVÍO TOTAL": celda[4].textContent,
                    "TOTAL A PAGAR": celda[5].textContent,
                    FECHA,

                    timeline: new Date().getTime(),
                    comprobante_bancario: comprobante_bancario || "SCB",
                    cuenta_responsable: celda[8].textContent || "SCR",
                  })
                  .then(() => {
                    firebase
                      .firestore()
                      .collectionGroup("guias")
                      .where("numeroGuia", "==", identificador)
                      .get()
                      .then((querySnapshot) => {
                        querySnapshot.forEach((doc) => {
                          doc.ref
                            .update({ debe: 0 })
                            .then(() => g.classList.add("text-success"));
                        });
                      });

                    pagado += parseInt(celda[5].textContent);
                  });
              }

              let mensaje =
                "Te informamos que se ha realizado una consignación a su cuenta bancaria registrada en Heka entrega por un monto de: " +
                convertirMoneda(pagado);
              if (comprobante_bancario)
                mensaje += " bajo el comprobante Nro.: " + comprobante_bancario;

              const respuestaMensaje = await fetch(
                "/mensajeria/sendMessage?number=57" +
                  numero +
                  "&message=" +
                  mensaje
              ).then((d) => d.json());

              if (respuestaMensaje.success) {
                Swal.fire({
                  icon: "success",
                  text:
                    'Se ha enviado el siguiente mensaje al usuario: "' +
                    mensaje +
                    '"',
                });
              } else {
                Swal.fire({
                  icon: "warning",
                  text:
                    "No se ha podido enviar el siguiente mensaje al usuario: " +
                    mensaje +
                    " - Razón: " +
                    respuestaMensaje.message,
                });
              }

              cargador.end();
            });
          });

          // me revisa todas las guías mostradas, para verificar que no están registrada en firebase
          row_guias.forEach(async (guia) => {
            let identificador = guia.getAttribute("id");
            let transportadora = guia.querySelectorAll("td")[1].textContent;
            let remitente = guia.getAttribute("data-remitente");
            let mostrador_total_local = document.getElementById(
              "total" + remitente
            );
            let btn_local = document.getElementById("pagar" + remitente);
            let total_local = mostrador_total_local.getAttribute("data-total");
            console.log("Antes del algoritmo: ", total_local);
            let mostrador_total = document.getElementById("total_pagos");
            let total = mostrador_total.getAttribute("data-total");

            let datos_guia = await firebase
              .firestore()
              .collectionGroup("guias")
              .where("numeroGuia", "==", identificador)
              .get()
              .then((querySnapshot) => {
                let datos;
                let row_guia_actual = guia.children[7];
                row_guia_actual.textContent =
                  " La guía no se encuentra en la base de datos";
                querySnapshot.forEach((doc) => {
                  datos = doc.data();
                });
                return datos;
              });

            let usuario_corporativo = await firebase
              .firestore()
              .collection("usuarios")
              .where("centro_de_costo", "==", remitente)
              .get()
              .then((querySnapshot) => {
                let usuario_corporativo = false;
                querySnapshot.forEach((doc) => {
                  if (doc.data().usuario_corporativo)
                    usuario_corporativo = true;
                });
              });

            firebase
              .firestore()
              .collection("pagos")
              .doc(transportadora.toLocaleLowerCase())
              .collection("pagos")
              .doc(identificador.toString())
              .get()
              .then((doc) => {
                let existe;

                if (doc.exists) {
                  guia.setAttribute(
                    "data-ERROR",
                    "La Guía " +
                      identificador +
                      " ya se encuentra registrada en la base de datos, verifique que ya ha sido pagada."
                  );
                  guia.classList.add("text-success");

                  mostrador_total_local = document.getElementById(
                    "total" + remitente
                  );
                  btn_local = document.getElementById("pagar" + remitente);
                  total_local =
                    mostrador_total_local.getAttribute("data-total");

                  mostrador_total = document.getElementById("total_pagos");
                  total = mostrador_total.getAttribute("data-total");

                  console.log(total_local);
                  total -= parseInt(guia.children[5].textContent);
                  total_local -= parseInt(guia.children[5].textContent);
                  mostrador_total_local.setAttribute("data-total", total_local);
                  mostrador_total_local.classList.add("text-success");
                  btn_local.textContent =
                    "Por Pagar $" + convertirMiles(total_local);
                  mostrador_total_local.textContent =
                    "$" + convertirMiles(total_local);
                  mostrador_total.setAttribute("data-total", total);
                  mostrador_total.textContent =
                    "Total $" + convertirMiles(total);
                  comprobarBoton(fecha);
                  existe = true;
                }

                if (datos_guia) {
                  // Para mostrar el tipo cuenta_responsable es de empresa o personal y guardarlo
                  guia.children[8].textContent =
                    datos_guia.cuenta_responsable || "Personal";

                  let row_guia_actual = guia.children[7];
                  row_guia_actual.textContent =
                    datos_guia.type || "PAGO CONTRAENTREGA";
                  if (datos_guia.centro_de_costo != remitente) {
                    row_guia_actual.textContent +=
                      " El centro de costo de la guía subida no coincide con el registrado en la base de datos.\n";
                  }

                  if (!datos_guia.debe || usuario_corporativo) {
                    row_guia_actual.textContent += " La guía fue descontada.";
                    if (!existe) sumarCostoEnvio(guia, remitente);
                  } else {
                    row_guia_actual.textContent +=
                      " Falta por descontar $" +
                      convertirMiles(Math.abs(datos_guia.debe));
                  }
                }

                totalizador(guia, remitente);
              });
          });

          usuarios.forEach((usuario) => {
            let remitente = usuario.getAttribute("data-usuario");
            let tipo_usuario = document.createElement("p");
            let bank_info = document.createElement("div");

            tipo_usuario.textContent =
              "Usuario no Encontrado en la base de Datos, (manéjelo con precaución)";
            tipo_usuario.classList.add("text-center");
            firebase
              .firestore()
              .collection("usuarios")
              .where("centro_de_costo", "==", remitente)
              .get()
              .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                  const docBank = doc.data().datos_bancarios;
                  if (doc.data().usuario_corporativo) {
                    tipo_usuario.textContent = "Usuario Corporativo";
                  } else {
                    tipo_usuario.textContent = "Usuario no Corporativo";
                  }

                  if (docBank) {
                    bank_info.innerHTML = `<div class="dropdown">
                  <button class="btn btn-secondary btn-sm dropdown-toggle" type="button" id="dropdown-${
                    doc.data().centro_de_costo
                  }" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Información Bancaria
                  </button>
                  <div class="dropdown-menu" aria-labelledby="dropdown-${
                    doc.data().centro_de_costo
                  }">
                    <h6 class="dropdown-item">${docBank.banco}</h6>
                    <h6 class="dropdown-item">Representante: ${
                      docBank.nombre_banco
                    }</h6>
                    <h6 class="dropdown-item">${docBank.tipo_de_cuenta}: ${
                      docBank.numero_cuenta
                    }</h6>
                      <h6 class="dropdown-item">${
                        docBank.tipo_documento_banco
                      } - ${docBank.numero_iden_banco}</h6>
                </div>`;
                    usuario.insertBefore(bank_info, usuario.firstChild);
                    usuario.parentNode.insertBefore(tipo_usuario, usuario);
                  }

                  usuario.setAttribute("data-numero", doc.data().celular);
                });
              });
          });

          //alterna las fechas entre la actual o la del documento ingresado
          function alternarFecha(contenido) {
            let actual = genFecha("LR");
            if (contenido.textContent != actual) {
              contenido.textContent = actual;
            } else {
              contenido.textContent = contenido.getAttribute("data-fecha");
            }
          }

          //Función importante que me habiita los pagos, dependiendo de la condicion de cada guia del usuario
          function comprobarBoton(elementos) {
            let desactivar = false;
            let identificador = [];
            for (let e of elementos) {
              identificador.push(e.getAttribute("data-id"));
              document
                .getElementById(e.getAttribute("data-id"))
                .querySelectorAll("p")
                .forEach((e) => e.remove());
            }
            elementos.forEach((elemento, i) => {
              let err = elemento.parentNode.getAttribute("data-error");
              if (err) {
                desactivar = true;
                let aviso = document.createElement("p");
                aviso.innerHTML = err;
                aviso.setAttribute("class", "text-danger border p-2");
                document
                  .getElementById(identificador[i])
                  .insertBefore(
                    aviso,
                    document.getElementById("pagar" + identificador[i])
                  );
              } else if (
                elemento.textContent == "undefined" ||
                elemento.textContent == ""
              ) {
                desactivar = true;
              }

              if (!desactivar) {
                document
                  .getElementById("pagar" + identificador[0])
                  .removeAttribute("disabled");
              } else {
                document
                  .getElementById("pagar" + identificador[0])
                  .setAttribute("disabled", "");
              }
            });
          }

          function sumarCostoEnvio(guia, remitente) {
            const mostrador_total_local = document.getElementById(
              "total" + remitente
            );
            const btn_local = document.getElementById("pagar" + remitente);

            let total_local = mostrador_total_local.getAttribute("data-total");
            let mostrador_total = document.getElementById("total_pagos");
            let total = mostrador_total.getAttribute("data-total");
            let recaudo = parseInt(guia.children[4].textContent);

            guia.children[5].textContent = guia.children[3].textContent;
          }

          document.querySelector("#cargador-pagos").classList.add("d-none");
        });
    })
    .catch((err) => {
      avisar("Algo salió mal", err, "advertencia");
      document.querySelector("#cargador-pagos").classList.add("d-none");
    });
}

//me consulta los pagos ya realizados y los filtra si es necesario
$("#btn-revisar_pagos").click(async (e) => {
  console.log(e.target);
  document.querySelector("#cargador-pagos").classList.remove("d-none");
  let fechaI = new Date($("#filtro-fechaI").val()).setHours(0) + 8.64e7,
    fechaF = new Date($("#filtro-fechaF").val()).setHours(0) + 2 * 8.64e7,
    guia;

  const filtroFechaActivo = $("#fecha-pagos").css("display") != "none";

  const referenceNatural = (b) =>
    firebase.firestore().collection("pagos").doc(b).collection("pagos");

  const referenceSorted = (b) =>
    referenceNatural(b)
      .orderBy("momentoParticularPago")
      .startAt(fechaI)
      .endAt(fechaF);

  let reference = (b) => referenceSorted(b);

  if (!administracion) {
    const referenciaClave = filtroFechaActivo
      ? referenceSorted
      : referenceNatural;

    reference = (b) =>
      referenciaClave(b).where(
        "REMITENTE",
        "==",
        datos_usuario.centro_de_costo
      );
  }

  if ($("#filtro-pago-usuario").val()) {
    const referenciaClave = filtroFechaActivo
      ? referenceSorted
      : referenceNatural;

    reference = (b) =>
      referenciaClave(b).where(
        "REMITENTE",
        "==",
        $("#filtro-pago-usuario").val()
      );
  }

  if ($("#filtro-cuenta_responsable").val()) {
    reference = (b) =>
      referenceNatural(b).where(
        "cuenta_responsable",
        "==",
        $("#filtro-cuenta_responsable").val()
      );
  }

  if ($("#filtro-pago-guia").val()) {
    guia = $("#filtro-pago-guia").val();

    reference = (b) => referenceNatural(b).where("GUIA", "==", guia);
  }

  let transportadoras = [];
  let filtro_transportadoras = document.getElementsByName(
    "filtro-trasnportadoras"
  );
  for (let transp of filtro_transportadoras) {
    if (transp.checked) {
      transportadoras.push(transp.value);
    }
  }

  if (transportadoras.length == 0) {
    transportadoras = [
      "SERVIENTREGA",
      "ENVIA",
      "TCC",
      "INTERRAPIDISIMO",
      "COORDINADORA",
    ];
  }

  let response = [];
  let consulta = 0;
  for await (let busqueda_trans of transportadoras) {
    await reference(busqueda_trans)
      .get()
      .then((querySnapshot) => {
        consulta += querySnapshot.size;
        querySnapshot.forEach((doc) => {
          let data = doc.data();
          let fecha_estandar = doc.data().FECHA.split("-").reverse().join("-");
          data.momento = new Date(fecha_estandar).getTime();

          response.push(data);
        });

        if (!administracion) {
          response = response.filter(
            (d) => d.REMITENTE == datos_usuario.centro_de_costo
          );
        }
      });
    console.log("total consulta", consulta);
    console.log(busqueda_trans);
  }

  if (administracion) {
    mostrarPagosAdmin(response);
    $("[data-funcion='pagar']").css("display", "none");
    document.querySelector("#cargador-pagos").classList.add("d-none");

    let row_guias = document.querySelectorAll("tr[id]");
    for (let guia of row_guias) {
      const remitente = guia.getAttribute("data-remitente");
      totalizador(guia, remitente);
    }
  } else {
    mostrarPagosUsuario(response);
    document.querySelector("#cargador-pagos").classList.add("d-none");
  }
});

$("#btn-descargar_facturas").click(consultarFacturasGuardadasAdmin);
async function consultarFacturasGuardadasAdmin() {
  const l = new ChangeElementContenWhileLoading(this);
  l.init();

  let fechaI = new Date($("#filtro-fechaI").val()).setHours(0) + 8.64e7,
    fechaF = new Date($("#filtro-fechaF").val()).setHours(0) + 2 * 8.64e7;

  const referencia = firebase
    .firestore()
    .collection("paquetePagos")
    .orderBy("timeline")
    .startAt(fechaI)
    .endAt(fechaF);

  const facturas = [];
  await referencia.get().then((q) => {
    q.forEach((d) => {
      const data = d.data();

      facturas.push(data);
    });
  });

  const usuarioCargados = new Map();
  const promiseFacturas = facturas.map(async (f) => {
    const id_user = f.id_user;
    if (!usuarioCargados.has(id_user)) {
      const respuestaUsuario = await db
        .collection("usuarios")
        .doc(id_user)
        .get()
        .then((d) => (d ? d.data() : null));

      usuarioCargados.set(id_user, respuestaUsuario);
    }

    const info_usuario = usuarioCargados.get(id_user);
    let identificacion, nombre_completo;
    if (info_usuario) {
      identificacion = info_usuario.numero_documento;
      nombre_completo = info_usuario.nombres + " " + info_usuario.apellidos;
    }

    const strFecha = genFecha("LR", f.timeline).replace(/\-/g, "/");
    const jsonArchivo = {
      "Centro de costo": f.centro_de_costo,
      "COMISION HEKA": f.comision_heka,
      "TOTAL A PAGAR": f.total_pagado,
      CEDULA: identificacion,
      TERCERO: nombre_completo,
      FACTURA: f.num_factura,
      "Fecha elaboración": strFecha,
    };

    return jsonArchivo;
  });

  const dataDescarga = await Promise.all(promiseFacturas);

  console.log(dataDescarga);
  crearExcel(
    dataDescarga,
    `Informe Facturas ${genFecha("LR", fechaI)} ${genFecha("LR", fechaF)}`
  );

  l.end();
}

function totalizador(guia, remitente) {
  const mostrador_total_local = document.getElementById("total" + remitente);
  const btn_local = document.getElementById("pagar" + remitente);

  let total_local = mostrador_total_local.getAttribute("data-total");
  let mostrador_total = document.getElementById("total_pagos");
  let total = mostrador_total.getAttribute("data-total");
  let recaudo = parseInt(guia.children[4].textContent);

  total = parseInt(total) + parseInt(guia.children[5].textContent);
  mostrador_total.setAttribute("data-total", total);
  mostrador_total.textContent = "Total $" + convertirMiles(total);
  total_local = parseInt(total_local) + parseInt(guia.children[5].textContent);
  mostrador_total_local.setAttribute("data-total", total_local);
  btn_local.textContent = "Por Pagar $" + convertirMiles(total_local);
  mostrador_total_local.textContent = "$" + convertirMiles(total_local);
}

//Muestra la situación de los pagos a consultar, recibe un arreglo de datos y los organiza por seller automáticamente
function mostrarPagos(datos) {
  const visor_pagos = document.getElementById("visor_pagos");
  visor_pagos.innerHTML = "";
  let centros_costo = [];
  datos.forEach((D, i) => {
    if (!D.GUIA) {
      D.ERROR = "Sin número de guía para subir: " + D.GUIA;
    } else if (!D.TRANSPORTADORA) {
      D.ERROR =
        "Lo siento, no se a que transportadora subir la guía: " + D.GUIA;
    } else if (
      D.TRANSPORTADORA.toLowerCase() !== "servientrega" &&
      D.TRANSPORTADORA.toLowerCase() != "envía" &&
      D.TRANSPORTADORA.toLowerCase() != "tcc" &&
      D.TRANSPORTADORA.toLowerCase() != "interrapidisimo"
    ) {
      D.ERROR =
        "Por favor, Asegurate que la factura de la guía: " +
        D.GUIA +
        " le pertenezca a <b>Envía, TCC, Servientrega o Interrapidisimo</b>";
    }
    datos.forEach((d, j) => {
      if (i != j) {
        if (D.GUIA == d.GUIA) {
          d.ERROR =
            "Este Número de guía: " +
            D.GUIA +
            " se encuentra duplicado, por favor verifique su documento y vuelvalo a subir.";
        }
      }
    });

    if (!D.REMITENTE) {
      alert(
        "Por favor, verifique tener registrado todos lo seller, de otra manera no se podrá continuar"
      );
      datos = [];
      return [];
    }
  });
  datos
    .sort((a, b) => {
      if (a["REMITENTE"] > b["REMITENTE"]) {
        return 1;
      } else if (a["REMITENTE"] < b["REMITENTE"]) {
        return -1;
      } else {
        return 0;
      }
    })
    .reduce(
      (a, b) => {
        if (a["REMITENTE"] != b["REMITENTE"]) {
          centros_costo.push(b["REMITENTE"]);
        }
        return b;
      },
      { REMITENTE: "" }
    );

  const dowloader = document.createElement("button");
  dowloader.classList.add("btn", "btn-outline-dark", "btn-block", "my-2");
  dowloader.setAttribute("id", "descargar-pagos");
  dowloader.innerText = "Descargar visibles";
  visor_pagos.appendChild(dowloader);

  const toDownload = datos.map((data) => {
    const down = Object.assign({}, data);
    delete down.momento;
    return down;
  });

  for (let user of centros_costo) {
    let filtrado = datos.filter((d) => d.REMITENTE == user);
    tablaPagos(filtrado, "visor_pagos");
  }

  let total = datos.reduce(function (a, b) {
    return a + parseInt(b["TOTAL A PAGAR"]);
  }, 0);

  // <h2 class="text-right mt-4" id="total_pagos" data-total="${total}">Total:  $${convertirMiles(total)}</h2>
  document.getElementById("visor_pagos").innerHTML += `
    <h2 class="text-right mt-4" id="total_pagos" data-total="0">Total:  $${convertirMiles(
      0
    )}</h2>
  `;

  visor_pagos
    .querySelector("#descargar-pagos")
    .addEventListener("click", () => {
      crearExcel(toDownload, "Historial de pagos");
    });

  activarBotonesVisorPagos();
}

function mostrarPagosAdmin(datos) {
  const visor_pagos = document.getElementById("visor_pagos");
  visor_pagos.innerHTML = "";
  let centros_costo = [];

  datos
    .sort((a, b) => {
      if (a["REMITENTE"] > b["REMITENTE"]) {
        return 1;
      } else if (a["REMITENTE"] < b["REMITENTE"]) {
        return -1;
      } else {
        return 0;
      }
    })
    .reduce(
      (a, b) => {
        if (a["REMITENTE"] != b["REMITENTE"]) {
          centros_costo.push(b["REMITENTE"]);
        }
        return b;
      },
      { REMITENTE: "" }
    );

  const dowloader = document.createElement("button");
  dowloader.classList.add("btn", "btn-outline-dark", "btn-block", "my-2");
  dowloader.setAttribute("id", "descargar-pagos");
  dowloader.innerText = "Descargar visibles";
  visor_pagos.appendChild(dowloader);

  const toDownload = datos.map((data) => {
    const down = Object.assign({}, data);
    delete down.momento;
    return down;
  });

  for (let user of centros_costo) {
    let filtrado = datos.filter((d) => d.REMITENTE == user);
    tablaPagos(filtrado, "visor_pagos");
  }

  // <h2 class="text-right mt-4" id="total_pagos" data-total="${total}">Total:  $${convertirMiles(total)}</h2>
  document.getElementById("visor_pagos").innerHTML += `
    <h2 class="text-right mt-4" id="total_pagos" data-total="0">Total:  $${convertirMiles(
      0
    )}</h2>
  `;

  visor_pagos
    .querySelector("#descargar-pagos")
    .addEventListener("click", () => {
      crearExcel(toDownload, "Historial de pagos");
    });

  activarBotonesVisorPagos();
}

const paqueteGuiasPagadas = {
  guias: new Map(),
  facturas: new Map(),
};

function activarBotonesVisorPagos() {
  $("[data-action='ver-factura']").click(async (e) => {
    const trget = e.target;
    const numeroGuia = trget.getAttribute("data-guia");
    const loader = new ChangeElementContenWhileLoading(trget);
    loader.init();

    const finalizar = (...args) => {
      console.log(args);
      Toast.fire(...args);
      loader.end();
    };

    try {
      if (!paqueteGuiasPagadas.guias.has(numeroGuia)) {
        const paquete = await obtenerFacturaRegistradaPorGuia(numeroGuia);

        console.log(paquete, numeroGuia);

        if (!paquete)
          return finalizar("Esta guía no fue facturada", "", "error");
      }

      const { idFactura } = paqueteGuiasPagadas.guias.get(numeroGuia);

      if (!paqueteGuiasPagadas.facturas.has(idFactura)) {
        const factura = await fetch("/siigo/pdfFactura/" + idFactura).then(
          (d) => d.json()
        );

        console.log(factura);
        if (!factura.base64)
          return finalizar("No se pudo cargar la factura.", "", "error");

        paqueteGuiasPagadas.facturas.set(idFactura, factura.base64);
      }

      const base64 = paqueteGuiasPagadas.facturas.get(idFactura);

      if (base64) {
        paqueteGuiasPagadas.facturas.set(idFactura, base64);
        openPdfFromBase64(base64);
      }

      loader.end();
    } catch (e) {
      console.log(e);
      loader.end();
      finalizar("Error al cargar la información.", "", "error");
    }
  });
}

async function obtenerFacturaRegistradaPorGuia(numeroGuia) {
  const guiasEstablecidas = paqueteGuiasPagadas.guias;
  if (guiasEstablecidas.has(numeroGuia))
    return guiasEstablecidas.get(numeroGuia);

  const referencia = db
    .collection("paquetePagos")
    .where("guiasPagadas", "array-contains", numeroGuia);

  const paquete = await referencia.get().then((q) => {
    if (q.size) {
      return q.docs[0].data();
    }

    return null;
  });

  if (!paquete) return null;

  const guiasPagadas = paquete.guiasPagadas;
  const idFactura = paquete.id_factura;
  guiasPagadas.forEach((g) => {
    paqueteGuiasPagadas.guias.set(g, {
      idFactura,
      comision_heka: paquete.comision_heka,
    });
  });

  return guiasEstablecidas.get(numeroGuia);
}

function mostrarPagosUsuario(data) {
  $("#visor-pagos").DataTable({
    data: data,
    destroy: true,
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json",
    },
    lengthMenu: [
      [-1, 10, 25, 50, 100],
      ["Todos", 10, 25, 50, 100],
    ],
    columnDefs: [{ className: "cell-border" }],
    columns: [
      { data: "TRANSPORTADORA", title: "Transportadora" },
      { data: "GUIA", title: "Guía" },
      { data: "FECHA", title: "Fecha" },
      { data: "RECAUDO", title: "Recaudo" },
      { data: "ENVÍO TOTAL", title: "Envío Total" },
      { data: "TOTAL A PAGAR", title: "Total a Pagar" },
      { data: "COMISION HEKA", title: "Comisión Heka", defaultContent: "" },
      { data: "referencia", title: "Referencia", defaultContent: "No aplica" },
      { data: "momento", title: "Momento", visible: false },
    ],
    dom: "Bfrtip",
    buttons: [
      {
        extend: "excel",
        text: "Descargar",
        filename: "Repote pagos",
        exportOptions: {
          columns: ":visible",
        },
      },
    ],
    //Es importante organizarlo por fecha de manera específica, para poder segmentarlo
    order: [[8, "desc"]],
    fixedHeader: { footer: true },
    drawCallback: function (settings) {
      //Me realiza una sumatoria de todos los elementos de una columna y los coloca en un footer
      let api = this.api();

      var rows = api.rows({ page: "current" }).nodes();
      var last = null;

      //función del Datatable que me coloca una fila completa para segmentarlo por fecha
      api
        .column(2, { page: "current" })
        .data()
        .each(function (group, i) {
          if (last !== group) {
            $(rows)
              .eq(i)
              .before(
                //Ingresa la siguiente fila antes de cada grupo para que el usuario identifique el segmento en el que se encuentra
                '<tr class="group text-center text-primary"><td colspan="8">Pagos Realizados el ' +
                  group +
                  "</td></tr>"
              );

            last = group;
          }
        });

      //la sumatoria de la columna cinco en toda la consulta
      total = api
        .column(5)
        .data()
        .reduce((a, b) => {
          return parseInt(a) + parseInt(b);
        }, 0);

      //La sumatoria de la columna cinco en la página actual
      pageTotal = api
        .column(5, { page: "current" })
        .data()
        .reduce((a, b) => {
          return parseInt(a) + parseInt(b);
        }, 0);

      console.log(pageTotal);
      //Finalmente muestro los totales en el footer
      $(this).children("tfoot").html(`
        <tr>
            <td colspan="4"></td>
            <td colspan="2"><h4>$${convertirMiles(
              pageTotal
            )} (total: $${convertirMiles(total)})</h4></td>
        </tr>
        `);
      $(api.column(4).footer()).html(
        `$${convertirMiles(pageTotal)} (${convertirMiles(total)} : total)`
      );
    },
    initComplete: function () {
      //a lfinalizar la carga de datos, filtro las fechas para llenar un select
      let column = this.api().column(2);
      let totales = this.api().column(5).nodes();

      //me aseguro de agegar el select en un nodo vacío para que no se dupliquen por cada consulta
      let select = $(
        '<select class="form-control mb-3"><option value="">Seleccione fecha</option></select>'
      )
        .appendTo($("#filtrar-fecha-visor-pagos").empty())
        .on("change", function () {
          let val = $.fn.dataTable.util.escapeRegex($(this).val());

          //realiza una busqueda en la columna especificada anteriormente para aquellos valores que coincidad
          // y me reescribe la tabla con los tados filtrados
          column.search(val ? "^" + val + "$" : "", true, false).draw();
        });

      column
        .data()
        .unique()
        .each(function (d, j) {
          //Toma aquellas fechas diferentes de la anterios y me crea un option por cada una

          //reviso todos los totales correspondientes a la fecha filtrada para agregarle también el total
          let sum = 0;
          $(totales)
            .parent()
            .each(function () {
              if ($(this).children(":eq(2)").text() == d) {
                sum += parseInt($(this).children(":eq(5)").text());
              }
            });

          //finalmente agrega el option para pder filtrar por fecha
          select.append(
            '<option value="' +
              d +
              '">' +
              d +
              " - Total pagado: $" +
              convertirMiles(sum) +
              "</option>"
          );
        });

      $("#visor-pagos_info").removeClass("dataTables_info");
      $("#visor-pagos_info").addClass("text-center");
    },
  });
}

$("#calcular-pagos_pendientes").click(pagosPendientesParaUsuario);
$("#solicitar-pagos_pendientes").click(solicitarPagosPendientesUs);
$(".mostrar-saldo_pendiente + i").click(showHidePagosPendientesUsuario);
let saldo_pendiente = 0;
async function pagosPendientesParaUsuario() {
  const viewer = $(".mostrar-saldo_pendiente");
  const details = $("#detalles_pagos-home");
  const filtroFecha = $("#fecha_cargue-pagos_pendientes");
  viewer.text("Calculando...");
  saldo_pendiente = 0;

  // Cómputo para calcular hasta el último viernes
  const fecha = new Date(filtroFecha.val());
  const diaSemana = fecha.getDay();
  const diaEnMilli = 8.64e7;

  let dia = fecha.getDate() + 1;
  // const diasARestar = 1;
  if (diaSemana <= 5 && false) {
    dia -= diaSemana;
  }

  const fechaMostrarMilli = fecha.getTime();
  const fechaFinal = genFecha("LR", fechaMostrarMilli);
  const endAtMilli = fechaMostrarMilli + diaEnMilli;
  // Fin de cómputo

  $("#infoExtra-usuario").text("Guías entregadas hasta el " + fechaFinal);
  $("#infoExtra-usuario").attr(
    "title",
    "Se han cargado los pagos que corresponden a la fecha del " + fechaFinal
  );

  await firebase
    .firestore()
    .collection("pendientePorPagar")
    .where("REMITENTE", "==", datos_usuario.centro_de_costo)
    .orderBy("timeline")
    .endAt(endAtMilli)
    .get()
    .then((querySnapshot) => {
      saldo_pendiente = 0;
      details.html("");
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const saldo = data["TOTAL A PAGAR"];

        saldo_pendiente += saldo;
        details.append(
          `<li class="list-group-item">${data.GUIA} ---> ${convertirMoneda(
            saldo
          )}</li>`
        );
      });
    });

  viewer.text(convertirMoneda(saldo_pendiente));
}

function obtenerMensajeDesembolso() {
  const mensajes2 =
    "<h2> Pago solicitado ✅</h2>  <br/>  Si solicitaste tu pago entre las 8 am - 6 pm lo recibirás al siguiente día habil, si realizas la solicitud fuera de ese horario, el pago llegará al segundo día hábil. <br/> e el pago se realizará durante el transcurso del día, sin un horario específico, ya que está programado.";
  return mensajes2;
  // const mensajes = ["Pago solicitado  ✅ ",
  //  "Tu pago ya fue solicitado, esta listo para desembolso en en el próximo día de pago, ya que nuestros días de pago son de lunes a viernes 😊",
  //   "Tu pago ya fue solicitado, esta listo para desembolso en MÁS de 24 horas, puesto que nuestros horarios de pago son de 8:00 am a 6:00 pm de Lunes a Viernes 😊"];
  // const lunJue = [8, 18, 0]; // hora inicial, hora final, index mensaje
  // const vieSab = [8, 13, 1];
  // const mensajeHor = [[0, 0, 3], lunJue, lunJue, lunJue, lunJue, vieSab, vieSab];
  // const hora = new Date().getHours();
  // const dia = new Date().getDay();
  // const horario = mensajeHor[dia];
  // const [hi, hf, i] = horario;

  // return hi <= hora && hf > hora ? mensajes[i] : mensajes[mensajes.length - 1];
}
const datosUsuario = localStorage.getItem("user_id");

console.log(datosUsuario);

async function solicitarPagosPendientesUs() {
  const datosUsuario = localStorage.getItem("user_id");

  console.log(datosUsuario)

// if(datosUsuario == "zGR9EbRKEQGRxIMfKiu4"){
//   return Swal.fire(" Desactivación Temporal de la Función de Solicitar Pagos", "Hemos desactivado temporalmente la función de solicitar pagos. Estamos trabajando en la solución y te mantendremos informado.", "error");

// }

  const mensajeDesembolso = obtenerMensajeDesembolso();
  const minimo_diario = 3000000;
  const ref = db.collection("infoHeka").doc("manejoUsuarios");
  const data = await ref.get().then((d) => d.data());

  const transportadoras = [
    "SERVIENTREGA",
    "ENVIA",
    "TCC",
    "INTERRAPIDISIMO",
    "COORDINADORA",
  ];
  const verPago = (t) =>
    db
      .collection("pagos")
      .doc(t)
      .collection("pagos")
      .where("REMITENTE", "==", datos_usuario.centro_de_costo)
      .limit(1)
      .get()
      .then((q) => !!q.docs[0]);

  const hayPagoAnterior = await Promise.all(transportadoras.map(verPago));

  console.log(hayPagoAnterior);

  if (!hayPagoAnterior.some(Boolean))
    return Swal.fire(
      "Se ha detectado que no hay registro de pago previo.",
      "Por favor, para poder continuar, es necesario que nos envíes tu RUT (En caso de no contar con RUT la cedula en foto legible o PDF) a el correo electrónico atencion@hekaentrega.co esto se realiza con la finalidad de validación de datos.",
      "error"
    );

  if (!data) return;

  const { limitadosDiario, diarioSolicitado, fechaSolicitud } = data;

  if (!datos_usuario.datos_bancarios)
    return Swal.fire(
      "No puede solicitar pagos",
      "Por favor, para poder continuar, es necesario que nos envíes tu RUT (En caso de no contar con RUT la cedula en foto legible o PDF) a el correo electrónico atencion@hekaentrega.co esto se realiza con la finalidad de validación de datos. Adicional debes registrar datos bancarios para tener donde realizar el deposito del dinero.",
      "error"
    );

  if (saldo_pendiente == 0) {
    const mensaje = "No puedes solicitar tu pago ya que no tienes saldo";
    return Swal.fire({
      icon: "warning",
      title: "No tienes saldo",
      html: mensaje,
      showCancelButton: false,
      confirmButtonText: "Aceptar",
    });
  }

  if (saldo_pendiente < 0) {
    const mensaje =
      "No puedes solicitar tu pago ya que tienes saldo negativo en tu cuenta";
    return Swal.fire({
      icon: "warning",
      title: "Solicitando pago",
      html: mensaje,
      showCancelButton: false,
      confirmButtonText: "Aceptar",
    });
  }

  if (diarioSolicitado.includes(datos_usuario.centro_de_costo))
    return Swal.fire("", mensajeDesembolso, "info");

  let fechaActual = new Date();

  // Definir opciones de formato
  const opcionesFormato = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  };

  // Formatear la fecha actual
  const fechaFormateada = fechaActual.toLocaleDateString(
    "es-ES",
    opcionesFormato
  );

  const fechaEnviada = `${datos_usuario.centro_de_costo} solicito el pago el <br> ${fechaFormateada}`;

  if (saldo_pendiente < minimo_diario) {
    const mensaje =
      "Estás a punto de solicitar pago con un monto inferior a " +
      minimo_diario +
      " por lo tanto podrá solicitarlo una vez a la semana.<br> ¿Estás seguro de solicitar el pago?";
    const resp = await Swal.fire({
      icon: "warning",
      title: "Solicitando pago",
      html: mensaje,
      showCancelButton: true,
      cancelButtonText: "No",
      confirmButtonText: "Si",
    });

    if (!resp.isConfirmed) return;

    if (!data) return;

    const usuario = datos_usuario.centro_de_costo;

    if (limitadosDiario.includes(usuario)) {
      Swal.fire(
        "Has excedido el cupo de pagos por esta semana.",
        "Error solicitando pago",
        "error"
      );
      return;
    } else {
      limitadosDiario.push(usuario);
    }

    if (!diarioSolicitado.includes(usuario)) diarioSolicitado.push(usuario);

    // const actualizacion = {
    //   diarioSolicitado: firebase.firestore.FieldValue.arrayUnion(datos_usuario.centro_de_costo),
    //   limitadosDiario: firebase.firestore.FieldValue.arrayUnion(datos_usuario.centro_de_costo)
    // }

    if (!fechaSolicitud.includes(fechaEnviada))
      fechaSolicitud.push(fechaEnviada);

    await ref.update({ limitadosDiario, diarioSolicitado, fechaSolicitud });
    Swal.fire("Pago solicitado con éxito.", "", "success");
  } else {
    const mensaje =
      "Estás a punto de solicitar pago con un monto superior a " +
      minimo_diario +
      ".<br> ¿Estás seguro de solicitar el pago?";

    const resp = await Swal.fire({
      icon: "warning",
      title: "Solicitando pago",
      html: mensaje,
      showCancelButton: true,
      cancelButtonText: "No",
      confirmButtonText: "Si",
    });

    if (!resp.isConfirmed) return;

    // const data = await ref.get().then(d => d.data());
    if (!data) return;

    console.log(datos_usuario.centro_de_costo);
    // return;

    if (
      !diarioSolicitado.includes(datos_usuario.centro_de_costo) &&
      !fechaSolicitud.includes(fechaEnviada)
    ) {
      diarioSolicitado.push(datos_usuario.centro_de_costo);
      console.log(fechaEnviada);
      fechaSolicitud.push(
        `${datos_usuario.centro_de_costo} solicito el pago el <br> ${fechaFormateada}`
      );
      await ref.update({ diarioSolicitado, fechaSolicitud });
    }

    // const actualizacion = {
    //   diarioSolicitado: firebase.firestore.FieldValue.arrayUnion("prueba"),
    // }

    // console.log(actualizacion);

    Swal.fire("Pago solicitado con éxito.", "", "success");
  }
}

function showHidePagosPendientesUsuario(e) {
  $(e.target).toggleClass("fa-caret-down");
  $(e.target).toggleClass("fa-caret-up");
  $("#detalles_pagos-home").toggleClass("d-none");
}

function descargarExcelPagosAdmin(datos) {
  console.log(datos);
  console.log("Funciona?");
}

function cerrarSession() {
  localStorage.clear();
}

const inputFlexii = document.querySelector("#inputIDGuiaFlexii");
const botonInputFlexii = document.querySelector("#boton-idPunto");

const urlParams = new URLSearchParams(window.location.search);
const valorQuery = urlParams.get("idguia");
const userquery = urlParams.get("iduser");

if (valorQuery) {
  inputFlexii.setAttribute("value", valorQuery);
}
let id_punto = localStorage.getItem("user_id");

botonInputFlexii.onclick = function () {
  db.collection("usuarios")
    .doc(id_punto)
    .get()
    .then((doc) => {
      if (doc.data().type === "PUNTO") {
        db.collection("usuarios")
          .doc(userquery)
          .collection("guias")
          .where("id_heka", "==", valorQuery)
          .get()
          .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              console.log(doc.data());
              if (doc.data().id_punto == id_punto) {
                return Swal.fire({
                  icon: "success",
                  text: "Esta guía ya está registrada en tu punto",
                });
              }
              if (doc.data().id_punto !== id_punto) {
                return Swal.fire({
                  icon: "success",
                  text: "Esta guía ya está registrada en otro punto",
                });
              }
              doc.ref.update({ id_punto: id_punto });
              return Swal.fire({
                icon: "success",
                text: "Guía registrada con éxito",
              });
            });
          });
      } else {
        return Swal.fire({
          icon: "error",
          text: "No tienes permisos para registrar guías",
        }).then(() => {
          window.location.replace("/plataforma2.html");
        });
      }
    });
};
