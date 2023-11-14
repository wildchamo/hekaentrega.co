const endpoint = "https://hekaentrega.co/Api";
// const endpoint = "http://localhost:6201/Api";

const pathCiudades = endpoint + "/Ciudades";
const pathCiudadesLista = pathCiudades + "/Lista";
const pathCiudadDane = pathCiudades + "/CiudadDane";
const pathEstadisticasCiudad = pathCiudades + "/Estadisticas";

const pathCotizador = endpoint + "/Heka/Cotizar";

export {
    pathCiudadesLista,
    pathCiudadDane,
    pathEstadisticasCiudad,
    pathCotizador
}