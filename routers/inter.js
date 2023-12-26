const express = require("express");
const app = express();
const router = express.Router();
const interRouter = require("../controllers/inter");
const serviceInter = require("../controllers/inter/service");

router.get("/consultarGuia", interRouter.consultarGuia);

router.post("/cotizar", interRouter.cotizar);

router.post("/crearGuia", interRouter.crearGuia);

router.get("/crearStickerGuia/:id", interRouter.crearStickerGuia);

router.get("/imprimirManifiesto/:guias", interRouter.imprimirManifiesto);

router.get("/utilidades/:numeroGuia", interRouter.utilidades);

router.post("/crearGuia", interRouter.crearGuia);

router.post("/recogidaesporadica", serviceInter.createSporadicCollections);

router.post("/planilladeenvios", serviceInter.createSpreadsheet);


module.exports = router