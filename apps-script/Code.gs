const TIME_ZONE = 'America/Bogota';
const SHEET_NAME = 'cuentas_de_cobro';
const SPREADSHEET_ID = '1BS202ubbtfls-d35y_PZYCXCzr6zUgCC51D5eQ6EHRM';
const WEB_APP_SHARED_PASSWORD = 'GAPT-2026';
const TOKEN_SECRET = PropertiesService.getScriptProperties().getProperty('TOKEN_SECRET');
const WHATSAPP_TO = '573228927995';
const WHATSAPP_GRAPH_VERSION = 'v21.0';
const WHATSAPP_PHONE_NUMBER_ID = PropertiesService.getScriptProperties().getProperty('WHATSAPP_PHONE_NUMBER_ID');
const WHATSAPP_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('WHATSAPP_ACCESS_TOKEN');

// Cambia estos datos aquí si el beneficiario cambia en el futuro.
const BENEFICIARIO = {
  nombre: 'Gustavo Adolfo Parra Trujillo',
  cedula: '1.019.014.761',
  email: 'dfparrat2012@gmail.com',
  celular: '(+57) 3228927995',
  cuentaPago: 'Nequi 3228927995, a nombre de Gustavo Adolfo Parra Trujillo, CC 1019014761'
};

const ORGANIZATION_EMAIL = 'gaptservicios@gmail.com';
const LEGAL_TEXT = 'Por favor abstenerse de hacer retención en la fuente, estos valores son declarados por contador personal';
const DEFAULT_GUARANTEE = 'Garantía Servicio prestado de 12 Meses por daños no relacionados a daño físico o daños por humedad';
const HEADERS = [
  'id_interno',
  'numero_consecutivo',
  'estado',
  'fecha_radicacion',
  'contratante_nombre',
  'contratante_cedula',
  'contratante_email',
  'contratante_celular',
  'contratante_forma_pago',
  'contratante_fecha_pago',
  'contratante_proyecto',
  'responsable_iva',
  'servicios',
  'total_abono',
  'fecha_creacion',
  'fecha_ultima_edicion',
  'garantia'
];

function doGet(e) {
  try {
    const payload = parsePayload_(e);
    const requestId = String(payload.requestId || (e && e.parameter && e.parameter.requestId) || '');
    const responseMode = String(payload.responseMode || (e && e.parameter && e.parameter.responseMode) || '');
    const callback = String(payload.callback || (e && e.parameter && e.parameter.callback) || '');

    const response = executeAction_(payload);
    return formatResponse_(responseMode, requestId, callback, response);
  } catch (error) {
    const errorResponse = { ok: false, message: error.message || String(error) };
    const payload = parsePayload_(e);
    const requestId = String(payload.requestId || (e && e.parameter && e.parameter.requestId) || '');
    const responseMode = String(payload.responseMode || (e && e.parameter && e.parameter.responseMode) || '');
    const callback = String(payload.callback || (e && e.parameter && e.parameter.callback) || '');
    return formatResponse_(responseMode, requestId, callback, errorResponse);
  }
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const requestId = String(payload.requestId || (e && e.parameter && e.parameter.requestId) || '');
    const responseMode = String(payload.responseMode || (e && e.parameter && e.parameter.responseMode) || '');
    const callback = String(payload.callback || (e && e.parameter && e.parameter.callback) || '');

    const response = executeAction_(payload);
    return formatResponse_(responseMode, requestId, callback, response);
  } catch (error) {
    const errorResponse = { ok: false, message: error.message || String(error) };
    const payload = parsePayload_(e);
    const requestId = String(payload.requestId || (e && e.parameter && e.parameter.requestId) || '');
    const responseMode = String(payload.responseMode || (e && e.parameter && e.parameter.responseMode) || '');
    const callback = String(payload.callback || (e && e.parameter && e.parameter.callback) || '');
    return formatResponse_(responseMode, requestId, callback, errorResponse);
  }
}

function executeAction_(payload) {
  const action = String(payload.action || '').trim();

  if (!action) {
    return { ok: true, message: 'Cuenta de cobro API operativa' };
  }

  if (action !== 'login' && action !== 'health') {
    authenticate_(payload);
  }

  switch (action) {
    case 'login':
      return login_(payload);
    case 'listDrafts':
      return { ok: true, records: listRecords_() };
    case 'getRecord':
      return { ok: true, record: getRecordById_(payload.id_interno) };
    case 'saveDraft':
      return saveDraft_(payload);
    case 'deleteDraft':
      return deleteDraft_(payload.id_interno);
    case 'approve':
      return approve_(payload);
    case 'health':
      return { ok: true, message: 'ok' };
    default:
      return { ok: false, message: 'Acción no soportada.' };
  }
}

function formatResponse_(responseMode, requestId, callback, payload) {
  if (responseMode === 'postMessage') {
    return bridge_(requestId, payload);
  }
  if (responseMode === 'jsonp') {
    return jsonp_(callback, payload);
  }
  return json_(payload);
}

function login_(payload) {
  const username = normalizeText_(payload.username || payload.user || '');
  const password = String(payload.password || '');
  const normalized = username.toLowerCase();
  const allowedUsers = {
    'gustavo parra': 'Gustavo Parra',
    'gustavo': 'Gustavo Parra',
    'duvi': 'Duvi'
  };

  if (!allowedUsers[normalized]) {
    throw new Error('Usuario no autorizado.');
  }

  if (password !== WEB_APP_SHARED_PASSWORD) {
    throw new Error('Clave incorrecta.');
  }

  return {
    ok: true,
    user: allowedUsers[normalized],
    token: createToken_(allowedUsers[normalized])
  };
}

function authenticate_(payload) {
  const token = String(payload.token || '');
  if (!token) {
    throw new Error('Sesión no encontrada.');
  }

  const parsed = verifyToken_(token);
  if (!parsed) {
    throw new Error('La sesión expiró o no es válida.');
  }

  return parsed;
}

function createToken_(user) {
  const expiration = Date.now() + 12 * 60 * 60 * 1000;
  const payload = user + '|' + expiration;
  const signature = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, TOKEN_SECRET));
  return Utilities.base64EncodeWebSafe(payload) + '.' + signature;
}

function verifyToken_(token) {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const payload = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString();
  const expected = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, TOKEN_SECRET));
  if (expected !== parts[1]) {
    return null;
  }

  const segments = payload.split('|');
  if (segments.length !== 2) {
    return null;
  }

  const expiration = Number(segments[1]);
  if (!Number.isFinite(expiration) || expiration < Date.now()) {
    return null;
  }

  return { user: segments[0], exp: expiration };
}

function saveDraft_(payload) {
  const sheet = getSheet_();
  const now = new Date();
  const record = buildRecordFromPayload_(payload, {
    idInterno: payload.id_interno || '',
    estado: 'Borrador',
    numeroConsecutivo: '',
    fechaRadicacion: '',
    fechaCreacion: now,
    fechaUltimaEdicion: now
  });

  validateRecord_(record);
  const existing = findRowById_(sheet, record.id_interno);

  if (existing.rowIndex > -1) {
    const current = rowToRecord_(existing.values);
    if (current.estado === 'Aprobado') {
      throw new Error('La cuenta ya fue aprobada y no puede editarse.');
    }
    record.fecha_creacion = current.fecha_creacion || formatTimestamp_(now);
    record.numero_consecutivo = '';
    record.estado = 'Borrador';
    record.fecha_radicacion = '';
    writeRow_(sheet, existing.rowIndex, record);
  } else {
    record.id_interno = record.id_interno || Utilities.getUuid();
    record.fecha_creacion = formatTimestamp_(now);
    record.fecha_ultima_edicion = formatTimestamp_(now);
    appendRow_(sheet, record);
  }

  return {
    ok: true,
    message: 'Borrador guardado.',
    record: getRecordById_(record.id_interno)
  };
}

function deleteDraft_(idInterno) {
  const sheet = getSheet_();
  const match = findRowById_(sheet, idInterno);
  if (match.rowIndex === -1) {
    throw new Error('No se encontró el borrador.');
  }

  const current = rowToRecord_(match.values);
  if (current.estado === 'Aprobado') {
    throw new Error('No se puede eliminar una cuenta aprobada.');
  }

  sheet.deleteRow(match.rowIndex);
  return { ok: true, message: 'Borrador eliminado.' };
}

function approve_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet_();
    const now = new Date();
    const record = buildRecordFromPayload_(payload, {
      idInterno: payload.id_interno || '',
      estado: 'Borrador',
      numeroConsecutivo: '',
      fechaRadicacion: '',
      fechaCreacion: now,
      fechaUltimaEdicion: now
    });

    validateRecord_(record);

    const existing = findRowById_(sheet, record.id_interno);
    if (existing.rowIndex > -1) {
      const current = rowToRecord_(existing.values);
      if (current.estado === 'Aprobado') {
        throw new Error('Esta cuenta ya fue aprobada.');
      }
      record.fecha_creacion = current.fecha_creacion || formatTimestamp_(now);
    } else {
      record.id_interno = record.id_interno || Utilities.getUuid();
      record.fecha_creacion = formatTimestamp_(now);
      appendRow_(sheet, {
        ...record,
        estado: 'Borrador',
        numero_consecutivo: '',
        fecha_radicacion: ''
      });
    }

    const rowToApprove = findRowById_(sheet, record.id_interno);
    const consecutive = getNextConsecutive_(sheet);
    record.numero_consecutivo = consecutive;
    record.estado = 'Aprobado';
    record.fecha_radicacion = formatLongDate_(now);
    record.fecha_ultima_edicion = formatTimestamp_(now);

    writeRow_(sheet, rowToApprove.rowIndex, record);

    const pdfBlob = generatePdf_(record);
    sendApprovalEmail_(record, pdfBlob);
    const whatsappResult = sendApprovalWhatsApp_(record, pdfBlob);

    return {
      ok: true,
      message: 'Cuenta aprobada, enviada por correo y WhatsApp.',
      record: getRecordById_(record.id_interno),
      whatsapp_message_id: whatsappResult.messageId
    };
  } finally {
    lock.releaseLock();
  }
}

function listRecords_() {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return [];
  }

  return data.slice(1)
    .map(rowToRecord_)
    .filter((record) => record.id_interno)
    .sort((left, right) => {
      if (left.estado !== right.estado) {
        return left.estado === 'Borrador' ? -1 : 1;
      }
      return String(right.fecha_creacion || '').localeCompare(String(left.fecha_creacion || ''));
    });
}

function getRecordById_(idInterno) {
  const sheet = getSheet_();
  const match = findRowById_(sheet, idInterno);
  if (match.rowIndex === -1) {
    throw new Error('No se encontró el registro.');
  }
  return rowToRecord_(match.values);
}

function buildRecordFromPayload_(payload, defaults) {
  const services = normalizeServices_(payload.servicios || []);
  return {
    id_interno: normalizeText_(defaults.idInterno || payload.id_interno || Utilities.getUuid()),
    numero_consecutivo: defaults.numeroConsecutivo || '',
    estado: defaults.estado || 'Borrador',
    fecha_radicacion: defaults.fechaRadicacion || '',
    contratante_nombre: normalizeText_(payload.contratante_nombre || ''),
    contratante_cedula: normalizeText_(payload.contratante_cedula || ''),
    contratante_email: normalizeText_(payload.contratante_email || ''),
    contratante_celular: normalizeText_(payload.contratante_celular || ''),
    contratante_forma_pago: normalizeText_(payload.contratante_forma_pago || ''),
    contratante_fecha_pago: normalizeText_(payload.contratante_fecha_pago || ''),
    contratante_proyecto: normalizeText_(payload.contratante_proyecto || ''),
    responsable_iva: Boolean(payload.responsable_iva),
    servicios: JSON.stringify(services),
    total_abono: Number(payload.total_abono || 0),
    fecha_creacion: formatTimestamp_(defaults.fechaCreacion || new Date()),
    fecha_ultima_edicion: formatTimestamp_(defaults.fechaUltimaEdicion || new Date()),
    garantia: normalizeText_(payload.garantia || DEFAULT_GUARANTEE)
  };
}

function normalizeServices_(services) {
  const parsed = Array.isArray(services) ? services : JSON.parse(String(services || '[]'));
  return parsed
    .map((service) => ({
      concepto: normalizeText_(service.concepto || ''),
      descripcion: normalizeText_(service.descripcion || ''),
      cantidad: Number(service.cantidad || 0),
      valor_unitario: Number(service.valor_unitario || 0)
    }))
    .filter((service) => service.concepto || service.descripcion || service.cantidad || service.valor_unitario);
}

function validateRecord_(record) {
  const required = [
    ['contratante_nombre', 'El nombre del contratante es obligatorio.'],
    ['contratante_cedula', 'La cédula del contratante es obligatoria.'],
    ['contratante_email', 'El correo del contratante es obligatorio.'],
    ['contratante_celular', 'El celular del contratante es obligatorio.'],
    ['contratante_forma_pago', 'La forma de pago es obligatoria.'],
    ['contratante_fecha_pago', 'La fecha de pago es obligatoria.']
  ];

  required.forEach(([field, message]) => {
    if (!record[field]) {
      throw new Error(message);
    }
  });

  if (!record.servicios || JSON.parse(record.servicios).length === 0) {
    throw new Error('Debes incluir al menos un servicio.');
  }

  const services = JSON.parse(record.servicios);
  services.forEach((service, index) => {
    if (!service.concepto) {
      throw new Error('El concepto del servicio #' + (index + 1) + ' es obligatorio.');
    }
    if (!(Number(service.cantidad) > 0)) {
      throw new Error('La cantidad del servicio #' + (index + 1) + ' debe ser mayor a cero.');
    }
    if (!(Number(service.valor_unitario) > 0)) {
      throw new Error('El valor unitario del servicio #' + (index + 1) + ' debe ser mayor a cero.');
    }
  });

  if (!(Number(record.total_abono) >= 0)) {
    throw new Error('El total abono no puede ser negativo.');
  }
}

function generatePdf_(record) {
  const services = JSON.parse(record.servicios || '[]');
  const totalFacturado = services.reduce((sum, service) => sum + Number(service.cantidad || 0) * Number(service.valor_unitario || 0), 0);
  const totalAbono = Number(record.total_abono || 0);
  const saldoPendiente = Math.max(totalFacturado - totalAbono, 0);
  const logo = buildLogoDataUri_();

  const rows = services.map((service) => {
    const subtotal = Number(service.cantidad || 0) * Number(service.valor_unitario || 0);
    return [
      '<tr>',
      '<td>' + escapeHtml_(service.concepto) + '</td>',
      '<td>' + escapeHtml_(service.descripcion) + '</td>',
      '<td class="num">' + formatInteger_(service.cantidad) + '</td>',
      '<td class="num">' + formatMoney_(service.valor_unitario) + '</td>',
      '<td class="num">' + formatMoney_(subtotal) + '</td>',
      '</tr>'
    ].join('');
  }).join('');

  const html = [
    '<!DOCTYPE html>',
    '<html><head><meta charset="utf-8">',
    '<style>',
    'body{font-family:Arial,sans-serif;color:#111;margin:0;padding:28px;} ',
    '.sheet{border:1px solid #111;padding:20px;} ',
    '.head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:20px;} ',
    '.logo{width:220px;} ',
    '.title{text-align:right;} ',
    '.title h1{margin:0;font-size:24px;letter-spacing:2px;} ',
    '.title .meta{margin-top:8px;font-size:12px;line-height:1.5;} ',
    '.section{margin-top:14px;} ',
    '.grid{display:flex;gap:20px;} ',
    '.box{flex:1;border-top:1px solid #111;padding-top:10px;} ',
    '.box h2{margin:0 0 8px 0;font-size:15px;text-transform:uppercase;letter-spacing:1px;} ',
    '.meta-line{font-size:12px;line-height:1.5;} ',
    'table{width:100%;border-collapse:collapse;margin-top:14px;} ',
    'th,td{border:1px solid #111;padding:8px;font-size:11px;vertical-align:top;} ',
    'th{background:#f3f3f3;text-transform:uppercase;letter-spacing:0.5px;} ',
    '.num{text-align:right;white-space:nowrap;} ',
    '.totals{width:320px;margin-left:auto;margin-top:12px;} ',
    '.totals td{font-size:12px;} ',
    '.footer-block{margin-top:18px;font-size:11px;line-height:1.6;} ',
    '.signature{margin-top:38px;display:flex;justify-content:space-between;gap:20px;align-items:flex-end;} ',
    '.line{width:44%;border-top:1px solid #111;padding-top:6px;text-align:center;font-size:11px;} ',
    '.signed-name{font-family:"STXingkai","KaiTi","STKaiti","DFKai-SB",serif;font-size:18px;line-height:1.1;margin-bottom:4px;} ',
    '.muted{font-size:10px;color:#333;} ',
    '</style></head><body>',
    '<div class="sheet">',
    '<div class="head">',
    '<div class="logo"><img src="' + logo + '" alt="GPARRAT" style="width:100%;height:auto;"></div>',
    '<div class="title"><h1>CUENTA DE COBRO</h1><div class="meta">No. ' + escapeHtml_(String(record.numero_consecutivo || '')) + '<br>Fecha: ' + escapeHtml_(record.fecha_radicacion || '') + '</div></div>',
    '</div>',
    '<div class="grid">',
    '<div class="box"><h2>Contratante</h2><div class="meta-line">' + [
      'Nombre: ' + escapeHtml_(record.contratante_nombre),
      'Cédula: ' + escapeHtml_(record.contratante_cedula),
      'Email: ' + escapeHtml_(record.contratante_email),
      'Celular: ' + escapeHtml_(record.contratante_celular),
      'Proyecto: ' + escapeHtml_(record.contratante_proyecto || 'N/A'),
      'Forma de pago: ' + escapeHtml_(record.contratante_forma_pago),
      'Fecha de pago: ' + escapeHtml_(record.contratante_fecha_pago),
      'Responsable IVA: ' + (record.responsable_iva ? 'Sí' : 'No')
    ].join('<br>') + '</div></div>',
    '<div class="box"><h2>Cuenta por cobrar</h2><div class="meta-line">' + [
      'Número: ' + escapeHtml_(String(record.numero_consecutivo || '')),
      'Fecha de radicación: ' + escapeHtml_(record.fecha_radicacion || ''),
      'Beneficiario: ' + escapeHtml_(BENEFICIARIO.nombre),
      'Cédula: ' + escapeHtml_(BENEFICIARIO.cedula),
      'Pago: ' + escapeHtml_(BENEFICIARIO.cuentaPago)
    ].join('<br>') + '</div></div>',
    '</div>',
    '<div class="section">',
    '<table><thead><tr><th>Concepto</th><th>Descripción</th><th>Cantidad</th><th>Valor unitario</th><th>Total</th></tr></thead><tbody>' + rows + '</tbody></table>',
    '</div>',
    '<table class="totals">',
    '<tr><td>Total valor facturado</td><td class="num">' + formatMoney_(totalFacturado) + '</td></tr>',
    '<tr><td>Total abono</td><td class="num">' + formatMoney_(totalAbono) + '</td></tr>',
    '<tr><td><strong>Total valor pendiente</strong></td><td class="num"><strong>' + formatMoney_(saldoPendiente) + '</strong></td></tr>',
    '</table>',
    '<div class="footer-block"><strong>Garantía:</strong> ' + escapeHtml_(record.garantia || DEFAULT_GUARANTEE) + '<br><strong>Nota legal:</strong> ' + escapeHtml_(LEGAL_TEXT) + '</div>',
    '<div class="footer-block"><strong>Datos de pago:</strong> ' + escapeHtml_(BENEFICIARIO.cuentaPago) + '</div>',
    '<div class="signature"><div class="line">Firma recibido</div><div class="line"><div class="signed-name">Gustavo Parra Trujillo</div>Autorizado por GAPT Servicios</div></div>',
    '<div class="muted">Documento generado automáticamente por el sistema interno de cuentas de cobro.</div>',
    '</div></body></html>'
  ].join('');

  return HtmlService.createHtmlOutput(html).getBlob().getAs(MimeType.PDF).setName('Cuenta de Cobro No. ' + record.numero_consecutivo + '.pdf');
}

function sendApprovalEmail_(record, pdfBlob) {
  const subject = 'Cuenta de cobro aprobada No. ' + record.numero_consecutivo + ' - GAPT Servicios';
  const body = [
    'Buen día,',
    '',
    'Adjuntamos la cuenta de cobro aprobada No. ' + record.numero_consecutivo + '.',
    '',
    'Contratante: ' + record.contratante_nombre,
    'Fecha de radicación: ' + record.fecha_radicacion,
    'Total abono: ' + formatMoney_(record.total_abono),
    '',
    'Este correo fue generado automáticamente por el flujo interno de aprobación.',
    '',
    'Saludos cordiales,',
    'GAPT Servicios'
  ].join('\n');

  GmailApp.sendEmail(
    [record.contratante_email, ORGANIZATION_EMAIL].join(','),
    subject,
    body,
    {
      attachments: [pdfBlob],
      name: 'GAPT Servicios'
    }
  );
}

function sendApprovalWhatsApp_(record, pdfBlob) {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    throw new Error('Falta configurar WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_ACCESS_TOKEN en Script Properties.');
  }

  const to = normalizePhone_(WHATSAPP_TO);
  const fileName = 'Cuenta-de-Cobro-No-' + record.numero_consecutivo + '.pdf';
  const uploadUrl = 'https://graph.facebook.com/' + WHATSAPP_GRAPH_VERSION + '/' + WHATSAPP_PHONE_NUMBER_ID + '/media';
  const mediaBlob = pdfBlob.copyBlob().setName(fileName);

  const uploadResponse = UrlFetchApp.fetch(uploadUrl, {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + WHATSAPP_ACCESS_TOKEN
    },
    payload: {
      messaging_product: 'whatsapp',
      file: mediaBlob
    },
    muteHttpExceptions: true
  });

  const uploadStatus = uploadResponse.getResponseCode();
  const uploadText = uploadResponse.getContentText();
  const uploadData = parseJsonSafe_(uploadText);
  const mediaId = uploadData && uploadData.id;

  if (!(uploadStatus >= 200 && uploadStatus < 300) || !mediaId) {
    throw new Error('No se pudo subir el PDF a WhatsApp. Código ' + uploadStatus + '. Respuesta: ' + uploadText);
  }

  const messageUrl = 'https://graph.facebook.com/' + WHATSAPP_GRAPH_VERSION + '/' + WHATSAPP_PHONE_NUMBER_ID + '/messages';
  const caption = [
    'Cuenta de cobro aprobada No. ' + record.numero_consecutivo,
    'Contratante: ' + record.contratante_nombre,
    'Fecha de radicación: ' + record.fecha_radicacion,
    'Total abono: ' + formatMoney_(record.total_abono)
  ].join(' | ');

  const messagePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'document',
    document: {
      id: mediaId,
      filename: fileName,
      caption: caption
    }
  };

  const messageResponse = UrlFetchApp.fetch(messageUrl, {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + WHATSAPP_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(messagePayload),
    muteHttpExceptions: true
  });

  const messageStatus = messageResponse.getResponseCode();
  const messageText = messageResponse.getContentText();
  const messageData = parseJsonSafe_(messageText);
  const messageId = messageData && messageData.messages && messageData.messages[0] && messageData.messages[0].id;

  if (!(messageStatus >= 200 && messageStatus < 300) || !messageId) {
    throw new Error('No se pudo enviar WhatsApp. Código ' + messageStatus + '. Respuesta: ' + messageText);
  }

  return {
    mediaId: mediaId,
    messageId: messageId,
    to: to
  };
}

function normalizePhone_(value) {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (!digits) {
    throw new Error('El número de WhatsApp destino no es válido.');
  }
  return digits;
}

function parseJsonSafe_(text) {
  try {
    return JSON.parse(String(text || '{}'));
  } catch (error) {
    return null;
  }
}

function getSheet_() {
  if (SPREADSHEET_ID.indexOf('REEMPLAZAR_') === 0) {
    throw new Error('Debes reemplazar SPREADSHEET_ID con el ID real de la Google Sheet.');
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const matches = HEADERS.every((header, index) => currentHeaders[index] === header);
  if (!matches) {
    sheet.clearContents();
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function appendRow_(sheet, record) {
  sheet.appendRow(recordToRow_(record));
}

function writeRow_(sheet, rowIndex, record) {
  sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([recordToRow_(record)]);
}

function recordToRow_(record) {
  return HEADERS.map((header) => {
    if (header === 'responsable_iva') {
      return Boolean(record[header]);
    }
    return record[header] !== undefined ? record[header] : '';
  });
}

function rowToRecord_(row) {
  const record = {};
  HEADERS.forEach((header, index) => {
    record[header] = row[index];
  });
  record.responsable_iva = record.responsable_iva === true || String(record.responsable_iva).toUpperCase() === 'TRUE';
  record.servicios = parseServices_(record.servicios);
  record.total_abono = Number(record.total_abono || 0);
  record.numero_consecutivo = record.numero_consecutivo ? Number(record.numero_consecutivo) : '';
  return record;
}

function parseServices_(value) {
  try {
    return JSON.parse(value || '[]');
  } catch (error) {
    return [];
  }
}

function findRowById_(sheet, idInterno) {
  const data = sheet.getDataRange().getValues();
  for (let index = 1; index < data.length; index += 1) {
    if (String(data[index][0]) === String(idInterno)) {
      return { rowIndex: index + 1, values: data[index] };
    }
  }
  return { rowIndex: -1, values: null };
}

function getNextConsecutive_(sheet) {
  const data = sheet.getDataRange().getValues();
  const approvedNumbers = data.slice(1)
    .map((row) => Number(row[1]))
    .filter((value) => Number.isFinite(value) && value > 0);
  return (approvedNumbers.length ? Math.max.apply(null, approvedNumbers) : 0) + 1;
}

function formatTimestamp_(date) {
  return Utilities.formatDate(new Date(date), TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
}

function formatLongDate_(date) {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const current = new Date(date);
  const month = months[current.getMonth()];
  return capitalize_(month) + ' ' + current.getDate() + ' de ' + current.getFullYear();
}

function capitalize_(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function formatMoney_(value) {
  return '$' + Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

function formatInteger_(value) {
  return Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

function normalizeText_(value) {
  return String(value || '').trim();
}

function parsePayload_(e) {
  if (!e) {
    return {};
  }

  if (e.parameter && e.parameter.payload) {
    try {
      const parsed = JSON.parse(e.parameter.payload);
      if (e.parameter.requestId) parsed.requestId = e.parameter.requestId;
      if (e.parameter.responseMode) parsed.responseMode = e.parameter.responseMode;
      return parsed;
    } catch (error) {
      throw new Error('El payload enviado no es JSON válido.');
    }
  }

  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      throw new Error('El cuerpo de la solicitud no es JSON válido.');
    }
  }

  if (e.parameter) {
    return { ...e.parameter };
  }

  return {};
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonp_(callback, payload) {
  const safeCallback = normalizeCallbackName_(callback);
  const body = safeCallback + '(' + JSON.stringify(payload) + ');';
  return ContentService.createTextOutput(body)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function normalizeCallbackName_(callback) {
  const input = String(callback || '').trim();
  if (!input) {
    return 'callback';
  }
  if (!/^[a-zA-Z_$][0-9a-zA-Z_$.]*$/.test(input)) {
    return 'callback';
  }
  return input;
}

function bridge_(requestId, payload) {
  const message = {
    type: 'gapt-cobro-response',
    requestId: requestId || '',
    payload: payload
  };

  const html = '<!doctype html><html><body><script>' +
    '(function(){var message=' + safeJsonForScript_(message) + ';' +
    'window.parent && window.parent.postMessage(message, "*");' +
    '})();' +
    '</script></body></html>';

  return HtmlService.createHtmlOutput(html);
}

function safeJsonForScript_(value) {
  return JSON.stringify(value).replace(/<\//g, '<\\/');
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildLogoDataUri_() {
  return 'https://gaptservicios.com.co/IMG/Logo%20sample.JPG?v=20260720';
}