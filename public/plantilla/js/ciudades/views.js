const percentage = (val, end) => (val * 100 / end).toFixed(2) + "%";

const statisticsDic = {
    devoluciones: "Devoluciones",
    entregas: "Entregas",
    envios: "Envíos",
    novedades: "Novedades",
    presentaronNovedad: "Guías presentan novedad",
    percentage: "Porcentaje de entrega"
}

const simpleTemplate = (key, val) => val && statisticsDic[key] ? `<p>${statisticsDic[key]}: <b>${val}</b></p>` : "";
const templates = data => Object.keys(data).map((k) => simpleTemplate(k, data[k])).join("\n");

export const estadisticasTempl = (estadistica) => {
    estadistica.percentage = percentage(estadistica.entregas, estadistica.envios);
    return `
        <div class="card-body col-md-3">
            <h4>${estadistica.transportadora}</h4>
            ${templates(estadistica)}
        </div>
    `;
}

const templateServientrega = data => `
<form class="row p-3">
    <div class="form-group col-md-4">
    <label for="ciudad-transp-ciudades">Ciudad</label>
    <input type="text" class="form-control" id="ciudad-transp-ciudades" name="ciudad" required>
    </div>
    <div class="form-group col-md-4">
    <label for="dane_ciudad-transp-ciudades">Dane ciudad</label>
    <input type="text" class="form-control" id="dane_ciudad-transp-ciudades" name="dane_ciudad" required>
    </div>
    <div class="form-group col-md-4">
    <label for="departamento-transp-ciudades">Departamento</label>
    <input type="text" class="form-control" id="departamento-transp-ciudades" name="departamento" required>
    </div>
    <div class="form-group col-md-4">
    <label for="forma_pago-transp-ciudades">Forma pago</label>
    <input type="text" class="form-control" id="forma_pago-transp-ciudades" name="forma_pago" required>
    </div>

    <div class="form-group col-md-4">
    <label for="frecuencia-transp-ciudades">Frecuencia</label>
    <input type="text" class="form-control" id="frecuencia-transp-ciudades" name="frecuencia" required>
    </div>
    <div class="form-group col-md-4">
    <label for="id-transp-ciudades">Id</label>
    <input type="text" class="form-control" id="id-transp-ciudades" name="id" required>
    </div>
    <div class="form-group col-md-4">
    <label for="modo_transporte-transp-ciudades">Modo transporte</label>
    <input type="text" class="form-control" id="modo_transporte-transp-ciudades" name="modo_transporte" required>
    </div>
    <div class="form-group col-md-4">
    <label for="region-transp-ciudades">Región</label>
    <input type="text" class="form-control" id="region-transp-ciudades" name="region" required>
    </div>
    <div class="form-group col-md-4">
    <label for="restriccion_fisica-transp-ciudades">Restricción física</label>
    <input type="text" class="form-control" id="restriccion_fisica-transp-ciudades" name="restriccion_fisica" required>
    </div>
    <div class="form-group col-md-4">
    <label for="tiempoentrega_comercial-transp-ciudades">Tiempo entrega comercial</label>
    <input type="text" class="form-control" id="tiempoentrega_comercial-transp-ciudades" name="tiempoentrega_comercial" required>
    </div>
    <div class="form-group col-md-4">
    <label for="tiempoentrega_comercial_minutos-transp-ciudades">Tiempo entrega comercial minutos</label>
    <input type="text" class="form-control" id="tiempoentrega_comercial_minutos-transp-ciudades" name="tiempoentrega_comercial_minutos" required>
    </div>
    <div class="form-group col-md-4">
    <label for="tipo_distribucion-transp-ciudades">Tipo de distribución</label>
    <input type="text" class="form-control" id="tipo_distribucion-transp-ciudades" name="tipo_distribucion" required>
    </div>
    <div class="form-group col-md-4">
    <label for="tipo_trayecto-transp-ciudades">Tipo de trayecto</label>
    <input type="text" class="form-control" id="tipo_trayecto-transp-ciudades" name="tipo_trayecto" required>
    </div>
</form>
`
export const transportadoraTempl = data => templateServientrega(data);