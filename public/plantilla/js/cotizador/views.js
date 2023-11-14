export function detallesFlexii(objData) {
    return `
    <div class="card">
      <div class="card-header bg-primary text-light">
        FLEXII - COD: ${objData.transportadora.substring(0, 4)}
      </div>
      <div class="card-body">
        <div class="card my-3 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">Cotización</h5>
            <p class="card-text d-flex justify-content-between">Valor declarado <b>$${convertirMiles(objData.detalles.seguro)}</b></p>
            <p class="card-text d-flex justify-content-between">Valor recaudo <b>$${convertirMiles(objData.detalles.recaudo)}</b></p>
            <p class="card-text d-flex justify-content-between">Peso <b>${objData.detalles.peso_liquidar}</b></p>
            <p class="card-text d-flex justify-content-between">Tiempo de entrega <b>${objData.tiempoEntrega} días hábiles</b></p>
          </div>
        </div>
        
        <div class="card my-3 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">Costo Transportadora</h5>
            <p class="card-text d-flex justify-content-between">Valor flete <b>$${convertirMiles(objData.flete)}</b></p>
            <p class="card-text d-flex justify-content-between">Comisión transportadora <b>$${convertirMiles(objData.sobreflete)}</b></p>
            <p class="card-text d-flex justify-content-between">Seguro mercancía <b>$${convertirMiles(objData.seguroMercancia)}</b></p>
          </div>
        </div>
          
        <div class="card my-3 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">Costo Flexii</h5>
            <p class="card-text d-flex justify-content-between">Comisión heka <b>$${convertirMiles(objData.sobrefleteHeka)}</b></p>
          </div>
        </div>
  
        <div class="card my-3 shadow-sm border-primary">
          <div class="card-body">
            <h3 class="card-text d-flex justify-content-between">Total:  
              <b>
                $${convertirMiles(objData.costoEnvio)}
              </b>
            </h3>
          </div>
        </div>
      </div>
    </div>
    `;
  }