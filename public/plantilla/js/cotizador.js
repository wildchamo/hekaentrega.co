// $("#xx").empty();
let datos_de_cotizacion,
  oficinas = [],
  bodega,
  datos_a_enviar = new Object({}),
  codTransp = "SERVIENTREGA";

// No se encuentra pueblo viejo(magdalena), nazaret(cundinamarca)
const bloqueo_direcciones_inter = [
  "19318000",
  "70523000",
  "73217001",
  "50711002",
  "13810011",
  "68298002",
];
const bloqueo_direcciones_envia = ["97666000", "52427000", "13188000"];

// Objeto principal en que se basa la transportadora a ser utilizada
let transportadoras = {
  SERVIENTREGA: {
    cod: "SERVIENTREGA",
    nombre: "Servientrega",
    observaciones: observacionesServientrega,
    logoPath: "img/logoServi.png",
    color: "success",
    limitesPeso: [3, 80],
    limitesLongitud: [1, 150],
    limitesRecaudo: [5000, 2000000],
    bloqueada: () => false,
    bloqueadaOfi: false,
    limitesValorDeclarado: (valor) => {
      return [5000, 300000000];
    },
    habilitada: () => {
      const sist = datos_personalizados.sistema_servientrega;
      return sist && sist !== "inhabilitado";
    },
    sistema: () => {
      const sist = datos_personalizados.sistema_servientrega;
      return sist;
    },
    getCuentaResponsable: () => "EMPRESA",
    sistemaAutomatizado: () =>
      /^automatico/.test(datos_personalizados.sistema_servientrega),
    valorMinimoEnvio: (kg) => 0,
  },
  INTERRAPIDISIMO: {
    cod: "INTERRAPIDISIMO",
    nombre: "Inter Rapidísimo",
    observaciones: observacionesInteRapidisimo,
    logoPath: "img/logo-inter.png",
    color: "dark",
    limitesPeso: [0.1, 80],
    limitesLongitud: [1, 150],
    limitesRecaudo: [10000, 3000000],
    bloqueada: (data) => bloqueo_direcciones_inter.includes(data.dane_ciudadD),
    bloqueadaOfi: false,
    limitesValorDeclarado: (peso) => {
      if (peso <= 2) return [15000, 30000000];
      if (peso <= 5) return [30000, 30000000];
      return [40000, 4540000];
    },
    habilitada: () => {
      const sist = datos_personalizados.sistema_interrapidisimo;
      return sist && sist !== "inhabilitado";
    },
    sistema: () => {
      const sist = datos_personalizados.sistema_interrapidisimo;
      return sist;
    },
    getCuentaResponsable: () => "EMPRESA",
    sistemaAutomatizado: () =>
      /^automatico/.test(datos_personalizados.sistema_interrapidisimo),
    valorMinimoEnvio: (kg) => {
      if (kg == 1) {
        return 15000;
      } else if (kg >= 3 && kg <= 5) {
        return 30000;
      } else if (kg >= 6 && kg <= 37) {
        return 40000;
      } else {
        return 0;
      }
    },
  },
  ENVIA: {
    cod: "ENVIA",
    nombre: "Envía",
    observaciones: observacionesEnvia,
    logoPath: "img/2001.png",
    color: "danger",
    limitesPeso: [0.1, 100],
    limitesLongitud: [1, 150],
    limitesRecaudo: [10000, 3000000],
    bloqueada: (coti) => bloqueo_direcciones_envia.includes(coti.dane_ciudadD),
    bloqueadaOfi: true,
    limitesValorDeclarado: (valor) => {
      return [10000, 30000000];
    },
    habilitada: () => {
      const sist = datos_personalizados.sistema_envia;
      return sist && sist !== "inhabilitado";
    },
    sistema: () => {
      const sist = datos_personalizados.sistema_envia;
      return sist;
    },
    getCuentaResponsable: () => "EMPRESA",
    sistemaAutomatizado: () =>
      /^automatico/.test(datos_personalizados.sistema_envia),
    valorMinimoEnvio: (kg) => 0,
  },
  TCC: {
    cod: "TCC",
    nombre: "TCC",
    observaciones: observacionesInteRapidisimo,
    logoPath: "img/logo-tcc.png",
    color: "warning",
    limitesPeso: [0.1, 100],
    limitesLongitud: [1, 150],
    limitesRecaudo: [10000, 3000000],
    bloqueada: () => true,
    bloqueadaOfi: true,
    limitesValorDeclarado: (valor) => {
      if (valor <= 2) return [12500, 30000000];
      if (valor <= 5) return [27500, 30000000];
      return [37500, 30000000];
    },
    habilitada: () => {
      const sist = datos_personalizados.sistema_tcc;
      return sist && sist !== "inhabilitado";
    },
    sistema: () => {
      const sist = datos_personalizados.sistema_tcc;
      return sist;
    },
    getCuentaResponsable: () => "EMPRESA",
    sistemaAutomatizado: () =>
      /^automatico/.test(datos_personalizados.sistema_tcc),
    valorMinimoEnvio: (kg) => 0,
  },
  COORDINADORA: {
    cod: "COORDINADORA",
    nombre: "Coordinadora",
    observaciones: observacionesEnvia,
    logoPath: "img/logo-coord.png",
    color: "primary",
    limitesPeso: [0.1, 100],
    limitesLongitud: [1, 150],
    limitesRecaudo: [10000, 3000000],
    bloqueada: () => false,
    bloqueadaOfi: false,
    limitesValorDeclarado: (valor) => {
      return [10000, 30000000];
    },
    habilitada: () => {
      const sist = datos_personalizados.sistema_coordinadora;
      return sist && sist !== "inhabilitado";
    },
    sistema: () => {
      const sist = datos_personalizados.sistema_coordinadora;
      return sist;
    },
    getCuentaResponsable: () => "EMPRESA",
    sistemaAutomatizado: () =>
      /^automatico/.test(datos_personalizados.sistema_coordinadora),
    valorMinimoEnvio: (kg) => 0,
  },
};

const configOficinaDefecto = {
  porcentaje_comsion: 3.9,
  tipo_distribucion: [1, 1], // 0: Entrega en dirección ; 1: Entrega en oficina
  comision_minima: 3900,
};

const TIPOS_DIST_OFICINA = ["Entrega en dirección", "Entrega en oficina"];

const CONTRAENTREGA = "PAGO DESTINO";
const PAGO_CONTRAENTREGA = "PAGO CONTRAENTREGA";
const CONVENCIONAL = "CONVENCIONAL";

const isIndex = document
  .getElementById("cotizar_envio")
  .getAttribute("data-index");

function gestionarTransportadora() {
  let html = "";
  for (let transp in transportadoras) {
    html += `<button class="btn btn-primary m-2"
        onclick="cambiarTransportadora('${transp}')">${transportadoras[transp].nombre}</button>`;
  }

  Swal.fire({
    title: "Seleccione transportadora",
    showConfirmButton: false,
    html,
  });
}

function cambiarTransportadora(nuevaTranps) {
  // Swal.close();
  console.log("se ha cambiado la transportadora");
  codTransp = nuevaTranps;
  ocultarCotizador();
  // mostrarTransportadora();
  return codTransp;
}

function mostrarTransportadora() {
  $(".transportadora").text(transportadoras[codTransp].nombre);
}

function ocultarCotizador() {
  if (document.getElementById("result_cotizacion").style.display != "none") {
    document.getElementById("result_cotizacion").style.display = "none";
  }
}

let ciudadD;
// Esta funcion verifica que los campos en el form esten llenados correctamente
async function cotizador() {
  let ciudadR = document.getElementById("ciudadR");
  ciudadD = document.getElementById("ciudadD");
  let info_precio = new CalcularCostoDeEnvio();
  datos_a_enviar = new Object();

  console.log(info_precio);
  datos_de_cotizacion = {
    ciudadR: value("ciudadR"),
    ciudadD: value("ciudadD"),
    dane_ciudadR: ciudadR.dataset.dane_ciudad,
    dane_ciudadD: ciudadD.dataset.dane_ciudad,
    ave_ciudadR: ciudadR.dataset.nombre_aveo,
    ave_ciudadD: ciudadD.dataset.nombre_aveo,
    peso: value("Kilos"),
    seguro: value("seguro-mercancia"),
    recaudo: 0,
    trayecto: info_precio.revisarTrayecto(),
    tiempo: "2-3",
    // precio: info_precio.costoEnvio,
    // flete: info_precio.flete,
    // comision_trasportadora: info_precio.sobreflete,
    // seguro_mercancia: info_precio.sobreflete_heka,
    ancho: value("dimension-ancho"),
    largo: value("dimension-largo"),
    alto: value("dimension-alto"),
  };

  document
    .getElementById("cotizador")
    .querySelectorAll("input")
    .forEach((i) => {
      i.addEventListener("input", ocultarCotizador);
    });

  if (
    value("ciudadR") != "" &&
    value("ciudadD") != "" &&
    value("Kilos") != "" &&
    value("seguro-mercancia") != "" &&
    value("dimension-ancho") != "" &&
    value("dimension-largo") != "" &&
    value("dimension-alto") != ""
  ) {
    //Si todos los campos no estan vacios
    if (
      !ciudadR.dataset.dane_ciudad ||
      !ciudadD.dataset.dane_ciudad ||
      !/^.+\(.+\)$/.test(ciudadR.value) ||
      !/^.+\(.+\)$/.test(ciudadD.value)
    ) {
      alert(
        "Recuerda ingresar una ciudad válida, selecciona entre el menú desplegable"
      );
      verificador(["ciudadR", "ciudadD"], true);
    } else if (
      value("seguro-mercancia") <
        transportadoras[codTransp].limitesValorDeclarado(value("Kilos"))[0] ||
      value("seguro-mercancia") >
        transportadoras[codTransp].limitesValorDeclarado(value("Kilos"))[1]
    ) {
      // Si el valor del recaudo excede el limite permitido
      alert(
        "Ups! el valor declarado en base a " +
          value("Kilos") +
          "Kg no puede ser menor a $" +
          convertirMiles(
            transportadoras[codTransp].limitesValorDeclarado(value("Kilos"))[0]
          ) +
          ", ni mayor a $" +
          convertirMiles(
            transportadoras[codTransp].limitesValorDeclarado(value("Kilos"))[1]
          )
      );
      verificador("seguro-mercancia", true);
    } else if (
      datos_de_cotizacion.ancho <
        transportadoras[codTransp].limitesLongitud[0] ||
      datos_de_cotizacion.largo <
        transportadoras[codTransp].limitesLongitud[0] ||
      datos_de_cotizacion.alto <
        transportadoras[codTransp].limitesLongitud[0] ||
      datos_de_cotizacion.ancho >
        transportadoras[codTransp].limitesLongitud[1] ||
      datos_de_cotizacion.largo >
        transportadoras[codTransp].limitesLongitud[1] ||
      datos_de_cotizacion.alto > transportadoras[codTransp].limitesLongitud[1]
    ) {
      // Si el valor de las dimensiones exceden el limite permitido
      alert(
        "Alguno de los valores ingresados en la dimensiones no es válido, Por favor verifique que no sean menor a 1cm, o mayor a 150cm"
      );
      verificador(
        ["dimension-alto", "dimension-largo", "dimension-ancho"],
        true
      );
    } else {
      //Si todo esta Correcto...
      verificador();

      if (new CalcularCostoDeEnvio().revisarTrayecto() == "Urbano") {
        datos_de_cotizacion.tiempo = "1-2";
      } else if (new CalcularCostoDeEnvio().revisarTrayecto() == "Especial") {
        datos_de_cotizacion.tiempo = "5-8";
      }
      let mostrador = document.getElementById("result_cotizacion");
      mostrador.style.display = "block";
      let respuesta = await response(datos_de_cotizacion);
      mostrador.innerHTML = respuesta;
      if (respuesta) detallesTransportadoras(datos_de_cotizacion);

      if (datos_de_cotizacion.recaudo < datos_de_cotizacion.precio) {
        alert(
          "El costo del envío excede el valor declarado, para continuar, debe incrementar el valor declarado"
        );
        document.getElementById("boton_continuar").disabled = true;
        verificador("seguro-mercancia", true);
      } else if (
        datos_personalizados.activar_saldo &&
        datos_de_cotizacion.precio > datos_personalizados.saldo
      ) {
        let aviso = document.createElement("p");
        aviso.textContent =
          "No dispone de saldo suficiente para continuar con su transacción, si desea continuar, por favor comuniquese con nuestros asesores para mayor información";
        aviso.classList.add("text-danger");
        mostrador.insertBefore(
          aviso,
          document.getElementById("boton_continuar").parentNode
        );
        document.getElementById("boton_continuar").disabled = true;
        document.getElementById("boton_continuar").style.display = "none";
      }
      // ***** Agregando los datos que se van a enviar para crear guia ******* //
      datos_a_enviar.ciudadR = ciudadR.dataset.ciudad;
      datos_a_enviar.ciudadD = ciudadD.dataset.ciudad;
      datos_a_enviar.departamentoD = ciudadD.dataset.departamento;
      datos_a_enviar.departamentoR = ciudadR.dataset.departamento;
      datos_a_enviar.alto = value("dimension-alto");
      datos_a_enviar.ancho = value("dimension-ancho");
      datos_a_enviar.largo = value("dimension-largo");
      // datos_a_enviar.valor = 0;
      // datos_a_enviar.seguro = value("seguro-mercancia");
      datos_a_enviar.correoR = datos_usuario.correo || "notiene@gmail.com";

      if (ControlUsuario.esPuntoEnvio) {
        datos_a_enviar.centro_de_costo_punto = datos_usuario.centro_de_costo;
      } else {
        datos_a_enviar.centro_de_costo = datos_usuario.centro_de_costo;
      }
      // datos_a_enviar.peso = datos_de_cotizacion.peso;
      // datos_a_enviar.costo_envio = datos_de_cotizacion.precio;

      // if(estado_prueba) datos_a_enviar.prueba = true;

      // $("#list-transportadoras a").click(seleccionarTransportadora);

      $("#boton_continuar").click(seleccionarTransportadora);

      if (!isIndex) guardarCotizacion();

      location.href = "#result_cotizacion";
    }
  } else {
    //si todos los campos estan vacios
    alert(
      "Ups! ha habido un error inesperado, por favor, verifique que los campos no estén vacíos"
    );
    verificador([
      "ciudadR",
      "ciudadD",
      "Kilos",
      "valor-a-recaudar",
      "dimension-alto",
      "dimension-largo",
      "dimension-ancho",
    ]);
  }
}

const watcherPlantilla = isIndex ? null : new Watcher(0);

async function guardarCotizacion() {
  const checkActualizar = $("#actv_editar_plantilla-cotizador");
  const plantillasEl = $("#list_plantillas-cotizador");
  const checkCrear = $("#guardar_cotizacion-cotizador");
  const isEditar = checkActualizar.prop("checked");
  const idPlantilla = plantillasEl.val();

  if (!isEditar && !checkCrear.prop("checked")) return;

  console.log("intentando crear plantilla");

  const form = $("#cotizar-envio");

  const values = form.serializeArray();
  const info = values.reduce((a, b) => {
    a[b.name] = b.value;
    return a;
  }, {});

  info.nombre = info.nombre.trim();
  info.codigo = info.nombre.toLowerCase().replace(/\s/g, "");

  console.log(info);

  if (!info.nombre)
    return verificador(
      ["nombre_cotizador"],
      true,
      "Si desear guardar una plantilla es necesario asignarle un nombre"
    );

  const ref = usuarioDoc.collection("plantillasCotizador");

  if (!isEditar) {
    const existente = await ref
      .where("codigo", "==", info.codigo)
      .get()
      .then((q) => q.size);

    if (existente)
      return verificador(
        ["nombre_cotizador"],
        true,
        "El nombre ingresado ya existe entre sus plantillas."
      );
  }

  if (isEditar) {
    await ref.doc(idPlantilla).update(info);
  } else {
    await ref.add(info);
  }

  watcherPlantilla.change(watcherPlantilla.value + 1);
}

async function pagoContraentrega() {
  //le muestra al usuario las opciones del pago contraentrega y
  // devuelve un objeto conciertas opciones a implementar al cotizador
  let recaudo = await Swal.fire({
    title: "<strong>Valor de Recaudo</strong>",
    icon: "info",
    html: `
            <p>Recuerde que el "valor Declarado" será sustituido por el valor de recaudo</p>
            <input type="number" id="valor-recaudo" class="form-control" placeholder="Ingrese monto"
            min="5000" max="2000000" require></input>
            <div class="form-group form-check mt-2">
                <input type="checkbox" class="form-check-input" id="sumar-envio-cotizador"></input>
                <label class="form-check-label" for="sumar-envio-cotizador">¿Desea sumar costo de envío?</label>
            </div>
            ${
              true
                ? ""
                : `
            <div class="form-group form-check mt-2">
                <input type="checkbox" class="form-check-input" id="restar-saldo-cotizador"></input>
                <label class="form-check-label" for="restar-saldo-cotizador">¿Desea restar el costo del envío del saldo?</label>
            </div>
            `
            }
          `,
    confirmButtonText: "Continuar",
    buttonsStyling: false,
    customClass: {
      confirmButton: "btn btn-success",
    },
    confirmButtonAriaLabel: "continuar",
    preConfirm: () => {
      //Antes de continuar, utiliza un validador
      let valor_recaudo = value("valor-recaudo");
      let cotizacion = new CalcularCostoDeEnvio(parseInt(valor_recaudo));
      let sumar_envio = $("#sumar-envio-cotizador").prop("checked");
      let restar_saldo = $("#restar-saldo-cotizador").prop("checked");

      //Si el usuario accede a sumar el envío, se calcula cual debería
      //ser el valor de recaudo, para que se sume el costo del envío
      if (sumar_envio) {
        cotizacion.sumar_envio = true;
      }

      /* si el usuario desea restar el saldo, la variable de la guia 
            "debe" pasa a ser false, ya que el usuario habrá pagado envío previamente */
      cotizacion.debe = !restar_saldo;
      // if(!restar_saldo) {
      //     cotizacion.debe = -cotizacion.costoEnvio
      // } else {
      //     cotizacion.debe = false;
      // }

      /*Verifica que haya valor en el recaudo, que no supere los límites ingresados
            Y que no sea menor al costo del envío*/
      if (!valor_recaudo) {
        Swal.showValidationMessage(`¡Recuerde ingresar un valor!`);
      } else if (
        value("valor-recaudo") < 5000 ||
        value("valor-recaudo") > 2000000
      ) {
        Swal.showValidationMessage(
          "El valor no puede ser menor a $5.000 ni mayor a $2.000.000"
        );
      }
      // else if (cotizacion.seguro < cotizacion.costoEnvio) {
      //     Swal.showValidationMessage("El valor del recaudo no debe ser menor al costo del envío ($" + convertirMiles(cotizacion.costoEnvio) +")");
      // };

      //me devuelve la clase del cotizador
      return cotizacion;
    },
  }).then((result) => {
    return result.isConfirmed ? result : "";
  });

  return recaudo;
}

async function seleccionarTipoEnvio() {
  return await Swal.fire({
    title: "¿Qué tipo de envío deseas realizar?",
    icon: "question",
    showCancelButton: true,
    confirmButtonClass: "bg-primary",
    confirmButtonText: "Pago Contra Entrega",
    cancelButtonText: "Común",
    showDenyButton: true,
    denyButtonText: "Pago a destino",
    denyButtonClass: "bg-success",
  }).then((result) => {
    if (result.isConfirmed) {
      return "PAGO CONTRAENTREGA";
    } else if (result.isDenied) {
      return CONTRAENTREGA;
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      return "CONVENCIONAL";
    } else {
      return "";
    }
  });
}

// me devuelve el resultado de cada formulario al hacer una cotizacion
async function response(datos) {
  let result_cotizacion,
    act_btn_continuar = true;

  //Primero le consulta al usuario por el tipo de envío
  let type = await seleccionarTipoEnvio();

  //si no selecciona ninguno, no devuelve nada
  if (!type) {
    return "";
  } else if (type == "PAGO DESTINO") {
    result_cotizacion = new CalcularCostoDeEnvio(1); // si coloco cero no funciona con envía
    result_cotizacion.debe = true;
  } else if (type == "PAGO CONTRAENTREGA") {
    // Para esta selección activa un nuevo modal que me devuleve los datos de cotización
    let resp_usuario = await pagoContraentrega();
    result_cotizacion = resp_usuario.value;
    if (!resp_usuario) {
      return "";
    }
  } else {
    // de resto calcula el costo del envío directamente con el seguro de mercancía o valor declarado
    result_cotizacion = new CalcularCostoDeEnvio(
      value("seguro-mercancia"),
      type
    );
    datos_a_enviar.debe = false;
  }
  //Lleno algunos campos de los datos de cotizacióm
  datos_de_cotizacion.peso = result_cotizacion.kg;
  datos_de_cotizacion.costo_envio = result_cotizacion.costoEnvio;
  datos_de_cotizacion.valor = result_cotizacion.valor;
  // datos_de_cotizacion.seguro = result_cotizacion.seguro;
  datos_de_cotizacion.sumar_envio = result_cotizacion.sumar_envio;
  datos_de_cotizacion.debe = result_cotizacion.debe;
  datos_de_cotizacion.type = type;

  const notas = agregarNotasDeExepcionAlCotizador();
  console.log(datos_de_cotizacion);
  // let htmlTransportadoras = await detallesTransportadoras(datos_de_cotizacion);

  //Creo un html con los detalles de la consulta y las transportadoras involucradas
  let div_principal = document.createElement("DIV"),
    crearNodo = (str) => new DOMParser().parseFromString(str, "text/html").body,
    boton_regresar =
      crearNodo(`<a class="btn btn-outline-primary mb-2" href="#cotizar_envio" onclick="regresar()">
            Subir
            </a>`),
    head = crearNodo(
      `<h4 class="text-center mb-3 flexii-title">Seleccione transportadora</h4>`
    ),
    info_principal = detalles_cotizacion(datos_de_cotizacion),
    oficinas = crearNodo(`

        `),
    transportadoras = crearNodo(`<div class="row">
            <div class="col-12">
                <div id="mostrador-oficinas" class="swiper my-2">
                    <div class="swiper-wrapper"></div>

                    <!-- If we need pagination -->
                    <div class="swiper-pagination"></div>

                    <!-- If we need navigation buttons -->
                    <div class="swiper-button-prev d-none"></div>
                    <div class="swiper-button-next d-none"></div>
                </div>
            </div>
            <div class="col">
                <ul class="list-group" id="list-transportadoras">
                </ul>
            </div>
            <div class="col-12 col-md-5 mt-4 mt-md-0 d-none d-md-block">
                <div class="tab-content" id="nav-contentTransportadoras">
                </div>
            </div>
        </div>`),
    boton_continuar =
      crearNodo(`<div class="d-flex justify-content-end mt-2"><input type="button" 
            data-transp="${codTransp}" id="boton_continuar" 
            class="btn btn-success mt-3" value="Continuar" ${
              !act_btn_continuar ? "disabled=true" : ""
            }></div>`);

  if (notas) head.innerHTML += "<small><b>Nota: </b> " + notas + "</small>";

  div_principal.append(
    // boton_regresar,
    // info_principal,
    head,
    transportadoras
    // boton_continuar
  );
  if (document.getElementById("cotizar_envio").getAttribute("data-index")) {
    boton_continuar.firstChild.style.display = "none";
    console.log("EStoy en el index");
  }
  // mostrador.innerHTML = div_principal.innerHTML;

  return div_principal.innerHTML;
}

function agregarNotasDeExepcionAlCotizador() {
  let mensaje = "";
  if (
    value("Kilos") <= 0 ||
    value("Kilos") > transportadoras[codTransp].limitesPeso[1]
  ) {
    // Si la cantidad de kilos excede el limite permitido
    mensaje +=
      "El rango de kilos para la transportadora " +
      codTransp +
      " debería ser entre " +
      transportadoras[codTransp].limitesPeso[0] +
      " y " +
      transportadoras[codTransp].limitesPeso[1];
  }

  return mensaje;
}

//Para llenar los diversos precios de las transportadoras que funcionarán con el cotizador
async function detallesTransportadoras(data) {
  let encabezados = "",
    detalles = "";
  let corredor = 0;
  const mostradorTransp = $("#list-transportadoras");
  const detallesTransp = $("#nav-contentTransportadoras");
  const result = $("#result_cotizacion");
  const button = $("#boton_cotizar");
  const factor_conversor = 1000;
  button.addClass("disabled");
  result.after(
    '<div id="cargador_cotizacion" class="d-flex justify-content-center align-items-center"><h3>Cargando</h3> <div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div></div>'
  );
  const isIndex = document
    .getElementById("cotizar_envio")
    .getAttribute("data-index");

  if (!isIndex && data.type === PAGO_CONTRAENTREGA && data.peso <= 5) {
    oficinas = await detallesOficinas(data.ciudadD);
    cargarPreciosTransportadorasOficinas(data);
  }

  const typeToAve = data.sumar_envio ? "SUMAR ENVIO" : data.type;
  let cotizacionAveo;
  const soloEntreganEnDireccion = ["ENVIA", "COORDINADORA"];

  //itero entre las transportadoras activas para calcular el costo de envío particular de cada una
  for (let transp in transportadoras) {
    let seguro = data.seguro,
      recaudo = data.valor;
    let transportadora = transportadoras[transp];
    if (transportadora.bloqueada(data)) continue;

    if (!cotizacionAveo && transp === "TCC") {
      cotizacionAveo = await cotizarAveonline(typeToAve, {
        origen: data.ave_ciudadR,
        destino: data.ave_ciudadD,
        valorRecaudo: recaudo,
        alto: data.alto,
        largo: data.largo,
        ancho: data.ancho,
        peso: value("Kilos"),
        valorDeclarado: seguro,
        type: typeToAve,
      });

      if (!cotizacionAveo.error)
        modificarDatosDeTransportadorasAveo(cotizacionAveo);
    }

    if (transp === "SERVIENTREGA" || transp === "INTERRAPIDISIMO") {
      seguro = recaudo ? recaudo : seguro;
    }

    if (data.peso > transportadora.limitesPeso[1]) continue;
    let valor = Math.max(
      seguro,
      transportadora.limitesValorDeclarado(data.peso)[0]
    );
    if (data.type === "PAGO DESTINO") valor = 0;
    let cotizador = new CalcularCostoDeEnvio(valor, data.type);

    if (["ENVIA", "COORDINADORA"].includes(transp)) {
      cotizador.valor = recaudo;
      cotizador.seguro = Math.max(
        seguro,
        transportadora.limitesValorDeclarado(data.peso)[0]
      );
    }

    cotizador.kg_min = transportadora.limitesPeso[0];

    const cotizacion = await cotizador.putTransp(transp, {
      dane_ciudadR: data.dane_ciudadR,
      dane_ciudadD: data.dane_ciudadD,
      cotizacionAveo,
    });

    if (!cotizacion.flete || cotizacion.empty) continue;

    if (data.sumar_envio || data.type === CONTRAENTREGA) {
      cotizacion.sumarCostoDeEnvio = cotizacion.valor;

      if (transp === "INTERRAPIDISIMO") {
        const minimoEnvio = transportadora.valorMinimoEnvio(
          cotizacion.kgTomado
        );
        const diferenciaMinima = minimoEnvio - cotizacion.valor;
        if (diferenciaMinima > 0)
          cotizacion.sumarCostoDeEnvio = diferenciaMinima;
      }
    }

    cotizacion.debe = data.debe;
    let descuento;
    if (cotizacion.descuento) {
      const percent = Math.round(
        ((cotizacion.costoEnvioPrev - cotizacion.costoEnvio) * 100) /
          cotizacion.costoEnvioPrev
      );
      descuento = percent + " %";
    }

    //Para cargar el sobreflete heka antes;
    cotizacion.costoEnvio;

    let sobreFleteHekaEdit = cotizacion.sobreflete_heka;
    let fleteConvertido = cotizacion.flete;
    if (
      ["ENVIA", "INTERRAPIDISIMO", "COORDINADORA"].includes(transp) &&
      data.type === PAGO_CONTRAENTREGA
    ) {
      sobreFleteHekaEdit -= factor_conversor;
      fleteConvertido += factor_conversor;
    }

    if (!transportadora.cotizacion) transportadora.cotizacion = new Object();
    transportadora.cotizacion[data.type] = cotizacion;

    const precioPuntoEnvio = ControlUsuario.esPuntoEnvio
      ? `
            <div class="card my-3 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">Comisión Punto</h5>
                    <p class="card-text d-flex justify-content-between">Comisión punto <b>$${convertirMiles(
                      cotizacion.comision_punto
                    )}</b></p>
                </div>
            </div>
        `
      : "";

    const encabezado = `<li style="cursor:pointer;" class="list-group-item list-group-item-action shadow-sm mb-2 border border-${
      transportadora.color
    }" 
        id="list-transportadora-${transp}-list" 
        data-transp="${transp}"
        data-type="${data.type}"
        aria-controls="list-transportadora-${transp}"
        >
            <div class="row" >
                <img src="${transportadora.logoPath}" 
                class="col" style="max-height:120px; max-width:fit-content"
                alt="logo-${transportadora.nombre}">
                <div class="col-12 col-sm-6 mt-3 mt-sm-0 order-1 order-sm-0">
                    <h5>${transportadora.nombre} <span class="badge badge-${
      transportadora.color
    } p-2">${transp === "TCC" ? "Próximamente" : ""}</span></h5>
                    <h6>tiempo de entrega: ${
                      cotizacion.tiempo || datos_de_cotizacion.tiempo
                    } Días</h6>
                    <h6 class="d-none ${
                      data.type == "CONVENCIONAL" ? "" : "mb-1 d-sm-block"
                    }">
                    El Valor consignado a tu cuenta será: <b>$${convertirMiles(
                      cotizacion.valor - cotizacion.costoEnvio
                    )}</b></h6>
                </div>
                <div class="col d-flex flex-column justify-content-around">
                    <small id="ver-detalles-${transp}" class="detalles btn btn-outline-primary badge badge-pill">
                    Detalles</small>
                    <span class="badge text-danger mt-1 ml-2 p-1 ${
                      !descuento && "d-none"
                    }">Descuento del ${descuento}</span>
                    <h5><b>$${convertirMiles(cotizacion.costoEnvio)} </b></h5>
                </div>
            </div>
            <p class="text-center mb-0 mt-2 d-none d-sm-block">Costo de envío para ${
              data.type == "CONVENCIONAL" ? "Valor declarado" : "recaudo"
            }: <b>$${convertirMiles(
      data.type == "CONVENCIONAL" ? cotizacion.seguro : cotizacion.valor
    )}</b></p>
            <p class="mb-0 d-sm-none">${
              data.type == "CONVENCIONAL" ? "Valor declarado" : "Recaudo"
            }: <b>$${convertirMiles(
      data.type == "CONVENCIONAL" ? cotizacion.seguro : cotizacion.valor
    )}</b></p>
            
            <p class="mb-0 text-center">
                <span class="estadisticas position-relative"></span>
            </p>
            
            <h5 class="text-danger text-center ${
              soloEntreganEnDireccion.includes(transp) ? "" : "d-none"
            }">
                Solo entrega en dirección
            </h5>

        </li>`;

    const detalle = `<div class="tab-pane fade 
        ${!corredor && !oficinas.length ? "show active" : ""}" 
        id="list-transportadora-${transp}" aria-labelledby="list-transportadora-${transp}-list">
            <div class="card">
                <div class="card-header bg-${transportadora.color} text-light">
                    ${transportadora.nombre}
                </div>
                <div class="card-body">
                    <div class="card my-3 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">Costo Transportadora</h5>
                            <p class="card-text d-flex justify-content-between">Valor flete <b>$${convertirMiles(
                              fleteConvertido
                            )}</b></p>
                            <p class="card-text d-flex justify-content-between">Comisión transportadora <b>$${convertirMiles(
                              cotizacion.sobreflete
                            )}</b></p>
                            <p class="card-text d-flex justify-content-between">Seguro mercancía <b>$${convertirMiles(
                              cotizacion.seguroMercancia
                            )}</b></p>
                        </div>
                    </div>
                    
                    <div class="card my-3 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">Costo Heka entrega</h5>
                            <p class="card-text d-flex justify-content-between">Comisión heka <b>$${convertirMiles(
                              sobreFleteHekaEdit
                            )}</b></p>
                        </div>
                    </div>

                    ${precioPuntoEnvio}

                    <div class="card my-3 shadow-sm border-${
                      transportadora.color
                    }">
                        <div class="card-body">
                            <h3 class="card-text d-flex justify-content-between">Total: 
                                <small class="text-danger ${
                                  !descuento && "d-none"
                                }">
                                    <del>${convertirMiles(
                                      cotizacion.costoEnvioPrev
                                    )}</del>
                                    <h6><small>Precio al público</small></h6>
                                </small> 
                                <b>
                                    $${convertirMiles(cotizacion.costoEnvio)}
                                    <h6><small>Con nosotros</small></h6>
                                </b>
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    encabezados += encabezado;
    detalles += detalle;
    mostradorTransp.append(encabezado);
    detallesTransp.append(detalle);

    $(`#ver-detalles-${transp}`).click(verDetallesTransportadora);
    $(`#list-transportadora-${transp}-list`).click(seleccionarTransportadora);
    if (!isIndex) mostrarEstadisticas(data.dane_ciudadD, transp);

    corredor++;
  }

  button.removeClass("disabled");

  if (!corredor) {
    result.html(`<div class="text-center"><li class="fa fa-frown m-1 fa-6x"></li><br>
            <h3>Lo sentimos, sin cobertura con ninguna transportadora</h3>
            </div>
        `);
  }

  $("#cargador_cotizacion").remove();

  /* Devuelve el html en dos manera, con la lista, y con los detalles particulares */
  return [encabezados, detalles];
}

// ESTADÍSTICAS

// funcion que consulta la ciudad y transportadora para revisar estadísticas de entrega
async function mostrarEstadisticas(dane_ciudad, transportadora) {
  const estadistica =
    transportadora === "ENVIA"
      ? await estEnvia(dane_ciudad)
      : await db
          .collection("ciudades")
          .doc(dane_ciudad)
          .collection("estadisticasEntrega")
          .doc(transportadora)
          .get()
          .then((d) => d.data());

  if (!estadistica) return;

  //Tomamos el contenedor en donde se va a llenar la info de cas transportadora
  const visorAll = $("#list-transportadoras");
  const visorTransp = $(`#list-transportadora-${transportadora}-list`);
  const contenedor = visorTransp.find(".estadisticas");

  // El porcentaje lo calculamos con la cantidad de entregas exitósas
  const porcentaje = Math.round(
    (estadistica.entregas / estadistica.envios) * 100
  );

  //mostramos la cantidad de estrellas correspondientes al porcentaje
  contenedor.html(llenarEstrellas(porcentaje));
  contenedor.append("<small>(" + porcentaje + "% de efectividad)</small>");
  contenedor.append(`<span 
        class='detalles rounded bg-light w-100 position-absolute' 
        style='
            cursor:pointer; opacity:0; top:0; left: 0;
            transition: opacity 300ms
        ' 
        onmouseenter='(() => this.style.opacity=0.7)()' 
        onmouseleave='(() => this.style.opacity=0)()'
    >
        Ver referencia
    </span>`);

  //PRAR REORGANIZAR LAS TRANSPORTADORAS DESDE LA MEJOR

  //agregamos la efectividad a la transportadora actual
  visorTransp.attr("data-efectivity", porcentaje);

  // lo reorganizamos con la mejor efectividad
  const organizado = visorAll
    .children("li")
    .sort(
      (a, b) =>
        b.getAttribute("data-efectivity") - a.getAttribute("data-efectivity")
    );

  // renderizamos esa parte del dom para pintarlas ya organizadas
  visorAll.append(organizado);

  //Para mostrar detalles de la mejor
  const primeraTransp = organizado[0].getAttribute("data-transp");
  $("#ver-detalles-" + primeraTransp).click();

  // habilitamos la función para ver los detalles de las estadísticas
  contenedor.click(() => detallesEstadisticas(estadistica));
}

const conjuntoEstadisticasEnvia = new Map();
async function estEnvia(dane_ciudad) {
  const min = 80;
  const max = 100;
  const entregas = Math.floor(Math.random() * (max - min)) + min;

  const respuesta = await new Promise((res, rej) => {
    setTimeout(() => {
      if (conjuntoEstadisticasEnvia.has(dane_ciudad)) {
        return res(conjuntoEstadisticasEnvia.get(dane_ciudad));
      }

      const dev = max - entregas;
      const estadistica = {
        envios: max,
        posiblesNovedades: null,
        devoluciones: dev,
        entregas: entregas,
        presentaronNovedad: 0,
      };

      conjuntoEstadisticasEnvia.set(dane_ciudad, estadistica);
      res(estadistica);
    }, entregas * 5);
  });

  return respuesta;
}

// función que me devuelve una sweet alert con las características introducidas
function detallesEstadisticas(estadisticas) {
  const {
    envios,
    posiblesNovedades,
    devoluciones,
    entregas,
    presentaronNovedad,
  } = estadisticas;
  const percentage = (val) => Math.round((val * 100) / envios);
  const mostrarNovedades = posiblesNovedades
    ? `
        <h4>Posibles novedades</h4>
        <ul>
            ${estadisticas.posiblesNovedades.reduce((a, b) => {
              if (b) a += "<li>" + b + "</li>";
              return a;
            }, "")}
        </ul>
    `
    : "";

  const html = `
        <div class="text-left row m-0">
            <div class="col-12 mb-2">
                <canvas id="estadisticasEntrega"></canvas>
            </div>

            <div class="col-12 mt-3">
                ${mostrarNovedades}
            </div>
        </div>
    `;
  Swal.fire({
    title: "Referencias de efectividad",
    html,
  });

  new Chart(document.getElementById("estadisticasEntrega"), {
    type: "pie",
    data: {
      labels: ["Entregas", "Devoluciones", "Novedades"],
      datasets: [
        {
          data: [
            percentage(entregas),
            percentage(devoluciones),
            percentage(presentaronNovedad),
          ],
          backgroundColor: ["#36b9cc", "#e74a3b", "#f6c23e"],
        },
      ],
    },

    options: {
      responsive: true,
      tooltips: {
        callbacks: {
          label: function (tooltip, chart) {
            const i = tooltip.index;
            const label = chart.labels[i];
            const value = chart.datasets[0].data[i];
            return `${value}% en porcentaje de ${label}`;
          },
        },
      },
    },
  });
}

// funcion que recibe un número del uno al cien y devuelve un string con cinco estrellas
function llenarEstrellas(porcentaje) {
  // porcentaje:número;

  let llenas = 0;
  //Arreglo que corresponde a la cantidad de estrellas que se van a devolver
  const clasesEstrellas = [null, null, null, null, null];
  const claseDefecto = "fa-star text-gray-400";

  // iteramos desde el diez hasta el valor introducido sumando de diez en diez
  for (let i = 10; i <= porcentaje; i += 10) {
    if ((i / 2) % 2) {
      // si la división del valor actual entre deo es impar, se llena la mitad de la estrella
      clasesEstrellas[llenas] = "fa-star-half-alt text-warning";
    } else {
      //caso contrario se llena la estrella completa y se va a la siguiente estrella
      clasesEstrellas[llenas] = "fa-star text-warning";
      llenas++;
    }
  }

  let respuesta = "";

  // intero entre las clases, y aquellas que sigan siendo nulas serán escritas con la clase por defecto
  clasesEstrellas.forEach((clase) => {
    respuesta += `
            <i class="fa ${clase || claseDefecto}"></i>
        `;
  });

  return respuesta;
}
// FIN ESTADÍSTICAS

function verDetallesTransportadora(e) {
  const detallesTransp = $("#nav-contentTransportadoras");
  const info = detallesTransp.parent();
  const selector = $(this).parents("[aria-controls]").attr("aria-controls");

  info.removeClass("d-none");
  detallesTransp.children().removeClass("active show");
  $("#" + selector).addClass("show active");
  info[0].scrollIntoView({ behavior: "smooth" });
}

//*** FUNCIONES PARA OFICINAS ***
async function detallesOficinas(destino) {
  const p = [
    {
      nombre_empresa: "Oficina 1",
      id_oficina: 1,
      correo: "correo@dominio.com",
      ciudad: "CALI(VALLE DEL CAUCA)",
      barrio: "los bellos",
      direccion: "Kra 23 #40-40",
      celular: "3102584568",
      numero_documento: "1234567989",
      tipo_documento: "CC",
      nombres: "NombreO",
      apellidos: "ApellidoO",
      direccion_completa: "Kra 23 #40-40, los bellos, CALI (VALLE DEL CAUCA)",
      configuracion: {
        porcentaje_comsion: 10,
      },
    },
    {
      nombre_empresa: "Oficina 1",
      id_oficina: 2,
      correo: "correo@dominio.com",
      ciudad: "CALI(VALLE DEL CAUCA)",
      barrio: "los bellos",
      direccion: "Kra 23 #40-40",
      celular: "3102584568",
      numero_documento: "1234567989",
      tipo_documento: "CC",
      nombres: "NombreO",
      apellidos: "ApellidoO",
      direccion_completa: "Kra 23 #40-40, los bellos, CALI (VALLE DEL CAUCA)",
      configuracion: {
        porcentaje_comsion: 5,
      },
    },
  ];

  // if(!estado_prueba) return [];

  return await firebase
    .firestore()
    .collection("oficinas")
    .where("ciudad", "==", destino)
    .get()
    .then((querySnapshot) => {
      const oficinas = new Array();

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        data.id_oficina = doc.id;
        if (!data.configuracion) {
          data.configuracion = Object.assign({}, configOficinaDefecto);
        }

        if (!data.visible || data.eliminado || data.bloqueado) return;

        oficinas.push(data);
      });

      console.log(oficinas);
      return oficinas;
    });
}

function mostrarOficinas(oficinas) {
  const mostradorOffi = $("#mostrador-oficinas");
  const wrapper = mostradorOffi.children(".swiper-wrapper");

  oficinas.forEach((oficina, i) => {
    const visualizador = new DOMParser().parseFromString(
      `
        <div class="border border-primary p-2 swiper-slide" 
        id="list-office-list-${i}"
        data-id="${i}"
        data-office="${oficina.nombre_empresa}"
        aria-controls="list-offices"
        >
            <div class="row">
                <img src="./img/logo-flexi.png" 
                class="col" style="max-height:120px; max-width:fit-content"
                alt="logo-OFFY">
                <div class="col-12 col-sm-6 mt-3 mt-sm-0 order-1 order-sm-0">
                    <h5>Flexii <span class="badge badge-primary p-2" data-change="nombre_ofi">${oficina.nombre_empresa}</span></h5>
                    <h6>Transportadora: <b data-change="transportadora">transportadora</b></h6>
                    <h6>Tiempo de entrega: <b data-change="tiempoEntrega"></b> Días</h6>
                    <h6 class="mb-1 d-none d-sm-block ver-pagoContraentrega">
                    El Valor consignado a tu cuenta será: <b data-change="valorConsignar"></b></h6>
                </div>
                <div class="col d-flex flex-column justify-content-around">
                    <small data-id="${i}" class="detalles detalles-office-click btn btn-outline-primary badge badge-pill">Detalles</small>

                    <select name="" data-id="${i}" class="form-control detalles ver-detalles-office">
                      
                    </select>
                    
                    <h5><b data-change="costoEnvio"></b></h5>
                </div>
            </div>
            <p class="text-center d-none d-sm-block m-0 ver-pagoContraentrega">Costo de envío para recaudo: <b data-change="valor_recaudo"></b></p>
            <p class="d-sm-none m-0 ver-pagoContraentrega">Recaudo: <b data-change="valor_recaudo"></b></p>

            <p class="text-center d-none d-sm-block m-0 ver-convencional">Costo de envío para valor declarado: <b data-change="valor_declarado"></b></p>
            <p class="d-sm-none m-0 ver-convencional">Valor declarado: <b data-change="valor_declarado"></b></p>

            <p class="text-center">Dirección de la oficina: <b data-change="direccion_ofi">${oficina.direccion_completa}</b></p>
        </div>
        `,
      "text/html"
    ).body.firstChild;

    wrapper.append(visualizador);
  });

  $(".swiper-slide").click(seleccionarTransportadora);

  const swiper = new Swiper("#mostrador-oficinas", {
    spaceBetween: 10,
    slidesPerView: 1,
    centeredSlides: true,
    // navigation: {
    //     nextEl: ".swiper-button-next",
    //     prevEl: ".swiper-button-prev",
    // },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
      type: "bullets",
    },
  });

  return mostradorOffi;
}

async function cargarPreciosTransportadorasOficinas(data) {
  if (!oficinas.length) return false;

  let oficinasMostradas = false;
  const detallesTransp = $("#nav-contentTransportadoras");

  // function que muestra el contenido html de las oficinas (SWIPPER)
  const renderizarOficinas = () => {
    const mostradorOfi = mostrarOficinas(oficinas);
    mostradorOfi.find(".swiper-slide").attr("data-type", data.type);

    if (data.type === "CONVENCIONAL") {
      mostradorOfi.find(".ver-pagoContraentrega").remove();
    } else {
      mostradorOfi.find(".ver-convencional").remove();
    }

    oficinasMostradas = true;
    detallesTransp.append(observadorDetallesOficinas());
    observadorTransp = $(".ver-detalles-office");
  };

  let cotizacionAveo,
    corredor = 0;
  const typeToAve = data.sumar_envio ? "SUMAR ENVIO" : "CONVENCIONAL";

  /**Esta variable será llenada por la funcción {@link renderizarOficinas}*/
  let observadorTransp;
  const detallesClick = $(".detalles-office-click");

  //itero entre las transportadoras activas para calcular el costo de envío particular de cada una
  for (let transp in transportadoras) {
    let seguro = data.seguro,
      recaudo = data.valor;
    let transportadora = transportadoras[transp];

    if (transportadora.bloqueadaOfi && !estado_prueba) continue;
    if (data.peso > transportadora.limitesPeso[1]) continue;

    if (false && !cotizacionAveo && (transp === "ENVIA" || transp === "TCC")) {
      cotizacionAveo = await cotizarAveonline(typeToAve, {
        origen: data.ave_ciudadR,
        destino: data.ave_ciudadD,
        valorRecaudo: recaudo,
        alto: data.alto,
        largo: data.largo,
        ancho: data.ancho,
        peso: value("Kilos"),
        valorDeclarado: seguro,
        type: typeToAve,
      });

      if (!cotizacionAveo.error)
        modificarDatosDeTransportadorasAveo(cotizacionAveo);
    }

    let valorSeguro = Math.max(
      seguro,
      transportadora.limitesValorDeclarado(data.peso)[0]
    );
    let valorRecaudo = Math.max(recaudo, transportadora.limitesRecaudo[0]);

    let cotizador = new CalcularCostoDeEnvio(valorSeguro, "CONVENCIONAL");
    cotizador.isOficina = true;

    if (transp === "ENVIA") cotizador.valor = recaudo;

    cotizador.kg_min = transportadora.limitesPeso[0];

    const cotizacion = await cotizador.putTransp(transp, {
      dane_ciudadR: data.dane_ciudadR,
      dane_ciudadD: data.dane_ciudadD,
      cotizacionAveo,
    });

    if (data.type === "PAGO CONTRAENTREGA") {
      const comision_heka = cotizacion.precios.comision_heka;
      const constante_heka = cotizacion.precios.constante_pagoContraentrega;
      let variacion_comision_heka = 0;
      if (transp !== "SERVIENTREGA") variacion_comision_heka = 1000;
      cotizacion.set_sobreflete_heka =
        Math.ceil((valorRecaudo * comision_heka) / 100) +
        constante_heka +
        variacion_comision_heka;
      cotizacion.valor = valorRecaudo;
    }

    if (data.sumar_envio) {
      cotizacion.sumarCostoDeEnvio = cotizacion.valor;
      cotizacion.seguro = valorSeguro;
    }

    cotizacion.debe = data.debe;

    if (!cotizacion.flete || cotizacion.empty) continue;

    if (!transportadora.cotizacion) transportadora.cotizacion = new Object();
    transportadora.cotizacion["OFICINA"] = cotizacion;

    console.log("Añadiendo " + transp);
    if (!oficinasMostradas) {
      renderizarOficinas();
      observadorTransp.append(`<option value="${transp}">${transp}</option>`);
      const el = observadorTransp[0];
      cambiarPreciosOficinasPorTransportadora(el, cotizacion, oficinas);
    } else {
      observadorTransp.append(`<option value="${transp}">${transp}</option>`);
    }

    corredor++;
  }

  observadorTransp.on("change", (e) => {
    const transp = e.target.value;
    const cotizacion = transportadoras[transp].cotizacion["OFICINA"];
    const verDetalles = verDetallesTransportadora.bind(e.target);

    cambiarPreciosOficinasPorTransportadora(e.target, cotizacion, oficinas);
    verDetalles();
  });

  detallesClick.on("click", (e) => {
    const transp = observadorTransp.val();
    const cotizacion = transportadoras[transp].cotizacion["OFICINA"];
    const verDetalles = verDetallesTransportadora.bind(e.target);

    cambiarPreciosOficinasPorTransportadora(e.target, cotizacion, oficinas);
    verDetalles();
  });

  return oficinas;
}

function cambiarPreciosOficinasPorTransportadora(target, cotizacion, oficinas) {
  if (!cotizacion) return;

  const factor_conversor = 1000;
  const transp = cotizacion.codTransp;
  const nOficina = $(target).attr("data-id");

  const oficina = oficinas[nOficina];
  console.log(oficina);
  const porcentaje_oficina = datos_personalizados.porcentaje_comsion_ofi
    ? datos_personalizados.porcentaje_comsion_ofi
    : oficina.configuracion
    ? oficina.configuracion.porcentaje_comsion
    : configOficinaDefecto.porcentaje_comsion;

  const sobreflete_ofi = (cotizacion.valor * porcentaje_oficina) / 100;
  cotizacion.sobreflete_oficina = Math.max(
    sobreflete_ofi,
    oficina.configuracion.comision_minima
  );

  const costoEnvio = cotizacion.costoEnvio;

  let sobreFleteHekaEdit = cotizacion.sobreflete_heka;
  let fleteConvertido = cotizacion.flete;
  if (
    ["ENVIA", "INTERRAPIDISIMO", "COORDINADORA"].includes(transp) &&
    cotizacion.type === PAGO_CONTRAENTREGA
  ) {
    sobreFleteHekaEdit -= factor_conversor;
    fleteConvertido += factor_conversor;
  }

  let descuento;
  if (cotizacion.descuento) {
    const percent = Math.round(
      ((cotizacion.costoEnvioPrev - cotizacion.costoEnvio) * 100) /
        cotizacion.costoEnvioPrev
    );
    console.log("tiene un descuento de: " + percent + "%");
    descuento = percent + " %";
  }

  const contenedor = $(target).parents("[data-office]");
  const detalles = $("#list-offices");

  const find = (type) => `[data-change="${type}"]`;
  contenedor.find(find("transportadora")).text(transp);
  contenedor
    .find(find("tiempoEntrega"))
    .text(cotizacion.tiempo || datos_de_cotizacion.tiempo);
  contenedor
    .find(find("valorConsignar"))
    .text("$" + convertirMiles(cotizacion.valor - costoEnvio));
  contenedor.find(find("costoEnvio")).text("$" + convertirMiles(costoEnvio));
  contenedor
    .find(find("valor_recaudo"))
    .text("$" + convertirMiles(cotizacion.valor));
  contenedor
    .find(find("valor_declarado"))
    .text("$" + convertirMiles(cotizacion.seguro));
  contenedor.attr("data-transp", transp);

  detalles.find(find("transportadora")).text(transp);
  detalles.find(find("nombre_empresa")).text(oficina.nombre_empresa);
  detalles
    .find(find("fleteConvertido"))
    .text("$" + convertirMiles(fleteConvertido));
  detalles
    .find(find("sobreflete"))
    .text("$" + convertirMiles(cotizacion.sobreflete));
  detalles
    .find(find("seguroMercancia"))
    .text("$" + convertirMiles(cotizacion.seguroMercancia));
  detalles
    .find(find("sobreFleteHekaEdit"))
    .text("$" + convertirMiles(sobreFleteHekaEdit));
  detalles
    .find(find("sobreFleteOficina"))
    .text("$" + convertirMiles(cotizacion.sobreflete_oficina));
  detalles.find(find("costoEnvio")).text("$" + convertirMiles(costoEnvio));
  detalles
    .find(find("costoEnvioPrev"))
    .text("$" + convertirMiles(cotizacion.costoEnvioPrev));

  if (!descuento) {
    $("#mostrador-descuento-office").addClass("d-none");
  } else {
    $("#mostrador-descuento-office").removeClass("d-none");
  }
}

function observadorDetallesOficinas() {
  return `
    <div class="tab-pane fade show active" 
        id="list-offices" aria-labelledby="list-office-list">
            <div class="card">
                <div class="card-header bg-primary text-light">
                    <span data-change="nombre_empresa"></span> - <span data-change="transportadora">Transportadora</span>
                </div>
                <div class="card-body">
                    <div class="card my-3 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">Costo Transportadora</h5>
                            <p class="card-text d-flex justify-content-between">Valor flete <b data-change="fleteConvertido"></b></p>
                            <p class="card-text d-flex justify-content-between">Comisión transportadora <b data-change="sobreflete"></b></p>
                            <p class="card-text d-flex justify-content-between">Seguro mercancía <b data-change="seguroMercancia"></b></p>
                        </div>
                    </div>
                    <div class="card my-3 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">Costo Heka entrega</h5>
                            <p class="card-text d-flex justify-content-between">Comisión heka <b data-change="sobreFleteHekaEdit"></b></p>
                        </div>
                    </div>
                    <div class="card my-3 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">Costo Oficina</h5>
                            <p class="card-text d-flex justify-content-between">Comisión oficina <b data-change="sobreFleteOficina"></b></p>
                        </div>
                    </div>
                    <div class="card my-3 shadow-sm border-primary">
                        <div class="card-body">
                            <h3 class="card-text d-flex justify-content-between">Total: 
                                <small id="mostrador-descuento-office" class="text-danger">
                                    <del data-change="costoEnvioPrev"></del>
                                    <h6><small>Precio al público</small></h6>
                                </small> 
                                <b>
                                    <strong data-change="costoEnvio"></strong>
                                    <h6><small>Con nosotros</small></h6>
                                </b>
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// retorna un objeto
function tomarDetallesImportantesOficina(oficina) {
  const campos_importante = [
    "id_oficina",
    "ciudad",
    "barrio",
    "direccion",
    "celular",
    "numero_documento",
    "tipo_documento",
    "nombres",
    "apellidos",
    "correo",
  ];

  const datos_obtenidos = new Object();
  campos_importante.forEach((v) => {
    datos_obtenidos[v] = oficina[v];
  });

  datos_obtenidos.nombre_completo =
    datos_obtenidos.nombres + " " + datos_obtenidos.apellidos;
  datos_obtenidos.tipo_distribucion = oficina.configuracion.tipo_distribucion;

  return datos_obtenidos;
}

function verificarAntesSeleccionarOficina(oficina, cotizacion) {
  //Le idea es utilizar la variable oficina, para obtener valores restrictivos particulares de cada oficina

  const maxKilos = 5,
    maxRec = 500000;

  console.log(datos_a_enviar);
  if (cotizacion.kgTomado > maxKilos) {
    Toast.fire({
      icon: "error",
      title:
        "La cantidad de kilos para las oficinas no debe ser mayor a " +
        maxKilos,
    });
    return true;
  }

  if (cotizacion.valor > maxRec) {
    Toast.fire({
      icon: "error",
      title:
        "El valor de recaudo para las oficinas no debe ser mayor a " + maxRec,
    });
    return true;
  }
}
//*** FIN FUNCIONES PARA OFICINAS ***

//Selecciona la transportadora a utilizar
function seleccionarTransportadora(e) {
  if (e.target.classList.contains("detalles")) return;
  const transp = this.getAttribute("data-transp");
  const type = this.getAttribute("data-type");
  const isOficina = !!this.getAttribute("data-office");
  const nOffice = this.getAttribute("data-id");
  const oficina = oficinas[nOffice];
  const seleccionado = isOficina ? "OFICINA" : type;
  const isIndex = document
    .getElementById("cotizar_envio")
    .getAttribute("data-index");

  delete datos_a_enviar.oficina;
  delete datos_a_enviar.datos_oficina;
  delete datos_a_enviar.id_oficina;

  let result_cotizacion = transportadoras[transp].cotizacion[seleccionado];

  if (isIndex) {
    location.href = "ingreso.html";
  }

  if (isOficina) {
    if (verificarAntesSeleccionarOficina(oficina, result_cotizacion)) return;
    const porc_comison = datos_personalizados.porcentaje_comsion_ofi
      ? datos_personalizados.porcentaje_comsion_ofi
      : oficina.configuracion.porcentaje_comsion;

    console.log(porc_comison);
    const sobreflete_ofi = (result_cotizacion.valor * porc_comison) / 100;
    result_cotizacion.sobreflete_oficina = Math.max(
      sobreflete_ofi,
      oficina.configuracion.comision_minima
    );

    const sistFlexi = datos_personalizados.sistema_flexii;
    const actvFlexi = sistFlexi && sistFlexi !== "inhabilitado";

    if (!actvFlexi)
      return Swal.fire({
        icon: "error",
        html: `Actualmente no tienes habilitado el envío por flexii, 
            si la quieres habilitar, puedes comunicarte con la asesoría logística <a target="_blank" href="https://wa.link/8m9ovw">312 463 8608</a>`,
      });
  }

  const texto_tranp_no_disponible = `Actualmente no tienes habilitada esta transportadora, 
    si la quieres habilitar, puedes comunicarte con la asesoría logística <a target="_blank" href="https://wa.link/8m9ovw">312 463 8608</a>`;

  const swal_error = {
    icon: "error",
    html: texto_tranp_no_disponible,
  };

  if (!transportadoras[transp].habilitada()) {
    return Swal.fire(swal_error);
  }

  if (result_cotizacion.debe)
    datos_a_enviar.debe = -result_cotizacion.costoEnvio;

  if (
    result_cotizacion.valor < result_cotizacion.costoEnvio &&
    result_cotizacion.type !== "CONVENCIONAL"
  ) {
    return Toast.fire({
      icon: "error",
      text: "El valor del recaudo no debe ser menor al costo del envío.",
    });
  }

  //Muestra algún dato relevante en un modal
  Swal.fire({
    icon: "info",
    title: "Tener en cuenta con " + transp,
    html: transportadoras[transp].observaciones(result_cotizacion),
    width: "50em",
    customClass: {
      cancelButton: "btn btn-secondary m-2",
      confirmButton: "btn btn-primary m-2",
    },
    showCancelButton: true,
    showCloseButton: true,
    cancelButtonText: "Cancelar",
    confirmButtonText: "Continuar",
    buttonsStyling: false,
  }).then((result) => {
    console.log(result);
    //continúa si el cliente termina seleccionando la transportadora
    if (result.isConfirmed) {
      console.log(datos_a_enviar);
      datos_a_enviar.peso = result_cotizacion.kgTomado;
      datos_a_enviar.costo_envio = result_cotizacion.costoEnvio;
      datos_a_enviar.valor = result_cotizacion.valor;
      datos_a_enviar.seguro = result_cotizacion.seguro;
      datos_a_enviar.type = type;
      datos_a_enviar.dane_ciudadR = datos_de_cotizacion.dane_ciudadR;
      datos_a_enviar.dane_ciudadD = datos_de_cotizacion.dane_ciudadD;
      datos_a_enviar.transportadora = transp;

      if (transp === "TCC") {
        datos_a_enviar.ave_ciudadD = datos_de_cotizacion.ave_ciudadD;
        datos_a_enviar.ave_ciudadR = datos_de_cotizacion.ave_ciudadR;
      }

      cambiarTransportadora(transp);

      if (isIndex) {
        location.href = "ingreso.html";
      } else if (
        !datos_a_enviar.debe &&
        !datos_personalizados.actv_credit &&
        datos_a_enviar.costo_envio > datos_personalizados.saldo &&
        datos_a_enviar.type !== CONTRAENTREGA
      ) {
        /* Si el usuario no tiene el crédito activo, la guía que quiere crear
                muestra que debe saldo y se verifica que el costo del envío excede el saldo
                Arroja la excepción*/
        Swal.fire(
          "¡No permitido!",
          `Lo sentimos, en este momento, el costo de envío excede el saldo
                que tienes actualmente, por lo tanto este metodo de envío no estará 
                permitido hasta que recargues tu saldo. Puedes comunicarte con la asesoría logística para conocer los pasos
                a seguir para recargar tu saldo.`
        );
        // boton_continuar = new DOMParser().parseFromString(`<div class="d-flex justify-content-center text-danger mt-3">
        //     <p></p>
        //     <p>Puedes comunicarte con la asesoría logística para conocer los pasos
        //     a seguir para recargar tu saldo.</p>
        // </div>, "text/html`).body
      } else {
        finalizarCotizacion(datos_a_enviar);
      }
    }
  });

  //Detalles del costo de Envío
  datos_a_enviar.detalles = result_cotizacion.getDetails;

  if (isOficina) {
    (datos_a_enviar.oficina = true),
      (datos_a_enviar.datos_oficina = tomarDetallesImportantesOficina(
        oficinas[nOffice]
      ));
    datos_a_enviar.id_oficina = datos_a_enviar.datos_oficina.id_oficina;
  }
  console.log(datos_a_enviar);
}

//Me devuelveun html con los detalles de la cotización que ya están implícitos en los datos ingresados
function detalles_cotizacion(datos) {
  return new DOMParser().parseFromString(
    `
        <div class="mb-4 card">
            <div class="card-header py-3">
                <h4 class="m-0 font-weight-bold text-primary text-center">Datos de envío - ${
                  datos.transportadora
                } (${datos.type})</h4>
            </div>
            <div class="card-body row">
                <div class="col-sm-6 mb-3 mb-sm-2">
                    <h5>Ciudad de Origen</h5>
                    <input readonly="readonly" type="text" class="form-control form-control-user" value="${
                      datos.ciudadR
                    }(${datos.departamentoR})" required="">  
                </div>
                <div class="col-sm-6 mb-3 mb-sm-2">
                    <h5>Ciudad de Destino</h5>
                    <input readonly="readonly" type="text" id="ciudadDestinoUsuario" class="form-control form-control-user" value="${
                      datos.ciudadD
                    }(${datos.departamentoD})" required="">  
                </div>
                <div class="col-sm-6 mb-3 mb-sm-2">
                    <h5>Kilos</h5>
                    <input readonly="readonly" type="text" class="form-control form-control-user" value="${
                      datos.peso
                    } Kg" required="">  
                </div>
                <div class="col-sm-6 mb-3 mb-sm-2">
                    <h5>Valor declarado</h5>
                    <input readonly="readonly" type="text" class="form-control form-control-user" value="$${convertirMiles(
                      datos.seguro
                    )}" required="">  
                </div>
                <div class="col-sm-12 mb-3 mb-sm-2 ${
                  !datos.valor ? "d-none" : ""
                }">
                    <h5>Recaudo (valor a cobrar al destinatario)</h5>
                    <input readonly="readonly" type="text" class="form-control form-control-user" value="$${convertirMiles(
                      datos.valor
                    )}" required="">  
                </div>
                <!--
                <div class="col">
                    <h5 class="mb-2 mt-3 text-center">Dimensiones <span>(Expresadas en Centímetros)</span></h5>
                    <div class="row d-flex justify-content-center">
                        <div class="col-sm-4 mt-2 d-flex align-items-center">
                            <h6>Ancho:  </h6>
                            <input readonly="readonly type="text" class="form-control form-control-user ml-2" value="${
                              datos.ancho
                            } Cm">
                        </div>
                        <div class="col-sm-4 mt-2 d-flex align-items-center">
                            <h6>Largo:  </h6>
                            <input readonly="readonly type="text" class="form-control form-control-user ml-2" value="${
                              datos.largo
                            } Cm">
                        </div>
                        <div class="col-sm-4 mt-2 d-flex align-items-center">
                            <h6>Alto:  </h6>
                            <input readonly="readonly type="text" class="form-control form-control-user ml-2" value="${
                              datos.alto
                            } Cm">
                        </div>
                    </div>
                </div>
                -->
            </div>
        </div>
        `,
    "text/html"
  ).body;
}

const opciones = [];

//M edevuelve el html del último formulario del cotizador
function finalizarCotizacion(datos) {
  let div_principal = document.createElement("DIV"),
    crearNodo = (str) => new DOMParser().parseFromString(str, "text/html").body;

  let creador = document.getElementById("crear_guia");
  const readonly = datos.transportadora == "INTERRAPIDISIMO";

  let solicitud_recoleccion = `
        <div class="col-sm-6 mb-2 form-check">
            <input type="checkbox" id="recoleccion" class="form-check-input">
            <label for="recoleccion" class="form-check-label" checked>Solicitud de Recolección</label>
        </div>
    `;

  let clientes = `   <div class="col-sm-6 mb-2 form-check" id="contenedor-guardar-user">
    <input type="checkbox" id="guardarUsuario" class="form-check-input">
    <label for="guardarUsuario" class="form-check-label" checked>Guardar en clientes frecuentes</label>
</div>`;

  let modificarCliente = `   <div class="col-sm-6 mb-2 form-check d-none" id="contenedor-modificar-user">
<input type="checkbox" id="modificarUser" class="form-check-input">
<label for="modificarUser" class="form-check-label" checked>Modificar usuario frecuente</label>
</div>`;
  let entrega_en_oficina = "";

  const checkCreacionPedido = `
        <div class="col-sm-6 mb-2 form-check d-none">
            <input type="checkbox" id="check-crear_pedido" class="form-check-input">
            <label for="check-crear_pedido" class="form-check-label">Crear en forma de pedido</label>
        </div>
    `;

  if (datos.transportadora !== "SERVIENTREGA" && datos.transportadora !== "INTERRAPIDISIMO"  ) {
    solicitud_recoleccion = `
        <div class="alert alert-danger col-12">
            <h3 class='ml-2'><small>Para realizar solicitud de recolección con ${datos.transportadora}, por favor, enviar la solicitud al correo <a href="mailto:atencion@hekaentrega.co">atencion@hekaentrega.co</a>.</small></h3>
        </div>
        `;
  }

  if (datos.oficina) {
    entrega_en_oficina = `
        <div class="col-sm-2">
            <h5>Tipo de entrega (flexii)</h5>

            <select class="custom-select" id="tipo_ditribucion_flexi" name="tipo_ditribucion_flexi">
                <option value="">Seleccione</option>
                ${TIPOS_DIST_OFICINA.map((val, i) =>
                  datos.datos_oficina.tipo_distribucion[i] === 1
                    ? `<option value="${i}">${val}</option>`
                    : null
                ).filter(Boolean)}
            </select>
        </div>`;
  } else {
    if (
      datos.transportadora === "INTERRAPIDISIMO" ||
      datos.transportadora === "SERVIENTREGA"
    ) {
      entrega_en_oficina = `
            <div class="col-sm-2">
                <h5>Tipo de entrega</h5>
    
                <select class="custom-select" id="entrega_en_oficina" name="entrega_en_oficina">
                    <option value="">Seleccione</option>
                    <option value="1">Entrega en dirección</option>
                    <option value="2">Entrega en oficina</option>
                </select>
            </div>`;
    }
  }

  let detalles = detalles_cotizacion(datos),
    boton_regresar =
      crearNodo(`<a class="btn btn-outline-primary btn-block mb-3" href="#cotizar_envio" onclick="regresar()">
            Regresar
            </a>`),
    input_producto = crearNodo(`<div class="row">
            <div class="col-md-6 mb-3 mb-sm-0">
                <h6>producto <span>(Lo que se va a enviar)</span></h6>
                <input id="producto" class="form-control form-control-user detect-errors" 
                name="producto" type="text" maxlength="40"
                placeholder="Introduce el contenido de tu envío">
                <p id="aviso-producto" class="text-danger d-none m-2"></p>
            </div>
            <div class="col-md-6 mb-3 mb-sm-0">
                <h6>Referencia <span>(Opcional)</span></h6>
                <input id="referencia" class="form-control form-control-user detect-errors" 
                placeholder="Clasificación de manejo personal"
                name="referencia" type="text" maxlength="40">
            </div>
        </div>`),
    directionNode = mostrarDirecciones(datos),
    input_buscar_usuario =
      datos_usuario.type === "PUNTO"
        ? `
            <div class="col-sm-6 mb-3 mb-sm-0">
                <h5>Cliente</h5>
                <div class="input-group mb-3">
                    <input id="numero_documento_usuario" type="number" class="form-control form-control-user" required="">  

                    <div class="input-group-append">
                        <button id="buscador_usuario-guia" class="btn btn-outline-primary btn-small"><i class="fa fa-search"></i></button>
                        <button data-toggle="modal" data-target="#modal-usuario_punto" 
                        id="crear_usuario-guia" 
                        class="btn btn-outline-primary btn-small">
                            <i class="fa fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 mb-3 mb-sm-0">
                <div class="card card-shadow" >
                    <div class="card-body" id="presentacion-cliente">
                    </div>
                </div>
            </div>
        `
        : "",
    datos_remitente = crearNodo(`
        <div class="card card-shadow m-6 mt-5" id="informacion-personal">
            <div class="card-header">
                <h4 class="m-0 font-weight-bold text-primary text-center">Datos de ${
                  datos_usuario.nombre_completo
                }</h4>
            </div>
            <div class="card-body row">
                <div class="col-sm-6 mb-3 mb-sm-0">
                    <h5>Nombre del Remitente</h5>
                    <input id="actualizar_nombreR" type="text" class="form-control form-control-user" value="${
                      datos_usuario.nombre_completo
                    }" ${readonly && "readonly"} required="">  
                </div>
                <div class="col-sm-6 mb-3 mb-sm-0">
                    <h5>Celular del remitente</h5>
                    <input id="actualizar_celularR"  type="text" class="form-control form-control-user" value="${
                      datos_usuario.celular
                    }" ${readonly && "readonly"} required="">  
                </div>
                ${directionNode}
                ${input_buscar_usuario}
            </div>
        </div>
        `),
    notas_oficina = datos.oficina
      ? `
            <div class="text-muted border-left-primary m-2">
                <h6 class="ml-2">
                    <span><b>Nota:</b> Por ahora FLEXII solo cuenta con entregas en oficina. !Esperamos incluir pronto las entregas a domicilio!</span>
                </h6>
            </div>
        `
      : "",
    datos_destinatario = crearNodo(`
        <div class="card card-shadow m-6 mt-5">
            <div class="card-header py-3">
                <h4 class="m-0 font-weight-bold text-primary text-center">Datos del Destinatario</h4>
            </div>


         <div class="card cotizador-beta" id="opciones-cotizador">
            <div class="card-body">

              <div class="row">    
                <div class="form-group col-md">
                  <label for="list_bodegas-cotizador">
                    Clientes Frecuentes
                    <i class="fa fa-question-circle" data-toggle="tooltip" title='Puedes listar clientes frecuentes para una creación de guía más oportuna'></i> 
                  </label>
                  <select type="text" class="form-control"
                  id="list_clientesFrecuentes" >
                  <option value="">Seleccione</option>
                </select>
                </div>
              </div>

              <div class="row">
                <div class="col-sm-6 text-center d-none" id="cont_act_plant-cotizador">
                  <input type="checkbox" id="actv_editar_plantilla-cotizador">
                  <label for="actv_editar_plantilla-cotizador">
                    Cambiar datos de la <b>plantilla</b>
                    <i class="fa fa-question-circle" data-toggle="tooltip" title='Si marcas la opción, se editará la información guardada previamente al presionar el botón "Cotizar envío"'></i> 
                  </label>
                </div>

              </div>
            </div>
            
          </div>

            <form id="datos-destinatario">
                <div class="card-body row">
                    <div class="col-lg-6 mb-3 mb-2">
                        <h5>Nombre del Destinatario</h5>
                        <input type="text" name="nombreD" id="nombreD" class="form-control form-control-user" value="" placeholder="Nombre" required="">
                    </div>
                    <div class="col-lg-6 mb-3 mb-2">
                        <div class="row align-items-center">
                            <div class="col-sm-8 mb-2">
                                <label for="identificacionD">Documento de identificación</label>
                                <input type="number" id="identificacionD" required="" class="form-control form-control-user detect-errors" value="" placeholder="ej. 123456789" required="">
                            </div>
                            <div class="col mb-2">
                                <label for="tipo-doc-dest" class="col-form-label">Tipo De Documento</label>
                                <select class="custom-select" form="datos-destinatario" required="" id="tipo-doc-dest">
                                    <option value="">Seleccione</option>
                                    <option value="1">NIT</option>
                                    <option value="2">CC</option>
                                </select>
                            </div>
                        
                        </div>
                    </div>
                    ${entrega_en_oficina}
                    <div class="col-sm-${
                      entrega_en_oficina ? "5" : "6"
                    } mb-3 mb-2">
                        <h5>Dirección del Destinatario</h5>
                        <input type="text" id="direccionD" class="form-control form-control-user" value="" placeholder="Dirección-Conjunto-Apartemento" required="">
                    </div>
                    <div class="col-sm-${
                      entrega_en_oficina ? "5" : "6"
                    } mb-3 mb-2">
                        <h5>Barrio del Destinatario</h5>
                        <input type="text" id="barrioD" class="form-control form-control-user detect-errors" value="" placeholder="Barrio" required="">
                    </div>
                    <div class="col-sm-6 mb-3 mb-2">
                        <h5>Celular del Destinatario</h5>
                        <input type="number" id="telefonoD" class="form-control form-control-user detect-errors" 
                        value="" placeholder="Celular" required="" maxlengt="10">
                    </div>
                    <div class="col-sm-6 mb-3 mb-2">
                        <h5>Otro celular del Destinatario</h5>
                        <input type="number" id="celularD" class="form-control form-control-user detect-errors" value="" placeholder="celular">
                    </div>
                    <div class="col-sm-6 mb-3 mb-2">
                        <h5>Email</h5>
                        <input type="email" id="correoD" class="form-control form-control-user" value="" placeholder="nombre@ejemplo.com">
                    </div>
                    <div class="col-sm-6 mb-3 mb-2">
                        <h5>Observaciones Adicionales</h5>
                        <input type="text" id="observaciones" class="form-control form-control-user detect-errors" value="" placeholder="Observaciones Adicionales">
                    </div>
                    ${solicitud_recoleccion}
                    ${clientes}
                    ${modificarCliente}
                    ${checkCreacionPedido}
                </div>
            </form>
        </div>
        `),
    boton_crear = crearNodo(`<button type="button" id="boton_final_cotizador" 
            class="btn btn-success btn-block mt-5" title="Crear guía" onclick="crearGuia()">Crear guía</button>`);

  if (!directionNode) return;
  div_principal.append(
    boton_regresar,
    detalles,
    input_producto,
    datos_remitente,
    datos_destinatario,
    boton_crear
  );
  creador.innerHTML = "";
  creador.innerHTML = div_principal.innerHTML;
  location.href = "#crear_guia";
  scrollTo(0, 0);

  const cambiadorDeDireccion = $("#moderador_direccionR");
  cambiadorDeDireccion.on("change", cambiarDirecion);
  cambiarDirecion.bind(cambiadorDeDireccion[0])();

  $("#entrega_en_oficina").on("change", verificarSelectorEntregaOficina);

  if (datos_usuario.type === "PUNTO")
    $("#buscador_usuario-guia").click(buscarUsuario);

  restringirCaracteresEspecialesEnInput();
  let informacion = document.getElementById("informacion-personal");
  document.getElementById("producto").addEventListener("blur", () => {
    let normalmente_envia = false;
    for (let product of datos_usuario.objetos_envio) {
      product = product.toLowerCase();
      if (value("producto").trim().toLowerCase() == product) {
        normalmente_envia = true;
      }
    }
    let aviso = document.getElementById("aviso-producto");
    if (!normalmente_envia) {
      aviso.innerHTML =
        'No se registra en lo que normalmente envías: <b>"' +
        datos_usuario.objetos_envio.join(", ") +
        '".</b> \r si deseas continuar de todos modos, solo ignora este mensaje';
      aviso.classList.remove("d-none");
    } else {
      aviso.classList.add("d-none");
    }
  });

  const ciudad = document.getElementById("ciudadDestinoUsuario");

  const referenciaUsuariosFrecuentes = usuarioAltDoc().collection(
    "plantillasUsuariosFrecuentes"
  );

  opciones.length = 0;

  referenciaUsuariosFrecuentes
    .where("ciudad", "==", ciudad.value)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((document) => {
        const data = document.data();
        data.id = document.id;
        console.log(data);

        opciones.push(data);
      });
    })
    .then(() => {
      console.log(opciones);
      cargarUsuariosFrecuentes(opciones);
    });
}

//jose
function cargarUsuariosFrecuentes(personas) {
  const selectClientes = document.getElementById("list_clientesFrecuentes");

  const contenedorGuardar = document.getElementById("contenedor-guardar-user");
  const guardarUser = document.getElementById("guardarUsuario");

  const contenedorModificar = document.getElementById(
    "contenedor-modificar-user"
  );
  const modificarUser = document.getElementById("modificarUser");

  console.log(personas);

  // Itera a través del arreglo de personas y agrega opciones al select
  personas.map((persona) => {
    const option = document.createElement("option");
    option.value = persona.id;
    option.text = `${persona.nombre}`;
    selectClientes.appendChild(option);
  });

  selectClientes.addEventListener("change", () => {
    const selectedValue = selectClientes.value;
    // Obtener los elementos input por su ID
    const nombreDestinatario = document.getElementById("nombreD");
    const identificacionDestinatario =
      document.getElementById("identificacionD");
    const tipoDocumentoDestinatario = document.getElementById("tipo-doc-dest");
    const direccionDestinatario = document.getElementById("direccionD");

    const barrioDestinatario = document.getElementById("barrioD");
    const telefonoDestinatario = document.getElementById("telefonoD");
    const celularDestinatario = document.getElementById("celularD");
    const correoDestinatario = document.getElementById("correoD");
    const tipoEntrega = document.getElementById("entrega_en_oficina");
    const observacionesDestinatario = document.getElementById("observaciones");

    // Encuentra el usuario seleccionado en el arreglo de personas
    const selectedPersona = personas.find(
      (persona) => persona.id === selectedValue
    );

    console.log(selectedPersona);

    // Actualiza los valores de los inputs
    if (selectedPersona) {
      contenedorModificar.classList.remove("d-none");
      contenedorGuardar.classList.add("d-none");
      guardarUser.checked = false;
      nombreDestinatario.value = selectedPersona.nombre;
      identificacionDestinatario.value = selectedPersona.documentoIdentidad;
      tipoDocumentoDestinatario.value = selectedPersona.tipoDocumento;
      direccionDestinatario.value = selectedPersona.direccionDestinatario;
      barrioDestinatario.value = selectedPersona.barrio;
      telefonoDestinatario.value = selectedPersona.otroCelular;
      celularDestinatario.value = selectedPersona.celular;
      correoDestinatario.value = selectedPersona.email;
      tipoEntrega.value = selectedPersona.tipoEntrega;
      observacionesDestinatario.value = selectedPersona.observaciones;
      contenedorGuardar.classList.add("d-none");

      var event = new Event("change");
      tipoDocumentoDestinatario.dispatchEvent(event);
      tipoEntrega.dispatchEvent(event);
    } else {
      contenedorModificar.classList.add("d-none");
      contenedorGuardar.classList.remove("d-none");
      // Si no se encuentra el usuario, puedes borrar los valores o mostrar un mensaje de error.
      nombreDestinatario.value = "";
      identificacionDestinatario.value = "";
      tipoDocumentoDestinatario.value = "";
      direccionDestinatario.value = "";
      barrioDestinatario.value = "";
      telefonoDestinatario.value = "";
      celularDestinatario.value = "";
      correoDestinatario.value = "";
      tipoEntrega.value = "";
      observacionesDestinatario.value = "";
      modificarUser.checked = false;
    }
  });
}

function enviarUsuarioFrecuente() {
  //inputs importantes
  const guardarUsuario = document.getElementById("guardarUsuario");
  const modificarUser = document.getElementById("modificarUser");

  //en el caso que no haya ninguna opción seleccionada
  if (!guardarUsuario.checked && !modificarUser.checked) {
    return;
  }

  // Obtener los elementos input por su ID
  const nombreDestinatario = document.getElementById("nombreD");
  const identificacionDestinatario = document.getElementById("identificacionD");
  const tipoDocumentoDestinatario = document.getElementById("tipo-doc-dest");
  const direccionDestinatario = document.getElementById("direccionD");

  const barrioDestinatario = document.getElementById("barrioD");
  const telefonoDestinatario = document.getElementById("telefonoD");
  const celularDestinatario = document.getElementById("celularD");
  const correoDestinatario = document.getElementById("correoD");
  const tipoEntrega = document.getElementById("entrega_en_oficina");
  const observacionesDestinatario = document.getElementById("observaciones");
  const ciudad = document.getElementById("ciudadDestinoUsuario");

  const nuevoObjeto = {
    nombre: nombreDestinatario.value,
    documentoIdentidad: identificacionDestinatario.value,
    tipoDocumento: parseInt(tipoDocumentoDestinatario.value),
    tipoEntrega: parseInt(tipoEntrega?.value) || 1,
    direccionDestinatario: direccionDestinatario.value,
    barrio: barrioDestinatario.value,
    celular: celularDestinatario.value,
    otroCelular: telefonoDestinatario.value,
    email: correoDestinatario.value,
    observaciones: observacionesDestinatario.value,
    ciudad: ciudad.value,
  };
  const dataejemplo = {
    nombre: "Juan Pérez",
    documentoIdentidad: "123456789",
    tipoDocumento: 1, // 1 para NIT, 2 para CC
    tipoEntrega: 1, // 1 para Tipo de entrega 1, 2 para Tipo de entrega 2
    direccionDestinatario: "Calle 123",
    barrio: "Barrio A",
    celular: "1234567890",
    otroCelular: "9876543210",
    email: "juan.perez@example.com",
    observaciones: "Entregar por la puerta trasera",
  };

  console.log(opciones);

  const referenciaUsuariosFrecuentes = usuarioAltDoc().collection(
    "plantillasUsuariosFrecuentes"
  );

  //si quiero agregar un nuevo usuario frecuente
  if (guardarUsuario.checked && !modificarUser.checked) {
    referenciaUsuariosFrecuentes
      .add(nuevoObjeto)
      .then((docRef) => {
        console.log("Documento agregado con ID:", docRef.id);
        avisar("Operación exitosa", "Usuario frecuente agregado");
      })
      .catch((error) => {
        console.error("Error al agregar el documento:", error);
      });
  }

  //si quiero modificar un usuario frecuente que ya esté creado

  const selectClientes = document.getElementById("list_clientesFrecuentes");

  if (modificarUser.checked && !guardarUsuario.checked) {
    referenciaUsuariosFrecuentes
      .doc(selectClientes.value)
      .set(nuevoObjeto)
      .then(() => {
        console.log("modificado");
      })
      .then(avisar("Operación exitosa", "Usuario frecuente agregado"));
  }
}

async function buscarUsuario(e) {
  const inp = $("#numero_documento_usuario");
  const presentacion = $("#presentacion-cliente");
  datos_a_enviar.id_user = null;
  datos_a_enviar.centro_de_costo = null;
  datos_a_enviar.info_user = {
    centro_de_costo: null,
    numero_documento: null,
    celular: null,
  };

  presentacion.html("");
  const usuario = await db
    .collection("usuarios")
    .where("numero_documento", "==", inp.val())
    .get()
    .then((q) => {
      if (q.size) {
        const d = q.docs[0];
        const data = d.data();
        data.id = d.id;
        return data;
      }

      return null;
    });

  if (!usuario) return presentacion.html("<p>Usuario no encontrado</p>");

  datos_a_enviar.centro_de_costo = usuario.centro_de_costo;
  datos_a_enviar.id_user = usuario.id;

  datos_a_enviar.info_user = {
    centro_de_costo: usuario.centro_de_costo,
    numero_documento: usuario.numero_documento,
    celular: usuario.celular,
    nombre_completo:
      usuario.nombres.split(" ")[0] + " " + usuario.apellidos.split(" ")[0],
  };

  presentacion.html(`
        <h5 class="card-title">Presentación Cliente</h5>
        <p><b>Nombre: </b> ${
          usuario.nombres.split(" ")[0] + " " + usuario.apellidos.split(" ")[0]
        }</p>
        <p><b>Número documento: </b> ${usuario.numero_documento}</p>
        <p><b>Número celular: </b> ${usuario.celular}</p>
    `);
  console.log(usuario);
}

// function que devuelve un input group con las direcciones disponibles
function mostrarDirecciones(datos) {
  const transp = datos.transportadora;
  const bodegas = datos_usuario.bodegas;
  const ciudad = datos.ciudadR + "(" + datos.departamentoR + ")";
  const avisoError = {
    icon: "warning",
    text: "No existe una bodega habilitada para esta transportadora con la ciudad de remitente ingresada.",
    showCancelButton: true,
    cancelButtonText: "Cerrar",
    confirmButtonText: "Ver bodegas",
  };

  if (!bodegas) {
    Swal.fire(avisoError).then((res) => {
      if (res.isConfirmed) location.href = "#bodegas";
    });
    return false;
  }

  const respuesta = document.createElement("div");
  const inpGroup = document.createElement("div");
  const groupAppend = document.createElement("div");
  const input = document.createElement("input");
  const select = document.createElement("select");
  const small = document.createElement("small");
  const aggDireccion = document.createElement("p");

  let direcciones = 0;

  respuesta.setAttribute("class", "col-12 mt-2");
  inpGroup.classList.add("input-group");
  groupAppend.classList.add("input-group-append");
  input.classList.add("form-control");
  input.setAttribute("type", "text");
  input.setAttribute("id", "actualizar_direccionR");
  input.setAttribute("readonly", true);
  select.classList.add("custom-select");
  select.setAttribute("id", "moderador_direccionR");
  select.setAttribute("data-moderate", "#actualizar_direccionR");
  small.setAttribute("class", "text-muted ver-direccion");
  aggDireccion.setAttribute("class", "text-muted");
  aggDireccion.innerHTML =
    "<small>¿no está la bodega que necesitas? puedes agregarla <a href='#bodegas'>aquí</a></small>";

  respuesta.innerHTML =
    "<label for='#actualizar_direccionR'>Dirección del Remitente</label>";

  bodegas.forEach((bodega, i) => {
    if (bodega.ciudad !== ciudad) return;
    if (transp === "INTERRAPIDISIMO" && !bodega.codigo_sucursal_inter) return;

    select.innerHTML += `<option value="${i}">${bodega.nombre}</option>`;

    direcciones++;
  });

  groupAppend.appendChild(select);
  inpGroup.append(input, groupAppend);
  respuesta.append(inpGroup, small, aggDireccion);

  if (!direcciones) {
    Swal.fire(avisoError).then((res) => {
      if (res.isConfirmed) location.href = "#bodegas";
    });
    return false;
  }

  return respuesta.outerHTML;
}

function cambiarDirecion(e) {
  const n = this.value;
  const toModerate = this.getAttribute("data-moderate");
  const inp = $(toModerate);

  bodega = datos_usuario.bodegas[n];

  inp.val(bodega.direccion + ", " + bodega.barrio);
  $(".ver-direccion").text(
    bodega.direccion + ", " + bodega.barrio + " / " + bodega.ciudad
  );
}

function verificarSelectorEntregaOficina(e) {
  const select = e.target;
  const tipo_distribucion = ciudadD.dataset.tipo_distribucion;

  if (codTransp === "SERVIENTREGA") {
    if (tipo_distribucion === "ENTREGA EN OFICINA" && select.value == "1") {
      swal.fire({
        icon: "warning",
        text:
          "Es probable que la ciudad a la que deseas realizar tu envío solo cuente con " +
          tipo_distribucion +
          ".",
      });
    } else if (
      tipo_distribucion === "ENTREGA A DOMICILIO" &&
      select.value == "2"
    ) {
      swal.fire({
        icon: "warning",
        text:
          "Es probable que la ciudad a la que deseas realizar tu envío solo cuente con " +
          tipo_distribucion +
          ".",
      });
    }
  } else if (codTransp === "INTERRAPIDISIMO") {
    const inpDir = $("#direccionD");
    const inputBarrio = $("#barrioD");
    if (select.value == "2") {
      inpDir.prop("disabled", true).val("Oficina principal interrapidisimo");
      inputBarrio
        .prop("disabled", true)
        .val("Oficina principal interrapidisimo");
    } else {
      inpDir.prop("disabled", false).val("");
      inputBarrio.prop("disabled", false).val("");
    }
  }
}

function restringirCaracteresEspecialesEnInput() {
  const detector = new DetectorErroresInput(
    ".detect-errors",
    "#direccionD"
  ).init("input");
  detector.setBooleans = [
    {
      operator: "contains",
      message:
        'Se cambiará el carácter ingresado "{forbidden}" por "{sustitute}"',
      selector: "#direccionD",
      forbid: "#",
      sustitute: "Nro ",
    },
    {
      operator: "contains",
      message:
        'Se cambiará el carácter ingresado "{forbidden}" por "{sustitute}".',
      selector: "#direccionD",
      forbid: "-",
      sustitute: " ",
    },
    {
      operator: "regExp",
      message: 'El caracter "{forbidden}" no está permitido',
      forbid: /[^\wñÑ\s]/g,
      sustitute: "",
      removeAccents: true,
    },
  ];

  const nombreD = new DetectorErroresInput("#nombreD").init("input");
  nombreD.insertBoolean = {
    operator: "regExp",
    message: 'El caracter "{forbidden}" no está permitido',
    selector: "#nombreD",
    forbid: /[^\wñÑ\s-]/g,
    sustitute: "",
    removeAccents: true,
  };
}

function regresar() {
  document.getElementById("result_cotizacion").style.display = "none";
  location.href = "#cotizar_envio";
}

// Verifica que el trayecto sea especial, nacional, o urbano
function revisarTrayecto() {
  let c_origen = document.getElementById("ciudadR").dataset;
  let c_destino = document.getElementById("ciudadD").dataset;
  if (c_destino.tipo_trayecto == "TRAYECTO ESPECIAL") {
    return "Especial";
  } else {
    if (c_destino.id == c_origen.id) {
      return "Urbano";
    } else if (c_destino.departamento == c_origen.departamento) {
      return "Zonal";
    } else {
      return "Nacional";
    }
  }
}

// Realiza el calculo del envio y me devuelve sus detalles
class CalcularCostoDeEnvio {
  constructor(valor, type, kilos, vol, extraData) {
    //Datos por defecto para Servientrega
    this.type = type;
    this.valor = type == "CONVENCIONAL" ? 0 : parseInt(valor);
    this.convencional = type === "CONVENCIONAL";
    this.seguro = parseInt(valor);
    this.kg = kilos || parseInt(value("Kilos"));
    this.volumen =
      vol ||
      value("dimension-ancho") *
        value("dimension-alto") *
        value("dimension-largo");
    this.factor_de_conversion = 222 / 1e6;
    this.data = extraData || new Object();
    this.precios = extraData ? extraData.precios : datos_personalizados;
    this.comision_transp = this.precios.comision_servi;
    this.sobreflete_min = 3000;
    this.seguroMercancia = 0;
    this.kg_min = 3;
    this.codTransp = "SERVIENTREGA";
    this.sobreflete_oficina = 0;
    this.comision_punto = 0;
    this.isOficina = false;

    this._alto = parseInt(value("dimension-alto"));
    this._ancho = parseInt(value("dimension-ancho"));
    this._largo = parseInt(value("dimension-largo"));
  }

  set alto(number) {
    this._alto = number;
  }
  get alto() {
    return this._alto;
  }

  set ancho(number) {
    this._ancho = number;
  }
  get ancho() {
    return this._ancho;
  }

  set largo(number) {
    this._largo = number;
  }
  get largo() {
    return this._largo;
  }

  //Devuelve el paso generado del volumen, debido al factor dec conversión
  get pesoVolumen() {
    let peso_con_volumen = this.volumen * this.factor_de_conversion;
    peso_con_volumen = Math.ceil(Math.floor(peso_con_volumen * 10) / 10);

    return peso_con_volumen;
  }

  //revisa entre el peso del volumen i el paso igresado cual es el mayor para devolverlo
  get kgTomado() {
    if (this.kg < this.kg_min) {
      this.kg = this.kg_min;
    }
    return Math.max(this.pesoVolumen, this.kg);
  }

  get flete() {
    if (this.total_flete) return this.total_flete;
    this.total_flete = this.revisadorInterno(
      this.precios.costo_especial2,
      this.precios.costo_nacional2,
      this.precios.costo_zonal2
    );
    if (this.kgTomado >= 1 && this.kgTomado < 4) {
      this.total_flete = this.revisadorInterno(
        this.precios.costo_especial1,
        this.precios.costo_nacional1,
        this.precios.costo_zonal1
      );
    } else if (this.kgTomado >= 4 && this.kgTomado < 9) {
    } else {
      let kg_adicional = this.kgTomado - 8;
      this.total_flete +=
        kg_adicional *
        this.revisadorInterno(
          this.precios.costo_especial3,
          this.precios.costo_nacional3,
          this.precios.costo_zonal3
        );
    }
    this.fletePrev = this.total_flete * 0.18 + this.total_flete;
    this.descuento = true;
    return this.total_flete;
  }

  get costoEnvio() {
    let resultado = this.flete + this.sobreFletes(this.valor);

    if (ControlUsuario.esPuntoEnvio) {
      this.comision_punto = Math.floor(
        (datos_personalizados.comision_punto * resultado) / 100
      );
      resultado += this.comision_punto;
    }

    return resultado;
  }

  get costoDevolucion() {
    if (this.costoDevolucionFormulado(datos_personalizados.formula_devolucion))
      return this.costoDevolucionFormulado(
        datos_personalizados.formula_devolucion
      );

    if (this.isOficina) return this.flete * 2 + 1000;

    switch (this.codTransp) {
      case transportadoras.SERVIENTREGA.cod:
        return this.costoEnvio;
      case transportadoras.INTERRAPIDISIMO.cod:
        return this.flete + this.seguroMercancia + this.sobreflete + 1000;
      case transportadoras.ENVIA.cod:
        return (this.flete + this.seguroMercancia + 1000) * 2;
      case transportadoras.COORDINADORA.cod:
        return (this.flete + this.seguroMercancia + 1000) * 2;
    }
  }

  get estructuraFormula() {
    return {
      F: this.flete, // Para el flete devuelto en la cotización
      CE: this.costoEnvio, // EL costo del envío
      SM: this.seguroMercancia, // El seguro de mercancía
      SF: this.sobreflete, // El sobreflete
    };
  }

  get costoEnvioPrev() {
    let resultado = this.fletePrev + this.sobreFletes(this.valor);
    return resultado;
  }

  get getDetails() {
    console.groupCollapsed("Detalles de Cotización");
    console.log("Valor ingresado =>", this.valor);
    console.log("Kg => ", this.kgTomado);
    console.log("Volumen => ", this.volumen);
    console.log("comision transportadora => ", this.sobreflete);
    console.log("Seguro mercancia => ", this.seguroMercancia);
    console.log("Comision heka => ", this.sobreflete_heka);
    console.log("Comisión Oficina =>", this.sobreflete_oficina);
    console.log("Flete => ", this.flete);
    console.log("Costo de envío =>", this.costoEnvio);
    console.groupEnd();

    const details = {
      peso_real: this.kg,
      flete: this.flete,
      comision_heka: this.sobreflete_heka,
      comision_trasportadora: this.sobreflete + this.seguroMercancia,
      peso_liquidar: this.kgTomado,
      peso_con_volumen: this.pesoVolumen,
      total: this.costoEnvio,
      recaudo: this.valor,
      seguro: this.seguro,
      costoDevolucion: this.costoDevolucion,
    };

    if (this.aveo) {
      details.seguro_mercancia = this.precio.costoManejo;
    }

    if (ControlUsuario.esPuntoEnvio)
      details.comision_punto = this.comision_punto;

    if (this.sobreflete_oficina)
      details.sobreflete_oficina = this.sobreflete_oficina;

    return details;
  }

  get empty() {
    return this.indisponible;
  }

  set flete(val) {
    this.total_flete = val;
  }

  set sumarCostoDeEnvio(val) {
    let counter = 0;
    // if(this.aveo) return;
    /* Mientras que el valor ingresado se mayor al valor devuelto por el contructor
        menos el costo del envío ingresa al bucle que le suma al valor ingresado el costo 
        del envío impuesto por el viejo contructor, para así sustituir el constructor*/
    while (val > Math.round(this.valor - this.costoEnvio) && counter < 10) {
      this.valor = Math.round(val + this.costoEnvio);
      this.seguro =
        this.aveo || this.codTransp === "ENVIA" ? this.seguro : this.valor;
      counter++;
      console.log("\n *** Estamos en bucle fase " + counter);
      console.log(this.codTransp);
      // this.getDetails;
    }
  }

  set empty(val) {
    this.indisponible = val;
  }

  costoDevolucionFormulado(formulas) {
    console.log(formulas);
    if (!formulas) return null;
    const listadoFormulas = formulas
      .split("--")
      .map((v) => v.trim().split(":"));
    if (!listadoFormulas.length) return null;

    const estructura = listadoFormulas.find((f) => f[0] === this.codTransp);

    if (!estructura) return null;

    let respuesta = estructura[1];
    const regexp = /([A-Z]+)/g;

    let exp,
      c = 0;
    while ((exp = regexp.exec(respuesta))) {
      c++;
      if (c >= 100) throw new Error("Alerta de bucle infinito");

      console.log(exp);
      const [expresion, item] = exp;

      const valor = this.estructuraFormula[item];
      respuesta = respuesta.replace(expresion, valor);
    }

    console.log(respuesta);
    return eval(respuesta);
  }

  sobreFletes(valor) {
    this.sobreflete = Math.ceil(
      Math.max((this.seguro * this.comision_transp) / 100, this.sobreflete_min)
    );

    let comision_heka = this.precios.comision_heka;
    let constante_heka = this.precios.constante_pagoContraentrega;
    if (this.convencional) {
      this.seguroMercancia = this.sobreflete;
      this.sobreflete = 0;
      comision_heka = 1;
      constante_heka = this.precios.constante_convencional;
    }

    this.sobreflete_heka =
      this.set_sobreflete_heka ||
      Math.ceil((valor * comision_heka) / 100) + constante_heka;

    if (this.codTransp === "INTERRAPIDISIMO") this.intoInter(this.precio);
    if (this.aveo) this.intoAveo(this.precio);
    if (this.envia) this.intoEnvia(this.precio);
    if (this.coordinadora) this.intoCoord(this.precio);
    if (this.servi) this.intoServi(this.precio, this.convencional);

    if (
      !this.convencional &&
      ["ENVIA", "INTERRAPIDISIMO", "COORDINADORA"].includes(this.codTransp)
    )
      this.sobreflete_heka += 1000;

    //* TEMPORAL: cuando el typo de envio es contraentrega y la transportadora es envía, el 'sobreflete_heka'
    //* pasa a ser cero, hasta que se genere la estrategia de comisión heka
    if (this.type === CONTRAENTREGA && this.envia) {
      this.sobreflete_heka = 0;
    }

    const respuesta =
      this.sobreflete +
      this.seguroMercancia +
      this.sobreflete_heka +
      this.sobreflete_oficina;
    return respuesta;
  }

  //según sea el trayecto devuelve entre los valores ingresados al primero que coincida
  revisadorInterno(especial, nacional, urbano) {
    let c_destino = this.data ? this.data.ciudadD : "";
    let c_origen = this.data ? this.data.ciudadR : "";
    switch (this.revisarTrayecto(c_origen, c_destino)) {
      case "Especial":
        return especial;
        break;
      case "Nacional":
        return nacional;
        break;
      case "NA":
        this.empty = true;
        return 0;
        break;
      default:
        return urbano;
        break;
    }
  }

  // revisa las opciones de la ciudad de destino y origen para devolverme el tipo de trayecto
  revisarTrayecto(origen, destino) {
    let c_origen = origen || document.getElementById("ciudadR").dataset;
    let c_destino = destino || document.getElementById("ciudadD").dataset;

    if (
      c_destino.tipo_trayecto == "undefined" &&
      this.codTransp == "SERVIENTREGA"
    )
      return "NA";

    if (c_destino.tipo_trayecto == "TRAYECTO ESPECIAL") {
      return "Especial";
    } else {
      if (c_destino.id == c_origen.id) {
        return "Urbano";
      } else if (c_destino.departamento == c_origen.departamento) {
        return "Zonal";
      } else {
        return "Nacional";
      }
    }
  }

  async putTransp(transportadora, dataObj) {
    this.codTransp = transportadora;
    switch (transportadora) {
      case transportadoras.INTERRAPIDISIMO.cod:
        this.factor_de_conversion = 1 / 6000;
        this.kg_min = 0.1;
        let respuestaCotizacion = await this.cotizarInter(
          dataObj.dane_ciudadR,
          dataObj.dane_ciudadD
        );
        if (!respuestaCotizacion) {
          this.empty = true;
          break;
        }

        this.precio = respuestaCotizacion.Precio;
        // this.precio.Valor += 1000;
        this.tiempo = respuestaCotizacion.TiempoEntrega;
        console.log("PRECIO", this.precio);
        this.intoInter(this.precio);

        break;

      case transportadoras.ENVIA.cod:
        const respCotizacionEnvia = await this.cotizarEnvia(
          dataObj.dane_ciudadR,
          dataObj.dane_ciudadD
        );
        break;

      case transportadoras.COORDINADORA.cod:
        await this.cotizarCoord(dataObj.dane_ciudadR, dataObj.dane_ciudadD);
        break;

      case transportadoras.TCC.cod:
        const cotizaciones = dataObj.cotizacionAveo;
        if (!cotizaciones) {
          this.empty = true;
          break;
        }
        const cotizacion = cotizaciones[transportadora];
        if (!cotizacion) {
          this.empty = true;
          break;
        }

        this.precio = cotizacion;
        this.aveo = true;
        // this.sumarCostoDeEnvio = false;
        this.kg_min = 1;
        this.factor_de_conversion = 0;
        this.sobreflete_min = 0;
        this.valor = parseInt(cotizaciones.recaudo);

        this.intoAveo(cotizacion);
        break;

      default:
        //La transportadora por defecto es servientrega
        //el envío por defecto es PAGO CONTRAENTREGA
        if (this.convencional) {
          this.sobreflete_min = 350;
          this.comision_transp = 1;
        }

        await this.cotizarServi(dataObj.dane_ciudadR, dataObj.dane_ciudadD);
        break;
    }

    return this;
  }

  async intoInter(precio) {
    this.seguroMercancia = Math.ceil(this.seguro * 0.02);
    if (this.type != "CONVENCIONAL") {
      let servicioContraPago;
      if (this.valor > 50000) {
        servicioContraPago = this.valor * 0.03;
      } else {
        servicioContraPago = 2500;
      }
      this.sobreflete = Math.ceil(servicioContraPago);
    }

    this.comision_transp = 2;
    this.sobreflete_min = 0;
    this.fletePrev = precio.Valor + precio.Valor * 0.17;
    this.descuento = true;
    this.flete = precio.Valor;
  }

  async cotizarInter(dane_ciudadR, dane_ciudadD) {
    console.log("cotizando Interrapidisimo");
    let ciudadBloqueada = false;
    // let url = "https://www3.interrapidisimo.com/ApiServInter/api/Cotizadorcliente/ResultadoListaCotizar/";
    let url =
      "https://www3.interrapidisimo.com/ApiServInter/api/CotizadorCliente/ResultadoListaCotizarValidaContrapago/";

    //let ciudadesPorBloquear = ["20013000","19022000","27025000","05034000","05040000","54051000","73055000","27050000","27073000","27075000","52079000","13074000","13001004","27615023","25086000","27099000","05107000","54109000","76109000","05129000","25288001","05147000","97161000","27160000","85015000","27205000","13212000","81220000","52224000","15223000","52233000","19532000","50245000","27135000","27245000","52250000","13248000","20250000","47258000","47268000","70233000","19256000","54250000","19290000","52520000","20295000","52320000","19318000","70265000","54344000","13300000","52354000","27361000","27372000","20383000","47980003","50370001","95025001","99524000","52390000","86573000","52405000","52411000","27413000","19418000","08421000","68425000","25426000","52427000","44430000","70429000","08433000","08436000","20443000","27425000","27430000","27450000","97001000","23500000","13458000","52473000","73461000","54480000","05495000","13490000","27491000","85225000","27495000","68498000","05501000","73504000","52506000","19517000","25518000","05543000","13549000","47555000","52540000","08560000","88564000","91540000","81591000","13580000","52786019","08606000","27580000","27600000","52621000","19622000","47660000","47675000","05642000","68669000","70678000","13655000","50686000","13667000","70713000","05667000","19693000","47703000","52696000","19701000","99624000","54680000","47980008","19743000","68745000","70771000","27787000","13780000","20787000","97666000","19809000","52835000","15839000","27810000","50370000","44847000","76890000","47960000"]
    let ciudadesPorBloquear = ["52835000"];
    ciudadesPorBloquear.forEach((ciudad) => {
      if (ciudad == dane_ciudadD) {
        ciudadBloqueada = true;
      }
    });

    if (
      ciudadBloqueada &&
      !this.isOficina &&
      (this.type === "PAGO CONTRAENTREGA" || this.type == "PAGO DESTINO")
    )
      return 0;

    const pagoContraentrega = this.convencional ? "FALSE" : "TRUE";

    //#region SOLICITUD PASADA AL BACK
    const data = {
      dane_ciudadR,
      dane_ciudadD,
      peso: this.kgTomado,
      seguro: this.seguro,
      pagoContraentrega,
    };
    /* Request de solicitud al back
    let resBack = await fetch(
      "/inter/cotizar",
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "Application/json"
        }
      }
    )
    .then((data) => {
      return data.json()
    })
    .catch((err) => err);
    */
    //#endregion

    let res = await fetch(
      url +
        7986 +
        "/" +
        dane_ciudadR +
        "/" +
        dane_ciudadD +
        "/" +
        this.kgTomado +
        "/" +
        this.seguro +
        "/1/" +
        genFecha("LR") +
        "/" +
        pagoContraentrega
    )
      .then((data) => {
        return data.json();
      })
      .catch((err) => {
        return err;
      });

    if (res.message || res.Message) return 0;
    let mensajeria = res.filter((d) => {
      let Convencional = false;
      let Contraentrega = false;
      d.FormaPagoServicio.FormaPago.forEach((d) => {
        if (d.Descripcion == "AlCobro") {
          Contraentrega = true;
        } else if (d.Descripcion == "Contado") {
          Convencional = true;
        }
      });
      if (d.IdServicio === 3 || d.IdServicio === 6) {
        if (this.type === "CONVENCIONAL" && Convencional === true) {
          return d;
        } else if (
          Contraentrega === true &&
          (this.type === "PAGO CONTRAENTREGA" || this.type == "PAGO DESTINO")
        ) {
          if (ciudadBloqueada) {
            return 0;
          }
          return d;
        }
      }
    });

    if (!mensajeria.length) return 0;

    console.log(res);
    return mensajeria[0];
  }

  intoEnvia(cotizacion) {
    if (!cotizacion) cotizacion = this.precio;
    this.kg = cotizacion.k_cobrados;
    this.total_flete = cotizacion.valor_flete;
    this.sobreflete = cotizacion.valor_otros;
    this.seguroMercancia = cotizacion.valor_costom;
    this.tiempo = cotizacion.dias_entrega;
  }

  async cotizarEnvia(origen, destino) {
    console.log("Cotizando envía");

    const data = {
      ciudad_origen: origen,
      ciudad_destino: destino,
      largo: this.largo,
      ancho: this.ancho,
      alto: this.alto,
      peso: this.kg,
      declarado: this.seguro,
      valorproducto: this.valor, // si aplica pago contraentrega, aquí va
    };

    console.log("enviando: ", data);

    const response = await fetch("envia/cotizar/" + this.type, {
      method: "Post",
      headers: { "Content-Type": "Application/json" },
      body: JSON.stringify(data),
    })
      .then((d) => d.json())
      .catch((d) => ({ respuesta: "Error del servidor" }));

    console.log(response);
    if (response.respuesta) {
      this.empty = true;
      return false;
    }

    this.precio = response;
    this.envia = true;

    if (this.type === CONTRAENTREGA) this.valor = 0;
    this.intoEnvia(response);
    return true;
  }

  intoCoord(cotizacion) {
    if (!cotizacion) cotizacion = this.precio;
    this.kg = cotizacion.peso_liquidado;
    this.total_flete = cotizacion.flete_fijo;
    this.sobreflete = this.convencional
      ? 0
      : Math.round(Math.max(this.valor * 0.0265, 4300));
    this.seguroMercancia = cotizacion.flete_variable;
    this.tiempo = cotizacion.dias_entrega;
  }

  async cotizarCoord(origen, destino) {
    console.log("Cotizando Coordinadora");
    const data = {
      ciudad_origen: origen,
      ciudad_destino: destino,
      largo: this.largo,
      ancho: this.ancho,
      alto: this.alto,
      peso: this.kg,
      seguro: this.seguro,
      valorProducto: this.valor,
    };

    console.log(JSON.stringify(data));
    const response = await fetch("coordinadora/cotizar/" + this.type, {
      method: "Post",
      headers: { "Content-Type": "Application/json" },
      body: JSON.stringify(data),
    })
      .then((d) => d.json())
      .catch((d) => ({ respuesta: "Error del servidor" }));

    console.log(response);
    if (!response || response.respuesta) {
      this.empty = true;
      return false;
    }

    this.precio = response;
    this.coordinadora = true;

    if (this.type === CONTRAENTREGA) this.valor = 0;
    this.intoCoord(response);
    return true;
  }

  intoAveo(cotizacion) {
    this.kg = cotizacion.kilos;
    this.total_flete = cotizacion.fletetotal;
    this.sobreflete = parseInt(cotizacion.valorOtrosRecaudos);
    this.seguroMercancia = cotizacion.costoManejo;
    this.tiempo = cotizacion.diasentrega;
  }

  async intoServi(cotizacion, conv) {
    if (!cotizacion) cotizacion = this.precio;
    this.total_flete = cotizacion.ValorFlete;
    // this.sobreflete = cotizacion.ValorSobreFlete;
    if (conv) {
      this.seguroMercancia = cotizacion.ValorSobreFlete;
    }
  }

  async cotizarServi(dane_ciudadR, dane_ciudadD) {
    const data = {
      IdProducto: 2,
      NumeroPiezas: 1,
      Peso: this.kg <= 3 ? 3 : this.kg,
      Largo: this.largo,
      Ancho: this.ancho,
      Alto: this.alto,
      ValorDeclarado: this.seguro,
      IdDaneCiudadOrigen: dane_ciudadR,
      IdDaneCiudadDestino: dane_ciudadD,
      EnvioConCobro: !this.convencional,
      FormaPago: 2,
      TiempoEntrega: 1,
      // MEDIO DE TRANSPORTE COD 1 = TERRESTRE
      MedioTransporte: 1,
    };
    console.log("COTIZANDO SERVIENTREGA", data);

    const response = await fetch("servientrega/cotizar", {
      method: "Post",
      headers: { "Content-Type": "Application/json" },
      body: JSON.stringify(data),
    })
      .then((R) => R.json())
      .catch((R) => ({ respuesta: "Error del servidor" }));

    if (response.message || response.Message) {
      this.empty = true;
      console.log("ERROR EN SERVIENTREGA", response);
      return false;
    }
    const conv = this.convencional;
    this.precio = response;
    this.servi = true;
    this.intoServi(response, conv);
    console.log("FINALIZÓ SERVIENTREGA");
    return true;
  }
}

function contizarEnviaPrueba() {
  fetch("envia/cotizar/CONVENCIONAL", {
    method: "Post",
  })
    .then((d) => d.json())
    .then((d) => console.log(d));
}

function crearGuiaEnviaPrueba() {
  fetch("envia/crearGuia", {
    method: "Post",
  })
    .then((d) => d.json())
    .then((d) => console.log(d));
}

async function cotizarAveonline(type, params) {
  const url = "/aveo/cotizar";
  const codEnvia = "29";
  const codTcc = "1010";
  try {
    const cotizacion = await fetch(`${url}/${type}`, {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify(params),
    }).then((d) => d.json());
    if (cotizacion.status === "error") return { error: true };

    const envia = cotizacion.cotizaciones.filter(
      (data) => data.codTransportadora == codEnvia
    )[0];
    const tcc = cotizacion.cotizaciones.filter(
      (data) => data.codTransportadora == codTcc
    )[0];

    return {
      recaudo: params.valorRecaudo,
      ENVIA: envia,
      TCC: tcc,
    };
  } catch (e) {
    console.log(e);
    return { error: true };
  }
}

function modificarDatosDeTransportadorasAveo(res) {
  const transp = ["ENVIA", "TCC"];
  transp.forEach((t) => {
    if (res[t]) {
      transportadoras[t].logoPath = res[t].logoTransportadora;
    }
  });
}
async function fetchWithRetry(url, options, maxRetries, segundos) {
  console.log("número maximo de retrys: ", maxRetries, segundos);
  console.log("segundos para rehacer la petición: ", segundos);

  for (let i = 0; i < maxRetries; i++) {
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => controller.abort(), segundos * 1000); // SEGUNDOSSSS

    try {
      let response = await fetch(url, { ...options, signal }); // Asociar la señal con la solicitud fetch

      console.log(`intento ${i + 1}`);

      if (i === 0) {
        Swal.fire({
          title: "Creando Guía",
          text: `Estamos conectandonos con la transportadora, por favor espere un momento`,
          didOpen: () => {
            Swal.showLoading();
          },
          allowOutsideClick: false,
          allowEnterKey: false,
          showConfirmButton: false,
          allowEscapeKey: true,
        });
      } else {
        Swal.fire({
          title: "Creando Guía",
          text: `Intento de conexión No. ${i + 1}`,
          didOpen: () => {
            Swal.showLoading();
          },
          allowOutsideClick: false,
          allowEnterKey: false,
          showConfirmButton: false,
          allowEscapeKey: true,
        });
      }

      return response;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("La solicitud se ha agotado, reintentando...");
        continue; // Si la solicitud se agotó, reintenta
      }
      if (i === maxRetries - 1) throw error; // Si es el último intento, lanza el error
    }
  }
}

// Para enviar la guia generada a firestore
function crearGuia() {
  enviarUsuarioFrecuente();
  let boton_final_cotizador = document.getElementById("boton_final_cotizador");
  const textoBtn = boton_final_cotizador.textContent;
  boton_final_cotizador.innerHTML =
    "<span class='spinner-border spinner-border-sm'></span> Cargando...";

  boton_final_cotizador.setAttribute("disabled", true);

  const mostrarResultado = (res) => {
    if (res.icon === "success") {
      Swal.fire({
        icon: "success",
        title: res.title,
        text: res.mensaje,
        timer: 6000,
        showCancelButton: true,
        confirmButtonText: "Si, ir al cotizador.",
        cancelButtonText: "No, ver el historial.",
      }).then((res) => {
        if (res.isConfirmed) {
          location.href = "#cotizar_envio";
        } else {
          location.href = "#historial_guias";
          cambiarFecha();
        }
      });
    } else {
      Swal.fire({
        icon: res.icon,
        title: res.title,
        html: res.mensaje,
      });

      firebase.firestore().collection("errores").add({
        datos_personalizados,
        datos_a_enviar,
        datos_usuario,
        momento: new Date().getTime(),
        fecha: new Date(),
        respuesta: res,
      });
    }

    boton_final_cotizador.removeAttribute("disabled");

    boton_final_cotizador.textContent = textoBtn;
  };

  if (
    value("nombreD") != "" &&
    value("direccionD") != "" &&
    value("telefonoD") != ""
  ) {
    let recoleccion = 0;
    if (
      document.getElementById("recoleccion") &&
      document.getElementById("recoleccion").checked
    ) {
      recoleccion = 1;
    }

    const inpTipo_entrega = document.getElementById("entrega_en_oficina");
    const inpTipo_entregaFlexi = document.getElementById(
      "tipo_ditribucion_flexi"
    );
    const checkCreacionPedido = $("#check-crear_pedido").prop("checked");

    if (value("producto") == "") {
      renovarSubmit(boton_final_cotizador, textoBtn);
      alert("Recuerde llenar también lo que contine su envío");
      scrollTo({
        top: document.getElementById("producto").parentNode.offsetTop - 60,
        left: document.getElementById("producto").parentNode.offsetLeft,
        behavior: "smooth",
      });
    } else if (!validar_email(value("correoD")) && value("correoD")) {
      //Recordar que existe una funcion llamada "validar_email(email)" que es mas especifica.
      alert(
        "Lo sentimos, verifique por favor que la dirección de correo sea valida"
      );
      renovarSubmit(boton_final_cotizador, textoBtn);
    } else if (value("telefonoD").length != 10) {
      alert(
        "Por favor verifique que el celular esta escrito correctamente (debe contener 10 digitos)"
      );
      renovarSubmit(boton_final_cotizador, textoBtn);
    } else if (!datos_usuario.centro_de_costo) {
      avisar(
        "¡Error al generar Guía!",
        "Por favor, recargue la página, e intente nuevamente, si su problema persiste, póngase en Contacto con nosotros para asignarle un centro de costo",
        "advertencia"
      );
      renovarSubmit(boton_final_cotizador, textoBtn);
    } else if (inpTipo_entrega && !inpTipo_entrega.value) {
      swal.fire("Es necesario seleccionar el tipo de envío", "", "warning");
      verificador("entrega_en_oficina");
      renovarSubmit(boton_final_cotizador, textoBtn);
    } else if (inpTipo_entregaFlexi && !inpTipo_entregaFlexi.value) {
      swal.fire(
        "Es necesario seleccionar el tipo de envío para flexi",
        "",
        "warning"
      );
      verificador("tipo_ditribucion_flexi");
      renovarSubmit(boton_final_cotizador, textoBtn);
    } else if (datos_usuario.type === "PUNTO" && !datos_a_enviar.id_user) {
      swal.fire("Recuerde seleccionar el cliente", "", "warning");
      verificador("numero_documento_usuario");
      renovarSubmit(boton_final_cotizador, textoBtn);
    } else if (
      datos_a_enviar.transportadora === "INTERRAPIDISIMO" &&
      (!bodega || !bodega.codigo_sucursal_inter)
    ) {
      swal.fire(
        "Asegurece de seleccionar una bodega válida para interrapidísimo",
        "",
        "warning"
      );
      verificador("actualizar_direccionR", "moderador_direccionR");
      renovarSubmit(boton_final_cotizador, textoBtn);
    } else {
      Swal.fire({
        title: "Creando Guía",
        text: "Por favor espere mientras le generamos su nueva Guía",
        didOpen: () => {
          Swal.showLoading();

          setTimeout(() => {
            if (Swal.isVisible()) {
              Swal.update({
                text: "La creación de la guía se está demorando más de lo usual, hay problemas de conexión con la transportadora",
              });

              Swal.showLoading();
            }
          }, 10000);
        },
        allowOutsideClick: false,
        allowEnterKey: false,
        showConfirmButton: false,
        allowEscapeKey: true,
      });
      let fecha = new Date(),
        mes = fecha.getMonth() + 1,
        dia = fecha.getDate();
      if (dia < 10) {
        dia = "0" + dia;
      }
      if (mes < 10) {
        mes = "0" + mes;
      }

      datos_a_enviar.nombreR = value("actualizar_nombreR").trim();
      datos_a_enviar.direccionR = value("actualizar_direccionR").trim();
      datos_a_enviar.nombre_empresa = datos_usuario.nombre_empresa || "";
      datos_a_enviar.celularR = value("actualizar_celularR").trim();
      datos_a_enviar.nombreD = value("nombreD").trim();
      datos_a_enviar.identificacionD = value("identificacionD") || 123;
      datos_a_enviar.direccionD =
        value("direccionD").trim() +
        " " +
        value("barrioD").trim() +
        " " +
        value("observaciones");
      datos_a_enviar.telefonoD = value("telefonoD");
      datos_a_enviar.celularD = value("celularD") || value("telefonoD");
      datos_a_enviar.correoD = value("correoD").trim() || "notiene@gmail.com";
      datos_a_enviar.tipo_doc_dest = value("tipo-doc-dest");
      datos_a_enviar.dice_contener = value("producto").trim();
      datos_a_enviar.referencia = value("referencia").trim();
      datos_a_enviar.observaciones = value("observaciones");
      datos_a_enviar.recoleccion_esporadica = recoleccion;
      datos_a_enviar.fecha = `${fecha.getFullYear()}-${mes}-${dia}`;
      datos_a_enviar.timeline = new Date().getTime();

      if (datos_usuario.type !== "PUNTO") datos_a_enviar.id_user = user_id;
      datos_a_enviar.staging = checkCreacionPedido;

      if (datos_usuario.type === "PUNTO") {
        datos_a_enviar.id_punto = user_id;
        datos_a_enviar.pertenece_punto = true;
      }

      if (datos_a_enviar.transportadora === "INTERRAPIDISIMO")
        datos_a_enviar.codigo_sucursal = bodega.codigo_sucursal_inter;

      datos_a_enviar.cuenta_responsable =
        transportadoras[datos_a_enviar.transportadora].getCuentaResponsable();

      if (inpTipo_entrega)
        datos_a_enviar.id_tipo_entrega = parseInt(inpTipo_entrega.value);
      if (inpTipo_entregaFlexi)
        datos_a_enviar.id_tipo_entrega_flexi = parseInt(
          inpTipo_entregaFlexi.value
        );

      // boton_final_cotizador.remove()

      if (checkCreacionPedido) {
        enviar_firestore(datos_a_enviar).then(mostrarResultado);
      } else {
        creacionDirecta(datos_a_enviar).then(mostrarResultado);
      }
    }
  } else {
    alert("Por favor, verifique que los campos esenciales no estén vacíos");
    verificador(["producto", "nombreD", "direccionD", "telefonoD"]);

    boton_final_cotizador.textContent = textoBtn;
    boton_final_cotizador.removeAttribute("disabled");
  }

  function renovarSubmit(boton_final_cotizador, textoBtn) {
    boton_final_cotizador.textContent = textoBtn;
    boton_final_cotizador.removeAttribute("disabled");
  }
}

//Un emulador rápido de pruebas para usar desde la consola y ver las respuesta de la misma;
const erroresComunes = new Map();
async function buscarGuiasConErrores() {
  return;
  const errorEstatus500Inter =
    '{"StatusCode":500,"Message":"Error desconocido","Description":"Favor contacte a soporte técnico"}';
  const res = await db
    .collection("errores")
    .orderBy("momento")
    .startAt(new Date().getTime() - 2 * 24 * 36e5)
    // .limit(10)
    .get()
    .then((q) => {
      console.log(q.size);
      return q.docs.map((d) => {
        const g = d.data();
        g.id = d.id;

        const mensajeError = g.respuesta.mensajeCorto;

        if (erroresComunes.has(mensajeError)) {
          erroresComunes.set(
            mensajeError,
            erroresComunes.get(mensajeError) + 1
          );
        } else {
          erroresComunes.set(mensajeError, 1);
        }

        return g;
      });
    });

  if (!res) {
    console.error("No se encontró alguna guía allí");
    return;
  }

  guias = res.filter((g) => {
    return (
      g.datos_a_enviar.transportadora === "INTERRAPIDISIMO" &&
      g.respuesta.mensajeCorto === errorEstatus500Inter
    );
  });

  for await (let g of guias) {
    console.log(g);
    const creada = await pruebaGeneracionGuias(g.id);
    console.log(creada);
    if (!creada) {
      console.log("ENCONTRAMOS UNA FALLA");
      break;
    }
  }
}

async function pruebaGeneracionGuias(idGuiaError) {
  const reference = db.collection("errores").doc(idGuiaError);
  const guia = await reference.get().then((d) => d.data());
  if (!guia) {
    console.error("No se encontró alguna guía allí");
    return;
  }

  const datos = guia.datos_a_enviar;

  if (datos.transportadora === "INTERRAPIDISIMO") {
    bodega = guia.datos_usuario.bodegas.find((b) => b.codigo_sucursal_inter);
  }

  const referencia = db.collection("pruebaDirigidaGuias").doc(datos.id_heka);

  const creacion = await crearGuiaTransportadora(datos, referencia);

  reference.delete();

  return creacion;
}

async function crearGuiaTransportadora(datos, referenciaNuevaGuia) {
  if (!datos.id_heka) {
    return {
      error: true,
      icon: "error",
      title: "¡Error con guía!",
      message: "Problema de comunicación interno, ausencia de identificador.",
    };
  }

  let generarGuia;
  const stagingPrevio = datos.staging;
  referenciaNuevaGuia =
    referenciaNuevaGuia ||
    usuarioAltDoc(datos.id_user).collection("guias").doc(datos.id_heka);

  if (datos.transportadora === "SERVIENTREGA") {
    generarGuia = generarGuiaServientrega(datos);
  } else if (datos.transportadora === "INTERRAPIDISIMO") {
    generarGuia = generarGuiaInterrapidisimo(datos);
  } else if (datos.transportadora === "ENVIA") {
    generarGuia = generarGuiaEnvia(datos);
  } else if (datos.transportadora === "TCC") {
    generarGuia = generarGuiaAveonline(datos);
  } else if (datos.transportadora === transportadoras.COORDINADORA.cod) {
    generarGuia = generarGuiaCoordinadora(datos);
  } else {
    return new Error(
      "Lo sentimos, esta transportadora no está optimizada para generar guías de manera automática."
    );
  }

  const respuesta = await generarGuia.then(async (resGuia) => {
    //le midifico los datos de respuesta al que será enviado a firebase
    datos.numeroGuia = resGuia.numeroGuia || 0;
    datos.has_sticker = resGuia.has_sticker || false;
    //y creo el documento de firebase
    if (resGuia.numeroGuia) {
      datos.staging = false; // true: creación de pedido, false: creación directa
      datos.estadoActual = estadosGuia.generada;
      datos.numeroGuia = datos.numeroGuia.toString();
      datos.fecha_aceptada = genFecha();
      let guia = !stagingPrevio
        ? resGuia
        : await referenciaNuevaGuia
            .update(datos)
            .then((doc) => {
              return resGuia;
            })
            .catch((err) => {
              console.log(
                "Hubo un error al crear la guía con firebase => ",
                err
              );
              return {
                error: true,
                numeroGuia: 0,
                message:
                  "Lo sentimos, hubo un problema con conexión con nuestra base de datos, le recomendamos recargar la página.",
              };
            });
      console.log(guia);
      return guia;
    } else {
      return {
        error: true,
        message: resGuia.error || resGuia.message,
      };
    }
    //Procuro devolver un objeto con el número de guía y el respectivo mensaje de erro si lo tiene
  });
  console.log(respuesta);

  if (!respuesta.error) {
    return {
      icon: "success",
      title: "¡Guía creada con éxito!",
      message: "¡Guía con id: " + datos.id_heka + " creada con éxito!",
    };
  } else {
    return {
      error: true,
      icon: "error",
      title: "¡Error con guía!",
      message: respuesta.message,
    };
  }
}

async function creacionDirecta(guia) {
  guia.id_heka = await obtenerIdHeka();
  if (transportadoras[guia.transportadora].sistemaAutomatizado()) {
    const guiaGenerada = await crearGuiaTransportadora(guia);

    if (guiaGenerada.error) {
      return {
        ...guiaGenerada,
        icon: "error",
        mensaje:
          'Error: No se ha podido concretar la creación de guía, por favor intente nuevamente más tarde. "' +
          guiaGenerada.message +
          '"',
      };
    }
  }

  guia.estadoActual = estadosGuia.generada;

  const respuesta = await enviar_firestore(guia);
  await descontarSaldo(guia);

  return respuesta;
}

async function obtenerIdHeka() {
  console.count("Se obtiene el id");
  const ref = firebase.firestore().collection("infoHeka").doc("heka_id");

  return await ref.get().then(async (doc) => {
    // return doc.data().id;
    if (doc.exists) {
      let id_heka = datos_usuario.numero_documento.slice(-4);
      id_heka = id_heka.replace(/^0/, 1);
      id_heka += doc.data().id.toString();

      await ref.update({ id: firebase.firestore.FieldValue.increment(1) });

      return id_heka;
    }
  });
}

//función que envía los datos tomados a servientrega
async function enviar_firestore(datos) {
  console.log(datos);
  let firestore = firebase.firestore();
  const id_heka = datos.id_heka ? datos.id_heka : await obtenerIdHeka();

  datos.seguimiento_finalizado = false;
  datos.fecha = genFecha();
  datos.timeline = new Date().getTime();

  const referenciaNuevaGuia = firestore
    .collection("usuarios")
    .doc(datos.id_user)
    .collection("guias")
    .doc(id_heka);

  // Esto ya lo debería actualizar la funcion obtenerIdHeka()
  // firestore.collection("infoHeka").doc("heka_id").update({id: firebase.firestore.FieldValue.increment(1)});

  return await referenciaNuevaGuia
    .set(datos)
    .then((id) => {
      return {
        icon: "success",
        title: "¡Guía creada con éxito!",
        mensaje: "¿Deseas crear otra guía?",
        mensajeCorto: "¡Guía con id: " + id_heka + " creada con éxito!",
      };
    })
    .catch((err) => {
      console.log(err.message);
      return {
        icon: "error",
        title: "¡Lo sentimos! Error inesperado",
        mensaje:
          'No se ha podido concretar la creación de guía, por favor intente nuevamente más tarde. "' +
          err.message +
          '"',
        mensajeCorto: err.message,
      };
      Swal.fire({
        icon: "error",
        title: "¡Lo sentimos! Error inesperado",
        html:
          'Hemos detectado el siguiente error: "' +
          err.message +
          "\". Si desconoce la posible causa, por favor comuniquese con asesoría logistica (<a href='https://wa.me/573213361911' target='_blank'>+57 321 3361911</a>) enviando un capture o detallando el mensaje expuesto. \nmuchas gracias por su colaboración y discupe las molestias causadas.",
      }).then(() => {
        console.log("revisa que paso, algo salio mal => ", err);
      });
    });
}

async function descontarSaldo(datos) {
  const datos_heka =
    datos_personalizados ||
    (await db
      .collection("usuarios")
      .doc(localStorage.user_id)
      .get()
      .then((doc) => doc.data().datos_personalizados));

  //Estas líneas será utilizadas para cuando todos los nuevos usuarios por defecto
  //no tengan habilitadas las transportadoras, para que administración se las tenga que habilitar
  // if(!datos_heka) {
  //     return {
  //         mensaje: "Lo sentimos, no pudimos carga su información de pago, por favor intente nuevamente.",
  //         mensajeCorto: "No se pudo cargar su información de pago",
  //         icon: "error",
  //         title: "Sin procesar"
  //     }
  // }

  // FIN DEL BLOQUE

  const id = datos.id_heka;
  console.log(datos.debe);
  if (
    !datos.debe &&
    !datos_personalizados.actv_credit &&
    datos.costo_envio > datos_personalizados.saldo &&
    datos.type !== CONTRAENTREGA
  ) {
    return {
      mensaje: `Lo sentimos, en este momento, el costo de envío excede el saldo
            que tienes actualmente, por lo tanto este metodo de envío no estará 
            permitido hasta que recargues tu saldo. Puedes comunicarte con la asesoría logística para conocer los pasos
            a seguir para recargar tu saldo.`,
      mensajeCorto: "El costo de envío excede el saldo que tienes actualmente",
      icon: "error",
      title: "¡No permitido!",
    };
  }

  let user_debe;
  datos_personalizados.saldo <= 0
    ? (user_debe = datos.costo_envio)
    : (user_debe = -datos_personalizados.saldo + datos.costo_envio);

  if (user_debe > 0 && !datos.debe) datos.user_debe = user_debe;

  if (!datos_heka) return id;

  let momento = new Date().getTime();
  let saldo = datos_heka.saldo;
  let saldo_detallado = {
    saldo: saldo,
    saldo_anterior: saldo,
    limit_credit: datos_heka.limit_credit || 0,
    actv_credit: datos_heka.actv_credit || false,
    fecha: genFecha(),
    diferencia: 0,
    mensaje: "Guía " + id + " creada exitósamente",
    momento: momento,
    user_id: localStorage.user_id,
    guia: id,
    numeroGuia: datos.numeroGuia || "",
    transportadora: datos.transportadora || "",
    medio:
      "Usuario: " +
      datos_usuario.nombre_completo +
      ", Id: " +
      localStorage.user_id,
    type: "DESCONTADO",
  };

  //***si se descuenta del saldo***
  if (!datos.debe && datos.type !== CONTRAENTREGA) {
    saldo_detallado.saldo = saldo - datos.costo_envio;

    if (ControlUsuario.esPuntoEnvio)
      saldo_detallado.saldo += datos.detalles.comision_punto;

    saldo_detallado.diferencia =
      saldo_detallado.saldo - saldo_detallado.saldo_anterior;

    let factor_diferencial =
      parseInt(datos_heka.limit_credit) + parseInt(saldo);
    console.log(saldo_detallado);

    /* creo un factor diferencial que sume el limite de credito del usuario
        (si posee alguno) más el saldo actual para asegurarme que 
        este por encima de cero y por debajo del costo de envío, 
        en caso de que no se cumpla, se envía una notificación a administración del exceso de gastos*/
    if (factor_diferencial <= datos.costo_envio && factor_diferencial > 0) {
      notificarExcesoDeGasto();
    }
    await actualizarSaldo(saldo_detallado);
  }
  return id;
}

function notificarExcesoDeGasto() {
  enviarNotificacion({
    mensaje: `El usuario ${datos_usuario.nombre_completo} acaba de exceder el límite de Gastos asignado.`,
    detalles: [
      "Su límite de gastos es de " + datos_personalizados.limit_credit,
      "Tenía un saldo de: " + datos_personalizados.saldo,
      "Sumando el envío realizado: " +
        (datos_personalizados.saldo - datos_a_enviar.costo_envio),
    ],
    icon: ["dollar-sign", "warning"],
    visible_admin: true,
    user_id,
    href: "deudas",
  });
}

//función que utiliza el webservice para crear las guías de manera automática
async function generarGuiaServientrega(datos) {
  let res = await fetch("/servientrega/crearGuia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  })
    .then((res) => res.json())
    .then((xml) => {
      //Devuelve un xml en string, que necestito convetir al formato correspondiente
      let parser = new DOMParser();
      data = parser.parseFromString(xml, "application/xml");
      console.log(data);
      console.log("se recibió respuesta");
      let retorno = new Object({});

      //Se verifica que la respuesta no muestre error de sintaxis
      if (data.querySelector("parsererror")) {
        retorno.numeroGuia = 0;
        retorno.error = "Alguno de los carácteres ingresados no está permitido";
        return retorno;
      }

      //También verifica otros tipos de errores devueltos por el xml
      if (data.querySelector("Text")) {
        retorno.numeroGuia = 0;
        retorno.error = data.querySelector("Text").textContent;
        return retorno;
      }

      //si el resultado el es positivo me devuelve un objeto con el numero de guía
      if (
        data.querySelector("CargueMasivoExternoResult").textContent === "true"
      ) {
        retorno = {
          numeroGuia: data.querySelector("Num_Guia").textContent,
          id_heka: datos.id_heka,
          nombreD: data.querySelector("Nom_Contacto").textContent,
          ciudadD: data.querySelector("Des_Ciudad").textContent,
          id_archivoCargar: data.querySelector("Id_ArchivoCargar").textContent,
          prueba: datos.centro_de_costo == "SellerNuevo" ? true : false,
          staging: false,
        };
      } else {
        //En caso contrario retorna el error devuelto por el webservice
        const contenedorErrores = data.querySelector("arrayGuias");
        console.log(contenedorErrores);
        console.log(data.querySelector("arrayGuias"));
        retorno = {
          numeroGuia: 0,
          error: contenedorErrores.textContent,
        };
      }

      if (!retorno.numeroGuia) {
        // analytics.logEvent("Error al crear guía servientrega", {res: xml, centro_de_costo: datos_usuario.centro_de_costo || "SCC"});
      }

      return retorno;
    })
    .catch((err) => {
      console.log("Hubo un error: ", err);
      // analytics.logEvent("Error al crear guía servientrega", {catch: err, centro_de_costo: datos_usuario.centro_de_costo || "SCC"});
      return {
        message:
          "Hubo un error al conectar con " +
          codTransp +
          ", por favor, intente nuevamente más tarde.",
      };
    });

  if (res.numeroGuia) {
    res.type = datos.type;
    res.oficina = datos.oficina;

    res.has_sticker = await guardarStickerGuiaServientrega(res);
  }

  return res;
}

//consulta al web service para crear el documento con el firestorage, si la creación resulta exitosa
// me devuelve agrega la variable *has_sticker* al objeto ingresado y lo devuleve
async function guardarStickerGuiaServientrega(data) {
  const maxPorSegmento = 500000;

  let base64GuiaSegmentada = await fetch(
    "/servientrega/generarGuiaSticker/?segmentar=" + maxPorSegmento,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  ).then((data) => data.json());

  const referenciaSegmentar = firebase
    .firestore()
    .collection("base64StickerGuias")
    .doc(data.id_heka)
    .collection("guiaSegmentada");

  /* del xml necesito el elemento *GenerarStickerResult*, si es correcto, se busca
    el valor *bytesReport*, se agrega al storage y devuelve has_sticker = true */
  if (base64GuiaSegmentada.length) {
    return await guardarDocumentoSegmentado(
      base64GuiaSegmentada,
      referenciaSegmentar
    );
  }

  console.log(data);
  return false;
}

//función para consultar la api en el back para crear guiade inter rapidisimo.}
// IMPORTANTE!
async function generarGuiaInterrapidisimo(datos) {
  let respuesta = await fetch("/inter/crearGuia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  })
    .then((d) => {
      if (d.status === 500)
        return {
          message:
            "Ocurrió un error  interno con la transportadora, por favor intente nuevamente.",
        };

      return d.json();
    })
    .catch((err) => {
      console.log(err);
      analytics.logEvent("Error al crear guía interrapidísimo", {
        catch: err,
        centro_de_costo: datos_usuario.centro_de_costo || "SCC",
      });
      return {
        message:
          "Hubo un error al conectar con " +
          codTransp +
          ", por favor, intente nuevamente más tarde.",
      };
    });

  if (!respuesta) {
    return {
      numeroGuia: 0,
      message:
        "Lo sentimos, " +
        codTransp +
        " no ha respondido correctamente su solicitud",
    };
  }

  respuesta = typeof respuesta === "object" ? respuesta : JSON.parse(respuesta);
  if (respuesta.Message || respuesta.message) {
    respuesta.centro_de_costo = datos_usuario.centro_de_costo || "SCC";
    // analytics.logEvent("Error al crear guía interrapidisimo", respuesta);

    return {
      numeroGuia: 0,
      message: respuesta.Message || respuesta.message,
    };
  }

  respuesta.numeroGuia = respuesta.numeroPreenvio;
  respuesta.id_heka = datos.id_heka;
  respuesta.prueba = datos.prueba;
  respuesta.staging = false;
  respuesta.has_sticker = await generarStickerGuiaInterrapidisimo(respuesta);

  console.log("interrapidísimo => ", respuesta);

  return respuesta;
}

async function generarStickerGuiaInterrapidisimo(data) {
  const maxPorSegmento = 500000;
  let url =
    "/inter/crearStickerGuia/" +
    data.numeroGuia +
    "?segmentar=" +
    maxPorSegmento;
  if (data.prueba) {
    url += "&prueba=" + data.prueba;
  }

  let base64GuiaSegmentada = await fetch(url)
    .then((data) => data.json())
    .catch((error) =>
      console.log(
        "Hubo un error al consultar el base64 de INTERRAPÍDISIMO => ",
        error
      )
    );

  const referenciaSegmentar = firebase
    .firestore()
    .collection("base64StickerGuias")
    .doc(data.id_heka)
    .collection("guiaSegmentada");
  if (base64GuiaSegmentada)
    return await guardarDocumentoSegmentado(
      base64GuiaSegmentada,
      referenciaSegmentar
    );

  return false;
  // return await guardarBase64ToStorage(base64Guia, user_id + "/guias/" + data.id_heka + ".pdf")
}

async function generarGuiaAveonline(datos) {
  const idAgente = datos_personalizados.id_agente_aveo;

  if (!idAgente) throw new Error("No se registra el agente.");

  datos.idAgente = idAgente;
  const res = await fetch("/aveo/crearGuia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  }).then((d) => d.json());

  if (res.error) {
    return {
      numeroGuia: 0,
      message: res.message,
    };
  }
  return {
    numeroGuia: "Generando...",
    id_heka: datos.id_heka,
    prueba: datos.prueba,
    has_sticker: false,
  };
}

async function guardarStickerGuiaAveo(data) {
  let url = "/aveo/obtenerStickerGuia?urlGuia";

  let base64GuiaSegmentada = await fetch(url, {
    method: "POST",
    headers: { "content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((data) => data.json())
    .catch((error) =>
      console.log(
        "Hubo un error al consultar el base64 de Aveonline => ",
        error
      )
    );

  const referenciaSegmentar = firebase
    .firestore()
    .collection("base64StickerGuias")
    .doc(data.id_heka)
    .collection("guiaSegmentada");
  return await guardarDocumentoSegmentado(
    base64GuiaSegmentada,
    referenciaSegmentar
  );
  // return await guardarBase64ToStorage(base64Guia, user_id + "/guias/" + data.id_heka + ".pdf")
}

async function generarGuiaEnvia(datos) {
  const response = await fetch("/envia/crearGuia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  }).then((d) => d.json());

  if (!response)
    return {
      numeroGuia: 0,
      message:
        "Lo sentimos, " +
        codTransp +
        " no ha respondido correctamente su solicitud",
    };

  if (response.respuesta) {
    return {
      numeroGuia: 0,
      message: response.respuesta,
    };
  }

  res = {
    numeroGuia: response.guia,
    id_heka: datos.id_heka,
    has_sticker: false,
  };

  // Para guardar la url en la que se encuentra alojada la guía inicialmente
  if (response.urlguia) {
    // Inyectamos el valor por referencia del objeto que se está pasando "datos"
    datos.urlGuia = response.urlguia;
  }

  res.has_sticker = await guardarStickerGuiaEnvia({
    url: response.urlguia,
    id_heka: datos.id_heka,
  });
  return res;
}

/**
 * Recibe una ruta completa o un numero de guía
 * @param {string} ruta
 * @param {string} id_heka
 * @returns {Promise<boolean>}
 */
async function guardarStickerGuiaEnvia({ url, numeroGuia, id_heka }) {
  let path = "/envia/obtenerStickerGuia";

  let base64GuiaSegmentada = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "Application/json" },
    body: JSON.stringify({ url, numeroGuia }),
  })
    .then((data) => data.json())
    .catch((error) =>
      console.log(
        "Hubo un error al consultar el base64 de Aveonline => ",
        error
      )
    );

  const referenciaSegmentar = firebase
    .firestore()
    .collection("base64StickerGuias")
    .doc(id_heka)
    .collection("guiaSegmentada");
  return await guardarDocumentoSegmentado(
    base64GuiaSegmentada,
    referenciaSegmentar
  );
  // return await guardarBase64ToStorage(base64Guia, user_id + "/guias/" + data.id_heka + ".pdf")
}

async function generarGuiaCoordinadora(datos) {
  const response = await fetch("/coordinadora/crearGuia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  }).then((d) => d.json());

  if (response.error) {
    return {
      numeroGuia: 0,
      message: response.message,
    };
  }

  res = {
    numeroGuia: response.codigo_remision,
    id_heka: datos.id_heka,
    has_sticker: false,
  };

  res.has_sticker = await guardarStickerGuiaCoordinadora(res);

  return res;
}

async function guardarStickerGuiaCoordinadora({ numeroGuia, id_heka }) {
  let path = "/coordinadora/obtenerStickerGuia";

  let response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "Application/json" },
    body: JSON.stringify({ numeroGuia }),
  })
    .then((data) => data.json())
    .catch((error) =>
      console.log(
        "Hubo un error al consultar el documento de coordinadora => ",
        error
      )
    );

  if (response.error) return false;

  console.log(response);
  const base64GuiaSegmentada = response.base64GuiaSegmentada;
  const referenciaSegmentar = firebase
    .firestore()
    .collection("base64StickerGuias")
    .doc(id_heka)
    .collection("guiaSegmentada");
  return await guardarDocumentoSegmentado(
    base64GuiaSegmentada,
    referenciaSegmentar
  );
}

// esta función me toma un arreglo de strings, junto con la refenrecia de FB, y lo guarda en una collectio indexada
async function guardarDocumentoSegmentado(base64Segmentada, referencia) {
  console.log(base64Segmentada);
  if (typeof base64Segmentada !== "object") return false;

  if (!base64Segmentada.length) return false;

  let guardado = true;
  for (let i = 0; i < base64Segmentada.length; i++) {
    const res = await referencia
      .doc(i.toString())
      .set({
        index: i,
        segmento: base64Segmentada[i],
      })
      .then(() => {
        return true;
      })
      .catch((error) => {
        console.log(
          "hubo un error al guardar una parte del documento segmentado => ",
          error
        );
        guardado = false;
        return false;
      });

    if (!res) break;
  }

  return guardado;
}

function convertirMiles(n) {
  let entero = Math.floor(n);
  let number_inv = entero.toString().split("").reverse();
  let response = [];
  for (let i = 0; i < number_inv.length; i++) {
    response.push(number_inv[i]);
    if ((i + 1) % 3 == 0) {
      if (i + 1 != number_inv.length) {
        response.push(".");
      }
    }
  }
  return response.reverse().join("");
}

function observacionesServientrega(result_cotizacion) {
  console.log(result_cotizacion);
  let c_destino = document.getElementById("ciudadD").dataset;
  let lists = [
    "Los tiempos de entrega son aproximados, no son exactos, ya que pueden suceder problemas operativos.",
    "El paquete deberá estar correctamente embalado, de lo contrario la transportadora no responderá por averías.",
    "En algunas ciudades y/o municipios, según las rutas, si el vehículo encargado de realizar las entregas no alcanza a culminar la ruta operativa dejara el paquete en una oficina para que sea reclamado por el destinatario.",
    "En caso de novedad en la cual el destinatario no se encuentre la transportadora realizará un nuevo intento de entrega, en caso de presentarse una novedad distinta la transportadora se comunicará con el remitente y destinario, en caso de no tener respuesta a la llamada la transportadora genera la devolución. (Por eso recomendamos solucionar las novedades lo antes posible para intentar retener el proceso de devolución).",
    "En caso de devolución la transportadora cobrará el valor completo del envío el cual estará reflejado en el cotizador. (Aplica para envíos en pago contra entrega).",
    "Las recolecciones deberán ser solicitadas antes de las 10:00 am para que pasen el mismo día, en caso de ser solicitadas después de este horario quedaran automáticamente para el siguiente día.",
    "La mercancía debe ser despachada y embalada junto con los documentos descargados desde la plataforma.",
    "El manifiesto o relación de envío se debe hacer sellar o firmar por el mensajero o la oficina donde se entreguen los paquetes, ya que este es el comprobante de entrega de la mercancía, sin manifiesto sellado, la transportadora no se hace responsable de mercancía.",
    `Los envíos a ${
      c_destino.ciudad
    } frecuentan los días: <span class="text-primary text-capitalize">${c_destino.frecuencia.toLowerCase()}</span>`,
    `Los envíos a ${
      c_destino.ciudad
    } disponen de: <span class="text-primary text-capitalize">${c_destino.tipo_distribucion.toLowerCase()}</span>`,
    `En caso de devolución pagarías: $${convertirMiles(
      result_cotizacion.costoDevolucion
    )} (Aplica solo para envíos en pago contra entrega)`,
    "Las devoluciones con flexii se debe pagar envío ida y vuelta",
  ];

  let ul = document.createElement("ul");
  ul.classList.add("text-left");

  for (let list of lists) {
    let li = document.createElement("li");
    li.classList.add("my-3");
    li.innerHTML = list;
    ul.append(li);
  }

  return ul;
}

function observacionesInteRapidisimo(result_cotizacion) {
  let lists = [
    "Los tiempos de entrega son aproximados, no son exactos, ya que pueden suceder problemas operativos.",
    "El paquete deberá estar correctamente embalado, de lo contrario la transportadora no responderá por averías.",
    "En algunos municipios, si la entrega es en dirección y está fuera de la cobertura de la oficina el cliente deberá reclamar su paquete en la oficina.",
    "En caso de novedad la transportadora llama a destinatario y/o remitente para solucionar.",
    "En caso de devolución la transportadora cobrará el valor del flete ida + seguro de mercancía, no se cobra comisión de recaudo, ni flete de vuelta.",
    "Las recolecciones deberán ser solicitadas el día anterior o el mismo antes de las 9:00 am para que pasen el mismo día.",
    "La mercancía debe ser despachada y embalada junto con los documentos descargados desde la plataforma.",
    "El manifiesto o relación de envío se debe hacer sellar o firmar por el mensajero donde se entreguen los paquetes, ya que este es el comprobante de entrega de la mercancía, sin manifiesto sellado, la transportadora no se hace responsable de mercancía.",
    "En caso de devolución pagarías: $" +
      convertirMiles(result_cotizacion.costoDevolucion) +
      " (Aplica solo para envíos en pago contra entrega)",
    "Las devoluciones con flexii se debe pagar envío ida y vuelta",
  ];

  let ul = document.createElement("ul");
  ul.classList.add("text-left");

  for (let list of lists) {
    let li = document.createElement("li");
    li.classList.add("my-3");
    li.innerHTML = list;
    ul.append(li);
  }

  return ul;
}

function observacionesEnvia(result_cotizacion) {
  let lists = [
    "Los tiempos de entrega son aproximados, no son exactos, ya que pueden suceder problemas operativos.",
    "El paquete deberá estar correctamente embalado, de lo contrario la transportadora no responderá por averías.",
    "En algunos municipios, si la entrega es en dirección y está fuera de la cobertura de la oficina el cliente deberá reclamar su paquete en la oficina.",
    "En caso de novedad la transportadora llama a destinatario y/o remitente para solucionar.",
    "En caso de devolución la transportadora cobrará el valor del flete ida y vuelta + seguro de mercancía, no se cobra comisión de recaudo.",
    "Las recolecciones deberán ser solicitadas el día anterior o el mismo antes de las 9:00 am para que pasen el mismo día.",
    "La mercancía debe ser despachada y embalada junto con los documentos descargados desde la plataforma.",
    "El manifiesto o relación de envío se debe hacer sellar o firmar por el mensajero donde se entreguen los paquetes, ya que este es el comprobante de entrega de la mercancía, sin manifiesto sellado, la transportadora no se hace responsable de mercancía.",
    `En caso de devolución pagarías: $${convertirMiles(
      result_cotizacion.costoDevolucion
    )} (Aplica solo para envíos en pago contra entrega)`,
    "Las devoluciones con flexii se debe pagar envío ida y vuelta",
  ];

  let ul = document.createElement("ul");
  ul.classList.add("text-left");

  for (let list of lists) {
    let li = document.createElement("li");
    li.classList.add("my-3");
    li.innerHTML = list;
    ul.append(li);
  }

  return ul;
}

// ESPACIO PARA ALIMENTAR LOS POPOVERS DEL COTIZADOR
const popoverDimensiones = document.querySelector(".popover-dimensiones");
const popoverPeso = document.querySelector(".popover-peso");
const popoverDeclarado = document.querySelector(".popover-declarado");
const pesoValorDeclarado = document.querySelector("#Kilos");

pesoValorDeclarado.addEventListener("change", (event) => {
  let peso = null;
  peso = event.target.value;
  renderValorDeclaradoEnPopover(peso);
});

const renderValorDeclaradoEnPopover = (peso) => {
  let valorSer = transportadoras.SERVIENTREGA.limitesValorDeclarado(peso);
  let valorInter = transportadoras.INTERRAPIDISIMO.limitesValorDeclarado(peso);
  let valorEnv = transportadoras.ENVIA.limitesValorDeclarado(peso);
  let valorTCC = transportadoras.TCC.limitesValorDeclarado(peso);

  if (popoverDeclarado !== null)
    popoverDeclarado.firstElementChild.setAttribute(
      "data-content",
      `          
        SERVIENTREGA: ${valorSer[0]} - ${valorSer[1]} 
        INTERRAPIDISIMO: ${valorInter[0]} - ${valorInter[1]} <br>
        ENVIA: ${valorEnv[0]} - ${valorEnv[1]} <br>
        TCC: ${valorTCC[0]} - ${valorTCC[1]}
    `
    );

  popoverDeclarado.firstElementChild.click();
  popoverDeclarado.firstElementChild.click();

  $(function () {
    $("#popover-valor-declarado").popover();
  });
};

if (popoverDeclarado !== null)
  popoverDeclarado.innerHTML = `
<span class="d-inline-block" data-toggle="popover" data-html="true" title="Límites por transportadora" data-content='          
    <h6>Para ver los valores, debes agregar el peso primero y oprimir la tecla enter</h6>'>
    <i class="fa fa-question-circle " style="pointer-events: none;" type="button" disabled ></i> 
</span>
`;
if (popoverPeso !== null)
  popoverPeso.innerHTML = `
    <span class="d-inline-block" data-toggle="popover" data-html="true" title="Límites por transportadora" data-content='          
        SERVIENTREGA: ${transportadoras.SERVIENTREGA.limitesPeso[0]} - ${transportadoras.SERVIENTREGA.limitesPeso[1]} 
        INTERRAPIDISIMO: ${transportadoras.INTERRAPIDISIMO.limitesPeso[0]} - ${transportadoras.INTERRAPIDISIMO.limitesPeso[1]} <br>
        ENVIA: ${transportadoras.ENVIA.limitesPeso[0]} - ${transportadoras.ENVIA.limitesPeso[1]}  <br>
        TCC: ${transportadoras.TCC.limitesPeso[0]} - ${transportadoras.TCC.limitesPeso[1]}
        '>
        <i class="fa fa-question-circle " style="pointer-events: none;" type="button" disabled ></i> 
    </span>
`;
if (popoverDimensiones !== null)
  popoverDimensiones.innerHTML = `
    <span class="d-inline-block" data-toggle="popover" data-html="true" title="Límites por transportadora" data-content='          
        SERVIENTREGA: ${transportadoras.SERVIENTREGA.limitesLongitud[0]} - ${transportadoras.SERVIENTREGA.limitesLongitud[1]} 
        INTERRAPIDISIMO: ${transportadoras.INTERRAPIDISIMO.limitesLongitud[0]} - ${transportadoras.INTERRAPIDISIMO.limitesLongitud[1]} <br>
        ENVIA: ${transportadoras.ENVIA.limitesLongitud[0]} - ${transportadoras.ENVIA.limitesLongitud[1]}  <br>
        TCC: ${transportadoras.TCC.limitesLongitud[0]} - ${transportadoras.TCC.limitesLongitud[1]}
        '>
        <i class="fa fa-question-circle" style="pointer-events: none;" type="button" disabled ></i> 
    </span>
`;
