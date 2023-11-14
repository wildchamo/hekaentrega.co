const hekaBrand = {
  nombre: "HEKA",
  cod: "H001",
  nombre_completo: "Heka Entrega",
  cel_area_comercial: "+57 312 463 8608",
  wsp_link: "https://wa.link/jwryoa",
  correo: " atencion@hekaentrega.co",
  hosts: "hekaentrega.co",
  dominios: ["hekaentrega.co", "www.flehekaentregaxi.co"],
  index: "/",
};

const flexxiBrand = {
  nombre: "FLEXII",
  cod: "F001",
  nombre_completo: "Flexii",
  cel_area_comercial: "+57 312 463 8608",
  wsp_link: "https://wa.link/jwryoa",
  correo: " atencion@flexii.co",
  hosts: "flexii.co",
  dominios: ["flexii.co", "www.flexi.co"],
  index: "/",
};

const localBrand = {
  nombre: "LOCAL",
  cod: "L001",
  nombre_completo: "Local Host",
  cel_area_comercial: "+57 777 463 8608",
  wsp_link: "https://wa.link/jwryoaaaa",
  correo: " atencion@local.co",
  hosts: "localhost:6200",
  dominios: ["localhost:6200"],
  index: "/",
  seccionesEliminadas: ["pagos", "novedades"],
};

const brands = [hekaBrand, flexxiBrand, localBrand];

hostnameReader();
function hostnameReader() {
  const hostname = window.location.host;
  const redirectFlexii = $("#redirectFlexii")
  const redirectHeka = $("#redirectHeka")
  const pageTitle = $("#pageTitle");
  const indexLink = $(".indexLink");
  const element = $(".copyrightWord");
  const brandName = $("#brandName");
  const correoAtencionCliente = $(".correo-atencion");
  const celAtencionCliente = $(".cel-atencion");
  // Buscamos el objeto de la empresa que alguno de los dominios coincida con el actual
  // Si no detecta uno, utiliza el de heka por defecto
  const brand = brands.find((b) => b.dominios.includes(hostname)) || hekaBrand;

  // Una vez que se tengan los cambios, se toma en cuenta los valores de la marca obtenida
  if(brand == localBrand) cambiarTema();
  // if(brand == localBrand) redirectHeka.addClass("d-none");
  if(brand == hekaBrand) redirectFlexii.addClass("d-none");
  if(brand == flexxiBrand) redirectHeka.addClass("d-none");
  pageTitle.text(brand.nombre_completo);
  indexLink.attr("href", brand.index);
  element.text(brand.nombre_completo);
  brandName.text(brand.nombre);
  correoAtencionCliente.text(brand.correo);
  correoAtencionCliente.attr("href", "mailto:" + brand.correo);
  celAtencionCliente.text(brand.cel_area_comercial)
  celAtencionCliente.attr("href", brand.wsp_link);
}
function cambiarTema() {
  // Obtiene el elemento :root del documento
  var root = document.documentElement;

  // Cambia el valor de la variable --primary
  root.style.setProperty("--primary", "orange");

  let navvar = document.getElementById("accordionSidebar");
  let buttons = document.querySelectorAll(".btn-primary");
  let texts = document.querySelectorAll(".text-primary");
  let brandName = document.getElementById("brandName");

  brandName.innerText = "flexii.co";

  buttons.forEach(function (button) {
    button.style.backgroundColor = "orange";
    button.style.color = "white";
    button.style.borderColor = "white"
  });

  texts.forEach(function (text) {
    text.style.setProperty("color", "orange", "important");
  });

  navvar.style.setProperty(
    "background-image",
    "linear-gradient(180deg, #f07605 10%, #f07605 100%)",
    "important"
  );
  navvar.style.setProperty("background-image", "#f07605", "important");
}




