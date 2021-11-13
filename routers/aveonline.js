const express = require("express");
const router = express.Router();
const aveoCtrl = require("../controllers/aveonline");

router.get("/auth", aveoCtrl.auth);

router.post("/cotizar/:type", aveoCtrl.auth, aveoCtrl.cotizar);

router.post("/crearGuia", aveoCtrl.auth, aveoCtrl.crearGuia);
router.get("/crearManifiesto", aveoCtrl.auth, aveoCtrl.generarRelacion);
router.get("/imprimirManifiesto/:nro", aveoCtrl.consultarRelacion);

module.exports = router;