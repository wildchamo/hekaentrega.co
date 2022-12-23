const fetch = require("node-fetch");
const db = require("../keys/firebase").firestore();
const {plantillas, credenciales} = require("../keys/messageBird");

const { key, chanel_id, namespace, endpoint } = credenciales;

const numberToNDC = number => number ? "+57" + number.toString().slice(-10) : "";

async function singleMessage(number, message) {
    const numero = numberToNDC(number);

    const respuesta = await fetch(endpoint + "/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "AccessKey " + key
        },
        body: JSON.stringify({
            "to": numero,
            "from": chanel_id,
            "type": "text",
            "content": {
                "text": message,
                "disableUrlPreview": false
            }
        })        
    }).then(d => d.json())
    .catch(err => {
        return {
            error: true,
            message: err.message
        }
    });

    return respuesta;

}

async function singleMessageCtrl(req, res) {
    const {number, message} = req.query;

    const response = await singleMessage(number, message)

    res.json(response);
}

async function templateMessage(templateName, number, params) {
    
    const numero = numberToNDC(number);
    console.log(templateName, params);
    const body = {
        "to": numero,
        "type": "hsm",
        "from": chanel_id,
        "content": {
            "hsm": {
                "namespace": namespace,
                "templateName": templateName,
                "language": {
                    "code": "es"
                },
                "params": params,
            }
        }
    }

    console.log(body);
    
    const respuesta = await fetch(endpoint + "/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "AccessKey " + key,
        },
        body: JSON.stringify(body)
    }).then(d => d.json());

    console.log(respuesta);

    return respuesta;

}

async function templateMessageCtrl(req,res) {
    const {number, params} = req.body;
    const templateName = req.params.templateName;
    try {
        const response = await templateMessage(templateName, number, params);
        res.json(response);
    } catch (e) {
        res.status(409).json({
            error:true,
            message: e.message
        })
    }
}

module.exports = {singleMessageCtrl, templateMessageCtrl, templateMessage}
