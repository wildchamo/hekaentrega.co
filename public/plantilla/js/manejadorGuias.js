let filtroPagos;

if (administracion) {
  if (localStorage.getItem("acceso_admin")) {
    if (location.hash === "#documentos") {
      cargarDocumentos("important");
    }

    $("#buscador-documentos").on("click", () => {
      cargarDocumentos("fecha");
    });

    $('[href="#documentos"]').on("click", () => {
      cargarDocumentos("important");
    });

    document
      .getElementById("btn_actualizador")
      .addEventListener("click", (e) => {
        e.preventDefault();
        actualizarEstado();
      });

    $("#btn_actualizador_utilidades").click(executeUtils);

    document
      .getElementById("btn-cargar_pagos")
      .addEventListener("click", (e) => {
        e.preventDefault();
        cargarPagos();
      });

    cargarFiltroDePagosPersonalizados();
  } else {
    let inputs = document.querySelectorAll("input");
    let botones = document.querySelectorAll("button");
    for (let inp of inputs) {
      inp.disabled = true;
    }

    for (let boton of botones) {
      boton.disabled = true;
    }

    avisar(
      "Acceso Denegado",
      "No tienes acceso a esta plataforma, espera unos segundos o da click en este mensaje y serás redirigido",
      "advertencia",
      "plataforma2.html"
    );
  }
}

$(document).ready(() => {
  $("#check-select-all-guias").change((e) => {
    let checks = document
      .getElementById("tabla-guias")
      .querySelectorAll("input");
    const limit = 50;
    let checked = 0;
    for (let check of checks) {
      if (!check.disabled) {
        if (e.target.checked && checked < limit) {
          check.checked = true;
          checked++;
        } else {
          check.checked = false;
        }
      }
    }
  });

  if (window.historialGuias) $("#btn-buscar-guias").click(historialGuias);
  // revisarNotificaciones();
});

const toHtmlNode = (str) =>
  new DOMParser().parseFromString(str, "text/html").body.firstChild;

let snapshotHistorialGuias;
async function historialGuiasAntiguo() {
  if (snapshotHistorialGuias) {
    snapshotHistorialGuias();
  }

  const contentTabla = $("#contenedor-tabla-historial-guias");
  const contentEmpty = $("#nohaydatosHistorialGuias");
  const btnBuscador = $("#btn-buscar-guias");
  const originalTextBuscador = btnBuscador.text();

  btnBuscador.html(`
      <span class="spinner-border
      spinner-border-sm" role="status" aria-hidden="true"></span>
      Cargando...
    `);

  const table = $("#dataTable").DataTable({
    destroy: true,
    data: null,
    rowId: "row_id",
    order: [[1, "desc"]],
    columns: [
      {
        data: null,
        title: "Acciones",
        render: (datos, type, row) => {
          if (type === "display" || type === "filter") {
            const id = datos.id_heka;
            const id_user = datos.id_user;
            const dataIdUser = id_user ? `data-id_user="${id_user}"` : "";
            const generacion_automatizada = [
              "automatico",
              "automaticoEmp",
            ].includes(
              transportadoras[datos.transportadora || "SERVIENTREGA"].sistema()
            );
            const showCloneAndDelete = datos.enviado ? "d-none" : "";
            const showDownloadAndRotulo = !datos.enviado ? "d-none" : "";
            const showMovements =
              datos.numeroGuia && datos.estado ? "" : "d-none";
            const guiaPunto = !!datos.id_punto ? "data-punto='true'" : "";
            let buttons = `
                    <div data-search="${datos.filter}"
                    class="d-flex justify-content-around flex-wrap">
                    `;

            const btnCrearSticker = `<button class="btn btn-primary btn-circle btn-sm action mt-1" data-id="${id}"
                    data-funcion="activar-desactivar" ${dataIdUser}
                    id="crear_sticker${id}" title="Crear Sticker de la guía">
                        <i class="fas fa-stamp"></i>
                    </button>`;

            const btnMovimientos = `<button class="btn btn-primary btn-circle btn-sm action mt-1" data-id="${id}"
                    id="ver_movimientos${id}" data-toggle="modal" data-target="#modal-gestionarNovedad" ${dataIdUser}
                    title="Revisar movimientos">
                        <i class="fas fa-truck"></i>
                    </button>`;

            const btnDownloadDocs = `<button class="btn btn-primary btn-circle btn-sm action mt-1" data-id="${id}"
                    id="descargar_documento${id}" title="Descargar Documentos">
                        <i class="fas fa-file-download"></i>
                    </button>`;

            const btnRotulo = `<button class="btn btn-primary btn-circle btn-sm action mt-1" data-id="${id}"
                    data-funcion="activar-desactivar" data-activate="after" ${guiaPunto}
                    id="generar_rotulo${id}" title="Generar Rótulo">
                        <i class="fas fa-ticket-alt"></i>
                    </button>`;

            const btnGuiaFlexii = `<button class="btn btn-primary btn-circle btn-sm mx-1 action" data-id="${id}"
                    data-funcion="activar-desactivar" data-activate="after"
                    data-placement="right"
                    id="generar_guiaflexii${id}" title="Generar Guía Flexii">
                        <i class="fas fa-f"></i>
                    </button>`;

            const btnClone = `<button class="btn btn-success btn-circle btn-sm action mt-1 ${showCloneAndDelete}" data-id="${id}"
                    id="clonar_guia${id}" data-funcion="activar-desactivar" data-costo_envio="${datos.costo_envio}"
                    title="Clonar Guía">
                        <i class="fas fa-clone"></i>
                    </button>`;

            const btnDelete = `<button class="btn btn-danger btn-circle btn-sm action mt-1 ${showCloneAndDelete}" data-id="${id}"
                    id="eliminar_guia${id}" data-funcion="activar-desactivar" data-costo_envio="${datos.costo_envio}"
                    title="Eliminar Guía">
                        <i class="fas fa-trash"></i>
                    </button>`;

            //Bottón para re crear el sticker de guía.
            if (
              datos.numeroGuia &&
              !datos.has_sticker &&
              generacion_automatizada
            ) {
              buttons += btnCrearSticker;
            }

            buttons += `
                        <button class="btn btn-primary btn-circle btn-sm action mt-1" data-id="${id}"
                        id="ver_detalles${id}" data-toggle="modal" data-target="#modal-detallesGuias"
                        ${dataIdUser}s
                        title="Detalles">
                            <i class="fas fa-search-plus"></i>
                        </button>
                    `;

            //Botón para ver movimientos
            if (datos.numeroGuia && datos.estado) {
              buttons += btnMovimientos;
            }

            //Botones para descargar documentosy rótulos cuando accede a la condición
            //botones para clonar y eliminar guía cuando rechaza la condición.
            
            if (datos.enviado) {
              buttons += btnDownloadDocs + btnRotulo + btnGuiaFlexii;
            }

            if (!datos.estado) buttons += btnClone;

            if (!datos.estado && datos.deletable !== false)
              buttons += btnDelete;

            buttons +=
              "<a href='javascript:void(0)' class='action text-trucate'>Ver más</a>";

            buttons += "</div>";
            return buttons;
          }
          return datos;
        },
      },
      { data: "id_heka", title: "Id", defaultContent: "" },
      { data: "numeroGuia", title: "Guía transportadora", defaultContent: "" },
      { data: "estado", title: "Estado", defaultContent: "" },
      {
        data: "mostrar_transp",
        orderable: false,
        title: "Transportadora",
        defaultContent: "",
      },
      { data: "type", title: "Tipo", defaultContent: "" },
      { data: "nombreD", title: "Destinatario", defaultContent: "" },
      {
        data: "telefonoD",
        title: "Telefonos",
        defaultContent: "",
        render: (valor, type, row) => {
          if (type === "display" || type === "filter") {
            const aCelular1 = `<a class="btn btn-light d-flex align-items-baseline mb-1 action" href="https://api.whatsapp.com/send?phone=57${valor
              .toString()
              .replace(
                /\s/g,
                ""
              )}" target="_blank"><i class="fab fa-whatsapp mr-1" style="color: #25D366"></i>${valor}</a>`;
            const aCelular2 = `<a class="btn btn-light d-flex align-items-baseline action" href="https://api.whatsapp.com/send?phone=57${row[
              "celularD"
            ]
              .toString()
              .replace(
                /\s/g,
                ""
              )}" target="_blank"><i class="fab fa-whatsapp mr-1" style="color: #25D366"></i>${
              row["celularD"]
            }</a>`;
            return aCelular1;
          }

          return valor;
        },
      },
      { data: "celularD", title: "only movil", visible: false },
      { data: "ciudadD", title: "Ciudad", defaultContent: "" },
      { data: "fecha", title: "Fecha", defaultContent: "" },
      {
        data: "seguro",
        title: "Seguro",
        defaultContent: "",
        render: (value, type, row) => {
          if (type === "display" || type === "filter") {
            return value || row["valor"];
          }

          return value;
        },
      },
      {
        data: "valor",
        title: "Recaudo",
        defaultContent: "",
      },
      {
        data: "costo_envio",
        title: "Costo de envío",
        defaultContent: "",
      },
      {
        data: "detalles.comision_punto",
        title: "Ganancia",
        defaultContent: "No aplica",
        visible: ControlUsuario.esPuntoEnvio,
      },
      {
        data: "referencia",
        title: "Referencia",
        defaultContent: "No aplica",
      },
    ],
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json",
    },
    dom: "Bfrtip",
    buttons: [
      {
        extend: "excel",
        text: "Descargar excel",
        filename: "Historial Guías",
        exportOptions: {
          columns: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 15],
        },
      },
      {
        text: "Descargar guías",
        className: "btn btn-primary",
        action: descargarGuiasParticulares,
      },
      {
        text: "Crear Documentos",
        className: "btn btn-success",
        action: crearDocumentos,
      },
    ],
    scrollY: "50vh",
    scrollX: true,
    scrollCollapse: true,
    paging: false,
    lengthMenu: [
      [-1, 10, 25, 50, 100],
      ["Todos", 10, 25, 50, 100],
    ],
    initComplete: funcionalidadesHistorialGuias,
    drawCallback: renderizadoDeTablaHistorialGuias,
  });

  document.getElementById("cargador-guias").classList.remove("d-none");
  if (!user_id) return;

  var fecha_inicio = Date.parse($("#fecha_inicio").val().replace(/\-/g, "/"));
  fecha_final =
    Date.parse($("#fecha_final").val().replace(/\-/g, "/")) + 8.64e7;

  var reference = ControlUsuario.esPuntoEnvio
    ? firebase
        .firestore()
        .collectionGroup("guias")
        .where("id_punto", "==", user_id)
    : firebase
        .firestore()
        .collection("usuarios")
        .doc(user_id)
        .collection("guias");

  let referencefilter = reference
    .orderBy("timeline", "desc")
    .startAt(fecha_final)
    .endAt(fecha_inicio);

  if ($("#numeroGuia-historial_guias").val()) {
    referencefilter = reference.where(
      "numeroGuia",
      "==",
      $("#numeroGuia-historial_guias").val()
    );
  }

  table.clear().draw();
  snapshotHistorialGuias = referencefilter.onSnapshot((snapshot) => {
    if (snapshot.empty) {
      contentTabla.hide();
      contentEmpty.show();
    } else {
      contentTabla.show();
      contentEmpty.hide();
    }

    let redraw = false;
    snapshot.docChanges().forEach((change) => {
      let data = change.doc.data();
      const id = change.doc.id;
      data.row_id = "historial-guias-row" + id;
      const newIdRow = data.row_id;
      const rowFinded = table.row("#" + newIdRow);

      data.filter = clasificarHistorialGuias(data);
      data.mostrar_transp = data.oficina
        ? data.transportadora + "-Flexii"
        : data.transportadora;

      if (change.type === "added" || change.type === "modified") {
        if (data.deleted) {
          if (rowFinded.length) {
            redraw = true;
            table.row("#" + newIdRow).remove();
          }
        } else if (rowFinded.length) {
          const row = table.row("#" + newIdRow);
          row.data(data);
          activarBotonesDeGuias(id, data, true);
        } else {
          redraw = true;
          table.row.add(data);
        }
      } else if (change.type === "removed") {
        if (rowFinded.length) {
          redraw = true;
          table.row("#" + newIdRow).remove();
        }
      }
    });

    if (redraw) table.draw();

    btnBuscador.text(originalTextBuscador);
    document.getElementById("cargador-guias").classList.add("d-none");
  });
}

function funcionalidadesHistorialGuias(settings, json) {
  const api = this.api();
  const btnsFilter = $(".hist-guias-filter");

  this.parent().parent().before(`
        <div class="form-group form-check">
            <input type="checkbox" class="form-check-input" id="select-all-guias">
            <label class="form-check-label" for="select-all-guias">Seleccionar Todas <span id="counter-selector-guias"></span></label>
        </div>
    `);

  $("#select-all-guias").change((e) => {
    if (e.target.checked) {
      let counter = 0;
      const limit = 50;
      const row = $("tr:gt(0)", this).each((i, row) => {
        const data = api.row(row).data();
        if (!data.enviado && counter < limit) {
          $(row).addClass("selected bg-gray-300");
          counter++;
        }
      });
    } else {
      $("tr:gt(0)", this).removeClass("selected bg-gray-300");
    }

    const cant = $("tr.selected", this).length;
    $("#counter-selector-guias").text(cant ? "(" + cant + ")" : "");
  });

  if (this[0].getAttribute("data-table_initialized")) {
    $("tbody", this).off("click", "tr", seleccionarFilaHistorialGuias);
    btnsFilter.off("click", filtradorEspecialHistorialGuias);
  } else {
    this[0].setAttribute("data-table_initialized", true);
  }

  $("tbody", this).on("click", "tr", seleccionarFilaHistorialGuias);

  btnsFilter.on("click", filtradorEspecialHistorialGuias);
  btnsFilter.addClass("btn-secondary");
  $(".todas").removeClass("btn-secondary");
  btnsFilter.removeClass("btn-primary");
  $(".todas").addClass("btn-primary");

  setTimeout(() => {
    filtrarHistorialGuiasPorColumna(api.column(4));
    filtrarHistorialGuiasPorColumna(api.column(5));
  }, 1000);
}

function seleccionarFilaHistorialGuias(e) {
  const limit = 50;
  if (e.target.classList.contains("action") || e.target.nodeName === "I")
    return;
  const table = $("#dataTable").DataTable();

  const row_id = this.getAttribute("id");
  const row = table.row("#" + row_id);
  const data = row.data();
  const cant = table.rows(".selected").data().length;

  if ((!data.enviado && cant < limit) || this.classList.contains("selected")) {
    $(this).toggleClass("selected bg-gray-300");
    const postCant = table.rows(".selected").data().length;
    $("#counter-selector-guias").text(postCant ? "(" + postCant + ")" : "");
  } else if (cant >= limit) {
    Toast.fire({
      icon: "warning",
      title: "Solo puedes seleccionar " + limit + " guías por documento.",
    });
  } else {
    Toast.fire({
      icon: "error",
      title: "Esta guía ya ha sido enviada",
    });
  }
}

function renderizadoDeTablaHistorialGuias(config) {
  console.count("renderizando tabla");
  const api = this.api();
  const data = this.api().data();

  const counter = {
    generada: 0,
    finalizada: 0,
    "en proceso": 0,
    pagada: 0,
    anulada: 0,
  };

  data.each((data, i) => {
    const row = api.row(i).node();
    const buttonsActivated = row.getAttribute("data-active");
    const filter = clasificarHistorialGuias(data);
    counter[filter]++;

    if (!buttonsActivated) {
      activarBotonesDeGuias(data.id_heka, data, true);
    }

    row.setAttribute("data-active", true);
  });

  $(".generadas > span").text(counter.generada);
  $(".en-proceso > span").text(counter["en proceso"]);
  $(".finalizadas > span").text(counter.finalizada);
  $(".anuladas > span").text(counter.anulada);
  $(".pagadas > span").text(counter.pagada);
  $(".todas > span").text(data.length);

  api
    .column(0)
    .nodes()
    .to$()
    .each((i, el) => {
      const buttonsToHide = $(el).children().children("button:gt(1)");
      const verMas = $(el).children().children("a:not(.activated)");

      verMas.click(() => {
        if (buttonsToHide.css("display") === "none") {
          buttonsToHide.show();
          verMas.text("Ver menos");
        } else {
          buttonsToHide.hide();
          verMas.text("Ver más");
        }
      });
      buttonsToHide.css("display", "none");
      verMas.text("Ver más");
      verMas.addClass("activated");
    });
}

const filtrosSelectores = new Map();
function filtrarHistorialGuiasPorColumna(column) {
  const header = column.header();

  const title = header.getAttribute("data-title") || header.textContent;
  header.setAttribute("data-title", title);
  const select = $(
    "<select class='form-control form-control-sm' style='min-width:120px'><option value=''>" +
      title +
      "</option></select>"
  )
    .appendTo($(header).empty())
    .on("change", function (e) {
      console.log($(this).val());
      const val = $.fn.dataTable.util.escapeRegex($(this).val());

      column.search(val ? "^" + val + "$" : "", true, false).draw();

      filtrosSelectores.set(title.trim(), val);
    });

  column
    .data()
    .unique()
    .sort()
    .each((value, i) => {
      const selected = filtrosSelectores.get(title);
      select.append(
        `<option value='${value}' ${
          selected === value ? "selected" : ""
        }>${value}</option>`
      );
    });

  // column.draw();
}

function clasificarHistorialGuias(data) {
  const estGeneradas = [
    "Envío Admitido",
    "RECIBIDO DEL CLIENTE",
    "Enviado",
    "",
    undefined,
  ];
  const estAnuladas = ["Documento Anulado", "Anulada"];

  let filter;

  if (estAnuladas.some((v) => data.estado === v)) {
    filter = "anulada";
  } else if (!data.debe && data.type !== "CONVENCIONAL") {
    filter = "pagada";
  } else if (data.seguimiento_finalizado) {
    filter = "finalizada";
  } else if (estGeneradas.some((v) => data.estado === v)) {
    filter = "generada";
  } else {
    filter = "en proceso";
  }

  return filter;
}

function filtradorEspecialHistorialGuias() {
  const btnsFilter = $(".hist-guias-filter");

  const api = $("#dataTable").DataTable();
  const filtrador = this.getAttribute("data-filtrar");

  btnsFilter.addClass("btn-secondary");
  $(this).removeClass("btn-secondary");
  btnsFilter.removeClass("btn-primary");
  $(this).addClass("btn-primary");

  api.search(filtrador).draw();
}

async function descargarGuiasParticulares(e, dt, node, config) {
  const api = dt;
  const selectedRows = api.rows(".selected");
  if (!selectedRows.data().length) {
    return Toast.fire({
      icon: "error",
      text: "No hay guías Seleccionadas.",
    });
  }

  const respuestaUsuario = await Swal.fire({
    title: "¡Atención!",
    text: "Recuerda que al descargar los documentos, ya no podrás eliminar las guías seleccionadas, ¿Deseas continuar?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "¡Si! continuar 👍",
    cancelButtonText: "¡No, déjame pensarlo!",
  });

  console.log(respuestaUsuario);

  if (!respuestaUsuario.isConfirmed) return;

  const charger = new ChangeElementContenWhileLoading(node);
  charger.init();

  // const datas = selectedRows.data().length > 0 ? selectedRows.data() : api.rows().data();
  const datas = selectedRows.data();
  const ids = new Array();
  const idsFaltantes = new Array();
  datas.each((r) => {
    const {has_sticker, id_heka, id_user} = r;
    if(!has_sticker) idsFaltantes.push([id_user, id_heka]);
    
    ids.push(id_heka)
  });

  console.log(ids);

  if(datos_usuario.type == "NATURAL-FLEXII") {
    generarGuiaFlexii(ids)
    return charger.end();
  }

  if(idsFaltantes.length) {
    Cargador.fire(
      "Solucionando conflictos",
      `Se han encontrado ${idsFaltantes.length} guías que no fueron creadas correctamente, estamos intentando solucionarlo por usted.`
    );

    // return;
    await Promise.all(idsFaltantes.map(([id_user, id_heka]) => generarSticker(id_user, id_heka)));
  }

  buscarGuiasParaDescargarStickers(ids).then(() => {
    charger.end();
    Toast.fire("Cargue Terminado", "Se han cargado las guías disponibles", "info");
  });
}

//función utilizada por el usuario para crear lo documentos
let noNotificarGuia;
function crearDocumentos(e, dt, node, config) {
  const api = dt;
  // Para cuando se use el selector
  const selectedRows = api.rows(".selected");
  const datas = selectedRows.data();

  // Para utilizar el método de empaque
  // const selectedRows = api.rows();
  // const datas = selectedRows.data().filter(d => d.empacada).slice(0, 51);

  console.log(datas);

  const nodos = selectedRows.nodes();
  node.prop("disabled", true);

  let id_user = ControlUsuario.esPuntoEnvio
      ? datas[0].id_user
      : localStorage.user_id,
    arrGuias = new Array();

  if (!datas.length) {
    node.prop("disabled", false);

    return Toast.fire({
      icon: "error",
      text: "No hay guías Seleccionadas.",
    });
  }

  datas.each((data, i) => {
    // const data = datas[i];
    console.log(data)
    const {
      numeroGuia,
      id_heka,
      id_archivoCargar,
      prueba,
      type,
      transportadora,
      has_sticker,
      telefonoD,
      id_oficina,
      id_punto,
      id_user,
      dice_contener,
      valor,
      nombre_empresa,
      nombreR,
      ciudadR,
      ciudadD,
      nombreD,
      direccionD,
      codigo_sucursal
    } = data;

    arrGuias.push({
      numeroGuia,
      id_heka,
      id_archivoCargar,
      prueba,
      type,
      transportadora,
      has_sticker,
      telefonoD,
      id_oficina,
      id_punto,
      id_user,
      dice_contener,
      valor,
      nombre_empresa,
      nombreR,
      ciudadR,
      ciudadD,
      nombreD,
      direccionD,
      codigo_sucursal
    });

    // $(nodo).removeClass("selected bg-gray-300");
  });

  //Verifica que todas las guias crrespondan al mismo tipo
  let tipos_diferentes = revisarCompatibilidadGuiasSeleccionadas(arrGuias);
  const guia_automatizada = ["automatico", "automaticoEmp"].includes(
    transportadoras[arrGuias[0].transportadora].sistema()
    );
  //Si no corresponden, arroja una excepción
  if (tipos_diferentes) {
    node.prop("disabled", false);

    return Swal.fire({
      icon: "error",
      title: "!No se pudo procesar la información!",
      html: tipos_diferentes,
    });
  }


  // Add a new document with a generated id.
  swal.fire({
    title: "Creando Documentos",
    html: "Estamos trabajando en ello, por favor espere...",
    didOpen: () => {
      Swal.showLoading();
    },
    allowOutsideClick: false,
    allowEnterKey: false,
    showConfirmButton: false,
    allowEscapeKey: true,
  });
  let documentReference = firebase.firestore().collection("documentos");
  //corresponde al nuevo documento creado
  documentReference
    .add({
      id_user: id_user,
      id_punto: arrGuias[0].id_punto || "",
      nombre_usuario: datos_usuario.nombre_completo,
      centro_de_costo: datos_usuario.centro_de_costo || "SCC",
      fecha: genFecha(),
      timeline: new Date().getTime(),
      descargar_relacion_envio: true,
      descargar_guias: true,
      type: arrGuias[0].type,
      transportadora: arrGuias[0].transportadora,
      guias: arrGuias.map((v) => v.id_heka).sort(),
      codigo_sucursal: arrGuias[0].codigo_sucursal? arrGuias[0].codigo_sucursal : "" ,
      generacion_automatizada: guia_automatizada
    })
    .then(async (docRef) => {
      if (noNotificarGuia == undefined) {
        const ref = db.collection("infoHeka").doc("manejoUsuarios");
        const data = await ref.get().then((d) => d.data().noEnviarWsPedido);
        noNotificarGuia = data.includes(datos_usuario.centro_de_costo);
      }

      const transportadora = arrGuias[0].transportadora;
      const generacion_automatizada = ["automatico", "automaticoEmp"].includes(
        transportadoras[transportadora].sistema()
      );
      arrGuias.sort((a, b) => {
        return a.numeroGuia > b.numeroGuia ? 1 : -1;
      });

      const guias = arrGuias.map((v) => v.id_heka).sort();

      /* Si tiene inhabilitado la creción de guías automáticas
        solo actualizará las guías que pasaron el filtro anterior y enviará una
        notificación a administración, es caso contrario utilizará el web service */
      if (["TCC"].includes(transportadora)) {
        await crearManifiestoAveonline(arrGuias, {
          id_user,
          prueba: estado_prueba,
          id_doc: docRef.id,
        });
      } else if (generacion_automatizada) {
        if (
          ["INTERRAPIDISIMO", "ENVIA", "COORDINADORA"].includes(transportadora)
        ) {
          // Con esta transportadora no creamos manifiestos de esta forma,
          //ya que el usuario los crea por su cuenta
          await actualizarEstadoGuiasDocCreado(arrGuias);
          Toast.fire({
            icon: "success",
            text: "¡Documento creado exitósamente!",
          });
          actualizarHistorialDeDocumentos();
          location.href = "#documentos";
          $("#filter_proceso-guias_hist").click();
        } else {
          await crearManifiestoServientrega(arrGuias, {
            id_user,
            prueba: estado_prueba,
            id_doc: docRef.id,
          });
          arrGuias.forEach(notificarPedidoCreado);
        }
      } else {
        await documentReference
          .doc(docRef.id)
          .update({
            descargar_guias: false,
            descargar_relacion_envio: false,
            important: true,
          })
          .then(() => {
            actualizarEstadoGuiasDocCreado(arrGuias);

            Swal.fire({
              icon: "success",
              text:
                "Las Guías " +
                guias +
                " Serán procesadas por un asesor, y en apróximadamente 10 minutos los documentos serán subidos.",
            });
          });

        await firebase
          .firestore()
          .collection("notificaciones")
          .add({
            mensaje: `${
              datos_usuario.nombre_completo
            } ha creado un Documento con las Guías: ${guias.join(", ")}`,
            fecha: genFecha(),
            guias: guias,
            usuario: datos_usuario.nombre_completo,
            timeline: new Date().getTime(),
            type: "documento",
            visible_admin: true,
          })
          .then(() => {
            actualizarHistorialDeDocumentos();
            location.href = "#documentos";
            $("#filter_proceso-guias_hist").click();
          });
      }

      node.prop("disabled", false);
    })
    .catch((error) => {
      console.error("Error adding document: ", error);
      node.prop("disabled", false);
    });
}

/*Utilizada para comprobar que las guís seleccionadas por el usuario para crear
los documentos cuenten con las mismas carácterísticas para no generar futuros errores
y me devuelve el mensaje con el error*/
function revisarCompatibilidadGuiasSeleccionadas(arrGuias) {
  let mensaje;
  const diferentes = arrGuias.some((v, i, arr) => {
    const generacion_automatizada = ["automatico", "automaticoEmp"].includes(
      transportadoras[v.transportadora].sistema()
      );
    if (v.type != arr[i ? i - 1 : i].type) {
      mensaje = "Los tipos de guías empacadas no coinciden.";
      return true;
    } else if (v.transportadora != arr[i ? i - 1 : i].transportadora) {
      mensaje = "Las transportadoras empacadas no coinciden.";
      return true;
    } else if (v.codigo_sucursal != arr[i ? i - 1 : i].codigo_sucursal && v.transportadora == "INTERRAPIDISIMO") {
      mensaje = "Para empacar guías de interrapidísimo, es necesario que todas las guías pertenezcan a la misma bodega.";
      return true
    } else if (generacion_automatizada && !v.numeroGuia) {
      mensaje =
        "Para el modo automático de guías, es necesario que todas las empacadas contengan el número de guía de la transportadora. <br/> Se recomienda desactivar el sistema automatizado para generar guias (que se encuentra en el cotizador), de esta forma, se le será permitido crear el documento con la guía nro. " +
        v.id_heka;

      return true;
    } else if (generacion_automatizada && !v.has_sticker) {
      let guias = arr
        .filter((t) => {
          return !t.has_sticker;
        })
        .map((v) => v.id_heka);

      const cantidad = guias.length;

      mensaje =
        "Por alguna razón, la(s) guía(s) " +
        guias +
        " no fue(ron) creada(s) completamente, para finalizar el proceso correcto, " +
        "presione <i class='fa fa-stamp rounded'></i> o intente clonar la guía para generarle el documento correctamente.";
      let match = cantidad > 1 ? /\(|\)/g : /\(\w+\)/g;
      mensaje = mensaje.replace(match, "");
      return true;
    } else if (
      ControlUsuario.esPuntoEnvio &&
      v.id_user != arr[i ? i - 1 : i].id_user
    ) {
      mensaje = "Los usuarios empacadas no coinciden.";
      return true;
    }

    return false;
  });

  return mensaje;
}

async function actualizarEstadoGuiasDocCreado(arrGuias) {
  for await (let guia of arrGuias) {
    usuarioAltDoc(guia.id_user)
      .collection("guias")
      .doc(guia.id_heka)
      .update({
        enviado: true,
        estado: "Enviado",
        estadoActual: estadosGuia.empacada,
      })
      .then(() => {
        const link =
          guia.transportadora === "ENVIA"
            ? "https://envia.co/"
            : "https://www.interrapidisimo.com/sigue-tu-envio/";

        notificarPedidoCreado(guia);

        if (guia.id_oficina) {
          enviarNotificacion({
            visible_office: true,
            user_id,
            office_id: guia.id_oficina,
            id_heka: guia.id_heka,
            numeroGuia: guia.numeroGuia,
            transportadora: guia.transportadora,
            mensaje: "Se ha creado una nueva guía que se dirige a tu oficina.",
          });
        }
      });
  }
}

function notificarPedidoCreado(guia) {
  const {
    transportadora,
    numeroGuia,
    dice_contener,
    valor,
    nombre_empresa,
    nombreR,
    ciudadR,
    nombreD,
    ciudadD,
    direccionD,
  } = guia;
  const plantilla = [
    transportadora,
    numeroGuia,
    dice_contener,
    valor.toString(),
    nombre_empresa || nombreR,
    ciudadR,
    nombreD,
    ciudadD,
    direccionD.trim(),
  ].map((p) => ({ default: p }));

  if (guia.numeroGuia && !noNotificarGuia) {
    fetch(
      "/mensajeria/ws/sendMessage/pedido_generado",
      organizarPostPlantillaMensaje(guia.telefonoD, plantilla)
    );
  }
}

//toma el un string de base64 y me devuelve un array buffer
function base64ToArrayBuffer(base64) {
  let binario = window.atob(base64);
  let bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    let ascii = binario.charCodeAt(i);
    bytes[i] = ascii;
  }

  return bytes;
}

//Toma la base 64 y abre una nueva pestaña con el documento obtenido
function openPdfFromBase64(base64) {
  const buffer = base64ToArrayBuffer(base64);
  let blob = new Blob([buffer], { type: "application/pdf" });
  let url = URL.createObjectURL(blob);
  window.open(url);
}

async function crearManifiestoServientrega(arrGuias, vinculo) {
  let mensaje = document.createElement("div");
  let ul = document.createElement("ul");

  sin_stiker = 0;
  arrGuias = arrGuias.filter((v) => {
    if (!v.has_sticker) sin_stiker++;
    return v.has_sticker;
  });

  if (sin_stiker) {
    ul.innerHTML += `<li>${sin_stiker} guias no pudieron ser procesadas por no contar con el sticker de la guía. \n"
        Le recomendamos clonar la(s) guía(s) involucrada, y eliminar la defectuosa</li>`;
  }

  let base64 = await fetch("/servientrega/generarManifiesto", {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify({ arrGuias, vinculo }),
  })
    .then((data) => data.text())
    .catch((error) => {
      console.log(error);
      Swal.fire({
        icon: "error",
        text: "Hubo un error al crear los documentos: " + error.message,
      });

      return "error";
    });

  let numero_guias = arrGuias.map((d) => d.numeroGuia).sort();
  const rango =
    numero_guias[0] +
    (numero_guias.length > 1
      ? "_" + numero_guias[numero_guias.length - 1]
      : "");
  const nombre_relacion = "Relacion " + rango;

  let documento_guardado;
  if (base64) {
    documento_guardado = await guardarBase64ToStorage(
      base64,
      user_id + "/" + vinculo.id_doc + "/" + nombre_relacion + ".pdf"
    );
  } else {
    if (arrGuias.length !== 0) {
      ul.innerHTML += `Por razones desconocidas, no se pudo crear el manifiesto, el problema ha sido transferido a asesoría logística,
            trataremos de corregirlo en la brevedad posible.`;
    }

    if (base64 === "error") {
      firebase
        .firestore()
        .collection("documentos")
        .doc(vinculo.id_doc)
        .delete();
    }
  }

  if (documento_guardado) {
    await firebase
      .firestore()
      .collection("documentos")
      .doc(vinculo.id_doc)
      .update({ nombre_relacion });
  }

  if (ul.innerHTML) {
    mensaje.appendChild(ul);
    Swal.fire({
      icon: "warning",
      title: "Obeservaciones",
      html: mensaje,
    });
  } else {
    Toast.fire({
      icon: "success",
      html: "¡Documento creado exitósamente!",
    });
  }

  actualizarHistorialDeDocumentos();
  location.href = "#documentos";
  $("#filter_proceso-guias_hist").click();
}

async function crearManifiestoAveonline(arrGuias, vinculo) {
  let mensaje = document.createElement("div");
  let ul = document.createElement("ul");

  sin_stiker = 0;
  arrGuias = arrGuias.filter((v) => {
    if (!v.has_sticker) sin_stiker++;
    return v.has_sticker;
  });

  if (sin_stiker) {
    ul.innerHTML += `<li>${sin_stiker} guias no pudieron ser procesadas por no contar con el sticker de la guía. \n"
        Le recomendamos clonar la(s) guía(s) involucrada, y eliminar la defectuosa</li>`;
  }

  let res = await fetch("/aveo/generarManifiesto", {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify({ arrGuias, vinculo }),
  })
    .then((data) => data.json())
    .catch((error) => {
      console.log(error);
      Swal.fire({
        icon: "error",
        text: "Hubo un error al crear los documentos: " + error.message,
      });

      return "error";
    });

  if (res.status === "error") {
    if (arrGuias.length !== 0) {
      ul.innerHTML += `Por razones desconocidas, no se pudo crear el manifiesto, el problema ha sido transferido a asesoría logística,
            trataremos de corregirlo en la brevedad posible.`;
    }
  }

  if (ul.innerHTML) {
    mensaje.appendChild(ul);
    Swal.fire({
      icon: "warning",
      title: "Obeservaciones",
      html: mensaje,
    });
  } else {
    Toast.fire({
      icon: "success",
      html: "¡Documento creado exitósamente!",
    });
  }

  actualizarHistorialDeDocumentos();
  location.href = "#documentos";
  $("#filter_proceso-guias_hist").click();
}

let documento = [],
  guias = [];

//muestra los documento al admin y le otorga funcionalidad a los botones
function cargarDocumentos(filter) {
  $("#statistics-filter-user").remove();
  $("#buscador-documentos").html(`
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Cargando...
    `);
  let documentos = document.getElementById("mostrador-documentos");
  let reference = firebase.firestore().collection("documentos"),
    docFiltrado;
  let fecha_inicio = Date.parse(value("docs-fecha-inicio").replace(/\-/g, "/")),
    fecha_final =
      Date.parse(value("docs-fecha-final").replace(/\-/g, "/")) + 8.64e7;
  switch (filter) {
    case "fecha":
      docFiltrado = reference
        .orderBy("timeline", "desc")
        .startAt(fecha_final)
        .endAt(fecha_inicio);
      break;
    case "sin gestionar":
      docFiltrado = reference
        // .orderBy("timeline", "desc")
        .where("descargar_relacion_envio", "==", false);
      // .where("descargar_guias", "==", false);
      break;
    case "important":
      docFiltrado = reference.where("important", "==", true);
      break;
    default:
      docFiltrado = reference.where("guias", "array-contains-any", filter);
  }

  docFiltrado
    .get()
    .then((querySnapshot) => {
      documentos.innerHTML = "";
      let users = new Array();
      let counter_guias = 0;
      let counter_convencional = 0,
        counter_pagoContraentrega = 0;
      let [counter_inter, counter_servi] = [0, 0];

      let docs = querySnapshot.docs;
      docs.sort((a, b) => b.data().timeline - a.data().timeline);

      docs.forEach((doc) => {
        doc.data().type == "CONVENCIONAL"
          ? counter_convencional++
          : counter_pagoContraentrega++;
        if (!users.includes(doc.data().centro_de_costo))
          users.push(doc.data().centro_de_costo);
        counter_guias += doc.data().guias.length;

        if (doc.data().descargar_relacion_envio || doc.data().descargar_guias) {
          //si tiene la informacion completa cambia el modo es que se ve la tarjeta y habilita mas funciones
          documentos.appendChild(
            toHtmlNode(mostrarDocumentos(doc.id, doc.data(), "warning"))
          );
          let descargador_completo = document.getElementById(
            "descargar-docs" + doc.id
          );
          descargador_completo.classList.remove("fa", "fa-file");
          descargador_completo.classList.add("fas", "fa-file-alt");
          descargador_completo.style.cursor = "alias";
          if (doc.data().descargar_relacion_envio) {
            let nombre_relacion = doc.data().nombre_relacion
              ? doc.data().nombre_relacion
              : "Relacion_" + doc.data().guias.slice(0, 5).toString();
            $("#mostrar-relacion-envio" + doc.id).text(nombre_relacion);
          }

          if (doc.data().descargar_guias) {
            let nombre_guias = doc.data().nombre_guias
              ? doc.data().nombre_guias
              : "Guias_" + doc.data().guias.slice(0, 5).toString();
            $("#mostrar-guias" + doc.id).text(nombre_guias);
          }
        } else {
          documentos.appendChild(
            toHtmlNode(mostrarDocumentos(doc.id, doc.data()))
          );
        }

        switch (doc.data().transportadora) {
          case "INTERRAPIDISIMO":
            counter_inter++;
            break;
          default:
            counter_servi++;
        }
      });
      showStatistics("#mostrador-documentos", [
        ["Usuarios", users.length, "users"],
        [
          "Guías / Documentos",
          counter_guias + " / " + querySnapshot.size,
          "file-alt",
        ],
        ["Pago Contraentrega", counter_pagoContraentrega, "hand-holding-usd"],
        ["Convencional", counter_convencional, "hand-holding"],
        ["Interrapidísimo", counter_inter, "truck"],
        ["Servientrega", counter_servi, "truck"],
      ]);

      filtrarDocsPorUsuarioAdmin(users);
      habilitarOtrosFiltrosDeDocumentosAdmin();
    })
    .then(() => {
      //Luego de cargar todo, agrega funciones a los botones
      let botones = document.querySelectorAll('[data-funcion="descargar"]');
      let descargador_completo = document.querySelectorAll(
        '[data-funcion="descargar-docs"]'
      );
      let visor_guias = document.querySelectorAll("[data-mostrar='texto']");
      //para el boton Que carga documentos
      for (let boton of botones) {
        boton.addEventListener("click", (e) => {
          boton.disabled = true;
          const idUser = e.target.parentNode.getAttribute("data-user");
          const guias = e.target.parentNode
            .getAttribute("data-guias")
            .split(",");
          const nombre = e.target.parentNode.getAttribute("data-nombre");
          const type = e.target.parentNode.getAttribute("data-type");
          const transp = e.target.parentNode.getAttribute(
            "data-transportadora"
          );
          documento = [];
          cargarDocumento(idUser, guias)
            .then(() => {
              let data = documento;
              data.sort((obja, objb) => {
                return parseInt(obja.id_heka) - parseInt(objb.id_heka);
              }, data.id_heka);
              if (guiaRepetida(data))
                return avisar(
                  "¡Posible error Detectado!",
                  "Alguna de las guías se encuentra repetida, se ha interrumpido el proceso antes de convertirlo en excel.",
                  "aviso"
                );
              if (data == "")
                return avisar(
                  "documento vacío",
                  "No se detectaron guías en este documento",
                  "advertencia"
                );
              if (transp == "INTERRAPIDISIMO") {
                descargarExcelInter(
                  data,
                  "heka_inter" + nombre + " " + guias.slice(0, 5).join("_"),
                  type
                );
              } else {
                descargarExcelServi(
                  data,
                  "heka_servi" + nombre + " " + guias.slice(0, 5).join("_"),
                  type
                );
              }
            })
            .then(() => {
              boton.disabled = false;
            });
        });
      }

      // Cuando esta habilitado, permite descarga el documento que ha sido enviado
      for (let descargar of descargador_completo) {
        descargar.addEventListener("click", (e) => {
          let id = e.target.getAttribute("data-id_guia");

          descargarDocumentos(id);
        });
      }

      for (let element of visor_guias) {
        element.addEventListener("click", () => {
          element.classList.toggle("text-truncate");
          element.style.cursor = "zoom-out";
          if (element.classList.contains("text-truncate"))
            element.style.cursor = "zoom-in";
        });
      }

      $(".resaltar-doc").click(cambiarRelevanciaDeDocumento);
    })
    .then(() => {
      // actualizarNumGuia()
      subirDocumentos();
      $("#buscador-documentos").text("Buscar");
      if (documentos.innerHTML == "") {
        documentos.innerHTML = `<div class="col-2"></div>
            <p class="col card m-3 p-3 border-danger text-danger text-center">
            No Hay documentos para tu búsqueda</p><div class="col-2"></div>`;
      }
    });
}

function cambiarRelevanciaDeDocumento(e) {
  const idDoc = e.target.getAttribute("data-id");
  let important = e.target.getAttribute("data-important");
  important = important === "true" ? true : false;
  Swal.fire({
    icon: "question",
    text:
      "Seguro que deseas " +
      (important ? "ocultar" : "mostrar") +
      " este documento al inicio?",
    showCancelButton: true,
    cancelButtonText: '<i class="fa fa-thumbs-down"></i>',
    confirmButtonText: '<i class="fa fa-thumbs-up"></i> Si',
  }).then((result) => {
    console.log(result);
    if (!result.isConfirmed) return;
    if (important === true) {
      $(this).removeClass("fa-eye");
      $(this).addClass("fa-eye-slash");
      $(this).attr("data-important", false);
    } else {
      $(this).addClass("fa-eye");
      $(this).removeClass("fa-eye-slash");
      $(this).attr("data-important", true);
    }
    db.collection("documentos").doc(idDoc).update({ important: !important });
  });
}

function guiaRepetida(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] == arr[i - 1]) {
      return true;
    }
  }
  return false;
}

/*Funcion que tomará un identificador como primer arg, creará un div que
me muestre cierta información que irá siento alterada cada vez que se
llame el método
*/
function showStatistics(query, arr, insertAfter) {
  let html = document.querySelector(query);
  const complement = "-" + query.replace(/[^\w||-]/gi, "");
  let splide = document.createElement("div");
  splide.setAttribute("id", "statistics" + complement);
  splide.classList.add("splide", "mb-3");

  let div = document.createElement("div");
  div.classList.add("splide__track");

  if (document.getElementById("statistics" + complement)) {
    splide = document.getElementById("statistics" + complement);
  }

  splide.innerHTML = "";
  let ul = document.createElement("ul");
  ul.classList.add("row", "splide__list");
  splide.append(div);
  div.append(ul);

  for (let card of arr) {
    ul.innerHTML += `<li class="tarjeta splide__slide">
            <div class="card border-left-${
              card[3] || "primary"
            } shadow h-100 py-2">
                <div class="card-body">
                    <div class="row no-gutters align-items-center">
                        <div class="col mr-2">
                            <div class="text-xs font-weight-bold text-${
                              card[3] || "primary"
                            } text-uppercase mb-1">${card[0]}</div>
                            <div class="h5 mb-0 font-weight-bold text-gray-800">${
                              card[1]
                            }</div>
                        </div>
                        <div class="col-auto">
                            <i class="fas fa-${
                              card[2]
                            } fa-2x text-gray-300"></i>
                        </div>

                    </div>
                </div>
            </div>
        </li>`;
  }

  if (insertAfter) {
    html.appendChild(splide);
  } else {
    html.parentNode.insertBefore(splide, html);
  }

  new Splide("#statistics" + complement, {
    perPage: 4,
    gap: 5,
    easing: "ease",
    classes: {
      prev: "splide__arrow--prev ml-n3 bg-transparent",
      next: "splide__arrow--next mr-n3 bg-transparent",
    },
    breakpoints: {
      640: {
        perPage: 2,
      },
      380: {
        perPage: 1,
      },
    },
  }).mount();
}

function filtrarDocsPorUsuarioAdmin(usuarios) {
  usuarios.sort();
  const userCard = $("#statistics-mostrador-documentos .tarjeta:first-child");
  let userContainer = document.createElement("div");
  userContainer.classList.add("list-group", "position-absolute", "shadow-lg");
  userContainer.setAttribute("id", "statistics-filter-user");
  userContainer.setAttribute(
    "style",
    "width: fit-content; z-index: 1; max-width: 300px; display: none"
  );
  userContainer.innerHTML = `<button type="button" class="list-group-item list-group-item-action active" aria-current="true">
        Filtrar por usuario <span class="float-right">&times;</span>
    </button>`;

  const userSelectors = document.createElement("div");
  userSelectors.classList.add("overflow-auto");
  userSelectors.setAttribute("style", "height: 50vh");
  userContainer.appendChild(userSelectors);

  usuarios.forEach((user) => {
    const userBtn = document.createElement("button");
    userBtn.setAttribute("type", "button");
    userBtn.setAttribute(
      "class",
      "list-group-item list-group-item-action text-truncate"
    );
    userBtn.innerHTML = user;
    userBtn.onclick = (e) => {
      const filtrador = e.target.textContent;
      const documento = $(".document-filter");

      documento.hide();
      $("[data-filter_user=" + filtrador + "]").show("slow");
    };

    userSelectors.appendChild(userBtn);
  });

  $("#statistics-mostrador-documentos").after(userContainer);
  userCard.click(() => {
    $(userContainer).toggle("fast");
  });

  $(userContainer).click(() => {
    $(userContainer).hide();
  });
}

function habilitarOtrosFiltrosDeDocumentosAdmin() {
  const todas = $("#statistics-mostrador-documentos .tarjeta:nth-child(2)");
  const pagoContraentregaCard = $(
    "#statistics-mostrador-documentos .tarjeta:nth-child(3)"
  );
  const pagoConvencionalCard = $(
    "#statistics-mostrador-documentos .tarjeta:nth-child(4)"
  );
  const interCard = $("#statistics-mostrador-documentos .tarjeta:nth-child(5)");
  const serviCard = $("#statistics-mostrador-documentos .tarjeta:nth-child(6)");

  pagoContraentregaCard.click(() => filtrar("PAGOCONTRAENTREGA", "type"));
  pagoConvencionalCard.click(() => filtrar("CONVENCIONAL", "type"));
  interCard.click(() => filtrar("INTERRAPIDISIMO", "transportadora"));
  serviCard.click(() => filtrar("SERVIENTREGA", "transportadora"));
  todas.click(() => {
    $(".document-filter").show("slow");
  });

  function filtrar(valor, param) {
    const filtrador = valor;
    const documento = $(".document-filter");

    documento.hide();
    $("[data-filter_" + param + "=" + filtrador + "]").show("slow");
  }
}

//En invocada cada vez que se va a cargar un documento
async function cargarDocumento(id_user, arrGuias) {
  guias = arrGuias;
  guias.sort();
  if (guiaRepetida(guias))
    return avisar(
      "¡Posible error Detectado!",
      "Uno de los identificadores encontrados, está repetido, el proceso ha sido cancelado, le recomiendo recargar la página",
      "aviso"
    );
  for (let guia of guias) {
    await firebase
      .firestore()
      .collection("usuarios")
      .doc(id_user)
      .collection("guias")
      .doc(guia)
      .get()
      .then((doc) => {
        if (doc.exists) {
          documento.push(doc.data());
        }
      });
  }
}

//Me convierte el conjunto de guias descargadas en archivo CsV
function descargarExcelServi(JSONData, ReportTitle, type) {
  console.log(JSONData);
  //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
  var arrData = typeof JSONData != "object" ? JSON.parse(JSONData) : JSONData;

  //un arreglo cuyo cada elemento contiene un arreglo: ["titulo de la columna", "la información a inrertar en dicha columna"]
  //Está ordenado, como saldrá en el excel
  let encabezado = [
    ["Ciudad/Cód DANE de Origen", "ciudadR"],
    ["Tiempo de Entrega", 1],
    ["Documento de Identificación", "identificacionD"],
    ["Nombre del Destinatario", "nombreD"],
    ["Dirección", "direccionD"],
    ["Ciudad/Cód DANE de destino", "ciudadD"],
    ["Departamento", "departamentoD"],
    ["Teléfono", "telefonoD"],
    ["Correo Electrónico Destinatario", "correoD"],
    ["Celular", "celularD"],
    ["Departamento de Origen", "departamentoR"],
    ["Direccion Remitente", "direccionR"],
    ["Nombre de la Unidad de Empaque", "heka"],
    ["Dice Contener", "dice_contener"],
    ["Valor declarado", "seguro"],
    ["Número de Piezas", 1],
    ["Cantidad", 1],
    ["Alto", "alto"],
    ["Ancho", "ancho"],
    ["Largo", "largo"],
    ["Peso", "peso"],
    ["Producto", 2],
    ["Forma de Pago", 2],
    ["Medio de Transporte", 1],
    ["Campo personalizado 1", "id_heka"],
    ["Unidad de longitud", "cm"],
    ["Unidad de peso", "kg"],
    ["Centro de costo", "centro_de_costo"],
    ["Recolección Esporádica", "recoleccion_esporadica"],
    ["Tipo de Documento", "tipo_doc_dest"],
    ["Nombre contacto remitente", "nombreR"],
    ["Correo electrónico del remitente", "correoR"],
    ["Numero de telefono movil del remitente.", "celularR"],
    ["Valor a cobrar por el Producto", "valor"],
  ];

  if (type == "CONVENCIONAL") {
    encabezado.splice(-5, 1);
    encabezado.splice(-1, 1);
  }

  let recolecciones = new Array();
  let newDoc = arrData.map((dat, i) => {
    let d = new Object();
    encabezado.forEach(([headExcel, fromData]) => {
      if (fromData === "recoleccion_esporadica") {
        fromData = i ? 0 : 1;
        if (fromData) recolecciones.push(i + 1);
      }
      d[headExcel] = dat[fromData] || fromData;
    });
    console.log(d);
    return d;
  });

  const titulo_rec = "Recolección esporádica";
  let texto_rec;
  if (recolecciones.length === 1) {
    texto_rec =
      "Solo la fila " +
      recolecciones[0] +
      " tiene habilitada la recolección esporádica.";
  } else if (recolecciones.length > 1) {
    texto_rec =
      "Las filas " +
      recolecciones +
      " tiene habilitada la recolección esporádica.";
  } else {
    texto_rec = "Ninguna fila tiene habilitada la recolección esporádica.";
  }

  avisar(titulo_rec, texto_rec, "aviso");

  crearExcel(newDoc, ReportTitle);
  return;
}

let errActualizarNovedades = [];
let actualizadasCorrectamente = 0;

async function subirExcelNovedades() {


  let datos = [];
  let contador = 0;
  let label = document.getElementById("excelDocSolucionesLabel");
  let inputExcel = document.getElementById("excelDocSoluciones")
  let data = new FormData(document.getElementById("form-novedades"));
  console.log(data.get("documento"));
  fetch("/excel_to_json", {
    method: "POST",
    body: data,
  })
    .then(async (res) => {
      if (!res.ok) {
        console.log(res);
        throw Error(
          "Lo sentimos, no pudimos cargar su documento, reviselo y vuelvalo a subir"
        );
      }
      inputExcel.value = ""
      label.innerHTML = "Seleccionar Archivo"
      datos = await res.json();
      let tamaño = datos.length;
      datos.forEach(async (data) => {
        contador++;
        let anteriorSeguimiento
        const id_user = data["ID USUARIO"];
        const id_heka = data["ID HEKA"].toString();
        const numGuia = data["NUMERO GUIA"];
        const respuesta = data["RESPUESTA TRANSPORTADORA"];
        const actualizar = data["ACTUALIZAR"];
        const transpor = data["TRANSPORTADORA"];
        const referenciaGuia = firebase
          .firestore()
          .collection("usuarios")
          .doc(id_user)
          .collection("guias")
          .doc(id_heka);

        referenciaGuia.get()
        .then(async doc=>{
          anteriorSeguimiento = doc.data().seguimiento?doc.data().seguimiento[doc.data().seguimiento?.length-1]:
          console.log(doc.data().seguimiento)

          let respuestaRepetida = false
          if (anteriorSeguimiento?.admin){
            console.log("entro")
            const respAnt = '<b>La transportadora "' +transpor + '" responde lo siguiente:</b> ' + respuesta.trim()
            console.log(respAnt)
            console.log(anteriorSeguimiento.gestion)
            if(anteriorSeguimiento.gestion == respAnt){
              errActualizarNovedades.push({
                guia: numGuia,
                error: "Ultima respuesta duplicada",
              })
              respuestaRepetida = true
            }
          }
          else if (!respuesta) {
            errActualizarNovedades.push({
              guia: numGuia,
              error: "No se encontro la informacion necesaria",
            });
          }
        if (errActualizarNovedades.length == tamaño) {
          Swal.fire({
            icon: "error",
            title: "Informe de actualizacion",
            showDenyButton: true,
            denyButtonText: `Descargar reporte`,
            text:
            "Se actualizaron correctamente " +
            actualizadasCorrectamente +
            " de " +
            tamaño +
              ".",
            }).then((result) => {
              if (result.isConfirmed) {
              errActualizarNovedades = [];
              actualizadasCorrectamente = 0;
            } else if (result.isDenied) {
              descargarInformeNovedades(errActualizarNovedades);
            }
          });
        }
        if (actualizar == "SI" && respuesta && !respuestaRepetida) {
          const solucion = {
            gestion:
            '<b>La transportadora "' +
            transpor +
            '" responde lo siguiente:</b> ' +
            respuesta.trim(),
            fecha: new Date(),
            admin: true,
            type: "Masivo",
          };
          console.log(anteriorSeguimiento)

          await referenciaGuia
          .update({
            seguimiento: firebase.firestore.FieldValue.arrayUnion(solucion),
            novedad_solucionada: true,
          })
            .then(() => {
              console.log("todo nice");
              actualizadasCorrectamente++;
              console.log(actualizadasCorrectamente);
              firebase
              .firestore()
              .collection("notificaciones")
              .doc(id_heka)
              .delete();

              enviarNotificacion({
                visible_user: true,
                user_id: id_user,
                id_heka: id_heka,
                mensaje:
                  "Respuesta a Solución de la guía número " +
                  numGuia +
                  ": " +
                  respuesta.trim(),
                href: "novedades",
              });
            })
            .catch((err) => {
              errActualizarNovedades.push({
                guia: numGuia,
                error: err.message,
              });
            })
            .finally(() => {
              console.log(datos.length);
              console.log(contador);
              if (contador == datos.length) {
                Swal.fire({
                  icon: "success",
                  title: "Informe de actualizacion",
                  showDenyButton: true,
                  denyButtonText: `Descargar reporte`,
                  text:
                  "Se actualizaron correctamente " +
                  actualizadasCorrectamente +
                  " de " +
                  tamaño +
                  ".",
                }).then((result) => {

                  if (result.isConfirmed) {

                    errActualizarNovedades = [];
                    actualizadasCorrectamente = 0;
                  } else if (result.isDenied) {
                    descargarInformeNovedades(errActualizarNovedades);
                  }
                });
              }
            });
          }
        });
      })
    })
    .catch((err) => {
      Swal.fire({
        icon: "error",
        title: "Error al subir excel",
        text: err.message,
      });
    });
}

function descargarInformeNovedades(data) {
  if (!data.length) {
    return Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "No hay datos que descargar!",
    });
  }
  let arrData = typeof data != "object" ? JSON.parse(data) : data;

  let encabezado = [
    ["NUMERO DE GUIA", "_guia"],
    ["ERROR", "_error"],
  ];

  let newDoc = arrData.map((dat, i) => {
    let d = new Object();

    encabezado.forEach(([headExcel, fromData]) => {
      if (fromData === "_guia") {
        fromData = dat.guia;
      }

      if (fromData === "_error") {
        fromData = dat.error;
      }

      d[headExcel] = dat[fromData] || fromData;
    });
    return d;
  });
  crearExcel(newDoc, "Reporte de errores");
}

function informeNovedadesCallcenter(JSONData){
  const checkboxNovedadesInter = document.getElementById("checkboxNovedadesInter")
  const checkboxNovedadesServientrega = document.getElementById("checkboxNovedadesServientrega")
  const checkboxNovedadesCoordinadora = document.getElementById("checkboxNovedadesCoordinadora")
  const checkboxNovedadesEnvia = document.getElementById("checkboxNovedadesEnvia")
  let interArr = []
  let serviArr = []
  let enviaArr = []
  let cordiArr = []
  let arrayFiltrado = []

  JSONData.forEach((data) => {
    const dataMovimientos = data.data.movimientos;
    const extraData = data.extraData;


    if (extraData.transportadora == "INTERRAPIDISIMO" ){
      let indexUltimaNovedad = data.data.movimientos.findLastIndex(movimiento => movimiento["Motivo"] !== "")
      let dataFinal = {
        idUser: extraData.id_user,
        seller: extraData.centro_de_costo,
        idHeka: extraData.id_heka,
        numeroGuia: extraData.numeroGuia,
        solicitud:
          extraData.seguimiento?extraData.seguimiento[extraData.seguimiento.length - 1].gestion:"",
        transportadora: extraData.transportadora,
        Novedad: dataMovimientos[indexUltimaNovedad]["Motivo"],
        fechaMov: dataMovimientos[indexUltimaNovedad]["Fecha Cambio Estado"],
      }
      interArr.push(dataFinal)
    }
    else if(extraData.transportadora == "SERVIENTREGA" ){
      let indexUltimaNovedad = data.data.movimientos.findLastIndex(movimiento => movimiento.NomConc !== "")
      let dataFinal = {
        idUser: extraData.id_user,
        seller: extraData.centro_de_costo,
        idHeka: extraData.id_heka,
        numeroGuia: extraData.numeroGuia,
        solicitud:
          extraData.seguimiento?extraData.seguimiento[extraData.seguimiento.length - 1].gestion:"",
        transportadora: extraData.transportadora,
        Novedad: dataMovimientos[indexUltimaNovedad].NomConc,
        fechaMov: dataMovimientos[indexUltimaNovedad].FecMov,
      }
      serviArr.push(dataFinal)
    }
    else if (extraData.transportadora == "ENVIA" ){
      let indexUltimaNovedad = data.data.movimientos.findLastIndex(movimiento => movimiento.novedad !== "")
      let dataFinal ={
        idUser: extraData.id_user,
        seller: extraData.centro_de_costo,
        idHeka: extraData.id_heka,
        numeroGuia: extraData.numeroGuia,
        solicitud:
        extraData.seguimiento?extraData.seguimiento[extraData.seguimiento.length - 1].gestion:"",
        transportadora: extraData.transportadora,
        Novedad: dataMovimientos[indexUltimaNovedad].novedad,
        fechaMov: dataMovimientos[indexUltimaNovedad].fechaMov,
      }
      enviaArr.push(dataFinal)
    }
    else if (extraData.transportadora == "COORDINADORA" ){
      let indexUltimaNovedad = data.data.movimientos.findLastIndex(movimiento => movimiento.codigo_novedad !== "")
      let dataFinal ={
        idUser: extraData.id_user,
        seller: extraData.centro_de_costo,
        idHeka: extraData.id_heka,
        numeroGuia: extraData.numeroGuia,
        solicitud:
        extraData.seguimiento?extraData.seguimiento[extraData.seguimiento.length - 1].gestion:"",
        transportadora: extraData.transportadora,
        Novedad: dataMovimientos[indexUltimaNovedad].descripcion,
        fechaMov: dataMovimientos[indexUltimaNovedad].fecha_completa,
      }
      cordiArr.push(dataFinal)
    }
  });

  if (checkboxNovedadesInter.checked){
    console.log(checkboxNovedadesInter.checked)
    arrayFiltrado = arrayFiltrado.concat(interArr)
  }
  if (checkboxNovedadesServientrega.checked){
    arrayFiltrado = arrayFiltrado.concat(serviArr)
  }
  if (checkboxNovedadesCoordinadora.checked){
    arrayFiltrado = arrayFiltrado.concat(cordiArr)
  }
  if (checkboxNovedadesEnvia.checked){
    arrayFiltrado = arrayFiltrado.concat(enviaArr)
  }
  if (!arrayFiltrado.length){
    return Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "No hay datos que descargar!",
    });
  }
  let arrData =
    typeof arrayFiltrado != "object"
      ? JSON.parse(arrayFiltrado)
      : arrayFiltrado;

  let encabezado = [
    // ["ID USUARIO", "_idUser"],
    ["SELLER", "_seller"],
    ["ID HEKA", "_idHeka"],
    ["NUMERO GUIA", "_numGuia"],
    ["TRANSPORTADORA", "_Transportadora"],
    // ["SOLICITUD", "_solicitud"],
    ["NOVEDAD", "_novedad"],
    ["FECHA MOVIMIENTO", "_fechaMov"],
  ];

  let newDoc = arrData.map((dat, i) => {
    let d = new Object();

    encabezado.forEach(([headExcel, fromData]) => {
      if (fromData === "_numGuia") {
        fromData = dat.numeroGuia;
      }

      // if (fromData === "_solicitud") {
      //   fromData = dat.solicitud;
      // }

      if (fromData === "_idHeka") {
        fromData = dat.idHeka;
      }

      if (fromData === "_idUser") {
        fromData = dat.idUser;
      }

      if (fromData === "_novedad") {
        fromData = dat.Novedad;
      }

      if (fromData === "_seller") {
        fromData = dat.seller;
      }

      if (fromData === "_fechaMov") {
        fromData = dat.fechaMov;
      }

      if (fromData === "_Transportadora") {
        fromData = dat.transportadora;
      }

      d[headExcel] = dat[fromData] || fromData;
    });
    return d;
  });
  const hoy = new Date(Date.now());
  const fecha_archivo = (hoy.toLocaleDateString()+" "+hoy.getHours()+"-"+hoy.getMinutes())
  crearExcel(newDoc, ("Excel Novedades Callcenter "+fecha_archivo));

}

function informeNovedadesLogistica(JSONData){
  const checkboxNovedadesInter = document.getElementById("checkboxNovedadesInter")
  const checkboxNovedadesServientrega = document.getElementById("checkboxNovedadesServientrega")
  const checkboxNovedadesCoordinadora = document.getElementById("checkboxNovedadesCoordinadora")
  const checkboxNovedadesEnvia = document.getElementById("checkboxNovedadesEnvia")
  let interArr = []
  let serviArr = []
  let enviaArr = []
  let cordiArr = []
  let arrayFiltrado = []

  JSONData.forEach((data) => {
    // if(data.seguimiento_finalizado == false)

    const dataMovimientos =
      data.data.movimientos[data.data.movimientos.length - 1];
      console.log(data)
    const extraData = data.extraData;


    if (extraData.transportadora == "INTERRAPIDISIMO" ){
      let dataFinal = {
        idUser: extraData.id_user,
        idHeka: extraData.id_heka,
        numeroGuia: extraData.numeroGuia,
        solicitud:
          extraData.seguimiento?extraData.seguimiento[extraData.seguimiento.length - 1].gestion:"",
        transportadora: extraData.transportadora,
        nombreMov: dataMovimientos["Descripcion Estado"],
        mensajeMov: dataMovimientos["Motivo"],
        fechaMov: dataMovimientos["Fecha Cambio Estado"],
      }
      interArr.push(dataFinal)
    }
    else if(extraData.transportadora == "SERVIENTREGA" ){
      let dataFinal = {
        idUser: extraData.id_user,
        idHeka: extraData.id_heka,
        numeroGuia: extraData.numeroGuia,
        solicitud:
          extraData.seguimiento?extraData.seguimiento[extraData.seguimiento.length - 1].gestion:"",
        transportadora: extraData.transportadora,
        nombreMov: dataMovimientos.NomMov,
        mensajeMov: dataMovimientos.NomConc,
        fechaMov: dataMovimientos.FecMov,
      }
      serviArr.push(dataFinal)
    }
    else if (extraData.transportadora == "ENVIA" ){
      let dataFinal ={
        idUser: extraData.id_user,
        idHeka: extraData.id_heka,
        numeroGuia: extraData.numeroGuia,
        solicitud:
        extraData.seguimiento?extraData.seguimiento[extraData.seguimiento.length - 1].gestion:"",
        transportadora: extraData.transportadora,
        nombreMov: dataMovimientos.novedad,
        mensajeMov: dataMovimientos.aclaracion,
        fechaMov: dataMovimientos.fechaMov,
      }
      enviaArr.push(dataFinal)
    }
    else if (extraData.transportadora == "COORDINADORA" ){
      let dataFinal ={
        idUser: extraData.id_user,
        idHeka: extraData.id_heka,
        numeroGuia: extraData.numeroGuia,
        solicitud:
        extraData.seguimiento?extraData.seguimiento[extraData.seguimiento.length - 1].gestion:"",
        transportadora: extraData.transportadora,
        nombreMov: dataMovimientos.descripcion,
        mensajeMov: dataMovimientos.codigo_novedad,
        fechaMov: data.data.fecha,
      }
      cordiArr.push(dataFinal)
    }
  });

  if (checkboxNovedadesInter.checked){
    console.log(checkboxNovedadesInter.checked)
    arrayFiltrado = arrayFiltrado.concat(interArr)
  }
  if (checkboxNovedadesServientrega.checked){
    arrayFiltrado = arrayFiltrado.concat(serviArr)
  }
  if (checkboxNovedadesCoordinadora.checked){
    arrayFiltrado = arrayFiltrado.concat(cordiArr)
  }
  if (checkboxNovedadesEnvia.checked){
    arrayFiltrado = arrayFiltrado.concat(enviaArr)
  }
  if (!arrayFiltrado.length){
    return Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "No hay datos que descargar!",
    });
  }
  let arrData =
    typeof arrayFiltrado != "object"
      ? JSON.parse(arrayFiltrado)
      : arrayFiltrado;

  let encabezado = [
    ["ID USUARIO", "_idUser"],
    ["ID HEKA", "_idHeka"],
    ["NUMERO GUIA", "_numGuia"],
    ["TRANSPORTADORA", "_Transportadora"],
    ["SOLICITUD", "_solicitud"],
    ["MOVIMIENTO", "_nombreMov"],
    ["MENSAJE MOVIMIENTO", "_mensajeMov"],
    ["FECHA MOVIMIENTO", "_fechaMov"],
    ["RESPUESTA TRANSPORTADORA", ""],
    ["ACTUALIZAR", "SI"],
  ];

  let newDoc = arrData.map((dat, i) => {
    let d = new Object();

    encabezado.forEach(([headExcel, fromData]) => {
      if (fromData === "_numGuia") {
        fromData = dat.numeroGuia;
      }

      if (fromData === "_solicitud") {
        fromData = dat.solicitud;
      }

      if (fromData === "_idHeka") {
        fromData = dat.idHeka;
      }

      if (fromData === "_idUser") {
        fromData = dat.idUser;
      }

      if (fromData === "_nombreMov") {
        fromData = dat.nombreMov;
      }

      if (fromData === "_mensajeMov") {
        fromData = dat.mensajeMov;
      }

      if (fromData === "_fechaMov") {
        fromData = dat.fechaMov;
      }

      if (fromData === "_Transportadora") {
        fromData = dat.transportadora;
      }

      d[headExcel] = dat[fromData] || fromData;
    });
    return d;
  });
  const hoy = new Date(Date.now());
  const fecha_archivo = (hoy.toLocaleDateString()+" "+hoy.getHours()+"-"+hoy.getMinutes())
  crearExcel(newDoc, ("Excel Novedades Logistica "+fecha_archivo));

}

function descargarExcelNovedades() {
  // const checkboxNovedadesLogistica = document.getElementById("checkboxNovedadesLogistica")
  // const checkboxNovedadesCallcenter = document.getElementById("checkboxNovedadesCallcenter")

  let JSONData = novedadesExcelData;
  if (!novedadesExcelData.length) {
    return Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "No hay datos que descargar!",
    });
  }
  informeNovedadesLogistica(JSONData)
  // if(checkboxNovedadesLogistica.checked) {informeNovedadesLogistica(JSONData)}
  // else if(checkboxNovedadesCallcenter.checked){informeNovedadesCallcenter(JSONData)}
  // else return Swal.fire({
  //   icon: "error",
  //   title: "Oops...",
  //   text: "No hay datos que descargar!",
  // });



}

function descargarExcelInter(JSONData, ReportTitle, type) {
  //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
  var arrData = typeof JSONData != "object" ? JSON.parse(JSONData) : JSONData;
  console.log(arrData);
  console.log(JSONData);
  //un arreglo cuyo cada elemento contiene un arreglo: ["titulo de la columna", "la información a inrertar en dicha columna"]
  //Está ordenado, como saldrá en el excel
  let encabezadoAntiguo = [
    ["NUMERO GUIA", ""],
    ["ID DESTINATARIO", "_idDestinatario"],
    ["NOMBRE DESTINATARIO", "_nombreD"],
    ["APELLIDO1 DESTINATARIO", "_apellidoD"],
    ["APELLIDO2 DESTINATARIO", ""],
    ["TELEFONO DESTINATARIO", "telefonoD"],
    ["DIRECCION DESTINATARIO", "direccionD"],
    ["CODIGO CIUDAD DESTINO", "dane_ciudadD"],
    ["CIUDAD DESTINO", "_ciudad"],
    ["DICE CONTENER", "dice_contener"],
    ["OBSERVACIONES", "id_heka"],
    ["BOLSA DE SEGURIDAD", ""],
    ["PESO", "peso"],
    ["VALOR COMERCIAL", "valor"],
    ["NO PEDIDO", ""],
    ["DIRECCION AGENCIA DESTINO", ""],
  ];
  let encabezado = [
    ["NUMERO GUIA", ""],
    ["ID DESTINATARIO", "_idDestinatario"],
    ["NOMBRE DESTINATARIO", "_nombreD"],
    ["APELLIDO1 DESTINATARIO", "_apellidoD"],
    ["APELLIDO2 DESTINATARIO", ""],
    ["TELEFONO DESTINATARIO", "telefonoD"],
    ["DIRECCION DESTINATARIO", "direccionD"],
    ["CODIGO CIUDAD DESTINO", "dane_ciudadD"],
    ["CIUDAD DESTINO", "_ciudad"],
    ["DICE CONTENER", "dice_contener"],
    ["OBSERVACIONES", "id_heka"],
    ["BOLSA DE SEGURIDAD", ""],
    ["PESO", "peso"],
    ["VALOR COMERCIAL", "valor"],
    ["NO PEDIDO", ""],
    ["DIRECCION AGENCIA DESTINO", ""],
    ["FOLIO", ""],
    ["CODIGO RADICADO", ""],
  ];

  let newDoc = arrData.map((dat, i) => {
    let d = new Object();
    const nombre_completo = dat.nombreD
      .trim()
      .split(" ")
      .filter((t) => t);
    const lNombres = nombre_completo.length;
    const divider = Math.floor(lNombres / 2);
    const nombresD =
      lNombres > 1
        ? nombre_completo.slice(0, divider).join(" ")
        : dat.nombreD.trim();
    let apellidosD =
      lNombres > 1 ? nombre_completo.slice(divider).join(" ") : nombresD;

    encabezado.forEach(([headExcel, fromData]) => {
      if (fromData === "_idDestinatario") {
        fromData = i + 1;
      }

      if (fromData === "_ciudad") {
        fromData = dat.ciudadD + "/" + dat.departamentoD;
      }

      if (fromData === "_nombreD") {
        fromData = nombresD;
      }

      if (fromData === "_apellidoD") {
        fromData = apellidosD;
      }

      if (dat.type === "CONVENCIONAL" && fromData === "valor") {
        fromData = dat.seguro;
      }

      d[headExcel] = dat[fromData] || fromData;
    });
    return d;
  });

  crearExcel(newDoc, ReportTitle);
}

function crearExcel(newDoc, nombre) {
  console.log(nombre);

  let ws = XLSX.utils.json_to_sheet(newDoc);

  let wb = XLSX.utils.book_new();
  console.log(wb);
  XLSX.utils.book_append_sheet(wb, ws, "1");

  XLSX.writeFile(wb, nombre + ".xlsx");
}

function descargarInformeGuias(JSONData, ReportTitle) {
  console.log(JSONData);
  //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
  var arrData = typeof JSONData != "object" ? JSON.parse(JSONData) : JSONData;

  //Aca esta organizado el encabezado
  let CSV = "";
  CSV = "sep=," + "\r\n";
  let encabezado =
    "# Guía Heka,# Guía Servientrega,Centro de Costo,Comisión Heka,Comisión Servientrega,Flete,Recaudo,Total,Fecha";
  CSV += encabezado + "\r\n";

  console.log(arrData.length);
  //Se actulizara cada cuadro por fila, ***se comenta cual es el campo llenado en cada una***
  for (var i = 0; i < arrData.length; i++) {
    let row = "";
    // # Guia Heka
    row += '"' + arrData[i].id_heka + '",';
    // Numero Guia Servientrega
    row += '"' + arrData[i].numeroGuia + '",';
    // Centro de costo
    row += '"' + arrData[i].centro_de_costo + '",';
    // Comision heka
    row += '"' + arrData[i].detalles.comision_heka + '",';
    // Comision servientrega
    row += '"' + arrData[i].detalles.comision_trasportadora + '",';
    //Flete
    row += '"' + arrData[i].detalles.flete + '",';
    //Recaudo
    row += '"' + arrData[i].detalles.recaudo + '",';
    //Total
    row += '"' + arrData[i].detalles.total + '",';
    // Fecha
    row += '"' + arrData[i].fecha + '",';

    row.slice(0, row.length - 1);

    //agg un salto de linea por cada fila
    CSV += row + "\r\n";
    console.log(row);
  }

  if (CSV == "") {
    alert("Datos invalidos");
    return;
  }

  //nombre del archivo por defecto
  var fileName = "guias_";
  //Toma los espacios en blanco en el nombre colocado y los reemplaza con guion bajo
  fileName += ReportTitle.replace(/ /g, "_");

  //Para formato CSV
  var uri = "data:text/csv;charset=utf-8," + escape(CSV);

  // un Tag link que no sera visible, pero redirigira al archivo para descargarlo en cuanto se active este funcion
  var link = document.createElement("a");
  link.href = uri;

  link.style = "visibility:hidden";
  link.download = fileName + ".csv";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

//Función que es utilizada por el admin para cargar los documentos al usuario
function subirDocumentos() {
  let cargadores = document.getElementsByClassName("cargar-documentos");
  let botones_envio = document.querySelectorAll('[data-funcion="enviar"]');
  console.log(botones_envio);
  let num_guia_actualizado = false;
  for (let cargador of cargadores) {
    //verifica y muestra cada documetno cargado
    cargador.addEventListener("change", (e) => {

      let tipo_de_doumento = e.target.getAttribute("data-tipo");
      let id_doc = e.target.parentNode.getAttribute("data-id_guia");
      let mostrador_relacion = document.getElementById(
        "mostrar-relacion-envio" + id_doc
      );
      let mostrador_guias = document.getElementById("mostrar-guias" + id_doc);
      if (tipo_de_doumento == "num-guia") {
        num_guia_actualizado = true;
      } else if (tipo_de_doumento == "relacion-envio") {
        mostrador_relacion.innerHTML =
          "Relación de envíos: " + e.target.files[0].name;
      } else {
        mostrador_guias.innerHTML = "Guías: " + e.target.files[0].name;
      }

      if (true) {
        document.getElementById("subir" + id_doc).classList.remove("d-none");
      } else {
        document.getElementById("subir" + id_doc).classList.add("d-none");
      }
    });
  }

  for (let enviar of botones_envio) {
    enviar.addEventListener("click", async (e) => {
      e.preventDefault();
      //Toma los archivos cargados y los envia a storage
      enviar.disabled = true;
      let parent = e.target.parentNode;
      let id_doc = parent.getAttribute("data-id_guia"); // idGuia
      let relacion_envio = document.getElementById(
        "cargar-relacion-envio" + id_doc
      );
      let guias = document.getElementById("cargar-guias" + id_doc);
      let actualizar_guia = document.getElementById(
        "actualizar-num-guia" + id_doc
      );
      let id_user = parent.getAttribute("data-user"); // IdUser
      let numero_guias = parent.getAttribute("data-guias").split(","); //IdHeka
      let nombre_usuario = parent.getAttribute("data-nombre");
      let nombre_documento =
        numero_guias[0] +
        (numero_guias.length > 1
          ? "_" + numero_guias[numero_guias.length - 1]
          : "");
      let nombre_guias = "Guias" + nombre_documento;
      let nombre_relacion = "Relacion" + nombre_documento;

      const hasDocument = await firebase
        .firestore()
        .collection("documentos")
        .doc(id_doc)
        .get()
        .then((doc) => doc.data().nombre_relacion || doc.data().nombre_guias);

      let continuar = true;
      let actualizacionCompletada = true;

      if (hasDocument) {
        await Swal.fire({
          icon: "warning",
          title: "¿Este documento ya tiene archivos cargados!",
          text: "Se ha detectado archivos en este documentos, recuerde que al subir un documento, sutituirá el anterior del mismo. ¿Desea continuar?",
          showCancelButton: true,
          cancelButtonText: "¡No!, perdón",
          confirmButtonText: "Si, sustituir 😎",
        }).then((response) => {
          if (!response.isConfirmed) {
            continuar = false;
          }
        });
      }

      if (!continuar) {
        return (enviar.disabled = false);
      }

      console.log(relacion_envio.files[0]);
      console.log(guias.files[0]);
      console.log(numero_guias);
      console.log(nombre_documento);

      var storageUser = firebase
        .storage()
        .ref()
        .child(id_user + "/" + id_doc);
      let guias_enviadas, relacion_enviada;
      //Sube los documentos a Storage y coloca el indice de busqueda en firestore().documentos
      // .then(async (res)=>{

      // actualizacionCompletada = await res
      // if (true) {
        if (relacion_envio.files[0]) {
          relacion_enviada = await storageUser
          .child(nombre_relacion + ".pdf")
          .put(relacion_envio.files[0])
          .then((querySnapshot) => {
            firebase.firestore().collection("documentos").doc(id_doc).update({
              descargar_relacion_envio: true,
              nombre_relacion,
            });
            return true;
          });
      }
      console.log("oka");
      if (guias.files[0]) {
        console.log("ok");
        guias_enviadas = await storageUser
          .child(nombre_guias + ".pdf")
          .put(guias.files[0])
          .then((querySnapshot) => {
            firebase.firestore().collection("documentos").doc(id_doc).update({
              descargar_guias: true,
              nombre_guias,
              important: !relacion_enviada,
            });
            return true;
          });
      }

      if (actualizar_guia.files[0]) {
          actualizarNumGuia(id_doc, id_user, numero_guias);
      }

      if (guias_enviadas || relacion_enviada) {
        Swal.fire({
          icon: "success",
          title: "Documento cargado con éxito",
          text: "¿Deseas eliminar la notificación?",
          showCancelButton: true,
          cancelButtonText: "no, gracias",
          confirmButtonText: "si, por favor",
        }).then((response) => {
          if (response.isConfirmed) {
            db.collection("notificaciones")
              .where("guias", "array-contains", numero_guias[0])
              .get()
              .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                  if (doc.data().visible_admin) {
                    doc.ref.delete();
                  }
                });
              });
          }
        });

        // apartado que será utilizado para cuando todos los usuarios tengan guías automáticas
        // firebase.firestore().collection("notificaciones").add({
        //     mensaje: `Se ha cargado un documento con las guias: ${numero_guias} a su cuenta.`,
        //     fecha: genFecha(),
        //     guias: numero_guias,
        //     user_id: id_user,
        //     visible_user: true,
        //     timeline: new Date().getTime(),
        //     type: "documento",
        //     important
        // })
        // }
        // })
        // .catch((res)=>{
        //   console.log(res + "hola peteeee")
        //   actualizacionCompletada = res
        // })
      }

      enviar.disabled = false;
    });
  }
}

//Similar a historial de Guias, carga los documentos al usuario por fecha.
function actualizarHistorialDeDocumentos(timeline) {
  // $('#tabla_documentos').DataTable().destroy();
  $("#btn-historial-docs").html(`<span class="spinner-border
    spinner-border-sm" role="status" aria-hidden="true"></span>
    Cargando...`);
  if (user_id) {
    let fecha_inicio =
        timeline ||
        Date.parse($("#docs-fecha-inicio").val().replace(/\-/g, "/")),
      fecha_final =
        timeline ||
        Date.parse($("#docs-fecha-final").val().replace(/\-/g, "/"));
    var reference = firebase
      .firestore()
      .collection("documentos")
      .where(
        ControlUsuario.esPuntoEnvio ? "id_punto" : "id_user",
        "==",
        localStorage.user_id
      )
      .orderBy("timeline", "desc")
      .startAt(fecha_final + 8.64e7)
      .endAt(fecha_inicio);

    reference
      .get()
      .then((querySnapshot) => {
        var tabla = [];
        console.log(localStorage.user_id);
        if (document.getElementById("body-documentos")) {
          inHTML("body-documentos", "");
        }

        //query que me carga la información en la tabla
        querySnapshot.forEach((doc) => {
          // tabla.push(mostrarDocumentosUsuario(doc.id, doc.data()));
          //PRimero convertimos el string devuelto en un nodo de html con parser String, para poder utilizar la función append
          const htmlDocConverted = new DOMParser().parseFromString(
            mostrarDocumentosUsuario(doc.id, doc.data()),
            "text/html"
          ).body.firstChild;

          //Utilizamos el append, ya que de otra manera los oidores de enventos no funcionan, si no para el último elemento
          $("#body-documentos").append(htmlDocConverted);
          const id_descargar_guia = "#boton-descargar-guias";
          const id_descargar_relacion = "#boton-descargar-relacion_envio";
          const btn_descarga_guia = document.querySelector(
            id_descargar_guia + doc.id
          );
          const btn_descarga_relacion = document.querySelector(
            id_descargar_relacion + doc.id
          );

          const documentoReciente = () => doc;

          //funcionalidad de botones para descargar guias y relaciones
          firebase
            .firestore()
            .collection("documentos")
            .doc(doc.id)
            .onSnapshot((row) => {
              if (row.data().descargar_guias) {
                $(id_descargar_guia + row.id).prop("disabled", false);
              }
              if (row.data().descargar_relacion_envio) {
                $(id_descargar_relacion + row.id).prop("disabled", false);
              }
              doc = row;
            });

          btn_descarga_guia.addEventListener("click", async (e) => {
            e.target.innerHTML =
              "<span class='spinner-border spinner-border-sm'></span> Cargando...";
            e.target.setAttribute("disabled", true);
            const docActualizado = documentoReciente();
            await descargarStickerGuias(docActualizado);
            e.target.innerHTML = "Descargar Guías";
            e.target.removeAttribute("disabled");
          });

          btn_descarga_relacion.addEventListener("click", (e) => {
            e.target.innerHTML =
              "<span class='spinner-border spinner-border-sm'></span> Cargando...";
            e.target.setAttribute("disabled", true);
            descargarManifiesto(doc);
            e.target.innerHTML = "Descargar Manifiesto";
            e.target.removeAttribute("disabled");
          });



          document
            .getElementById("boton-generar-rotulo" + doc.id)
            .addEventListener("click", function () {
              if (datos_usuario.type == "NATURAL-FLEXII") {
                generarGuiaFlexii(
                  this.parentNode.parentNode
                    .getAttribute("data-guias")
                    .split(",")
                );
              } else {
                generarRotulo(
                  this.parentNode.parentNode
                    .getAttribute("data-guias")
                    .split(",")
                );
              }
            });
        });



        var contarExistencia = 0;
        for (let i = tabla.length - 1; i >= 0; i--) {
          if (document.getElementById("body-documentos")) {
            printHTML("body-documentos", tabla[i]);
          }
          contarExistencia++;
        }

        if (contarExistencia) {
          if (document.getElementById("historial-docs")) {
            document.getElementById("historial-docs").style.display = "none";
          }
          if (document.getElementById("nohaydatosHistorialdocumentos")) {
            document.getElementById(
              "nohaydatosHistorialdocumentos"
            ).style.display = "block";
            location.href = "#nohaydatosHistorialdocumentos";
          }
        } else {
          if (document.getElementById("historial-docs")) {
            document.getElementById("historial-docs").style.display = "block";
          }
          if (document.getElementById("nohaydatosHistorialdocumentos")) {
            document.getElementById(
              "nohaydatosHistorialdocumentos"
            ).style.display = "none";
          }
          // $(document).ready( function () {
          //   $('#tabla_documentos').DataTable();
          // });
        }
      })
      .then(() => {
        let view_guide = document.querySelectorAll('[data-mostrar="texto"]');
        for (let element of view_guide) {
          element.addEventListener("click", () => {
            element.classList.toggle("text-truncate");
            element.style.cursor = "zoom-out";
            if (element.classList.contains("text-truncate"))
              element.style.cursor = "zoom-in";
          });
        }
        $("#btn-historial-docs").html("Buscar");
      });
  }
}

//Función que descarga todos los documentos cargados
function descargarDocumentos(id_doc) {
  firebase
    .firestore()
    .collection("documentos")
    .doc(id_doc)
    .get()
    .then((doc) => {
      if (doc.exists) {
        descargarStickerGuias(doc);

        descargarManifiesto(doc);
      }
    });
}

// funcion que, dependiendo de las situaciones abre una pestaña para mostrarme el manifiesto
// Recive como parametro el doc devuelto por firebase
function descargarManifiesto(doc) {
  let nombre_relacion = doc.data().nombre_relacion
    ? doc.data().nombre_relacion
    : "relacion envio" + doc.data().guias.toString();
  if (doc.data().nombre_relacion) {
    firebase
      .storage()
      .ref()
      .child(doc.data().id_user + "/" + doc.id + "/" + nombre_relacion + ".pdf")
      .getDownloadURL()
      .then((url) => {
        console.log(url);
        window.open(url, "_blank");
      });
  } else if (doc.data().base64Manifiesto) {
    let base64 = doc.data().base64Manifiesto;
    openPdfFromBase64(base64);
  } else if (
    ["INTERRAPIDISIMO", "ENVIA", "COORDINADORA"].includes(
      doc.data().transportadora
    )
  ) {
    Swal.fire({
      icon: "info",
      text: 'Para descargar los manifiestos de inter rapidísimo, coordinadora o envía, debe ingresar a "Manifiestos", buscar filtrando por fecha, seleccionar la transportadora y las guías que desea gestionar para crearlo.',
    });
  } else if (doc.data().nro_manifiesto) {
    const idEmpresa = doc.data().idEmpresa || 0;
    window.open(
      "/aveo/imprimirManifiesto/" +
        doc.data().nro_manifiesto +
        "?idEmpresa=" +
        idEmpresa,
      "_blank"
    );
  } else {
    doc.ref
      .collection("manifiestoSegmentado")
      .get()
      .then((querySnapshot) => {
        if (!querySnapshot.size)
          return alert("Lo siento, no consigo una relación que descargar.");

        let base64 = "";

        querySnapshot.forEach((doc) => {
          base64 += doc.data().segmento;
        });

        openPdfFromBase64(base64);
      });
  }
}

// funcion que, dependiendo de las situaciones descarga el sticker de guia
// Recive como parametro el doc devuelto por firebase
async function descargarStickerGuias(doc) {
  let nombre_guias = doc.data().nombre_guias
    ? doc.data().nombre_guias
    : "guias" + doc.data().guias.toString();

  if (doc.data().nombre_guias) {
    firebase
      .storage()
      .ref()
      .child(doc.data().id_user + "/" + doc.id + "/" + nombre_guias + ".pdf")
      .getDownloadURL()
      .then((url) => {
        console.log(url);
        window.open(url, "_blank");
      });
  } else if (doc.data().base64Guias) {
    let base64 = doc.data().base64Guias;
    openPdfFromBase64(base64);
  } else {
    const guias = doc.data().guias;

    const pdfBase64 = await buscarGuiasParaDescargarStickers(guias);
    if (!pdfBase64) return;

    nombre_guias = "Guias " + indexarGuias(guias);

    const storagePath =
      doc.data().id_user + "/" + doc.id + "/" + nombre_guias + ".pdf";
    let cargarGuiasStorage = await guardarBase64ToStorage(
      pdfBase64,
      storagePath
    );

    if (cargarGuiasStorage) {
      doc.ref.update({ nombre_guias });
    }
  }
}

async function buscarGuiasParaDescargarStickers(guias) {
  const pdfDoc = await PDFLib.PDFDocument.create();
  for await (let guia of guias) {
    let deletable = false;
    await firebase
      .firestore()
      .collection("base64StickerGuias")
      .doc(guia)
      .collection("guiaSegmentada")
      .orderBy("index")
      .get()
      .then(async (querySnapshot) => {
        let base64 = "";
        console.log(querySnapshot.size);
        querySnapshot.forEach((doc) => {
          base64 += doc.data().segmento;
        });

        const page = await PDFLib.PDFDocument.load(base64);
        const cantPages = page.getPages().length;

        const [existingPage] = await pdfDoc.copyPages(page, [0]);
        await pdfDoc.addPage(existingPage);

        deletable = false;
      })
      .catch(() => {
        console.log("la guías numero " + guia + " no fue encontrada");
      });

    if (deletable === false) {
      usuarioDoc.collection("guias").doc(guia).update({ deletable });
    }
  }

  const pdfBase64 = await pdfDoc.saveAsBase64();
  openPdfFromBase64(pdfBase64);

  return pdfBase64;
}

function actualizarNumGuia(id_doc, id_user, numero_guias) {
  return new Promise((resolve, reject) => {
    let data = new FormData(
      document.getElementById("form-estado-numguia" + id_doc)
    );
    if (!data) resolve(true);
    console.log(data.get("documento"));
    fetch("/excel_to_json", {
      method: "POST",
      body: data,
    })
      .then(async (res) => {
        if (!res.ok) {
          console.log(res);
          throw Error(
            "Lo sentimos, no pudimos cargar su documento, reviselo y vuelvalo a subir"
          );
        }
        const datos = await res.json();
        const datosFiltrados = [];
        console.log(datos);

        for (let e of numero_guias) {
          const guiaEncontrada = datos.filter(
            (data) =>
              data.IdCliente == e &&
              data["Número de Guia"] &&
              data["Estado Envío"]
          );
          if (!guiaEncontrada.length) {
            throw Error(
              "No se encontro la informacion requerida, revisa el archivo, recarga la pagina y repite el proceso"
            );
          } else datosFiltrados.push(guiaEncontrada[0]);
        }

        datosFiltrados.forEach(async (data) => {
          const idHeka = data["IdCliente"].toString();
          await firebase
            .firestore()
            .collection("usuarios")
            .doc(id_user)
            .collection("guias")
            .doc(idHeka)
            .update({
              numeroGuia: data["Número de Guia"].toString(),
              estado: data["Estado Envío"],
              seguimiento_finalizado: false,
            });
        });
        Swal.fire({
          icon: "success",
          title: "Numero de guia actualizado correctamente",
          showConfirmButton: false,
          timer: 1500,
        });
        resolve(true);
      })
      .catch((err) => {
        Swal.fire({
          icon: "error",
          title: "Error al actualizar guia",
          text: err.message,
        });
        reject(false);
      });
  });
}

function actualizarEstado() {
  document.querySelector("#cargador-actualizador").classList.remove("d-none");
  document.querySelector("#resultado-actualizador").innerHTML = "";
  let data = new FormData(document.getElementById("form-estado"));
  console.log(data);
  console.log(data.get("documento"));
  fetch("/excel_to_json", {
    method: "POST",
    body: data,
  })
    .then((res) => {
      if (!res.ok) {
        console.log(res);
        throw Error(
          "Lo sentimos, no pudimos cargar su documento, reviselo y vuelvalo a subir"
        );
      }

      res
        .json()
        .then(async (datos) => {
          let res = "";
          if (datos.length == 0) {
            res = "vacio";
          }

          let total_datos = datos.length;
          let actualizadas = new Array();
          let regresiveCounter = datos.length;
          $("#cargador-actualizador").find("span").text(regresiveCounter);

          for await (let dato of datos) {
            let x = {
              numero_guia_servientrega: dato["Número de Guia"],
              fecha_envio: dato["Fecha de Envio"],
              producto: dato["Producto"],
              fecha_imp_envio: dato["Fecha Imp. Envio"],
              tipo_trayecto: dato["Tipo Trayecto"],
              valor_total_declarado: dato["Valor Total Declarado"],
              valor_flete: dato["Valor Flete"],
              valor_sobreflete: dato["Valor SobreFlete"],
              valor_liquidado: dato["Valor Liquidado"],
              id_guia: dato["Campo Personalizado1"] || dato["IdCliente"],
              estado_envio: dato["Estado Envío"],
              mensaje_mov: dato["Mensaje Mov"],
              fecha_ult_mov: dato["Fecha Ult Mov"],
              nombre_centro_costo: dato["Nombre Centro Costo"],
            };
            if (x.id_guia && x.numero_guia_servientrega) {
              const id = x.id_guia.toString();
              const numeroGuia = x.numero_guia_servientrega.toString();
              await firebase
                .firestore()
                .collectionGroup("guias")
                .where("id_heka", "==", id)
                .get()
                .then((querySnapshot) => {
                  // let guia;
                  querySnapshot.forEach(async (doc) => {
                    try {
                      const guia = firebase
                        .firestore()
                        .doc(doc.ref.path)
                        .update({
                          numeroGuia,
                          estado: x.estado_envio,
                          seguimiento_finalizado: false,
                        })
                        .then(() => {
                          // console.log(id + " Actualizada exitósamente");
                          return id;
                        });
                      actualizadas.push(guia);
                    } catch (error) {
                      document.querySelector(
                        "#resultado-actualizador"
                      ).innerHTML += `
                                    <li>
                                        No se pudo actualizar la guía ${id} en la fila ${
                        total_datos - regresiveCounter + 2
                      }
                                        revise que tenga un estado que actualizar
                                    </li>
                                `;
                      console.log("No se pudo actualizar la guía: " + id);
                      console.log(error);
                    }
                  });
                });
              // console.log(x.id_guia, new Date().getTime())
            } else {
              $("#resultado-actualizador").append(`
                        <li>
                            No sé a que guía actualizar o no hay un número de guía en la fila ${
                              total_datos - regresiveCounter + 2
                            }
                        </li>
                    `);
            }
            regresiveCounter--;
            $("#cargador-actualizador").find("span").text(regresiveCounter);
          }

          actualizadas = await Promise.all(actualizadas);
          return { total_datos, actualizadas };
        })
        .then((r) => {
          console.log(r);
          if (r == "vacio") {
            avisar(
              "¡Error!",
              "El documento está vacío, por favor verifique que el formato ingresado es un formato actual de excel, preferiblemente .xlsx",
              "advertencia"
            );
          } else if (r == "falta id") {
            avisar(
              "Algo Salió mal",
              "hubo un error en alguno de los documentos, es posible que no todos se hayan enviado correctamente",
              "aviso"
            );
          } else {
            console.log(r);
            avisar(
              "Actualizando Documentos",
              "Se han actualizado " +
                r.actualizadas.length +
                " Guías de " +
                r.total_datos +
                " Registradas.",
              "",
              false,
              20000
            );
          }

          document
            .querySelector("#cargador-actualizador")
            .classList.add("d-none");
        });
    })
    .catch((err) => {
      avisar("Algo salió mal", err, "advertencia");
      document.querySelector("#cargador-actualizador").classList.add("d-none");
    });
}

async function executeUtils(e) {
  e.preventDefault();
  document.querySelector("#cargador-utilidades").classList.remove("d-none");
  const resultado = $("#resultado-utilidades");
  resultado.html();
  let data = new FormData(document.getElementById("form-utilidades"));
  console.log(data);
  console.log(data.get("documento"));
  const arrData = await fetch("/excel_to_json", {
    method: "POST",
    body: data,
  })
    .then((res) => res.json())
    .catch((err) => {
      avisar("Algo salió mal", err, "advertencia");
      document.querySelector("#cargador-utilidades").classList.add("d-none");
    });

  let regresiveCounter = arrData.length;

  for await (let data of arrData) {
    const res = await fetch("/inter/utilidades/" + data.numeroGuia).then(
      (res) => res.json()
    );

    if (res.ok) {
      let respuesta;
      const querySnapshot = await firebase
        .firestore()
        .collectionGroup("guias")
        .where("id_heka", "==", res.id_heka)
        .get()
        .then((q) => q);

      querySnapshot.forEach(async (doc) => {
        console.log(doc.data());
        try {
          await doc.ref.update({ numeroGuia: res.numeroGuia });

          respuesta = `<li>Se ha actualizado el número de guía ${res.numeroGuia}
                    en la guia ${doc.id} del usuario con centro de costo ${
            doc.data().centro_de_costo
          }</li>`;
        } catch (e) {
          respuesta = `<li class="text-danger">Hubo un error (${e.message}) al actualizar
                    el número de guía ${res.numeroGuia} con id ${doc.id}</li>`;
        }
        resultado.append(respuesta);
      });

      if (!respuesta) {
        respuesta = `<li class="text-danger">No se consiguió el id ${res.id}
                de la guía ${res.numeroGuia}</li>`;
        resultado.append(respuesta);
      }
    } else {
      respuesta = `<li class="text-danger">Erorr en el servidor: ${res.message}</li>`;
      resultado.append(respuesta);
    }

    regresiveCounter--;
    $("#cargador-utilidades").find("span").text(regresiveCounter);
  }

  document.querySelector("#cargador-utilidades").classList.add("d-none");
}

//guardará un arreglo y funcionará cun un listener
class ArregloInteractivo {
  constructor() {
    this.guias = new Array();
  }

  set push(val) {
    if (!this.guias.includes(val)) {
      this.guias.push(val);
    }
  }

  set quit(val) {
    const index = this.guias.indexOf(val);
    this.guias.splice(index, 1);
  }

  init() {
    console.log("se Inició la función con =>", this.guias);
  }
}

function revisarNotificaciones() {
  let notificador = document.getElementById("notificaciones");
  let audio = document.createElement("audio");
  audio.innerHTML = `<source type="audio/mpeg" src="./recursos/notificacion.mp3">`;
  let busqueda = localStorage.user_id,
    operador = "==",
    buscador = "user_id",
    novedades;
  let guiasNovedad;

  if (administracion) {
    busqueda = true;
    operador = "==";
    buscador = "visible_admin";
    novedades = document.getElementById("notificaciones-novedades");
    novedades.addEventListener("click", (e) => {
      let badge = novedades.querySelector("span");
      badge.textContent = 0;
      badge.classList.add("d-none");
    });

    guiasNovedad = new ArregloInteractivo();
    document.querySelector("#ver-novedades").addEventListener("click", () => {
      location.href = "#novedades";
      revisarMovimientosGuias(true, null, null, guiasNovedad.guias);
    });
  }
  notificador.addEventListener("click", (e) => {
    let badge = notificador.querySelector("span");
    badge.textContent = 0;
    badge.classList.add("d-none");
  });

  firebase
    .firestore()
    .collection("notificaciones")
    .orderBy("timeline")
    .where(buscador, operador, busqueda)
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        let notification = change.doc.data();
        let identificador = change.doc.id;
        let mostrador, contador;
        if (
          (!administracion &&
            notification.visible_user &&
            notification.user_id == busqueda) ||
          (administracion && notification.visible_admin)
        ) {
          if (change.type == "added" || change.type == "modified") {
            audio.play().catch(() => {});
            let notificacionNormal = false;
            if (notification.type == "novedad") {
              contador = novedades.querySelector("span");
              contador.classList.remove("d-none");
              contador.innerHTML = parseInt(contador.textContent) + 1;
              mostrador = document.getElementById("mostrador-info-novedades");
              guiasNovedad.push = notification.guia;
              notificacionNormal = true;
            } else if (notification.type === "estatica") {
              mostrarNotificacionEstaticaUsuario(notification, identificador);
            } else if (
              !notification.type ||
              notification.type === "documento"
            ) {
              contador = notificador.querySelector("span");
              contador.classList.remove("d-none");
              contador.innerHTML = parseInt(contador.textContent) + 1;
              mostrador = document.getElementById("mostrador-notificaciones");
              notificacionNormal = true;
            }

            if (parseInt(contador.textContent) > 9) {
              contador.innerHTML = 9 + "+".sup();
            }

            if (notificacionNormal)
              mostrador.insertBefore(
                mostrarNotificacion(
                  notification,
                  notification.type,
                  identificador
                ),
                mostrador.firstChild
              );
          } else if (change.type == "removed") {
            if (document.querySelector("#notificacion-" + identificador)) {
              if (notification.type == "novedad") {
                contador = novedades.querySelector("span");
                contador.innerHTML =
                  parseInt(contador.textContent) <= 0
                    ? 0
                    : parseInt(contador.textContent) - 1;
                guiasNovedad.quit = notification.guia;
              } else {
                contador = notificador.querySelector("span");
                contador.innerHTML =
                  parseInt(contador.textContent) <= 0
                    ? 0
                    : parseInt(contador.textContent) - 1;
              }
              $(".notificacion-" + identificador).remove();
            }
          }
        } else {
          $(".notificacion-" + identificador).remove();
        }
      });
    });

  if (!administracion) {
    manejarNotificacionesMasivas();
  }
}

async function manejarNotificacionesMasivas() {
  const manejarInformacion = querySnapshot => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if(!data.active) return;
      // return;

      if (data.endDate < new Date().getTime()) {
        eliminarNotificacionDinamica(doc.id);
      }

      if (data.type === "estatica") {
        mostrarNotificacionEstaticaUsuario(data, doc.id);
      } else if(data.type === "alerta") {
        data.id = doc.id;
        listaNotificacionesAlerta.push(data);

        if(!data.ubicacion || "#"+data.ubicacion === location.hash)
          mostrarNotificacionAlertaUsuario(data, doc.id);
      }
    });
  }

  const ref = db.collection("centro_notificaciones")
  .orderBy("startDate")
  .endAt(new Date().getTime());

  ref.where("isGlobal", "==", true)
  .get()
  .then(manejarInformacion);

  ref.where("usuarios", "array-contains", user_id)
  .get().then(manejarInformacion);
}

function eliminarNotificaciones() {
  let visible = administracion ? "visible_admin" : "visible_user";
  firebase
    .firestore()
    .collection("notificaciones")
    .where(visible, "==", true)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        let notificacion = firebase
          .firestore()
          .collection("notificaciones")
          .doc(doc.id);
        if (
          (administracion && doc.data().type == "documento") ||
          doc.data().user_id == user_id
        ) {
          notificacion.delete();
        }
      });
    });
}

async function descargarHistorialGuias() {
  avisar("Solicitud Recibida", "Procesando...", "aviso");
  let fechaI = new Date(value("guias-fechaI-modal")).getTime();
  let fechaF = new Date(value("guias-fechaF-modal")).getTime();

  avisar(
    "Solicitud Procesada",
    "Espere un momento, en breve iniciaremos con su descarga"
  );

  let guias = await firebase
    .firestore()
    .collectionGroup("guias")
    .orderBy("timeline")
    .startAt(new Date(fechaI).getTime())
    .endAt(new Date(fechaF).getTime() + 8.64e7)
    .get()
    .then((querySnapshot) => {
      let res = new Array();
      console.log(querySnapshot.size);
      querySnapshot.forEach((doc) => {
        res.push(doc.data());
      });
      return res;
    });

  guias.sort((a, b) => {
    if (parseInt(a.id_heka) > parseInt(b.id_heka)) {
      return 1;
    } else {
      return -1;
    }
  });
  console.log(guias);
  console.log(guias.length);

  descargarInformeGuias(
    guias,
    guias[0].id_heka + "-" + guias[guias.length - 1].id_heka
  );
}

function cargarNovedades() {
  document.querySelector("#cargador-novedades").classList.remove("d-none");
  let data = new FormData(document.getElementById("form-novedades"));
  console.log(data);
  console.log(data.get("documento"));
  fetch("/excel_to_json", {
    method: "POST",
    body: data,
  })
    .then((res) => {
      if (!res.ok) {
        throw Error(
          "Lo siento, No pudimos cargar sus Novedades, por favor, revise su documento e intent de nuevo"
        );
      }
      res.json().then((datos) => {
        let novedades = [];
        for (let data of datos) {
          if (data.NOVEDAD && data["NUMERO DOCUMENTO CLIENTE4"]) {
            let novedad = {
              guia: data["NUMERO GUIA"],
              fecha_envio: data["FECHA ENVIO"],
              id_heka: data["NUMERO DOCUMENTO CLIENTE4"],
              centro_de_costo: data["CENTRO COSTO CLIENTE"] || "SCC",
              novedades: [data["NOVEDAD"]],
              fechas_novedades: [data["FECHA NOVEDAD"]],
            };

            let i = 1;
            while (i <= 3) {
              if (data["NOVEDAD " + i]) {
                novedad.novedades.push(data["NOVEDAD " + i]);
                novedad.fechas_novedades.push(data["FECHA NOVEDAD " + i]);
              }

              i++;
            }

            novedades.push(novedad);
            // firebase.firestore().collection("novedades").doc(novedad.guia.toString()).set(novedad);
          }
        }
        console.log(novedades);
        document.querySelector("#cargador-novedades").classList.add("d-none");
      });
    })
    .catch((err) => {
      avisar("Algo salió mal", err, "advertencia");
      document.querySelector("#cargador-novedades").classList.add("d-none");
    });
}

//función que me revisa los movimientos de las guías
function revisarMovimientosGuias(admin, seguimiento, id_heka, guia) {
  novedadesExcelData = [];

  let filtro = true,
    toggle = "==",
    buscador = "enNovedad";
  const cargadorClass = document.getElementById("cargador-novedades").classList;
  cargadorClass.remove("d-none");

  if (($("#filtrado-novedades-guias").val() || guia) && admin) {
    let filtrado = guia || $("#filtrado-novedades-guias").val().split(",");
    if (typeof filtrado == "object") {
      filtrado.forEach((v, i) => {
        firebase
          .firestore()
          .collectionGroup("estadoGuias")
          .where("numeroGuia", "==", v.trim())
          .get()
          .then((querySnapshot) => {
            querySnapshot.size == 0
              ? $("#cargador-novedades").addClass("d-none")
              : "";
            querySnapshot.forEach((doc) => {
              let path = doc.ref.path.split("/");
              let data = doc.data();
              consultarGuiaFb(
                path[1],
                doc.id,
                data,
                "Consulta Personalizada",
                i + 1,
                filtrado.length
              );
            });
          });
      });
    } else {
      firebase
        .firestore()
        .collectionGroup("estadoGuias")
        .where("numeroGuia", "==", filtrado)
        .get()
        .then((querySnapshot) => {
          querySnapshot.size == 0
            ? $("#cargador-novedades").addClass("d-none")
            : "";
          querySnapshot.forEach((doc) => {
            let path = doc.ref.path.split("/");
            let data = doc.data();
            consultarGuiaFb(path[1], doc.id, data, "Solucionar Novedad");
          });
        });
    }
  } else if (admin) {
    if ($("#filtrado-novedades-usuario").val()) {
      filtro = $("#filtrado-novedades-usuario").val();
      toggle = "==";
      buscador = "centro_de_costo";
    }

    firebase
      .firestore()
      .collectionGroup("estadoGuias")
      .where(buscador, toggle, filtro)
      .get()
      .then((querySnapshot) => {
        let contador = 0;
        let size = querySnapshot.size;
        querySnapshot.forEach((doc) => {
          let path = doc.ref.path.split("/");
          let dato = doc.data();
          contador++;
          consultarGuiaFb(
            path[1],
            doc.id,
            dato,
            dato.centro_de_costo,
            contador,
            size
          );
          // console.log(doc.data());
        });
      });
  } else {
    if (
      (document.getElementById("visor_novedades").innerHTML == "" &&
        seguimiento == "once") ||
      !seguimiento
    ) {
      firebase
        .firestore()
        .collection("usuarios")
        .doc(localStorage.user_id)
        .collection("estadoGuias")
        // .orderBy("estado")
        .where("mostrar_usuario", "==", true)
        // .limit(10)
        .get()
        .then((querySnapshot) => {
          let contador = 0;
          let size = querySnapshot.size;
          console.log(size);
          if (!querySnapshot.size) {
            return cargadorClass.add("d-none");
          }
          $("#visor_novedades").html("");
          const guias_actualizadas = revisarTiempoGuiasActualizadas();
          querySnapshot.forEach((doc) => {
            let dato = doc.data();
            contador++;
            console.log(dato);
            consultarGuiaFb(
              user_id,
              doc.id,
              dato,
              "Posibles Novedades",
              contador,
              size
            );
            if (!guias_actualizadas) actualizarEstadoGuia(dato.numeroGuia);
          });

          actualizarEstadosEnNovedad();
        });
    } else {
      cargadorClass.add("d-none");
    }
  }
}

function revisarNovedades(transportadora) {
  novedadesExcelData = [];

  const cargadorClass = document.getElementById("cargador-novedades").classList;
  cargadorClass.remove("d-none");

  const usuarios = new Set();
  firebase
    .firestore()
    .collectionGroup("estadoGuias")
    .where("enNovedad", "==", true)
    .where("transportadora", "==", transportadora)
    // .limit(10)
    .get()
    .then((q) => {
      let contador = 0;
      let size = q.size;
      console.log(size);

      if (!size) cargadorClass.add("d-none");

      q.forEach((d) => {
        let path = d.ref.path.split("/");
        let dato = d.data();
        contador++;

        usuarios.add(path[1]);

        consultarGuiaFb(
          path[1],
          d.id,
          dato,
          dato.centro_de_costo,
          contador,
          size
        );
      });

      if (revisarTiempoGuiasActualizadas()) return;

      usuarios.forEach(actualizarEstadosEnNovedadUsuario);

      localStorage.last_update_novedad = new Date();
    });
}

async function actualizarEstadoGuia(numeroGuia, id_user = user_id, wait) {
  console.log(numeroGuia, id_user);
  return await fetch("/procesos/actualizarEstados/numeroGuia", {
    method: "POST",
    headers: { "Content-Type": "Application/json" },
    body: JSON.stringify({ user_id: id_user, argumento: numeroGuia, wait }),
  }).then((d) => d.json());
}

function revisarTiempoGuiasActualizadas() {
  const lastUpdt = localStorage.last_update_novedad;
  const actual = new Date();
  // const maxTime = 2 * 60000;
  const maxTime = 3 * 36e5;
  return lastUpdt && actual.getTime() - new Date(lastUpdt).getTime() < maxTime;
}

function actualizarEstadosEnNovedad() {
  const actual = new Date();
  if (revisarTiempoGuiasActualizadas()) return;

  console.log("Actualizando novedades");

  actualizarEstadosEnNovedadUsuario(user_id);

  localStorage.last_update_novedad = actual;
}

function actualizarEstadosEnNovedadUsuario(user_id) {
  fetch("/procesos/actualizarEstados/novedad", {
    method: "POST",
    headers: { "Content-Type": "Application/json" },
    body: JSON.stringify({ user_id }),
  });
}

function revisarGuiaUser(id_heka) {
  const cargadorClass = document.getElementById("cargador-novedades").classList;
  cargadorClass.remove("d-none");

  usuarioDoc
    .collection("guias")
    .doc(id_heka)
    .get()
    .then((doc) => {
      if (doc.exists) {
        console.log(id_heka);
        consultarEstadoGuiasParaUsuario(doc.data(), id_heka);
      }
      cargadorClass.add("d-none");
    });
}

document
  .getElementById("btn-revisar-novedades")
  .addEventListener("click", (e) => {
    e.preventDefault();
    const novedades_transportadora = $("#activador_busq_novedades").val();
    if (administracion && novedades_transportadora) {
      console.log("Buscando novedades");
      revisarNovedades(novedades_transportadora);
    } else {
      if (
        administracion &&
        !$("#filtrado-novedades-guias").val() &&
        !$("#filtrado-novedades-usuario").val()
      ) {
        swal.fire(
          "No permitido",
          "Recuerda por favor filtrar por guía o por usuario para esta opción",
          "error"
        );
        return;
      }

      console.log("Busqueda natural");
      revisarMovimientosGuias(administracion);
    }
  });

let inputExcelDoc = document.getElementById("excelDocSoluciones");
let excelDocSoluciones = document.getElementById("descargarExcelNovedades");
let excelDocSolucionesBoton = document.getElementById(
  "excelDocSolucionesBoton"
);

inputExcelDoc?.addEventListener("change", (e) => {
  let label = document.getElementById("excelDocSolucionesLabel");
  label.innerHTML = e.target.files[0].name
});

excelDocSoluciones?.addEventListener("click", (e) => {
  descargarExcelNovedades();
});

excelDocSolucionesBoton?.addEventListener("click", async (e) => {
  e.preventDefault();
  subirExcelNovedades();
});

$("#btn-vaciar-consulta").click(() => {
  novedadesExcelData = [];
  $("#visor_novedades").html("");
});

//No está en funcionamiento, pero puede servir
function consultarGuia(
  numGuia,
  usuario = "Consulta Personalizada",
  contador,
  totalConsultas
) {
  let data = { guia: numGuia };
  fetch("/servientrega/consultarGuia", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      let parser = new DOMParser();
      data = parser.parseFromString(data, "application/xml");
      console.log(data.querySelector("ConsultarGuiaResult"));
      if (numGuia) {
        if (data.querySelector("NumGui")) {
          let informacion = {
            fechaEnvio: data.querySelector("FecEnv").textContent,
            numeroGuia: data.querySelector("NumGui").textContent,
            estadoActual: data.querySelector("EstAct").textContent,
            movimientos: [],
          };
          data.querySelectorAll("InformacionMov").forEach((mov) => {
            informacion.movimientos.push({
              movimiento: mov.querySelector("NomMov").textContent,
              fecha: mov.querySelector("FecMov").textContent,
              descripcion: mov.querySelector("DesMov").textContent,
              idViewCliente: mov.querySelector("IdViewCliente").textContent,
              tipoMov: mov.querySelector("TipoMov").textContent,
              DesTipoMov: mov.querySelector("DesTipoMov").textContent,
            });
          });

          // console.log(informacion);
          tablaMovimientosGuias(informacion, usuario);
        } else {
          document.getElementById("visor_novedades").innerHTML += `
                    <p class="border border-danger p-2 m-2">La Guía Número ${numGuia} No fue Encontrada en la base de datos.
                    <br>
                    Por favor, verifique que esté bien escrita</p>
                `;
        }
      }
      if (contador == totalConsultas) {
        document.getElementById("cargador-novedades").classList.add("d-none");
      }
    });
}

// actualizarMovimientoGuia();
function actualizarMovimientoGuia() {
  if (!administracion)
    usuarioDoc
      .collection("guias")
      .where("seguimiento_finalizado", "==", false)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type == "modified") {
            console.log(change.doc.data());
            consultarEstadoGuiasParaUsuario(change.doc.data(), change.doc.id);
          }
        });
      });
}

function consultarEstadoGuiasParaUsuario(data, id) {
  usuarioDoc
    .collection("estadoGuias")
    .doc(id)
    .get()
    .then((doc) => {
      if (doc.exists) {
        // if(doc.data().mostrar_usuario)
        tablaMovimientosGuias(
          doc.data(),
          data,
          "Para revisar",
          id,
          localStorage.user_id
        );
      }
    });
}

function consultarGuiaFb(
  id_user,
  id,
  data,
  usuario = "Movimientos",
  contador,
  total_consulta
) {
  //Cuando Id_user existe, id corresponde a el id_heka, cuando no, corresponde al número de gíia
  if (id_user) {
    firebase
      .firestore()
      .collection("usuarios")
      .doc(id_user)
      .collection("guias")
      .doc(id)
      .get()
      .then((doc) => {
        if (doc.exists) {
          tablaMovimientosGuias(data, doc.data(), usuario, id, id_user);
        }
      })
      .then(() => {
        if (contador == total_consulta) {
          $("#cargador-novedades").addClass("d-none");
          let table = $("#tabla-estadoGuias-" + usuario.replace(/\s/g, ""));

          table = table.DataTable();
        }
      });
  } else {
    firebase
      .firestore()
      .collectionGroup("guias")
      .where("numeroGuia", "==", id)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          let path = doc.ref.path.split("/");
          tablaMovimientosGuias(data, doc.data(), usuario, path[3], path[1]);
        });
      })
      .then(() => {
        if (contador == total_consulta) {
          $("#cargador-novedades").addClass("d-none");
        }
      });
  }
}

function revisarDeudas() {
  $("#cargador-deudas").children().removeClass("d-none");
  $("#visor-deudas").html("");
  firebase
    .firestore()
    .collectionGroup("guias")
    .where("user_debe", ">", 0)
    .get()
    .then((querySnapshot) => {
      let id_users = new Array();
      querySnapshot.forEach((doc) => {
        let data = doc.data();
        mostradorDeudas(data);
        if (id_users.indexOf(data.id_user) == -1) {
          id_users.push(data.id_user);
        }
      });
      id_users.forEach(async (id_user) => {
        let reference = firebase.firestore().collection("usuarios");

        let saldo = await reference
          .doc(id_user)
          .get()
          .then((doc) => {
            if (doc.exists && doc.data().datos_personalizados) {
              return doc.data().datos_personalizados.saldo;
            }
            return "saldo no encontrado";
          });
        consolidadorTotales("#deudas-" + id_user, saldo);
      });
      habilitarSeleccionDeFilasInternas('[data-function="selectAll"]');
      $("#cargador-deudas").children().addClass("d-none");
    });
}

function habilitarSeleccionDeFilasInternas(query) {
  $(query).on("change", function () {
    let table = $(this).parent().parent().next();
    let inpInt = table.find("input");
    let check = $(this).children("input").prop("checked");
    inpInt.each(function () {
      if (!this.disabled) {
        $(this).prop("checked", !check);
        $(this).click();
      }
    });
  });
}

function consolidadorTotales(query, saldo) {
  // let mostradores = new Array();
  let deuda = typeof saldo == "number" ? "$" + convertirMiles(saldo) : saldo;

  let mostrador = [
    ["Actualmente Debe", deuda, "search-dollar"],
    ["Deuda sumada", "", "dollar-sign"],
  ];
  firebase
    .firestore()
    .collection("usuarios")
    .doc(query.replace("#deudas-", ""))
    .onSnapshot((doc) => {
      if (doc.exists && doc.data().datos_personalizados) {
        saldo = doc.data().datos_personalizados.saldo;
        mostrador[0][1] = "$" + convertirMiles(saldo);
      }
    });

  let totalizadores = $(query).find(".totalizador");
  let totalInt = 0;
  totalizadores.each(function (i, e) {
    totalInt += parseInt($(e).text());
  });
  // mostrador[0][1] = "$"+convertirMiles(totalInt);
  mostrador[1][1] = "$" + convertirMiles(totalInt);
  showStatistics("#" + $(query).attr("id"), mostrador, true);

  $(query)
    .find(".takeThis")
    .on("change", function () {
      let parent = $(this)
        .parents()
        .filter(function () {
          return $(this).hasClass("card-body");
        })
        .get();
      let totalizadores = $(parent).find(".totalizador");
      let checks = $(parent).find(".takeThis");
      let checked = $(parent).find(".takeThis:checked");
      // console.log(checks);
      let sumaChecks = 0,
        totalInt = 0;
      checks.each(function (i, check) {
        totalInt += parseInt($(totalizadores[i]).text());
        if ($(check).prop("checked"))
          sumaChecks += parseInt($(totalizadores[i]).text());
      });

      console.log(checked);
      let resto = isNaN(saldo) ? totalInt - sumaChecks : saldo + sumaChecks;
      let detalle_saldado = {
        saldo: saldo + sumaChecks,
        saldo_anterior: saldo,
        actv_credit: true,
        fecha: genFecha(),
        diferencia: sumaChecks,

        //si alguno de estos datos es undefined podría generar error al subirlos
        momento: new Date().getTime(),
        user_id: query.replace("#deudas-", ""),
        guia: "",
        medio: "Administración " + localStorage.user_id,
        type: "CANJEADO",
      };

      let btn_saldar = `<button
        class="btn btn-primary ${isNaN(saldo) ? "disabled" : "saldar"}">
        $${convertirMiles(sumaChecks)}</button>`;

      mostrador[1][1] = "$" + convertirMiles(totalInt);
      mostrador[2] = ["Quedaría", "$" + convertirMiles(resto), "funnel-dollar"];
      mostrador[3] = ["Saldar", btn_saldar, "hand-holding-usd"];
      if (!sumaChecks) {
        mostrador = mostrador.slice(0, 3);
      }
      showStatistics("#" + $(parent).attr("id"), mostrador, true);

      $(parent)
        .find(".saldar")
        .click(async function () {
          this.disabled = true;
          let momento = new Date().getTime();
          let deuda = await saldar(checked, momento);

          if (!deuda[0]) {
            return avisar(
              "¡Error!",
              "Todas la guía seleccionadas tuvieron problemas para ser actualizadas, por favor intente nuevamente",
              "advertencia"
            );
          }
          detalle_saldado.saldo = saldo + deuda[0];
          detalle_saldado.diferencia = deuda[0];
          (detalle_saldado.mensaje =
            "Administración ha saldado $" +
            convertirMiles(deuda[0]) +
            " en " +
            deuda[1] +
            " Guías"),
            console.log(detalle_saldado);
          actualizarSaldo(detalle_saldado);
          avisar(
            "Información",
            "Se Saldó $" +
              convertirMiles(deuda[0]) +
              " en " +
              deuda[1] +
              " Guías. Por favor verifique el saldo del usuario.",
            "aviso"
          );
        });
    });
}

async function saldar(checked, momento_saldado) {
  let deudaGuias = 0;
  let selected_checks = 0;

  for await (let check of checked) {
    check.disabled = true;
    check.checked = false;
    let id_heka = check.getAttribute("data-id_heka");
    let id_user = check.getAttribute("data-id_user");
    let deuda = check.getAttribute("data-deuda");
    try {
      let reference = firebase.firestore().collection("usuarios").doc(id_user);

      let data = await reference
        .collection("guias")
        .doc(id_heka)
        .get()
        .then((doc) => doc.data());

      if (data) {
        // await reference.collection("guiasSaldadas")
        // .doc(id_heka).set(data);

        await reference.collection("guias").doc(id_heka).update({
          user_debe: 0,
          momento_saldado,
          dinero_saldado: deuda,
        });

        deudaGuias += parseInt(deuda);
        selected_checks++;
      }
    } catch (err) {
      console.log(err);
    }
  }
  return [deudaGuias, selected_checks];
}

$("#filter-user-deudas").on("input", function () {
  let valores = $(this).val().replace(/\s/g, "").toLowerCase().split(",");
  let filters = new Array();
  $("[data-filter]").each(function () {
    filters.push($(this).attr("data-filter"));
  });
  for (let filter of filters) {
    $("[data-filter='" + filter + "']").hide();
    for (let inp of valores) {
      if (filter.toLowerCase().indexOf(inp) != -1) {
        $("[data-filter='" + filter + "']").show();
      }
    }
  }
});

$('[href="#novedades"]').click(() => {
  mostrar("novedades");
  document.querySelectorAll(".icon-notificacion-novedad").forEach((i) => {
    i.classList.add("d-none");
  });
});

function revisarGuiasSaldas() {
  $("#cargador-deudas").children().removeClass("d-none");
  usuarioDoc
    .collection("guias")
    .orderBy("momento_saldado")
    .get()
    .then((querySnapshot) => {
      let data = [];
      querySnapshot.forEach((doc) => {
        let info = doc.data();
        info.fecha_saldada = genFecha(info.momento_saldado);
        data.push(info);
      });
      console.log(data);

      $("#visor-deudas").DataTable({
        data: data,
        destroy: true,
        language: {
          url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json",
          emptyTable: "Aún no tienes guías saldadas.",
        },
        lengthMenu: [
          [10, 25, 50, 100, -1],
          [10, 25, 50, 100, "Todos"],
        ],
        columnDefs: [{ className: "cell-border" }],
        columns: [
          { data: "id_heka", title: "# Guía Heka" },
          { data: "fecha", title: "Fecha creación" },
          { data: "fecha_saldada", title: "Fecha Saldada" },
          { data: "type", title: "Tipo Guía" },
          { data: "dinero_saldado", title: "Cant. Saldada" },
        ],
        fixedHeader: { footer: true },
        drawCallback: function (settings) {
          let api = this.api();

          let intVal = function (i) {
            return typeof i === "string"
              ? i.replace(/[\$.]/g, "") * 1
              : typeof i === "number"
              ? i
              : 0;
          };

          total = api
            .column(4)
            .data()
            .reduce((a, b) => {
              return intVal(a) + intVal(b);
            }, 0);

          pageTotal = api
            .column(4, { page: "current" })
            .data()
            .reduce((a, b) => {
              return intVal(a) + intVal(b);
            }, 0);

          $(this).children("tfoot").html(`
                <tr>
                    <td colspan="3"></td>
                    <td colspan="2"><h4>$${convertirMiles(
                      pageTotal
                    )} (total: $${convertirMiles(total)})</h4></td>
                </tr>
                `);
          $(api.column(3).footer()).html(
            `$${convertirMiles(pageTotal)} (${convertirMiles(total)} : total)`
          );
        },
      });
      $("#cargador-deudas").children().addClass("d-none");
    });
}

$("#guias_punto-hist_guias").on("change", (e) => {
  if (e.target.checked) {
    $("#filt_exp-hist_guias").addClass("d-none");
    // $("#filtro_transp-hist_guias").parent().addClass("d-none");
  } else {
    $("#filt_exp-hist_guias").removeClass("d-none");
    // $("#filtro_transp-hist_guias").parent().removeClass("d-none");
  }
});

async function cargarFiltroDePagosPersonalizados() {
  filtroPagos = await db
    .collection("infoHeka")
    .doc("manejoUsuarios")
    .get()
    .then((d) => d.data());

  const listaOpciones = filtroPagos.pagar.map(
    (c, i) => `<option value="${c}">${filtroPagos.titulos[c]}</option>`
  );

  listaOpciones.unshift('<option value="">Seleccione pagos</option>');

  $(".filtro-pagos").html(listaOpciones);

  return filtroPagos;
}

$("#tipo_filt-hist_guias").on("change", cambiarFiltroHistGuiasAdmin);
function cambiarFiltroHistGuiasAdmin(e) {
  const el = e.target;
  const idTarget = el.value;
  const target = $("#" + idTarget + "-hist_guias");

  $(".filtro-gen").addClass("d-none");

  target.removeClass("d-none");
}

async function historialGuiasAdmin(e) {

  const referencia = db.collection("infoHeka").doc("novedadesMensajeria");
  const htmlStatus = $("#status-historial_guias");
  const limiteConsulta = 5e3;

  const {lista:listacategorias} = await referencia.get().then(d => {
    if(d.exists) return d.data();
})
  categorias= listacategorias || [];

  console.log(categorias)

  const finalId = e.id.split("-")[1];
  let fechaI = document.querySelector("#fechaI-" + finalId).value;
  let fechaF = document.querySelector("#fechaF-" + finalId).value;

  const fecha_inicio = new Date(fechaI).setHours(0) + 8.64e7;;
  const fecha_final = new Date(fechaF).setHours(0) + (2 * 8.64e7);
  const numeroGuia = document.querySelector("#num_guia-" + finalId).value;
  const tipoFiltro = $("#tipo_filt-hist_guias").val();
  const filtroCentroDeCosto = $("#filtro_pagos-" + finalId).val();
  const filtroTransp = $("#filtro_transp-" + finalId).val();
  const filtroActual = $("#" + tipoFiltro + "-hist_guias")
    .children(".form-control")
    .val();
  console.log(filtroActual);
  const descargaDirecta = e.id === "descargar-hist_guias";
  $("#historial_guias .cargador").removeClass("d-none");
  const guiasPunto = $("#guias_punto-" + finalId).prop("checked");

  let filtroPagoSeleccionado;

  if (filtroCentroDeCosto) {
    if (!filtroPagos) {
      filtroPagos = await cargarFiltroDePagosPersonalizados();
    }

    filtroPagoSeleccionado = filtroPagos[filtroCentroDeCosto];
  }

  let data = [];
  const manejarInformacion = (querySnapshot) => {
    const s = querySnapshot.size;

    querySnapshot.forEach((doc) => {
      const guia = doc.data();

      guia.transpToShow = doc.data().oficina
        ? guia.transportadora + "-Flexii"
        : guia.transportadora;



      let tituloEncontrado = null; // Inicializamos la variable donde almacenaremos el título si se encuentra una coincidencia

      tituloEncontrado = categorias.find((categoria)=>categoria.novedad==guia.estado)?.categoria;

      if (tituloEncontrado !== null) {
        guia.categoria = tituloEncontrado;
      }

      let condicion = true;

      switch (tipoFiltro) {
        case "filt_3":
        case "filt_4":
          condicion = guia.centro_de_costo
            .toUpperCase()
            .includes(filtroActual.toUpperCase());
        break;

        case "filt_5":
          condicion = !guia.deleted // Se captura entre las que no fueron eliminadas
          && guia.deuda != 0 // Solamente se va a tomar aquellas que no tengan deuda
          && guia.numeroGuia // Debe también tener número de guía
          && guia.estado // Debe tener un estado presente
        break;

        default:
          condicion = true;
      }

      if (condicion) data.push(guia);
    });

    if(s === limiteConsulta) {
      let message = "Vaya 😲! Parece que nuestra consulta se ha extendido más de lo que debería, pero bueno solucionemos, te estaré mostrando el estado"
      if(htmlStatus.children().length) {
        message = `Ten paciencia, hago lo mejor que puedo, vamos por ${data[data.length - 1].fecha}. ¡SI SE PUEDE!`
      }
      htmlStatus.append(`<li>${message}</li>`);
    } else {
      if(htmlStatus.children().length) {
        htmlStatus.html(`<li>¡LO HEMOS LOGRADO! ya te muestro bien, dejame respirar 😪😥😴</li>`);
        setTimeout(() => htmlStatus.html(""), 5000);
      }
    }
  };

  let reference = firebase.firestore().collectionGroup("guias");

  reference = reference
    .orderBy("timeline")
    .startAt(fecha_inicio)
    .endAt(fecha_final);

  if (guiasPunto) reference = reference.where("pertenece_punto", "==", true);

  const referenceAlt = firebase.firestore().collectionGroup("guias");

  if (numeroGuia) {
    await referenceAlt
      .where("numeroGuia", "==", numeroGuia.trim())
      .get()
      .then(manejarInformacion);
  } else if (tipoFiltro === "filt_1") {
    const segementado = segmentarArreglo(filtroPagoSeleccionado, 10);
    for await (const paquete of segementado) {
      await reference
        .where("centro_de_costo", "in", paquete)
        .get()
        .then(manejarInformacion);
    }
  } else if (tipoFiltro === "filt_2") {
    await reference
      .where("transportadora", "==", filtroTransp)
      .get()
      .then(manejarInformacion);
  } else if (tipoFiltro === "filt_3") {
    await reference
      .where("centro_de_costo", "==", filtroActual)
      .get()
      .then(manejarInformacion);

    // if(!data.length) await reference.get().then(manejarInformacion);
  } else if (tipoFiltro === "filt_4") {
    await reference
      .where("type", "==", filtroActual)
      .get()
      .then(manejarInformacion);
  } else if (tipoFiltro === "filt_5") {
    await referenceAlt
      .where("debe", "<", 0)
      .get()
      .then(manejarInformacion);
  } else {
    // await reference
    // .get().then(manejarInformacion);

    await recursividadPorReferencia(reference, manejarInformacion, limiteConsulta)
  }

  let nombre = "Historial Guias" + fechaI + "_" + fechaF;
  let encabezado;
  if (fechaI == fechaF) {
    encabezado = "Guias creadas el " + fechaI;
  } else {
    encabezado = "Guias creadas desde el " + fechaI + " Hasta " + fechaF;
  }

  // data= [{nombre: "nombre", apellido: "apellido"}]
  const columnas = [
    { data: "id_heka", title: "# Guía Heka" },
    { data: "numeroGuia", title: "# Guía Servientrega", defaultContent: "" },
    { data: "categoria", title: "Categoría", defaultContent: "NaN", visible: false },
    { data: "estado", title: "Estado", defaultContent: "" },
    { data: "centro_de_costo", title: "Centro de Costo" },
    {
      data: "transpToShow",
      title: "Transportadora",
      defaultContent: "Servientrega",
    },
    { data: "type", title: "Tipo", defaultContent: "Pago contraentrega" },
    { data: "alto", title: "Alto", visible: false },
    { data: "ancho", title: "Ancho", visible: false },
    { data: "largo", title: "Largo", visible: false },
    { data: "peso", title: "peso", visible: false },
    { data: "detalles.comision_heka", title: "Comisión Heka" },
    {
      data: "detalles.comision_trasportadora",
      title: "Comisión Transportadora",
    },
    { data: "detalles.flete", title: "Flete" },
    { data: "detalles.recaudo", title: "Recaudo" },
    { data: "seguro", title: "Seguro", visible: false },
    { data: "detalles.total", title: "Total" },
    {
      data: "detalles.costoDevolucion",
      title: "Costo devolución",
      defaultContent: "---",
      visible: false
    },
    { data: "fecha", title: "Fecha" },
    {
      data: "debe",
      title: "deuda",
      defaultContent: "no aplica",
      render: function (content, display, data) {
        if (
          data.debe &&
          data.seguimiento_finalizado &&
          data.type !== "CONVENCIONAL"
        )
          return -content + '<span class="sr-only"> Por pagar</span>';

        return -content;
      },
    },
    {
      data: "cuenta_responsable",
      title: "Cuenta responsable",
      defaultContent: "Personal",
    },
    { data: "ciudadR", title: "Ciudad remitente", defaultContent: "---", visible: false },
    { data: "ciudadD", title: "Ciudad destino", defaultContent: "---", visible: false },
    {
      data: "departamentoD",
      title: "Despartamento destino",
      defaultContent: "---",
      visible: false
    },
    { data: "direccionD", title: "Dirección", defaultContent: "---", visible: false },
    { data: "dice_contener", title: "Contenido", defaultContent: "---", visible: false },
    {
      data: "id_tipo_entrega",
      title: "Tipo de entrega",
      defaultContent: "no aplica",
      render: function (content, display, data) {
        return (
          [null, "Entrega en dirección", "Entrega en oficina"][content] ||
          "no aplica"
        );
      },
      visible: false
    },
  ];

  const idTabla = "#tabla-" + finalId;
  const idTablaPunto = idTabla + "-punto";

  if (guiasPunto) {
    columnas.push(
      ...[
        {
          data: "detalles.comision_punto",
          title: "Comisión Punto",
          defaultContent: "No aplica",
        },
        {
          data: "centro_de_costo_punto",
          title: "Punto",
          defaultContent: "No aplica",
        },
        {
          data: "info_user.celular",
          title: "Celular Usuario",
          defaultContent: "No aplica",
        },
      ]
    );

    $(idTabla).parent().addClass("d-none");
    $(idTablaPunto).parent().removeClass("d-none");
  } else {
    $(idTablaPunto).parent().addClass("d-none");
    $(idTabla).parent().removeClass("d-none");
  }

  if (descargaDirecta) {
    $("#historial_guias .cargador").addClass("d-none");

    return descargarInformeGuiasAdmin(columnas.filter(g => g.visible !== false), data, nombre);
  }

  let tabla = $(guiasPunto ? idTablaPunto : idTabla).DataTable({
    data: data,
    destroy: true,
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json",
      emptyTable: "Aún no tienes guías saldadas.",
    },
    columns: columnas,
    dom: "Bfrtip",
    buttons: [
      {
        extend: "excel",
        text: "Descargar Historial",
        filename: nombre,
        title: encabezado,
        exportOptions: {
          columns: ":visible",
        },
      },
    ],
    initComplete: function () {
      const api = this.api();
      const tabla = $(this);
      tabla.before("<h5>Mostrar/ocultar Columnas</h5>");
      api
        .columns()
        .header()
        .each((val, i) => {
          const column = api.column(i);
          const visible = column.visible();
          const boton = document.createElement("span");
          boton.classList.add("badge", "text-truncate", "m-1", "p-1");
          boton.style.cursor = "pointer";
          boton.classList.add(visible ? "badge-info" : "badge-secondary");

          $(boton).click((e) => {
            const badge = e.target;
            column.visible(!column.visible());
            $(badge).toggleClass("badge-info");
            $(badge).toggleClass("badge-secondary");
          });

          boton.textContent = val.textContent;
          tabla.before(boton);
        });
    },
    // action: function() {}
  });

  tabla.on("buttons-processing", function (e, indicator, btnApi, dt, node) {
    console.log(indicator);
    if (indicator) {
      $(node).text("Descargando...");
      $(node).prop("disabled", true);
    } else {
      $(node).text("Descargar Historial");
    }
  });

  $("#historial_guias .cargador").addClass("d-none");
}

async function recursividadPorReferencia(ref, handler, limitePaginacion, next) {
  let consulta = ref;
  if(next) {
    consulta = ref.startAfter(next);
  }

  return await consulta.limit(limitePaginacion).get().then(async q => {
    const t = q.size;
    handler(q);

    if(t === limitePaginacion) {
      const siguiente = q.docs[t - 1];
      await recursividadPorReferencia(ref, handler, limitePaginacion, siguiente);
    }
  });
}

function descargarInformeGuiasAdmin(columnas, guias, nombre) {
  const columnasParaExcel = {};

  columnas.forEach((col) => {
    columnasParaExcel[col.data] = col.title;
  });

  guias = guias.map((g) => {
    let deuda = g.debe ? -g.debe : 0;

    if (g.debe && g.seguimiento_finalizado && g.type !== "CONVENCIONAL")
      deuda = deuda + " Por pagar";

    g.debe = deuda;
    return g;
  });

  descargarInformeExcel(columnasParaExcel, guias, nombre);
}

function filtrarPorpagosHistGuiasAdm(e, editor, button, config) {
  const { filtrado } = config;

  if (filtrado) {
    const filtrar = filtrado.join("|");
    console.log(filtrar);
    editor.column(3).search(filtrar, true, false);
  } else {
    editor.column(3).search("");
  }

  editor.draw();
}

async function generarRotulo(id_guias) {
  let div = document.createElement("div");
  let table = document.createElement("table");
  let tbody = document.createElement("tbody");
  let guias = new Array();
  for (let id of id_guias) {
    let x = usuarioDoc
      .collection("guias")
      .doc(id)
      .get()
      .then((d) => d.data());
    guias.push(x);
  }

  let data_guias = await Promise.all(guias);
  console.log(data_guias);

  table.setAttribute("class", "table");
  for (let data of data_guias) {
    let tr = document.createElement("tr");
    tr.classList.add("border-bottom-secondary");

    let src_logo_transp = "img/logoServi.png";
    let logo = "img/WhatsApp Image 2020-09-12 at 9.11.53 PM.jpeg";

    if (data.oficina) {
      logo = "img/logo-flexi.png";
    }

    if (data.transportadora === "INTERRAPIDISIMO") {
      src_logo_transp = "img/logo-inter.png";
    } else if (data.transportadora === "ENVIA") {
      src_logo_transp = "img/2001.png";
    } else if (data.transportadora === "TCC") {
      src_logo_transp = "img/logo-tcc.png";
    } else if (data.transportadora === "COORDINADORA") {
      src_logo_transp = "img/logo-coord.png";
    }

    const celularD =
      data.celularD != data.telefonoD
        ? data.celularD + " - " + data.telefonoD
        : data.telefonoD;

    const nombres = data.oficina
      ? data.datos_oficina.nombre_completo
      : data.nombreD;
    const direccion = data.oficina
      ? data.datos_oficina.direccion
      : data.direccionD;
    const ciudad = data.oficina
      ? data.datos_oficina.ciudad
      : `${data.ciudadD}(${data.departamentoD})`;
    const celular = data.oficina ? data.datos_oficina.celular : celularD;

    let imgs = `<td><div class="align-items-center d-flex flex-column">
            <img src="${logo}" width="100px">
            <img src="${src_logo_transp}" width="100px">
        </div></td>`;
    let infoRem = `<td>
        <h2>Datos Del Remitente</h2>
            <h5 class="text-dark">ID: <strong>${data.id_heka}</strong></h5>
            <h5 class="text-dark">Nombre: <strong>${data.nombreR}</strong></h5>
            <h5 class="text-dark">Dirección: <strong>${data.direccionR}</strong></h5>
            <h5 class="text-dark">Ciudad:  <strong>${data.ciudadR}(${data.departamentoR})</strong>  </h5>
            <h5 class="text-dark">Celular:  <strong>${data.celularR}</strong></h5>
            <h5 class="text-dark">Contenido:  <strong>${data.dice_contener}</strong></h5>
        </td>`;

    let infoDest = `<td>
            <h2>Datos Del Destinatario</h2>
            <h5 class="text-dark">Número de Guía: <strong>${data.numeroGuia}</strong></h5>
            <h5 class="text-dark">Nombre: <strong>${nombres}</strong></h5>
            <h5 class="text-dark">Dirección: <strong>${direccion}</strong></h5>
            <h5 class="text-dark">Ciudad:  <strong>${ciudad}</strong>  </h5>
            <h5 class="text-dark">Celular:  <strong>${celular}</strong></h5>
            <h5 class="text-dark">Valor asegurado:  <strong>${data.seguro}</strong></h5>
        </td>`;

    tr.innerHTML = imgs + infoRem + infoDest;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  div.appendChild(table);

  var element = div;
  var opt = {
    margin: 0,
    filename: "myfile.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    pagebreak: { mode: "avoid-all" },
    // jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  // New Promise-based usage:
  // html2pdf().set(opt).from(element).save();

  w = window.open();
  w.document.write(`<html><head>
        <meta charset="utf-8">

        <link rel="shortcut icon" type="image/png" href="img/heka entrega.png"/>

        <link href="css/sb-admin-2.min.css" rel="stylesheet">

        <title>Rótulo Heka</title>
    </head><body>`);
  w.document.write(div.innerHTML);
  w.document.write("</body></html>");
  // w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    // w.close();
  }, 500);
}

async function generarGuiaFlexii(id_guias) {
  let div = document.createElement("div");
  let table = document.createElement("table");
  let tbody = document.createElement("tbody");
  let guias = new Array(); 

  for (let id of id_guias) {
    let x = usuarioDoc
      .collection("guias")
      .doc(id)
      .get()
      .then((d) => d.data());
    guias.push(x);
  }

  let guiaImprimir = null;

  firebase
    .firestore()
    .collection("documentos")
    .where("guias", "array-contains", id_guias.toString())
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        guiaImprimir = { ...doc.data(), id: doc.id };
        console.log(doc.id);
        console.log(doc.data());
      });
    }).then(async()=>{
  let data_guias = await Promise.all(guias);

  table.setAttribute("class", "table");

  let urlsQR= [] //array

  for (let data of data_guias) {
    guiaImprimir= data;
    let tr = document.createElement("tr");
    tr.classList.add("border-bottom-secondary");

    let logo = "img/WhatsApp Image 2020-09-12 at 9.11.53 PM.jpeg";

    if (data.oficina) {
      logo = "img/logo-flexi.png";
    }
    const celularD =
      data.celularD != data.telefonoD
        ? data.celularD + " - " + data.telefonoD
        : data.telefonoD;

    const nombres = data.oficina
      ? data.datos_oficina.nombre_completo
      : data.nombreD;
    const direccion = data.oficina
      ? data.datos_oficina.direccion
      : data.direccionD;
    const ciudad = data.oficina
      ? data.datos_oficina.ciudad
      : `${data.ciudadD}(${data.departamentoD})`;
    const celular = data.oficina ? data.datos_oficina.celular : celularD;
    const urlQR= `http://localhost:6200/ingreso.html?idguia=${guiaImprimir.id_heka}&iduser=${guiaImprimir.id_user}#flexii-guia`
   
    urlsQR.push({
      id_heka: guiaImprimir.id_heka,
      id_user: guiaImprimir.id_user,
      urlQR,
    });

   let header = `
   <div>
   <table class="table table-bordered">
   <thead>
   <tr>
   <th scope="col">#</th>
   <th scope="col">Flexii</th>
   <th scope="col">RECIBE: ${data.nombreD} </th>
   <th scope="col">Fecha: ${data.fecha}</th>
   <th scope="col">Guia:  ${data.id_heka}</th>
   <th scope="col">Transportadora: ${data.transportadora}</th>
   </tr>
   </thead>
   </table>
   <p> El usuario deja constancia expresa de que acepta y tiene conocimiento del contrato publicado en la pagina web Flexii ,como remitente declara que este envío no contiene dinero en efectivo, joyas, objetos o fines prohibidos por la ley, y exime a Flexii y la transportadora asignada de toda responsabilidad. </p>
   </div>
   `;

   let body = `

   <table class="table table-bordered">

  <tbody>
      <td >
        DATOS REMITENTE  <br/>
        Remitente: ${data.id_heka} <br/>
        Nombre: ${data.nombreR} <br/>
        Ciudad: ${data.ciudadR} <br/>
        Dirección: ${data.direccionR} <br/>
        Cel/Tel: ${data.celularR}</td>

      <td>DATOS DESTINO <br/>
        Nombre: ${nombres}<br/>
        Ciudad: ${ciudad} <br/>
        Dirección: ${direccion} <br/>
        Cel/Tel: ${celular}</td>
      <th >Firma de quien recibe:</th>

      </tr>
      <tr>
      <th >Escanea el qr </br>
      <div class="qr-code" id="qrcode-${urlQR}"></div>
      <td>
          Peso real: ${data.peso} kg<br/>
          Contenido: ${data.dice_contener}<br/>
          Costo envío: ${data.valor} <br/>
      </td>

            <th >Valor cobro destino: ${data.valor}</th>

    </tr>


  </tbody>
</table>

   `;
    div.innerHTML += header + body;
    tbody.appendChild(tr);

  }
    
   console.log(urlsQR)



  table.appendChild(tbody);
  div.appendChild(table);

  w = window.open();
  w.document.write(`<html><head>
        <meta charset="utf-8">

        <link rel="shortcut icon" type="image/png" href="img/heka entrega.png"/>

        <link href="css/sb-admin-2.min.css" rel="stylesheet">

        <title>Rótulo Heka</title>

        <script src="https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js"></script>

    </head><body>



    `);
  w.document.write(div.innerHTML);
    console.log(guiaImprimir)
  w.document.write(`

  <script type="text/javascript">

  const urlsQR= document.querySelectorAll(".qr-code");
  console.log(urlsQR);

  // Itera sobre cada elemento
  for (let i = 0; i < urlsQR.length; i++) {
    // Obtiene el id del elemento
    const id = urlsQR[i].id;

    // Extrae la parte del id después de "qrcode-"
    const url = id.substring("qrcode-".length);

    // Genera el código QR
    new QRCode(urlsQR[i], url);
  }

  
</script>
  </body></html>`);
  // w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    // w.close();
  }, 500);

})

}




async function imprimirRotuloPunto(id_heka) {
  fetch("procesos/rotuloPunto/" + id_heka)
    .then((d) => d.text())
    .then((d) => {
      w = window.open();
      w.document.write(d);
    });
}

$("#buscar-manifiestos").click(buscarGuiasManifiesto);
function buscarGuiasManifiesto() {
  $("#cargador-manifiestos").removeClass("d-none");
  const inpTransp = $(".transp_man:checked");
  const transp = inpTransp.val();

  const [fechaI, fechaF] = getDateRangeMs(
    "fecha_inicio-manifiestos",
    "fecha_final-manifiestos"
  );

  const coll = ControlUsuario.esPuntoEnvio
    ? db.collectionGroup("guias").where("id_punto", "==", user_id)
    : usuarioDoc.collection("guias");

  const reference = coll
    .orderBy("timeline", "desc")
    .startAt(fechaF)
    .endAt(fechaI)
    .where("transportadora", "==", transp);
  // .limit(10)

  if (!this.getAttribute("data-table_initialized")) {
    incializarTablaTablaGuiasInter();
    this.setAttribute("data-table_initialized", true);
  }

  const mostrador_guias_seleccionadas = $(
    '[aria-describedby="crear-manifiesto-manifiestos"]'
  );
  mostrador_guias_seleccionadas.val("");

  const tabla = $("#tabla-manifiestos").DataTable();
  // return;
  reference.get().then((querySnapshot) => {
    const size = querySnapshot.size;
    if (size) {
      $("#mostrador-manifiestos").show("fast");
      $("#sin-manifiestos").hide("slow");
    } else {
      $("#mostrador-manifiestos").hide("slow");
      $("#sin-manifiestos").show("fast");
    }

    tabla.clear();

    querySnapshot.forEach((doc) => {
      if (doc.data().numeroGuia && !doc.data().deleted) {
        tabla.rows.add([doc.data()]);
      }
    });

    tabla.draw();

    $("#cargador-manifiestos").addClass("d-none");
  });
}

function agregarFilaGuiasInter() {
  $("#tabla-manifiestos")
    .DataTable()
    .rows.add([
      {
        id_heka: "# Guía Heka",
        transportadora: "Fecha creación",
        fecha: "Fecha Saldada",
        type: "Tipo Guía",
        valor: "Cant. Saldada",
      },
    ])
    .draw();
}

function incializarTablaTablaGuiasInter() {
  const tabla = $("#tabla-manifiestos").DataTable({
    destroy: true,
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json",
    },
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "Todos"],
    ],
    columnDefs: [
      {
        render: function (data, type, row) {
          let result = "";
          let n = 1;
          let telefono = data;
          while (n <= 1) {
            result += `<a class="btn btn-light d-flex align-items-baseline mb-1"
                        href="https://api.whatsapp.com/send?phone=57${telefono
                          .toString()
                          .replace(/\s/g, "")}"
                        target="_blank">
                            <i class="fab fa-whatsapp mr-1" style="color: #25D366"></i>
                            ${telefono}
                        </a>`;

            telefono = row.celularD;
            n++;
          }
          return result;
        },
        targets: 5,
      },
    ],
    columns: [
      { data: "id_heka", title: "# Guía Heka" },
      { data: "numeroGuia", title: "# Guía transportadora" },
      { data: "estado", title: "Estado", defaultContent: "" },
      { data: "type", title: "Tipo" },
      { data: "nombreD", title: "Nombre" },
      { data: "telefonoD", title: "Telefonos" },
      { data: "fecha", title: "Fecha generación" },
      { data: "ciudadD", title: "Ciudad Dest." },
      { data: "seguro", title: "Seguro" },
      { data: "valor", title: "Recaudo" },
      { data: "costo_envio", title: "Costo de envío" },
    ],
    scrollY: "50vh",
    scrollX: true,
    initComplete: funcionalidadesTablaHistorialGuiasInter,
  });

  const btn_crear_manifiesto = $("#crear-manifiesto-manifiestos");
  const mostrador_guias_seleccionadas = $(
    '[aria-describedby="crear-manifiesto-manifiestos"]'
  );

  tabla.on("click", "tr", function (e) {
    if (e.target.parentNode.nodeName !== "TR") return;

    $(this).toggleClass("selected bg-gray-300");
    const seleccionadas = guiasSeleccionadas().map((g) => g.numeroGuia);
    const cant = seleccionadas.length;

    mostrador_guias_seleccionadas.val(seleccionadas);
    $("#counter-selector-guias-inter").text(cant ? "(" + cant + ")" : "");
  });

  btn_crear_manifiesto.click(async () => {
    const guias = guiasSeleccionadas();
    btn_crear_manifiesto.text("Cargando ...");

    if (guias[0].transportadora === "INTERRAPIDISIMO") {
      imprimirManifiestoInter(guias.map((g) => g.numeroGuia));
    } else {
      await imprimirManifiestoEnvia(guias);
      btn_crear_manifiesto.text("Crear manifiesto");
    }
  });

  function guiasSeleccionadas() {
    let guias = new Array();
    tabla
      .rows(".selected")
      .data()
      .each((d, o) => {
        guias.push(d);
      });
    return guias;
  }
}

function funcionalidadesTablaHistorialGuiasInter() {
  const api = this.api();
  this.parent().parent().before(`
        <div class="form-group form-check">
            <input type="checkbox" class="form-check-input" id="select-all-guias-inter">
            <label class="form-check-label" for="select-all-guias-inter">Seleccionar Todas las visibles <span id="counter-selector-guias-inter"></span></label>
        </div>
    `);

  $("#select-all-guias-inter").change((e) => {
    if (e.target.checked) {
      let counter = 0;
      const limit = 50;
      const row = $("tr:gt(0)", this).each((i, row) => {
        const data = api.row(row).data();
        if (counter < limit) {
          $(row).addClass("selected bg-gray-300");
          counter++;
        }
      });
    } else {
      $("tr:gt(0)", this).removeClass("selected bg-gray-300");
    }

    const cant = $("tr.selected", this).length;
    $("#counter-selector-guias-inter").text(cant ? "(" + cant + ")" : "");
  });
}

async function imprimirManifiestoEnvia(guias) {
  if (!guias || !guias.length)
    return new Toast({
      icon: "error",
      title: "Debes seleccionar las guías antes de crear la relación",
    });

  await fetch("/envia/imprimirManifiesto/", {
    method: "POST",
    headers: { "Content-Type": "Application/json" },
    body: JSON.stringify(guias),
  })
    .then((d) => d.text())
    .then((d) => {
      w = window.open();
      w.document.write(d);
    });
}

function imprimirManifiestoInter(numeroGuias) {
  if (!numeroGuias || !numeroGuias.length)
    return new Toast({
      icon: "error",
      title: "Debes seleccionar las guías antes de crear la relación",
    });

  open("/inter/imprimirManifiesto/" + numeroGuias, "_blank");
}

function descargarInformeExcel(datosDescarga, informeJson, title) {
  const datosDescargaEjemplo = {
    campo_json: "Titulo a guardar del excel",
    nombres: "Nombres",
    apellidos: "Apellidos",
    centro_de_costo: "Centro de costo",
    correo: "Correo",
    nombre_empresa: "Nombre de la empresa",
    "datos_bancarios.banco": "Banco",
    "datos_personalizados.sistema_envia": "Sistema envia",
    "datos_personalizados.sistema_tcc": "Sistema tcc",
  };

  const normalizeObject = (campo, obj) => {
    if (!obj) return "No aplica";
    return obj[campo];
  };

  const transformDatos = (obj) => {
    const res = {};
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

    return res;
  };

  const data = informeJson.map(transformDatos);

  crearExcel(data, title);
}
