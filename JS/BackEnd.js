var mobile = (/iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase()));  
if (mobile) 
{ 
    $('.hidemobile').css('display', 'none'); // OR you can use $('.hidemobile').hide();
} 
else 
{ 
    $('.hideweb').css('display', 'none'); // OR you can use $('.hideweb').hide();
}


//btnwapp.addEventListener('click', enviarMensaje)
function enviarMensaje()
{
	var inputName = document.querySelector('#nombre').value
	var inputDireccion = document.querySelector('#direccion').value
	var inputVisita = document.querySelector('#visita').value
	var inputCalentador = document.querySelector('#calentador').value
	//var inputFile = document.querySelector('#file').value
	var inputMensaje = document.querySelector('#msgwapp').value

    
	const texto = [
        `Nombre: ${encodeURIComponent(inputName)}`,
        `Dirección: ${encodeURIComponent(inputDireccion)}`,
        `Visita: ${encodeURIComponent(inputVisita)}`,
        `Calentador: ${encodeURIComponent(inputCalentador)}`,
        `Mensaje: ${encodeURIComponent(inputMensaje)}`
    ].join("%0A");

    // Elige la URL basada en el dispositivo
    const whatsappUrl = mobile 
        ? `https://api.whatsapp.com/send?phone=+573132031426&text=${texto}`
        : `https://web.whatsapp.com/send?phone=+573132031426&text=${texto}`;

    // Abre la URL en una nueva pestaña
    window.open(whatsappUrl, "_blank");
}
