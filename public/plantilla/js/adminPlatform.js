import { cargarOficinas, descargarInformeOficinasAdm } from "./oficinas/index.js";
import "./pagos/index.js";
import "./infoHeka/manejoUsuarios.js";
import "./movimientoGuias/registroMovimientos.js";
import "./notificaciones/index.js";
import { ValidarAccesoAdmin } from "./auth/handlers.js";
import { renderListaCiudades } from "./ciudades/index.js";

ValidarAccesoAdmin();
renderListaCiudades();
$("#descargar-informe-oficinas").click(descargarInformeOficinasAdm);
$("#buscador-oficinas").click(cargarOficinas);