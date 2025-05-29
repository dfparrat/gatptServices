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
        ? `https://api.whatsapp.com/send?phone=+573228927995&text=${texto}`
        : `https://web.whatsapp.com/send?phone=+573228927995&text=${texto}`;

    // Abre la URL en una nueva pestaña
    window.open(whatsappUrl, "_blank");
}
//Send information from PopUp
// Mostrar popup al cargar la página
$(document).ready(function() {
    // Mostrar el modal después de 2 segundos
    setTimeout(function() {
        var welcomeModal = new bootstrap.Modal(document.getElementById('welcomeModal'));
        welcomeModal.show();
    }, 2000);

    // Manejar el envío a WhatsApp
    $('#sendWhatsAppBtn').click(function() {
        const firstName = $('#firstName').val();
        const lastName = $('#lastName').val();
        const serviceNeeded = $('#serviceNeeded').val();
        
        if (!firstName || !lastName || !serviceNeeded) {
            alert('Por favor completa todos los campos.');
            return;
        }
        
        // Formatear el mensaje para WhatsApp
        const message = `Hola, mi nombre es ${firstName} ${lastName}. Estoy interesado en el servicio de: ${serviceNeeded}. Por favor dame más información de precios y horarios.`;
        
        // Codificar el mensaje para URL
        const encodedMessage = encodeURIComponent(message);
        
        // Tu número de WhatsApp (reemplaza con el real)
        const whatsappNumber = '573228927995'; // Ejemplo: número colombiano
        
        // Redirigir a WhatsApp
        window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
        
        // Cerrar el modal
        $('#welcomeModal').modal('hide');
        
        // Opcional: Guardar en localStorage para no mostrar de nuevo
        localStorage.setItem('welcomePopupShown', 'true');
    });
    
    // Opcional: No mostrar si ya se vio antes
    if (localStorage.getItem('welcomePopupShown')) {
        $('#welcomeModal').modal('hide');
    }
});

// Función al verificar el CAPTCHA
function onCaptchaSuccess(response) {
    if (response) {
        document.getElementById("captcha-popup").style.display = "none";
        document.getElementById("whatsappLink").style.display = "block";
	document.getElementById("whatsappBtn").style.display = "flex";
        document.getElementById("callBtn").style.display = "flex";
    }
};
