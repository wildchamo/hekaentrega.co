
import { ChangeElementContenWhileLoading, verificador, DetectorErroresInput } from "../utils/functions.js";
import { handleAuthErrors, findUser } from "./handlers.js";
import { auth, firestore as db } from "../config/firebase.js";

import Stepper from "../utils/stepper.js";

const registerStep = new Stepper("#register-form");
const rgOfiForm = new Stepper("#rgOficina-form");
registerStep.init();
rgOfiForm.init();

registerStep.findErrorsBeforeNext = revisarErroresParticularesRegistro;
rgOfiForm.findErrorsBeforeNext = revisarErroresParticularesRegistro;

const comprobacionesRegistro = habilitarComprobacionesDeInputs();

function habilitarComprobacionesDeInputs() {
    const varifyInputsImportants = new DetectorErroresInput(".verificacion-especial");
    varifyInputsImportants.init("blur");
    varifyInputsImportants.setBooleans = [{
        operator: '<',
        message: 'La contraseña debe tener como mínimo 8 carácteres',
        selector: "#register-password",
        forbid: 8,
        case: "length"
    }, {
        operator: 'regExp',
        message: 'El carácter {forbidden} no está permitido',
        selector: "#register-empresa",
        forbid: /[^\w\d\s_\-ñÑ]/g
    }, {
        operator: '>=',
        message: 'Has llegado al límite de carácteres ({forbidden}).',
        selector: "#register-empresa",
        forbid: 25,
        case: "length"
    }, {
        operator: 'regExp',
        message: 'Recuerde ingresar solo números.',
        selectors: ["#register-celular", "#register-celular2", "#register-numero_documento"],
        forbid: /[^\d]/
    }, {
        operator: '!=',
        message: 'El celular debe tener 10 díjitos',
        selector: "#register-celular",
        forbid: 10,
        case: "length",
    }];

    return [varifyInputsImportants]
}

function revisarErroresParticularesRegistro(container) {
    const ids = new Array();
    const inputs = $(container).find("input:required");
    inputs.each((i, input) => ids.push(input.getAttribute("id")));

    const [comprobador_particular] = comprobacionesRegistro;
    
    let hasError = false;
    let firstError;
    
    if(comprobador_particular.hasError()) {
        const firstSelector = comprobador_particular.errores[0];
        firstError = $(firstSelector);
        hasError = true;
    } 
    
    if(!hasError) {
        const inner_comprobator = verificador(ids, null, "Este campo es obligatorio.");
        if(inner_comprobator.length) {
            const firstSelector = inner_comprobator[0];
            firstError = $("#"+firstSelector);
            hasError = true;
        }
    }
    
    if(hasError) {
        const step = firstError.parents(".step");
        registerStep.moveTo(step);
    }

    return hasError;
}

async function registrarNuevoUsuario(toSend, data) {
    const {correo, con, nombre_empresa} = data;
    const existe_empresa = await verificarExistencia(toSend, data.cod_empresa);
    if(existe_empresa) throw new Error('¡El nombre de empresa "' +nombre_empresa+ '" ya existe!');

    const newUser = await createUserWithEmailAndPassword(correo, con);

    if(newUser.error) throw new Error(newUser.message);

    data.ingreso = newUser.uid;

    console.log(data);
    await db.collection(toSend).add(data);
    await auth.currentUser.sendEmailVerification();
    await findUser(data.ingreso);
}

async function createUserWithEmailAndPassword(email, password) {
    const user = await auth.createUserWithEmailAndPassword(email, password)
    .then(cr => cr.user)
    .catch(handleAuthErrors);

    return user;
}

async function verificarExistencia(coll, cod_empresa) {
    return await db.collection(coll).where("cod_empresa", "==", cod_empresa)
    .get().then(querySnapshot => {
        return querySnapshot.size;
    });
}

function datosRegistroUsuario(formData) {
    const toSend = new Object();
    for(let registro of formData) {
        toSend[registro[0]] = registro[1].trim();
    }

    toSend.objetos_envio = $("[data-objeto_envio]").map((i,it) => it.getAttribute("data-objeto_envio")).get();
    toSend.direccion_completa = toSend.direccion + ", " + toSend.barrio + ", " + toSend.ciudad;

    if(!toSend.objetos_envio.length) {
        const inpObjetos = $("#register-objetos_envio");
        const step = inpObjetos.parents(".step");
        inpObjetos.addClass("border-danger");
        registerStep.moveTo(step);

        throw new Error("Recuerde agregar la(s) cosas que normalmente envía.")
    }

    const empresa = toSend.nombre_empresa.replace(/\s/g, "");
    
    toSend.centro_de_costo = "Seller" + empresa;
    toSend.cod_empresa = empresa.toLowerCase();
    toSend.fecha_creacion = new Date();

    return toSend;
}

function datosRegistroOficina(formData) {
    const toSend = new Object();
    for(let registro of formData) {
        toSend[registro[0]] = registro[1].trim();
    }

    toSend.direccion_completa = toSend.direccion + ", " + toSend.barrio + ", " + toSend.ciudad;

    const empresa = toSend.nombre_empresa.replace(/\s/g, "");
    
    toSend.centro_de_costo = "Offi" + empresa;
    toSend.cod_empresa = empresa.toLowerCase();
    toSend.fecha_creacion = new Date();

    return toSend;
}

function checkTerms(checkQuery) {
    if(!$(checkQuery).prop("checked")) {
        verificador(["register-terms"], true, "Debe aceptar términos y condiciones.")
        return false;
    }

    return true;
}

export default async function registro(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const formName = form.name;
    const loader = new ChangeElementContenWhileLoading("#registrar-nuevo-usuario");
    let data, collName, termsChecked
    
    if(revisarErroresParticularesRegistro(form)) return;
    
    switch(formName) {
        case "oficina":
            data = datosRegistroOficina(formData);
            collName = "oficinas";
            termsChecked = checkTerms("#rgOficina-terms");
            break;
        default:
            data = datosRegistroUsuario(formData);
            collName = "usuarios";
            termsChecked = checkTerms("#register-terms");
    }

    if(!termsChecked) return;

    loader.init();

    registrarNuevoUsuario(collName, data)
    .catch(error => {
        const errorEl = document.createElement("p");
        errorEl.setAttribute("class", "mt-1 text-danger text-center mensaje-error");
        errorEl.innerText = error.message;
        console.log(error);
        form.append(errorEl);
        loader.end();
    });
}