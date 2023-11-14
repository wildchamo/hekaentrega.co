const path = require("path");

const dominiosFlexii = ["flexii.co", "www.flexi.co", "localhost:6200"];
const obtenerLogo = name => path.join(__dirname, "..", "public", "plantilla", "img", name);
const logoNeutral = (req, res) => {
    let logo = "logo-heka.png";
    const dominio = req.headers.host;
    if(dominiosFlexii.includes(dominio)) logo = "logo-flexi.png"
    
    res.sendFile(obtenerLogo(logo));
}

const logoLight = (req, res) => {
    let logo = "logo-heka-light.png";
    const dominio = req.headers.host;
    if(dominiosFlexii.includes(dominio)) logo = "logo-flexi.png"
    
    res.sendFile(obtenerLogo(logo));
}

const logoDark = (req, res) => {
    let logo = "logo-heka-dark.png";
    const dominio = req.headers.host;
    if(dominiosFlexii.includes(dominio)) logo = "logo-flexi.png"

    res.sendFile(obtenerLogo(logo));
}

module.exports = {logoNeutral, logoLight, logoDark}