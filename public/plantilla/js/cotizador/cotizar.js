import { pathCotizador } from "../config/api.js";
import { getRandomInt } from "../utils/functions.js";
import { detallesFlexii } from "./views.js";

/**
 * Función encargada de redirigir la cotización, según el cotizador que se requiera según los parámetros que se ingresen
 * al botón que se ingrese
 * @param {Event} e 
 */
export function cotizar(e) {
    // Se analiza las clases que posee el botón para saber si se va autilizar el cotizador flexii
    // o el cotizador por defecto (que usa la forma convencional)
    if(e.target.classList.contains("cotizador-2")) {
        cotizadorFlexii();
    } else {
        cotizador();
    }
}

//#region COTIZADOR FLEXII
let datoscoti
async function cotizadorFlexii() {
  let ciudadR = document.getElementById("ciudadR");
  let ciudadD = document.getElementById("ciudadD");
  
  datoscoti={
    // "peso": 1,
    // "alto": 10,
    // "largo": 10,
    // "ancho": 10,
    // "valorSeguro": 50000,
    // "valorRecaudo": 50000,
    // "idDaneCiudadOrigen": "05001000",
    // "idDaneCiudadDestino": "05001000",
    tipo: "CONVENCIONAL",
    ciudadR: value("ciudadR"),
    ciudadD: value("ciudadD"),
    dane_ciudadR: ciudadR.dataset.dane_ciudad,
    dane_ciudadD: ciudadD.dataset.dane_ciudad,
    ave_ciudadR: ciudadR.dataset.nombre_aveo,
    ave_ciudadD: ciudadD.dataset.nombre_aveo,
    peso: parseInt(value("Kilos")),
    valorSeguro: parseInt(value("seguro-mercancia")),
    valorRecaudo: parseInt(value("seguro-mercancia")),
    ancho: value("dimension-ancho"),
    largo: value("dimension-largo"),
    alto: value("dimension-alto"),
  };
  
  console.log(datoscoti)
  
  // validad obejeto datoscorti != ""
  if (
    true
  ) {
    //Si todos los campos no estan vacios
    if (
      !datoscoti.dane_ciudadR ||
      !datoscoti.dane_ciudadD ||
      !/^.+\(.+\)$/.test(datoscoti.ciudadR) ||
      !/^.+\(.+\)$/.test(datoscoti.ciudadD)
    ) {
      alert(
        "Recuerda ingresar una ciudad válida, selecciona entre el menú desplegable"
      );
      verificador(["ciudadR", "ciudadD"], true);
    } else if (
      datoscoti.seguro <
        transportadoras[codTransp].limitesValorDeclarado(datoscoti.peso)[0] ||
        datoscoti.seguro >
        transportadoras[codTransp].limitesValorDeclarado(datoscoti.peso)[1]
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
    } else if (datoscoti.ancho <
        transportadoras[codTransp].limitesLongitud[0] ||
        datoscoti.largo <
        transportadoras[codTransp].limitesLongitud[0] ||
        datoscoti.alto < transportadoras[codTransp].limitesLongitud[0] ||
        datoscoti.ancho >
        transportadoras[codTransp].limitesLongitud[1] ||
        datoscoti.largo >
        transportadoras[codTransp].limitesLongitud[1] ||
        datoscoti.alto > transportadoras[codTransp].limitesLongitud[1]
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
      const loader = new ChangeElementContenWhileLoading("#boton_cotizar_2,#boton_cotizar");
      loader.init();

      let mostrador = document.getElementById("result_cotizacion");
      mostrador.style.display = "block";
      let respuesta = await responseFlexii(datoscoti);
      // funcion que lee respuesta del api e inserta card
      mostrador.innerHTML = respuesta
      loader.end();

      // ***** Agregando los datos que se van a enviar para crear guia ******* //
      datos_a_enviar.ciudadR = ciudadR.dataset.ciudad;
      datos_a_enviar.ciudadD = ciudadD.dataset.ciudad;
      datos_a_enviar.departamentoD = ciudadD.dataset.departamento;
      datos_a_enviar.departamentoR = ciudadR.dataset.departamento;
      datos_a_enviar.alto = datoscoti.alto;
      datos_a_enviar.ancho = datoscoti.ancho;
      datos_a_enviar.largo = datoscoti.largo;
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

async function cotizarApi(datos, transportadora,type){
  console.log("COTIZANDO API")
  try {
    const cotizacion = await fetch(pathCotizador + '/' + transportadora,
    {
      method: 'POST',
      headers: {
        'Authentication': 'nk58Yq6Y1GUFbaaRkdMFuwmDLxO2',
        'Content-Type': 'application/json'
      },
      body:JSON.stringify({
        "peso": parseInt(datos.peso),
        "alto": parseInt(datos.alto),
        "largo": parseInt(datos.largo),
        "ancho": parseInt(datos.ancho),
        "valorSeguro": parseInt(datos.valorSeguro),
        "valorRecaudo": parseInt(datos.valorRecaudo),
        "idDaneCiudadOrigen": datos.dane_ciudadR,
        "idDaneCiudadDestino": datos.dane_ciudadD,
        "tipo": type,
        sumarCostoEnvio: !!datos.sumar_envio
      })
    }).then(httpResponse => httpResponse.json()
    )
    return cotizacion
  } catch (error) {
    console.log(error)
  } 
}

async function validaPagoContraentregaFlexii() {
  //le muestra al usuario las opciones del pago contraentrega y
  // devuelve un objeto conciertas opciones a implementar al cotizador
  let recaudo = await Swal.fire({
    title: "<strong>Valor de Recaudo</strong>",
    icon: "info",
    html: `
            <p>Recuerde que es posible que el "valor Declarado" será sustituido por el valor de recaudo</p>
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
      let sumar_envio = $("#sumar-envio-cotizador").prop("checked");
      let restar_saldo = $("#restar-saldo-cotizador").prop("checked");

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


      return {
        sumar_envio, restar_saldo, valor_recaudo: parseInt(valor_recaudo)
      };
    },
  }).then((result) => {
    return result.isConfirmed ? result : "";
  });

  return recaudo;
}

async function responseFlexii(datos) {

  //Primero le consulta al usuario por el tipo de envío
  let type = await seleccionarTipoEnvio();

  //si no selecciona ninguno, no devuelve nada
  if (!type) {
    return "";
  } else if (type == "PAGO DESTINO") {
    // result_cotizacion.debe = true;
  } else if (type == "PAGO CONTRAENTREGA") {
    // Para esta selección activa un nuevo modal que me devuleve los datos de cotización
    let resp_usuario = await validaPagoContraentregaFlexii();
    
    if (!resp_usuario) {
      return "";
    }

    datos.sumar_envio = !!resp_usuario.value.sumar_envio;
    datos.valorRecaudo = resp_usuario.value.valor_recaudo;
  } else {
    // de resto calcula el costo del envío directamente con el seguro de mercancía o valor declarado
    datos_a_enviar.debe = false;
  }

  const codTransp = ["COORDINADORA", "INTERRAPIDISIMO", "SERVIENTREGA"];
  const tSeleccionada = codTransp[getRandomInt(codTransp.length)];

  const cotizacion = await cotizarApi(datos, tSeleccionada, type);

  if(cotizacion.error) {
    console.log(cotizacion);
    Swal.fire("Error Cod. " + tSeleccionada.substring(0,4), cotizacion.body.message || cotizacion.body, "error");
    return "";
  }
  
  const result_cotizacion = cotizacion.body;
  console.log(result_cotizacion)
  //Lleno algunos campos de los datos de cotizacióm
  datoscoti.peso = result_cotizacion.detalles.peso_real;
  datoscoti.costo_envio = result_cotizacion.costoEnvio;
  datoscoti.valor = result_cotizacion.valor;
  // datos_de_cotizacion.seguro = result_cotizacion.seguro;
  datoscoti.sumar_envio = result_cotizacion.sumar_envio;
  datoscoti.debe = result_cotizacion.debe;
  datoscoti.type = type;

  return detallesFlexii(result_cotizacion);
  
}
//#endregion
