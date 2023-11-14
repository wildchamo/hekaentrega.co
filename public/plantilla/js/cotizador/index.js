import { cotizar } from "./cotizar.js";
import { llenarBodegasCotizador, llenarProductos } from "./plantillas.js";

const btnCotizarGlobal = $(".cotizador-button");
const opcionesEl = $(".cotizador-beta");

btnCotizarGlobal.on("click", cotizar);

export function iniciarOpcionesCotizador() {
    llenarBodegasCotizador();
    llenarProductos();
    opcionesEl.removeClass("d-none");
    $("#cotizador .form-control-user").removeClass("form-control-user");
}