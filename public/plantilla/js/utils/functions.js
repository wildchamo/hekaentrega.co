//Utilizada para cambiar el contenido de un botón mientras se carga la información
export class ChangeElementContenWhileLoading {
    //Recibe el elemento que normalmente se desea deshabilitar
    constructor(e) {
        this.el = $(e);
        this.initVal = $(e).html();
        this.charger = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Cargando...`
    }

    // Inicializa la función y cambia de una vez el contenido elemento. También lo inhabilita.
    init() {
        this.el.prop("disabled", true);
        this.el.html(this.charger);
    }

    // finaliza la carga y vuelve el contenido del elemento a su estado original
    end() {
        this.el.prop("disabled", false);
        this.el.html(this.initVal);
    }
}

//Utilizada para comprobar errores de cada input conforme el tipo de listener ingresado
export class DetectorErroresInput {
    // Recibe los selectores que contarán con las mismas características
    constructor (...selectors) {
        this.selectors = selectors;
        this.booleans = new Array();
        this.config = new Object();
        this.message = "Valor inválido";
        this.errores = new Array();
    }

    //Instrucciones generales
    static instructions() {
        const exampleBoolean = {
            operator: 'Toma el tipo de operador lógico a tomar en cuenta. ej: "RegExp", "<", ">" (solo están los operadores básicos)',
            message: 'El caracter "{forbidden}" no está permitido, lo quiero sustituir por {sustitute}',
            selector: "Toma un selector particular para agregale una condición extra",
            selectors: "Toma un arreglo de selectores para agregale una condición extra",
            forbid: /[^\wñÑ\s-]/g, //Condición que se tomará en cuenta según el operador ingresado,
            sustitute: "Valor a sustituir en el input",
            case: "Caso que voy a tomar en cuenta (longitud y number)"
        }

        console.log("Ejeplo de configuraciones ", exampleBoolean);
    }

    // Inicializa el listener a ejecutar en el(los) input(s)
    init(type = "input") {
        // le agrega el listener a cada selector agregado
        this.selectors.forEach(selector => {
            $(selector).on(type, (e) => {
                this.value = e.target.value;
                const id = "#" + e.target.getAttribute("id") || selector;

                // Revisa el index del selector actual, para comprobar el error registrado
                const index = this.booleans.findIndex(bool => this.comprobateBoolean(id, bool));
                const bool = index != -1;
    
                // Para tomar el tipo de excepción devuelta según el arreglo de booleanos ingresados
                const boolTaken = this.booleans[index];

                let message;
                if(boolTaken) {
                    const sustitute = boolTaken.sustitute;
                    const forbid = boolTaken.forbid;
                    const type = typeof forbid;
                    message = boolTaken.message;
                    const character = type === "object" ? this.value.match(forbid)[0] : forbid
    
                    if(sustitute || sustitute === "") e.target.value = e.target.value.replace(forbid, sustitute);
                    if(message) {
                        message = message
                        .replace("{forbidden}", character)
                        .replace("{sustitute}", sustitute);
                    }
                }

                bool ? this.addError(id) : this.removeError(id)

                message = message ? message : this.message;
                this.showHideErr(e.target, bool, message);
            });
        })

        return this;
    }

    // Toma el selector y las configuraciones del boolean, 
    // para saber si el elemento cumple con las condiciones dadas
    comprobateBoolean(selector, boolConfig) {
        const caso = this.viewCase(boolConfig.case);
        const operator = boolConfig.operator;
        const valor = boolConfig.forbid;
        if((boolConfig.selector && selector !== boolConfig.selector ) 
        || (boolConfig.selectors && !boolConfig.selectors.includes(selector))) return false;
        let bool = false;
        if(!this.value) return false;

        // Toma el operador que va a ejecutar la excepción
        switch (operator) {
            case ">":
                bool = caso > valor
                break;
            case "<":
                bool = caso < valor
                break;
            case ">=":
                bool = caso >= valor
                break;
            case "<=":
                bool = caso <= valor
                break;
            case "==":
                bool = caso == valor
                break;
            case "!=":
                bool = caso != valor
                break;
            case "contains":
                bool = valor.split("|").some(v => caso.includes(v));
                break;
            case "regExp":
                bool = valor.test(caso)
                break;
        }
        return bool;
    }

    // Para revisar si se desea comprobar la longitud o si es una comprobación matemática
    // para devolver, sea la longitud del string, o parsea el valor a número
    viewCase(caso) {
        let respuesta;
        switch (caso) {
            case "length":
                respuesta = this.value.length
                break;
            case "number":
                respuesta = parseInt(this.value)
                break
            default:
                respuesta = this.value
        }
        return respuesta || this.value
    }

    disableEnableElements(type) {
        const toEdit = this.config.disableElements;
        if(toEdit) {
            toEdit.forEach(el => {
                $(el).prop("disabled", type === "disable" ? true : false);
            });
        }
    }

    addError(selector) {
        this.errores.push(selector)
    }

    hasError() {
        return this.errores.length
    }

    removeError(selector) {
        this.errores = this.errores.filter(error => error !== selector);
    }

    // Para agrega un mensaje por defecto
    set setDefaultMessage(message) {
        this.message = message
    }

    // para insertar una sola condicion a la lista de condiciones
    set insertBoolean(boolean) {
        this.booleans.push(boolean);
    }

    // Para agregar todas las condiciones necesarias o sustituir las que ya están
    set setBooleans(booleans) {
        this.booleans = booleans;
    }

    // Agregar configuraciones generales para los inputs
    set setConfig(config) {
        this.config = config
    }
    
    // Analiza si existe un error y el elemento que lo arroja
    showHideErr(id, hasErr, message) {
        if(hasErr) {
            if($(id).parent().children(".mensaje-error").length) {
                $(id).parent().children(".mensaje-error").text(message)
            } else {
                $(id).parent().append(`<p class="mensaje-error mt-1 text-center ${this.config.className || "text-danger"}">${message}</p>`);
            }
            this.disableEnableElements("disable");
        } else {
            if($(id).parent().children(".mensaje-error")) {
                $(id).parent().children(".mensaje-error").remove();
            }
            this.disableEnableElements("enable");
        }
    }
}

// función utilizada principalmente para tomar los inputs y verificar que no estén vacíos
export function verificador(arr, scroll, mensaje) {
    /*
        arr: Recibe un arreglo de ids de inputs a analizar, también recibe un string,
        scroll: si se desea hacer un croll al elemento coincidente
        mensaje: El mensaje que se desea agregar debajo del o los inputs agregado(s) en arr
    */
    let inputs = document.querySelectorAll("input");
    let mensajes_error = document.querySelectorAll(".mensaje-error");
    let error = [], primerInput;

    mensajes_error.forEach(err => {
        err.remove()
    });

    for(let i = 0; i < inputs.length; i++){
        inputs[i].classList.remove("border-danger");
    }

    if(arr){
        if(typeof arr == "string") {
            if(addId(arr)) {
                primerInput = document.getElementById(arr).parentNode;
                return true;
            }
        } else {
            for(let id of arr){
                let inp = document.getElementById(id)
                if(addId(id)){
                    error.push(id);
                    if(mensaje) {
                        if(inp.parentNode.querySelector(".mensaje-error")) {
                            inp.parentNode.querySelector(".mensaje-error").innerText = mensaje;
                        } else {
                            let p = document.createElement("p");
                            p.innerHTML = mensaje;
                            p.setAttribute("class", "mensaje-error text-danger text-center mt-1")
                            inp.parentNode.appendChild(p);
                        }
                    }
                    // console.log(inp);
                    primerInput = document.getElementById(error[0]).parentNode;
                }
            }
        }

        // Toma el primer input que arroja la excepción para mostrarlo en la ventana por scroll
        if(primerInput) {
            primerInput.querySelector("input").focus()
            // primerInput.scrollIntoView({
            //     behavior: "smooth"
            // });
        }
    }
    
    function addId(id){
        let elemento = document.getElementById(id);
        if(!elemento.value){
            elemento.classList.add("border-danger");
            return true
        } else if(scroll) {
            elemento.classList.add("border-danger");
            return scroll == "no-scroll" ? false : true
        } else {
            elemento.classList.remove("border-danger");
            return false
        }
    }

    return error

}

export async function enviarNotificacion(options) {
    //Este es el patrón utilizado para el objeto que se ingresa en las notificaciones
    let example_data = {
        visible_user: true,
        visible_admin: false,
        icon: ["exclamation", "danger"],
        detalles: "arrErroresUsuario", //mostrar una lista de posibles causas
        user_id: "vinculo.id_user",
        mensaje: "Mensaje a mostrar en la notificación",
        href: "id destino"
    }
    let fecha = genFecha("ltr").replace(/\-/g, "/");
    let hora = new Date().getHours();
    let minutos = new Date().getMinutes();    
    if(hora <= 9) hora = "0" + hora;
    if(minutos <= 9) minutos = "0" + minutos;
    fecha += ` - ${hora}:${minutos}`;;
    let notificacion = {
        fecha,
        timeline: new Date().getTime()
    };

    for(let option in options) {
        notificacion[option] = options[option];
    }

    console.log(notificacion);

    return await firebase.firestore().collection("notificaciones").add(notificacion)
};

export const segmentarArreglo = (arr, rango) => {
    const res = [];
    
    for (let i = 0; i < arr.length; i += rango) {
        const last = Math.min(i + rango, arr.length)
        res.push(arr.slice(i, last))
    }

    return res;
}

export function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
  