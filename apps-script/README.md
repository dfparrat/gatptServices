# Cuenta de Cobro - Google Apps Script

## 1. Crear la Google Sheet

1. Crea una hoja nueva en Google Sheets.
2. Ponle un nombre, por ejemplo `cuentas_de_cobro`.
3. En la fila 1 crea estas columnas exactas, en este orden:

   `id_interno`, `numero_consecutivo`, `estado`, `fecha_radicacion`, `contratante_nombre`, `contratante_cedula`, `contratante_email`, `contratante_celular`, `contratante_forma_pago`, `contratante_fecha_pago`, `contratante_proyecto`, `responsable_iva`, `servicios`, `total_abono`, `fecha_creacion`, `fecha_ultima_edicion`, `garantia`

4. Copia el ID de la hoja desde la URL.

## 2. Crear el proyecto de Apps Script

1. En la hoja, ve a `Extensiones > Apps Script`.
2. Reemplaza el contenido de `Code.gs` con el archivo de este repo.
3. Cambia estas constantes:
   - `SPREADSHEET_ID`
   - `WEB_APP_SHARED_PASSWORD` si quieres otra clave compartida
   - `TOKEN_SECRET`
4. Revisa la sección `BENEFICIARIO` si algún día cambian los datos de pago.

## 3. Publicar como Web App

1. En Apps Script, ve a `Deploy > New deployment`.
2. Elige tipo `Web app`.
3. Configura:
   - Execute as: `Me`
   - Who has access: `Anyone` o `Anyone with Google account`, según tu política interna.
4. Autoriza permisos de Sheets y Gmail la primera vez.
5. Copia la URL del Web App y pégala en `cuenta-de-cobro.html` dentro de `window.GAPT_COBRO_CONFIG.appUrl`.

## 4. Conectar el frontend

1. Abre `cuenta-de-cobro.html`.
2. Reemplaza `REEMPLAZAR_CON_URL_DEL_WEB_APP_DE_APPS_SCRIPT` por la URL real.
3. Sube `cuenta-de-cobro.html`, `CSS/cuenta-de-cobro.css`, `JS/cuenta-de-cobro.js` e `IMG/logo-gparrat.svg` al sitio.

## 5. Flujo esperado

1. Inicias sesión con usuario `Gustavo Parra` o `Duvi` y la clave compartida.
2. Guardas borradores sin asignar consecutivo.
3. Al aprobar, Apps Script asigna el siguiente consecutivo disponible, fija la fecha de radicación, genera el PDF y envía el correo al contratante y a `gaptservicios@gmail.com`.

## 6. Nota técnica

El frontend usa `fetch()` contra el Web App. Si Google Apps Script limita la solicitud por CORS en tu navegador o configuración, la alternativa es alojar la interfaz dentro del propio Apps Script o usar un proxy intermedio, pero este repo ya queda listo para la ruta solicitada.