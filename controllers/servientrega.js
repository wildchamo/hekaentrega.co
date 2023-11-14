const request = require("request");
const fetch = require("node-fetch");
const requestPromise = require("request-promise");
const parseString = require("xml2js").parseString;
const DOMParser = require("xmldom").DOMParser;
const { PDFDocument } = require("pdf-lib");

const firebase = require("../keys/firebase");
const db = firebase.firestore();

const extsFunc = require("../extends/funciones");
const { notificarGuiaOficina } = require("../extends/notificaciones");

const { UsuarioPrueba, Credenciales } = require("../keys/serviCredentials");
const {
  revisarNovedadAsync,
  estadosGuia,
  modificarEstadoGuia,
  detectaNovedadEnElHistorialDeEstados,
  atributosAdicionalesEnActualizacion,
} = require("../extends/manejadorMovimientosGuia");
const { templateMessage } = require("./messageBird");
const { notificarNovedadEncontrada } = require("../extends/notificaciones");

// const storage = firebase.storage();

// router.use(bodyParser.urlencoded({extended: true}));
// router.use(bodyParser.json());

const rastreoEnvios =
  "http://sismilenio.servientrega.com/wsrastreoenvios/wsrastreoenvios.asmx";
const generacionGuias = Credenciales.url_generar_guias;
const genGuiasPrueba = UsuarioPrueba.url_generar_guias;
const id_cliente = "1072497419";

const auth_header_prueba = `<tem:AuthHeader>
<tem:login>${UsuarioPrueba.login}</tem:login>
<tem:pwd>${UsuarioPrueba.password}</tem:pwd>
<tem:Id_CodFacturacion>${UsuarioPrueba.id_codFacturacion}</tem:Id_CodFacturacion>
<tem:Nombre_Cargue></tem:Nombre_Cargue><!--AQUI VA EL NOMBRE DEL
CARGUE APARECERÁ EN SISCLINET-->
</tem:AuthHeader>`;

const auth_header_convencional = `<tem:AuthHeader>
<tem:login>${Credenciales.Conv.login}</tem:login>
<tem:pwd>${Credenciales.Conv.password}</tem:pwd>
<tem:Id_CodFacturacion>${Credenciales.Conv.id_codFacturacion}</tem:Id_CodFacturacion>
<tem:Nombre_Cargue></tem:Nombre_Cargue><!--AQUI VA EL NOMBRE DEL
CARGUE APARECERÁ EN SISCLINET-->
</tem:AuthHeader>`;

const auth_header_pagoContraentrega = `<tem:AuthHeader>
<tem:login>${Credenciales.PgCon.login}</tem:login>
<tem:pwd>${Credenciales.PgCon.password}</tem:pwd>
<tem:Id_CodFacturacion>${Credenciales.PgCon.id_codFacturacion}</tem:Id_CodFacturacion>
<tem:Nombre_Cargue></tem:Nombre_Cargue><!--AQUI VA EL NOMBRE DEL
CARGUE APARECERÁ EN SISCLINET-->
</tem:AuthHeader>`;

//***** COTIZADOR ******/
exports.cotizar = async (req, res) => {
  const body = req.body;

  const data = {
    IdProducto: body.IdProducto,
    NumeroPiezas: 1,
    Piezas: [
      {
        Peso: body.Peso,
        Largo: body.Largo,
        Ancho: body.Ancho,
        Alto: body.Alto,
      },
    ],
    ValorDeclarado: body.ValorDeclarado,
    IdDaneCiudadOrigen: body.IdDaneCiudadOrigen,
    IdDaneCiudadDestino: body.IdDaneCiudadDestino,
    EnvioConCobro: body.EnvioConCobro,
    FormaPago: body.FormaPago,
    TiempoEntrega: 1,
    MedioTransporte: 1,
    NumRecaudo: body.ValorDeclarado,
  };
//  return res.json(data)
  console.log("COTIZANDO SERVIENTREGA");
  const response = await fetch(
    "http://web.servientrega.com:8058/CotizadorCorporativo/api/Cotizacion",
    {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
        Authorization: body.EnvioConCobro?Credenciales.PgCon.Token:Credenciales.Conv.Token
      },
      body: JSON.stringify(data),
    }
  )
  .then((data) => {
    console.log("SERVIENTREGA RESPONDE");
    return data.json();
  })
  .catch((error) => {
    console.log(error);
    console.log("errorsinho");
  })
  .finally(() => {
    console.log("FINALIZÓ PROCESO COTIZACIÓN")
  });

  console.log("FINALIZÓ EL COTIZADOR SERVIENTREGA");
  res.send(response);
};

//***** COMIENZO DEL EXPORTADOR DE RUTAS ******/
exports.consultarGuia = (req, res) => {
  request.post(
    {
      headers: { "content-type": "text/xml" },
      url: rastreoEnvios,
      body: consultarGuia(guias.guia),
    },
    (error, response, body) => {
      if (error) {
        return console.dir(error);
      }
      console.log(response.statusCode);
      // console.log(JSON.stringify(body));
      res.send(JSON.stringify(body));
    }
  );
};

exports.estadoGuia = (req, res) => {
  console.log(req.body.guia);
  request.post(
    {
      headers: { "Content-Type": "text/xml" },
      url: rastreoEnvios,
      body: estadoGuia(req.body.guia),
    },
    (err, response, body) => {
      if (err) {
        return console.dir(err);
      }

      res.send(JSON.stringify(body));
    }
  );
};

exports.crearGuia = (req, res) => {
  request.post(
    {
      headers: { "Content-Type": "text/xml" },
      url: req.body.prueba ? genGuiasPrueba : generacionGuias,
      body: generarGuia(req.body),
    },
    (err, response, body) => {
      if (err) return console.error(err);

      console.log("Se está creando una guía");
      // console.log(body);
      res.send(JSON.stringify(body));
    }
  );
};

exports.generarGuiaSticker = (req, res) => {
  const data = req.body;
  const type = data.oficina ? "CONVENCIONAL" : data.type;
  console.log(data);
  console.log("REQUEST => ", {
    headers: { "Content-Type": "text/xml" },
    url: req.body.prueba ? genGuiasPrueba : generacionGuias,
    body: crearGuiaSticker(
      data.numeroGuia,
      data.id_archivoCargar,
      type,
      data.prueba
    ),
  });
  try {
    request.post(
      {
        headers: { "Content-Type": "text/xml" },
        url: req.body.prueba ? genGuiasPrueba : generacionGuias,
        body: crearGuiaSticker(
          data.numeroGuia,
          data.id_archivoCargar,
          type,
          data.prueba
        ),
      },
      (err, response, body) => {
        if (err) return console.error(err);

        console.log("Se está creando una guía");
        console.log("RESPONSE => ", body);
        let base64 = "";

        let xmlResponse = new DOMParser().parseFromString(body, "text/xml");
        const result = xmlResponse.documentElement.getElementsByTagName(
          "GenerarGuiaStickerResult"
        )[0];
        if (result && result.textContent === "true") {
          base64 =
            xmlResponse.documentElement.getElementsByTagName("bytesReport")[0]
              .textContent;
        }

        let segmentar = parseInt(req.query.segmentar);
        if (segmentar) {
          const segmentado = Math.min(segmentar, 1000000);
          res.json(extsFunc.segmentarString(base64, segmentado));
        } else {
          res.send(base64);
        }
      }
    );
  } catch (e) {
    res.send("");
  }
};

exports.generarManifiesto = async (req, res) => {
  let guias = req.body.arrGuias;
  console.log(req.body.arrGuias);
  const vinculo = req.body.vinculo;
  const base64 = await generarStickerManifiesto(guias, vinculo.prueba);
  let numeroGuias = guias.map((v) => v.id_heka).sort();

  let campos_actualizados = {
    guias: numeroGuias,
  };

  if (!base64) {
    campos_actualizados.descargar_relacion_envio = false;
    campos_actualizados.important = true;
    campos_actualizados.href = "documentos";
  }

  res.send(base64);

  const arrBase64 = extsFunc.segmentarString(base64, 100000);

  for (let i = 0; i < arrBase64.length; i++) {
    await db
      .collection("documentos")
      .doc(vinculo.id_doc)
      .collection("manifiestoSegmentado")
      .doc(i.toString())
      .set({
        segmento: arrBase64[i],
        index: i,
      });
  }

  try {
    await db
      .collection("documentos")
      .doc(vinculo.id_doc)
      .update(campos_actualizados)
      .then(() => {
        console.log("Ya se configuró el documento correctamente");
        for (let guia of guias) {
          console.log("Actualizando estado =>", guia.id_heka);
          db.collection("usuarios")
            .doc(vinculo.id_user)
            .collection("guias")
            .doc(guia.id_heka)
            .update({
              enviado: true,
              estado: "Enviado",
              estadoActual: estadosGuia.proceso,
            })
            .then(() => {
              const link = "https://www.servientrega.com/";
              try {
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

                const parametros = [
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

                // templateMessage("pedido_creado_completo", guia.telefonoD, parametros);
              } catch (e) {}

              if (guia.id_oficina) {
                notificarGuiaOficina({
                  user_id: vinculo.id_user,
                  id_heka: guia.id_heka,
                  office_id: guia.id_oficina,
                });
              }
            })
            .catch((error) => {
              console.log(
                'hubo un error Al actualizar el estado de la guia a "Enviado" => ',
                error
              );
            });
        }
        console.log("Se están actualizando todos los estados");
      })
      .catch((error) => {
        console.log("Hubo un error para configurar el documento");
        console.log(error);
        console.log(JSON.stringify(error));
        console.log(error.message);
      });
  } catch (err) {
    console.error(err);
  }
};

exports.crearDocumentos = async (req, res) => {
  // console.log(req.body);
  let arr = [];
  let vinculo = req.body[1];
  let arrData = req.body[0].filter(
    (d) => d.prueba == vinculo.prueba && d.numeroGuia != "undefined"
  );
  let manifestarGuias = new Array();
  let arrErroresUsuario = new Array();
  if (arrData.length < req.body[0].length)
    arrErroresUsuario.push(
      "Algunas guías que no corresponden con el estado actual no fueron tomadas en cuenta."
    );
  for (let data of arrData) {
    let promiseBase64 = new Promise((resolve, reject) => {
      request.post(
        {
          headers: { "Content-Type": "text/xml" },
          url: data.prueba ? genGuiasPrueba : generacionGuias,
          body: crearGuiaSticker(
            data.numeroGuia,
            data.id_archivoCargar,
            data.type,
            data.prueba
          ),
        },
        (error, response, body) => {
          if (error) {
            reject(error);
          }
          console.log(response.statusCode);
          // console.log(JSON.stringify(body));

          let xmlResponse = new DOMParser().parseFromString(body, "text/xml");
          // console.info(xmlResponse.documentElement.getElementsByTagName("GenerarGuiaStickerResponse")[0].textContent);
          if (
            xmlResponse.documentElement.getElementsByTagName(
              "GenerarGuiaStickerResult"
            )[0].textContent == "true"
          ) {
            manifestarGuias.push(data);
            resolve(
              xmlResponse.documentElement.getElementsByTagName("bytesReport")[0]
                .textContent
            );
          } else {
            resolve(0);
          }

          // resolve(body.slice(25, 50));

          // res.send(JSON.stringify(body));
        }
      );
    });
    arr.push(promiseBase64);
  }

  let arrBase64 = await Promise.all(arr);
  // console.log(arrBase64);
  // console.log(manifestarGuias);
  if (arrData.length > manifestarGuias.length)
    arrErroresUsuario.push(
      "Algunas guías presentaron errores para crear el Sticker, pruebe intentando de nuevo con las restantes, o clonarlas y eliminar las defectuosas"
    );
  let base64Guias = await joinBase64WhitPdfDoc(arrBase64);
  let base64Manifiesto = await generarStickerManifiesto(
    manifestarGuias,
    vinculo.prueba
  );
  console.log(
    "mustra de los primeros 10 datos de base64manifiesto => ",
    base64Manifiesto.toString().slice(0, 10)
  );
  try {
    if (!base64Manifiesto && manifestarGuias.length)
      arrErroresUsuario.push(
        "Ocurrió un Error inesperado al crear el manifiesto de las guías, el problema será tranferido a centro logístico, procuraremos atenderlo en la brevedad posible, disculpe las molestias causadas"
      );

    if (arrErroresUsuario.length) {
      console.log("Hubo algún error mientras se creaban los documentos.");
      let fecha = new Date();
      console.log("Enviando Notificacion al usuario");
      db.collection("notificaciones")
        .add({
          fecha:
            fecha.getDate() +
            "/" +
            (fecha.getMonth() + 1) +
            "/" +
            fecha.getFullYear() +
            " - " +
            fecha.getHours() +
            ":" +
            fecha.getMinutes(),
          visible_user: true,
          timeline: new Date().getTime(),
          icon: ["exclamation", "danger"],
          mensaje:
            "Hemos registrado algún error al crear los documentos, revíselos para ver como resolverlos.",
          detalles: arrErroresUsuario,
          user_id: vinculo.id_user,
        })
        .catch((error) => {
          console.log("error Al enviar la notificación al usuario => ", error);
        });
    }

    if (manifestarGuias.length) {
      console.log("empieza a configurar los documentos");
      let guias = manifestarGuias.map((v) => v.id_heka).sort();
      console.log(guias, base64Guias.length, base64Manifiesto.length);

      console.log(base64Guias);
      await db
        .collection("documentos")
        .doc(vinculo.id_doc)
        .update({
          descargar_guias: base64Guias ? true : false,
          descargar_relacion_envio: base64Manifiesto ? true : false,
          guias,
          base64Guias,
          base64Manifiesto,
        })
        .then(() => {
          console.log("Ya se configuró el documento correctamente");
          for (let guia of manifestarGuias) {
            console.log("Actualizando estado =>", guia.id_heka);
            db.collection("usuarios")
              .doc(vinculo.id_user)
              .collection("guias")
              .doc(guia.id_heka)
              .update({
                enviado: true,
                estado: "Enviado",
                estadoActual: estadosGuia.proceso,
              })
              .catch((error) => {
                console.log(
                  'hubo un error Al actualizar el estado de la guia a "Enviado" => ',
                  error
                );
              });
          }
          console.log("Se actualizaron todos los estados");
          let guias_respuesta = manifestarGuias.map((v) => v.id_heka).sort();
          let respuesta =
            "Las Guías " + guias_respuesta + " Fueron creadas exitósamente.";
          if (arrErroresUsuario.length)
            respuesta +=
              "\n Pero se presentó un error, revise las notificaciones para obtener más detalles";
          console.log(respuesta);
          res.json(respuesta);
        })
        .catch((error) => {
          console.log("Hubo un error para configurar el documento");
          console.log(error);
          console.log(JSON.stringify(error));
          console.log(error.error);
          console.log(error.toString());
          console.log(error.message);
        });
    } else {
      db.collection("documentos").doc(vinculo.id_doc).delete();
      res
        .status(422)
        .send(JSON.stringify({ error: "no hubo guía que procesar" }));
    }
  } catch (error) {
    console.log(error);
  }

  // let ejemploGuias = new Buffer.from(base64Guias, "base64");
  // let ejemploManifiesto = new Buffer.from(base64Manifiesto, "base64");
  // fs.writeFileSync("ejemplo.pdf",ejemplo);
};

exports.actualizarMovimientos = actualizarMovimientos;

//***** FIN DEL EXPORTADOR DE RUTAS ******/

//A partir de aquí habrán solo funciones

function consultarGuia(numGuia) {
  let res = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
      <ConsultarGuia xmlns="http://servientrega.com/">
      <NumeroGuia>${numGuia}</NumeroGuia>
      </ConsultarGuia>
      </soap:Body>
    </soap:Envelope>`;

  return res;
}

function estadoGuia(numGuia) {
  return `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      <EstadoGuia xmlns="http://servientrega.com/">
        <ID_Cliente>1072497419</ID_Cliente>
        <guia>${numGuia}</guia>
      </EstadoGuia>
    </soap:Body>
  </soap:Envelope>`;
}

async function actualizarMovimientos(doc) {
  // para servientrega se realiza un request
  return await requestPromise({
    // "headers": {"Content-Type": "text/xml"},
    method: "POST",
    uri: rastreoEnvios + "/ConsultarGuiaExterno",
    form: {
      NumeroGuia: doc.data().numeroGuia,
    },
    json: true,
  })
    .then(async (body) => {
      // console.log(body)
      //Aquí comienza el proceso interno de actualización
      let respuesta = await new Promise((resolve, reject) => {
        parseString(body, async (error, result) => {
          if (error)
            return [{
              estado: "Est.N.A", //Estado no actualizado
              guia: doc.id + " / " + doc.data().numeroGuia,
              causa: error.message || "Error desconocido SERVIENTREGA"
            }];
          try {
            // let path = doc.ref.path.split("/");
            let data = result.InformacionGuiaMov;
            // console.log("198 => ",data)
            if (!data.Mov) {
              throw " Esta guía no manifiesta movimientos.";
            }
            let movimientos = data.Mov[0].InformacionMov;

            const guia = doc.data();
            console.log(guia.numeroGuia);
            console.log("Timeline => ", guia.timeline);
            const ultimaNovedadRegistrada = guia.ultima_novedad;

            let entrega_oficina_notificada =
              guia.entrega_oficina_notificada || false;
            let upte_movs, ultima_novedad, fecha_ult_novedad;
            //Confirmo si hay movimientos para actualizarlos
            if (movimientos) {
              for (let movimiento of movimientos) {
                for (let x in movimiento) {
                  movimiento[x] = movimiento[x][0];
                }

                if (
                  movimiento.NomConc == "EMPRESARIO SATELITE C.O.D. Y/O LPC" &&
                  !entrega_oficina_notificada
                ) {
                  extsFunc.notificarEntregaEnOficina(guia);
                  entrega_oficina_notificada = true;
                }
              }

              //Maqueta general para mostrar el estado y sus respctivos movimientos
              let data_to_fb = {
                numeroGuia: data.NumGui[0], //guia devuelta por la transportadora
                fechaEnvio: data.FecEnv[0],
                ciudadD: data.CiuDes[0],
                nombreD: data.NomDes[0],
                direccionD: data.DirDes[0],
                estadoActual: data.EstAct[0],
                fecha: data.FecEst[0], //fecha del estado
                movimientos, // movimientos registrados por la transportadora
              };

              //#region Enviar mensaje cuando se detecte cierta novedad y asignar la última novedad encontrada a la guía
              // movimientos.reverse();
              // for await (const mov of movimientos) {
              //   // const revision = await revisarNovedadAsync(mov, "SERVIENTREGA");
              //   if(false) {
              //     ultima_novedad = mov.NomConc;
              //     fecha_ult_novedad = mov.FecMov;
              //     if(ultima_novedad !== ultimaNovedadRegistrada) {
              //       notificarNovedadPorMensaje(guia, ultima_novedad);
              //     }
              //     break;
              //   }

              // }
              // movimientos.reverse();
              //#endregion

              /*Respuesta ante la actualización de movimientos.
              se actulizan aquellos estados que sean diferentes y que estén registrados en este objeto*/
              upte_movs = await extsFunc.actualizarMovimientos(doc, data_to_fb);
            } else {
              upte_movs = {
                estado: "Sn.Mov",
                guia: doc.id + " / " + doc.data().numeroGuia,
              };
            }

            let finalizar_seguimiento = doc.data().prueba ? true : false;
            /*Respuesta a la actualización de los estados,
            ésta me actualiza el estado actual que manifiesta la guía, si el seguimiento
            fue finalizado, y la fecha de actualización*/
            
            guia.estadoTransportadora = data.EstAct[0];
            
            // Función encargada de actualizar el estado, como va el seguimiento, entre cosas base importantes
            const actualizaciones = modificarEstadoGuia(guia);

            actualizaciones.enNovedad = detectaNovedadEnElHistorialDeEstados(upte_movs);

            // Esto me llena un arreglo de todas las novedades que han sido notificadas, para consultarlo y evitar duplicar notificaciones
            actualizaciones.novedadesNotificadas =
              await notificarNovedadEncontrada(guia, movimientos);

            // Esto pasa una serie de argumentos, que detecta que haya alguna información para actualizar
            // en caso de que los valores del segundo parametros sean falsos, undefined o null, no los toma en cuenta para actualizar
            atributosAdicionalesEnActualizacion(actualizaciones, {
              fecha_ult_novedad, ultima_novedad, entrega_oficina_notificada, 
              seguimiento_finalizado: finalizar_seguimiento
            });

            console.log(actualizaciones);

            // return [{
            //   estado: "Est.N.A", //Estado no actualizado
            //   guia: doc.id + " / " + doc.data().numeroGuia,
            // }];
            
            let upte_estado = await extsFunc.actualizarEstado(
              doc,
              actualizaciones
            );

            resolve([upte_estado, upte_movs]);
          } catch (e) {
            console.log("error el actualizar guias");
            console.log(e);
            resolve([
              {
                estado: "error",
                guia: doc.id + " / " + doc.data().numeroGuia + e,
              },
            ]);
          }
        });
      });

      return respuesta;
    })
    .catch((err) => {
      // console.log("289 => ",err);
      return [
        {
          estado: "error",
          guia: doc.id + " / " + doc.data().numeroGuia + err.message,
          causa: err.message || "Error desconocido SERVIENTREGA"
        },
      ];
    });
}

function generarGuia(datos) {
  let auth_header;
  const dest = extsFunc.transformarDatosDestinatario(datos);

  if (dest.type == "CONVENCIONAL") {
    auth_header = auth_header_convencional;
  } else {
    auth_header = auth_header_pagoContraentrega;
  }

  if (datos.prueba && false) auth_header = auth_header_prueba;
  const centroCosto = `<CentroCosto>${
    datos.prueba ? "" : datos.centro_de_costo
  }</CentroCosto>`;

  let consulta = `<?xml version="1.0" encoding="UTF-8"?>
  <env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope" xmlns:tem="http://tempuri.org/">
    <env:Header>
      ${auth_header}
    </env:Header>
    <env:Body>
      <CargueMasivoExterno xmlns="http://tempuri.org/">
        <envios>
          <CargueMasivoExternoDTO>
            <objEnvios>
              <EnviosExterno>
                <Num_Guia>0</Num_Guia>
                <Num_Sobreporte>0</Num_Sobreporte>
                <Num_SobreCajaPorte>0</Num_SobreCajaPorte>
                <Doc_Relacionado></Doc_Relacionado>
                <Num_Piezas>1</Num_Piezas>
                <Des_TipoTrayecto>1</Des_TipoTrayecto>
                <Ide_Producto>2</Ide_Producto><!--ENVÍO CON MERCACÍA PREMIER-->
                <Des_FormaPago>2</Des_FormaPago>
                <Ide_Num_Identific_Dest>${
                  dest.numero_documento
                }</Ide_Num_Identific_Dest>
                
                <Tipo_Doc_Destinatario>${
                  dest.tipo_documento == "1" ? "NIT" : "CC"
                }</Tipo_Doc_Destinatario>
                <Des_MedioTransporte>1</Des_MedioTransporte>
                <Num_PesoTotal>${datos.peso}</Num_PesoTotal>
                <Num_ValorDeclaradoTotal>${
                  datos.seguro
                }</Num_ValorDeclaradoTotal>
                <Num_VolumenTotal>0</Num_VolumenTotal>
                <Num_BolsaSeguridad>0</Num_BolsaSeguridad>
                <Num_Precinto>0</Num_Precinto>
                <Des_TipoDuracionTrayecto>1</Des_TipoDuracionTrayecto>
                <Des_Telefono>${dest.telefono}</Des_Telefono>
                <Num_Celular>${dest.celular}</Num_Celular>
                <Des_Ciudad>${
                  datos.dane_ciudadD
                }</Des_Ciudad><!--o codigo dane para ciudad destino-->
                <Des_Direccion>${dest.direccion}</Des_Direccion>
                <Nom_Contacto>${dest.nombre}</Nom_Contacto>
                <Des_VlrCampoPersonalizado1>${
                  datos.id_heka
                }</Des_VlrCampoPersonalizado1>
                
                <Num_ValorLiquidado>0</Num_ValorLiquidado>
                <Des_DiceContener>${datos.dice_contener}</Des_DiceContener>
                <Des_TipoGuia>1</Des_TipoGuia>
                <Num_VlrSobreflete>0</Num_VlrSobreflete>
                <Num_VlrFlete>0</Num_VlrFlete>
                <Num_Descuento>0</Num_Descuento>
                <idePaisOrigen>1</idePaisOrigen>
                <idePaisDestino>1</idePaisDestino>
                <Des_IdArchivoOrigen></Des_IdArchivoOrigen>
                <Des_DireccionRemitente>${datos.direccionR} --- Rte: ${
    datos.nombreR
  }</Des_DireccionRemitente><!--Opcional-->
                <Num_PesoFacturado>0</Num_PesoFacturado>
                <Est_CanalMayorista>false</Est_CanalMayorista>
                <Num_IdentiRemitente />
                <Des_CiudadRemitente>${datos.dane_ciudadR}</Des_CiudadRemitente>
                <Num_TelefonoRemitente>${datos.celularR}</Num_TelefonoRemitente>
                <Des_DiceContenerSobre>${
                  datos.dice_contener
                }</Des_DiceContenerSobre>
                <Num_Alto>${datos.alto}</Num_Alto>
                <Num_Ancho>${datos.ancho}</Num_Ancho>
                <Num_Largo>${datos.largo}</Num_Largo>
                <Des_DepartamentoDestino>${
                  datos.departamentoD
                }</Des_DepartamentoDestino>
                <Des_DepartamentoOrigen>${
                  datos.departamentoR
                }</Des_DepartamentoOrigen>
                <Gen_Cajaporte>false</Gen_Cajaporte>
                <Gen_Sobreporte>false</Gen_Sobreporte>
                <Nom_UnidadEmpaque>Generica</Nom_UnidadEmpaque>
                <Nom_RemitenteCanal />
                <Des_UnidadLongitud>cm</Des_UnidadLongitud>
                <Des_UnidadPeso>kg</Des_UnidadPeso>
                <Num_ValorDeclaradoSobreTotal>0</Num_ValorDeclaradoSobreTotal>
                <Num_Factura>0</Num_Factura>
                <Recoleccion_Esporadica>${
                  datos.recoleccion_esporadica
                }</Recoleccion_Esporadica>
                <Des_CorreoElectronico>${dest.correo}</Des_CorreoElectronico>
                <correo_remitente>${datos.correoR}</correo_remitente>
                <Num_Recaudo>${
                  datos.prueba || dest.type == "CONVENCIONAL"
                    ? "0"
                    : datos.valor
                }</Num_Recaudo>
              </EnviosExterno>
            </objEnvios>
          </CargueMasivoExternoDTO>
        </envios>
      </CargueMasivoExterno>
    </env:Body>
  </env:Envelope>`;

  return consulta;
}

function crearGuiaSticker(numeroGuia, id_archivoCargar, type, prueba) {
  console.log(numeroGuia, id_archivoCargar, type, prueba);
  let auth_header, ide_codFacturacion;

  if (type == "CONVENCIONAL") {
    auth_header = auth_header_convencional;
    ide_codFacturacion = Credenciales.Conv.id_codFacturacion;
  } else {
    auth_header = auth_header_pagoContraentrega;
    ide_codFacturacion = Credenciales.PgCon.id_codFacturacion;
  }

  if (prueba && false) {
    auth_header = auth_header_prueba;
    ide_codFacturacion = UsuarioPrueba.id_codFacturacion;
  }

  console.log("numero guia =>", numeroGuia);
  let consulta = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:tem="http://tempuri.org/">
  <soapenv:Header>
    ${auth_header}
  </soapenv:Header>
  <soapenv:Body>
      <GenerarGuiaSticker xmlns="http://tempuri.org/">
        <num_Guia>${numeroGuia}</num_Guia>
        <num_GuiaFinal>${numeroGuia}</num_GuiaFinal>
        <ide_CodFacturacion>${ide_codFacturacion}</ide_CodFacturacion>
        <sFormatoImpresionGuia>1</sFormatoImpresionGuia>
        <Id_ArchivoCargar>${id_archivoCargar}</Id_ArchivoCargar>
        <interno>false</interno>
        <bytesReport></bytesReport>
      </GenerarGuiaSticker>
    </soapenv:Body>
  </soapenv:Envelope>`;

  return consulta;
}

function generarManifiesto(arrGuias, prueba) {
  let auth_header;

  if (arrGuias[0].type == "CONVENCIONAL") {
    auth_header = auth_header_convencional;
  } else {
    auth_header = auth_header_pagoContraentrega;
  }

  if (prueba) auth_header = auth_header_prueba;

  console.log(arrGuias);
  let guias = `<tem:Guias>`;
  for (let i = 0; i < arrGuias.length; i++) {
    guias += `<tem:ObjetoGuia>
      <tem:Numero_Guia>${arrGuias[i].numeroGuia}</tem:Numero_Guia>
    </tem:ObjetoGuia>`;
  }
  guias += `</tem:Guias>`;

  let consulta = `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
  xmlns:tem="http://tempuri.org/">
    <soap:Header>
      ${auth_header}
    </soap:Header>
    <soap:Body>
        <tem:GenerarManifiesto>
            <tem:Ide_Currier>0</tem:Ide_Currier>
            <!--Optional:-->
            <tem:Nombre_Currier>0</tem:Nombre_Currier>
            <tem:Ide_Auxiliar>0</tem:Ide_Auxiliar>
            <!--Optional:-->
            <tem:Nombre_Auxiliar></tem:Nombre_Auxiliar>
            <!--Optional:-->
            <tem:Placa_Vehiculo>0</tem:Placa_Vehiculo>
            <!--Optional:-->
            <tem:Lista_Guias_Xml>
              ${guias}
            </tem:Lista_Guias_Xml>
        </tem:GenerarManifiesto>
    </soap:Body>
  </soap:Envelope>`;

  return consulta;
}

function encriptarContrasena(str) {
  request.post(
    {
      headers: { "Content-Type": "text/xml" },
      url: generacionGuias,
      body: `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <EncriptarContrasena xmlns="http://tempuri.org/">
          <strcontrasena>${str}</strcontrasena>
        </EncriptarContrasena>
      </soap:Body>
    </soap:Envelope>`,
    },
    (err, res, body) => {
      console.log(body);
    }
  );
}

async function joinBase64WhitPdfDoc(arrBase64) {
  try {
    const pdfDoc = await PDFDocument.create();
    let manifestarGuias = new Array();
    let contador = 0;
    for (let base64 of arrBase64) {
      if (base64) {
        let buff = new Buffer.from(base64, "base64");
        let documen = await PDFDocument.load(buff);
        let [page] = await pdfDoc.copyPages(documen, [0]);
        pdfDoc.addPage(page);
        manifestarGuias.push(arrBase64[contador]);
      }
      contador++;
    }
    let resultBase64 = await pdfDoc.saveAsBase64();
    if (contador) {
      return resultBase64;
    } else {
      return 0;
    }
  } catch (error) {
    console.log(error);
  }
}

async function generarStickerManifiesto(arrGuias, prueba) {
  if (arrGuias.length) {
    let base64 = new Promise((resolve, reject) => {
      request.post(
        {
          headers: { "Content-Type": "text/xml" },
          url: prueba ? genGuiasPrueba : generacionGuias,
          body: generarManifiesto(arrGuias, prueba),
        },
        (error, response, body) => {
          if (error) {
            return console.dir(error);
          }

          let xmlResponse = new DOMParser().parseFromString(body, "text/xml");
          // resolve(body);
          try {
            console.log(xmlResponse);
            if (
              xmlResponse.documentElement.getElementsByTagName(
                "GenerarManifiestoResult"
              )[0].textContent == "true"
            ) {
              //------- Espacio para colocar la notificación a enviar a firebase
              //
              resolve(
                xmlResponse.documentElement.getElementsByTagName(
                  "cadenaBytes"
                )[0].textContent
              );
              // console.log(xmlResponse.documentElement.getElementsByTagName("cadenaBytes")[0].textContent)
            } else {
              let errorGeneradoPorGuia =
                xmlResponse.documentElement.getElementsByTagName("Des_Error")[0]
                  .childNodes;
              let guiasConErrores = new Array();

              for (let i = 0; i < errorGeneradoPorGuia.length; i++) {
                let guia = errorGeneradoPorGuia[i].childNodes[0].textContent;
                let resErr = errorGeneradoPorGuia[i].childNodes[1].textContent;

                console.log("guia", guia);
                console.log("destalle", resErr);
                guiasConErrores.push(guia + " - " + resErr);
              }

              let fecha = new Date();
              console.log("Guias con errores", guiasConErrores);

              if (arrGuias.length) {
                db.collection("notificaciones")
                  .add({
                    fecha:
                      fecha.getDate() +
                      "/" +
                      (fecha.getMonth() + 1) +
                      "/" +
                      fecha.getFullYear() +
                      " - " +
                      fecha.getHours() +
                      ":" +
                      fecha.getMinutes(),
                    visible_admin: true,
                    mensaje:
                      "Hubo un problema para crear el manifiesto de las guías " +
                      arrGuias.map((v) => v.id_heka).join(", "),
                    guias: arrGuias.map((v) => v.id_heka),
                    timeline: new Date().getTime(),
                    detalles: guiasConErrores,
                  })
                  .catch((err) => {
                    Console.LOG("Error enviando notificacion");
                    db.collection("errores").add({
                      err: err,
                    });
                  });
              }

              resolve("");
            }
          } catch (error) {
            reject(error);
            console.log(error);
          }
        }
      );
    });
    return await base64;
  } else {
    return 0;
  }
}

function notificarNovedadPorMensaje(guia, ultima_novedad) {
  console.log(
    "tengo que enviar un mensaje al usuario " +
      guia.nombreD +
      " por " +
      ultima_novedad
  );
}

function notificarEntregaEnOficina(guia) {
  return (
    "Tu envío SERVIENTREGA con número " +
    guia.numeroGuia +
    " se encuentra en la oficina principal de tu ciudad, para que sea reclamado máximo en 6 días hábiles."
  );
}
