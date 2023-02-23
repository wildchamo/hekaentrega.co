const db = require("../keys/firebase").firestore();

exports.estadosGuia = {
    novedad: "NOVEDAD",
    pedido: "PEDIDO",
    pagada: "PAGADA",
    finalizada: "FINALIZADA",
    generada: "GENERADA",
    proceso: "TRANSITO",
    empacada: "EMPACADA",
    eliminada: "ELIMINADA"
}

exports.revisarTipoEstado = (est, transp) => {
    const entregadas = ["ENTREGADO", "Entrega Exitosa"];
    const devoluciones = ["ENTREGADO A REMITENTE", "Devuelto al Remitente"];
    const anulados = ["Documento Anulado"];
  
    if(entregadas.includes(est)) return "entregas";
    if(devoluciones.includes(est)) return "devoluciones";
    return "";
}

exports.traducirMovimientoGuia = (transportadora) => {
    switch (transportadora) {
        case "ENVIA":
            return {
                novedad: "novedad",
                fechaMov: "fechaMov",
                observacion: "observacion",
                descripcionMov: "estado",
                ubicacion: "ciudad"
            }
        case "TCC":
            return {
                novedad: "aclaracion",
                fechaMov: "fechamostrar",
                observacion: "descripcion",
                descripcionMov: "estado",
                ubicacion: "ciudad"
            }
        case "INTERRAPIDISIMO":
            return {
                novedad: "Motivo",
                fechaMov: "Fecha Cambio Estado",
                observacion: "Motivo",
                descripcionMov: "Descripcion Estado",
                ubicacion: "Ciudad"
            }
        default:
            return {
                novedad: "NomConc",
                fechaMov: "FecMov",
                observacion: "DesTipoMov",
                descripcionMov: "NomMov",
                ubicacion: "OriMov"
            }
    }
}

let listaNovedadesServientrega;
exports.revisarNovedadAsync = async (mov, transp) => {
    if(transp === "INTERRAPIDISIMO") {
        return mov.Motivo;
    } else if (transp === "ENVIA" || transp === "TCC") {
        return mov.novedad
    } else {
        listaNovedadesServientrega = listaNovedadesServientrega || await db.collection("infoHeka")
        .doc("novedadesRegistradas").get().then(d => d.data());

        if(listaNovedadesServientrega) {
            return listaNovedadesServientrega.SERVIENTREGA.includes(mov.NomConc)
        }

        return mov.TipoMov === "1";
    }
}

exports.revisarNovedad = (mov, transp) => {
    if(transp === "INTERRAPIDISIMO") {
        return !!mov.Motivo;
    } else if (transp === "ENVIA" || transp === "TCC") {
        return !!mov.novedad
    } else {
        if(listaNovedadesServientrega) {
            return listaNovedadesServientrega.SERVIENTREGA.includes(mov.NomConc)
        } else {
            this.revisarNovedadAsync(mov,transp);
        }

        return mov.TipoMov === "1";
    }
}

exports.guiaEnNovedad = (movimientos, transp) => {
    movimientos.reverse();
    const lastMov = movimientos[0];
    const fechaActual = new Date().getTime();
    const maxHors = 72 * 3.6e6;

    let enNovedad = false;
    let novedad;

    switch(transp) {
        case "INTERRAPIDISIMO": 
        // case "SERVIENTREGA":
            for (const mov of movimientos) {
                const tradFecha = this.traducirMovimientoGuia(transp)["fechaMov"];
                const fechaMov = mov[tradFecha];
                // const [soloFech, soloHr] = fechaMov.split(" ");
                // const soleFechFormat = soloFech.split("/").reverse().join("-");

                // const fechaMovMill = new Date(soleFechFormat + " " + soloHr).getTime();
                const fechaMovMill = new Date(fechaMov).getTime();
                const diferencia = fechaActual - fechaMovMill;
                const novedadEncontrada = this.revisarNovedad(mov, transp);
                
                if(novedadEncontrada) {
                    novedad = mov;
                    enNovedad = diferencia <= maxHors;
                    break;
                }
            }
            break;

        default: 
            novedad = lastMov
            enNovedad = this.revisarNovedad(lastMov, transp);
            break;
    }

    movimientos.reverse();

    console.log("NOVEDAD REGISTRADA", novedad, enNovedad);

    return {enNovedad, novedad, transp};
}

exports.revisarEstadoFinalizado = (estado) => {
    return [
        "ENTREGADO", "Entrega Exitosa", 
        "ENTREGADO A REMITENTE", "Devuelto al Remitente", 
        "Documento Anulado", "Entregado"
    ].includes(estado)
}