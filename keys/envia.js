const credentialsEnv = {
    endpoint: "http://200.69.100.66/ServicioLiquidacionRESTpruebas/Service1.svc/",
    usuario: "EMPCAR01",
    password: "EMPCAR1",
    cod_cuenta: 30,
    cod_cuenta_rec: 30,
    // cod_cuenta_rec: 11491,
    authentication: "Basic RU1QQ0FSMDE6RU1QQ0FSMQ=="
}

const credentialsProd = {
    endpoint: "http://200.69.100.66/ServicioLiquidacionREST/Service1.svc",
    consultEndpoint: "http://200.69.100.66/ServicioRESTConsultaEstados/Service1Consulta.svc/",
    usuario: "F70ERAMI",
    password: "F70EDC14",
    // cod_cuenta: "01-001-0015707",
    // cod_cuenta_rec: "01-001-0015708",
    cod_cuenta: 15707,
    cod_cuenta_rec: 15708,
    authentication: "Basic RjcwRVJBTUk6RjcwRURDMTQ="
}

module.exports = credentialsProd;
// module.exports = credentialsEnv;