export const cardBodegaRecoleccion = data => {
    return `
        <li class="list-group-item"><span class="mr-2">
            <span>${data.centro_de_costo} - ${data.codigo_sucursal}</span> 
            <button class="btn btn-primary" data-action="solicitarRecoleccion" data-codigo_sucursal="${data.codigo_sucursal}">
                Solicitar Recolección
                <span class="badge badge-light badge-pill">${data.guias.length}</span>
            </button>
        </li>
    `;
}


export const formRecoleccion = data => {
    return `
        <form>
            <div class="mb-3">
                <label for="fecha-recoleccion">Fecha Recolección</label>
                <input type="datetime-local" class="form-control" required id="fecha-recoleccion" name="fechaRecogida">
                <div class="invalid-feedback">Please provide a valid city.</div>
            </div>
            <div class="mb-3 d-none">
                <input type="number" class="form-control" required name="idSucursalCliente" value="${data.codigo_sucursal}">
            </div>
        </form>
    `;
}