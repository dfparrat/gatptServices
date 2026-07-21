(function () {
	'use strict';

	const config = window.GAPT_COBRO_CONFIG || {};
	const appUrl = String(config.appUrl || '').trim();
	const storageKey = 'gaptCuentaCobroSession';
	const storageUserKey = 'gaptCuentaCobroUser';
	const currencyFormatter = new Intl.NumberFormat('es-CO', {
		style: 'currency',
		currency: 'COP',
		maximumFractionDigits: 0
	});

const state = {
	token: localStorage.getItem(storageKey) || '',
	user: localStorage.getItem(storageUserKey) || '',
	records: [],
	currentId: '',
	approved: false
};

	let jsonpSequence = 0;

	const elements = {
		authGrid: document.getElementById('authGrid'),
		loginView: document.getElementById('loginView'),
		appView: document.getElementById('appView'),
		loginForm: document.getElementById('loginForm'),
		loginUser: document.getElementById('loginUser'),
		loginPassword: document.getElementById('loginPassword'),
		sessionLabel: document.getElementById('sessionLabel'),
		draftStatePill: document.getElementById('draftStatePill'),
		consecutiveLabel: document.getElementById('consecutiveLabel'),
		alertBox: document.getElementById('alertBox'),
		accountForm: document.getElementById('accountForm'),
		recordId: document.getElementById('recordId'),
		servicesBody: document.getElementById('servicesBody'),
		recordsBody: document.getElementById('recordsBody'),
		addServiceBtn: document.getElementById('addServiceBtn'),
		saveDraftBtn: document.getElementById('saveDraftBtn'),
		approveBtn: document.getElementById('approveBtn'),
		logoutBtn: document.getElementById('logoutBtn'),
		newDraftBtn: document.getElementById('newDraftBtn'),
		totalFacturado: document.getElementById('totalFacturado'),
		totalPendiente: document.getElementById('totalPendiente'),
		totalAbono: document.getElementById('total_abono'),
		contratanteNombre: document.getElementById('contratante_nombre'),
		contratanteCedula: document.getElementById('contratante_cedula'),
		contratanteEmail: document.getElementById('contratante_email'),
		contratanteCelular: document.getElementById('contratante_celular'),
		contratanteFormaPago: document.getElementById('contratante_forma_pago'),
		contratanteFechaPago: document.getElementById('contratante_fecha_pago'),
		contratanteProyecto: document.getElementById('contratante_proyecto'),
		responsableIva: document.getElementById('responsable_iva'),
		garantia: document.getElementById('garantia')
	};

	const sharedDraftGuarantee = 'Garantía Servicio prestado de 12 Meses por daños no relacionados a daño físico o daños por humedad';

	function showAlert(message, type) {
		elements.alertBox.textContent = message;
		elements.alertBox.className = 'alert-box ' + (type === 'error' ? 'error' : 'success');
		elements.alertBox.hidden = false;
	}

	function clearAlert() {
		elements.alertBox.hidden = true;
		elements.alertBox.textContent = '';
		elements.alertBox.className = 'alert-box';
	}

	function formatMoney(value) {
		const amount = Number(value || 0);
		return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
	}

	function createEmptyService(service = {}) {
		const row = document.createElement('tr');
		row.innerHTML = [
			'<td><input class="service-input service-concept" type="text" required placeholder="Ej. mantenimiento"></td>',
			'<td><textarea class="service-textarea service-description" rows="2" placeholder="Detalle del servicio"></textarea></td>',
			'<td><input class="service-number service-quantity" type="number" min="1" step="1" value="1" required></td>',
			'<td><input class="service-number service-unit" type="number" min="0" step="1" value="0" required></td>',
			'<td><span class="service-row-total">$0</span></td>',
			'<td><button type="button" class="row-remove-btn">Eliminar</button></td>'
		].join('');

		const concept = row.querySelector('.service-concept');
		const description = row.querySelector('.service-description');
		const quantity = row.querySelector('.service-quantity');
		const unit = row.querySelector('.service-unit');
		const removeBtn = row.querySelector('.row-remove-btn');

		concept.value = service.concepto || '';
		description.value = service.descripcion || '';
		quantity.value = Number(service.cantidad || 1);
		unit.value = Number(service.valor_unitario || 0);

		const recalculateRow = () => {
			const amount = Number(quantity.value || 0) * Number(unit.value || 0);
			row.querySelector('.service-row-total').textContent = formatMoney(amount);
			recalculateTotals();
		};

		concept.addEventListener('input', recalculateRow);
		description.addEventListener('input', recalculateRow);
		quantity.addEventListener('input', recalculateRow);
		unit.addEventListener('input', recalculateRow);
		removeBtn.addEventListener('click', () => {
			if (elements.servicesBody.children.length === 1) {
				concept.value = '';
				description.value = '';
				quantity.value = 1;
				unit.value = 0;
				recalculateRow();
				return;
			}
			row.remove();
			recalculateTotals();
		});

		recalculateRow();
		return row;
	}

	function readServices() {
		const services = [];
		elements.servicesBody.querySelectorAll('tr').forEach((row) => {
			const concept = row.querySelector('.service-concept').value.trim();
			const description = row.querySelector('.service-description').value.trim();
			const quantity = Number(row.querySelector('.service-quantity').value || 0);
			const unit = Number(row.querySelector('.service-unit').value || 0);

			if (!concept && !description && quantity === 0 && unit === 0) {
				return;
			}

			services.push({
				concepto: concept,
				descripcion: description,
				cantidad: quantity,
				valor_unitario: unit
			});
		});
		return services;
	}

	function recalculateTotals() {
		let totalFacturado = 0;
		elements.servicesBody.querySelectorAll('tr').forEach((row) => {
			const quantity = Number(row.querySelector('.service-quantity').value || 0);
			const unit = Number(row.querySelector('.service-unit').value || 0);
			const subtotal = quantity * unit;
			row.querySelector('.service-row-total').textContent = formatMoney(subtotal);
			totalFacturado += subtotal;
		});

		const totalAbono = Number(elements.totalAbono.value || 0);
		const totalPendiente = Math.max(totalFacturado - totalAbono, 0);
		elements.totalFacturado.textContent = formatMoney(totalFacturado);
		elements.totalPendiente.textContent = formatMoney(totalPendiente);
	}

	function getFormData() {
		return {
			id_interno: state.currentId,
			contratante_nombre: elements.contratanteNombre.value.trim(),
			contratante_cedula: elements.contratanteCedula.value.trim(),
			contratante_email: elements.contratanteEmail.value.trim(),
			contratante_celular: elements.contratanteCelular.value.trim(),
			contratante_forma_pago: elements.contratanteFormaPago.value.trim(),
			contratante_fecha_pago: elements.contratanteFechaPago.value.trim(),
			contratante_proyecto: elements.contratanteProyecto.value.trim(),
			responsable_iva: elements.responsableIva.checked,
			servicios: readServices(),
			total_abono: Number(elements.totalAbono.value || 0),
			garantia: elements.garantia.value.trim() || sharedDraftGuarantee
		};
	}

	function validatePayload(payload) {
		const required = [
			['contratante_nombre', 'El nombre del contratante es obligatorio.'],
			['contratante_cedula', 'La cédula del contratante es obligatoria.'],
			['contratante_email', 'El correo del contratante es obligatorio.'],
			['contratante_celular', 'El celular del contratante es obligatorio.'],
			['contratante_forma_pago', 'La forma de pago es obligatoria.'],
			['contratante_fecha_pago', 'La fecha de pago es obligatoria.']
		];

		for (const [field, message] of required) {
			if (!payload[field]) {
				throw new Error(message);
			}
		}

		if (!payload.servicios.length) {
			throw new Error('Debes cargar al menos un servicio.');
		}

		payload.servicios.forEach((service, index) => {
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

		if (!(Number(payload.total_abono) >= 0)) {
			throw new Error('El total abono no puede ser negativo.');
		}
	}

	async function api(action, data = {}) {
		if (!appUrl) {
			throw new Error('Primero debes configurar la URL del Web App en cuenta-de-cobro.html.');
		}

		const payload = {
			action,
			token: state.token,
			username: state.user,
			...data
		};

		return jsonpRequest(payload);
	}

	function jsonpRequest(payload) {
		return new Promise((resolve, reject) => {
			const callbackName = '__gaptCobroJsonpCb' + (++jsonpSequence);
			const script = document.createElement('script');
			const timeoutId = window.setTimeout(() => {
				cleanup();
				reject(new Error('La solicitud tardó demasiado en responder.'));
			}, 30000);

			function cleanup() {
				window.clearTimeout(timeoutId);
				delete window[callbackName];
				script.remove();
			}

			window[callbackName] = function (response) {
				cleanup();
				if (!response || !response.ok) {
					reject(new Error((response && response.message) || 'La operación no pudo completarse.'));
					return;
				}
				resolve(response);
			};

			const query = new URLSearchParams({
				responseMode: 'jsonp',
				callback: callbackName,
				payload: JSON.stringify(payload)
			});

			script.src = appUrl + (appUrl.includes('?') ? '&' : '?') + query.toString();
			script.async = true;
			script.onerror = function () {
				cleanup();
				reject(new Error('No se pudo conectar con el Web App.'));
			};

			document.head.appendChild(script);
		});
	}

	function setSession(token, user) {
		state.token = token;
		state.user = user;
		localStorage.setItem(storageKey, token);
		localStorage.setItem(storageUserKey, user);
		elements.sessionLabel.textContent = user;
	}

	function clearSession() {
		state.token = '';
		state.user = '';
		state.records = [];
		state.currentId = '';
		state.approved = false;
		localStorage.removeItem(storageKey);
		localStorage.removeItem(storageUserKey);
		elements.sessionLabel.textContent = '—';
		elements.authGrid.hidden = false;
		elements.appView.hidden = true;
		elements.loginView.hidden = false;
	}

	function setDraftState(stateLabel, approved, consecutive) {
		state.approved = approved;
		elements.draftStatePill.textContent = stateLabel || 'Borrador';
		elements.draftStatePill.className = 'summary-pill ' + (approved ? 'approved' : 'draft');
		elements.consecutiveLabel.textContent = consecutive ? String(consecutive) : 'Pendiente';
		elements.saveDraftBtn.disabled = approved;
		elements.approveBtn.disabled = approved;
		elements.accountForm.querySelectorAll('input, textarea, button').forEach((field) => {
			if (field === elements.logoutBtn || field === elements.newDraftBtn) {
				return;
			}
			if (field === elements.saveDraftBtn || field === elements.approveBtn || field === elements.addServiceBtn) {
				field.disabled = approved;
			}
			if (approved && field !== elements.totalAbono) {
				field.readOnly = true;
				if (field.type === 'checkbox') {
					field.disabled = true;
				}
			}
		});
	}

	function setEditableMode() {
		state.approved = false;
		elements.saveDraftBtn.disabled = false;
		elements.approveBtn.disabled = false;
		elements.accountForm.querySelectorAll('input, textarea').forEach((field) => {
			field.readOnly = false;
			field.disabled = false;
		});
		elements.totalAbono.disabled = false;
		elements.responsableIva.disabled = false;
		elements.addServiceBtn.disabled = false;
	}

	function resetForm() {
		state.currentId = '';
		elements.recordId.value = '';
		elements.accountForm.reset();
		elements.servicesBody.innerHTML = '';
		elements.servicesBody.appendChild(createEmptyService());
		elements.totalAbono.value = '0';
		elements.garantia.value = sharedDraftGuarantee;
		setEditableMode();
		setDraftState('Borrador', false, 'Pendiente');
		recalculateTotals();
	}

	function populateForm(record) {
		resetForm();
		state.currentId = record.id_interno || '';
		elements.recordId.value = state.currentId;
		elements.contratanteNombre.value = record.contratante_nombre || '';
		elements.contratanteCedula.value = record.contratante_cedula || '';
		elements.contratanteEmail.value = record.contratante_email || '';
		elements.contratanteCelular.value = record.contratante_celular || '';
		elements.contratanteFormaPago.value = record.contratante_forma_pago || '';
		elements.contratanteFechaPago.value = record.contratante_fecha_pago || '';
		elements.contratanteProyecto.value = record.contratante_proyecto || '';
		elements.responsableIva.checked = Boolean(record.responsable_iva);
		elements.totalAbono.value = Number(record.total_abono || 0);
		elements.garantia.value = record.garantia || sharedDraftGuarantee;

		const services = Array.isArray(record.servicios) ? record.servicios : JSON.parse(record.servicios || '[]');
		elements.servicesBody.innerHTML = '';
		if (services.length) {
			services.forEach((service) => elements.servicesBody.appendChild(createEmptyService(service)));
		} else {
			elements.servicesBody.appendChild(createEmptyService());
		}

		setDraftState(record.estado || 'Borrador', record.estado === 'Aprobado', record.numero_consecutivo || 'Pendiente');
		recalculateTotals();
	}

	function renderRecords(records) {
		state.records = records;
		elements.recordsBody.innerHTML = '';

		if (!records.length) {
			elements.recordsBody.innerHTML = '<tr><td colspan="5">No hay registros cargados.</td></tr>';
			return;
		}

		records.forEach((record) => {
			const row = document.createElement('tr');
			row.innerHTML = [
				'<td>' + (record.numero_consecutivo || '—') + '</td>',
				'<td>' + escapeHtml(record.contratante_nombre || '') + '</td>',
				'<td><span class="status-tag ' + (record.estado === 'Aprobado' ? 'approved' : 'draft') + '">' + escapeHtml(record.estado || 'Borrador') + '</span></td>',
				'<td>' + escapeHtml(record.fecha_creacion || '') + '</td>',
				'<td><div class="records-actions"></div></td>'
			].join('');

			const actionsCell = row.querySelector('.records-actions');
			const editBtn = document.createElement('button');
			editBtn.type = 'button';
			editBtn.className = 'inline-link';
			editBtn.textContent = record.estado === 'Aprobado' ? 'Ver' : 'Editar';
			editBtn.addEventListener('click', () => populateForm(record));
			actionsCell.appendChild(editBtn);

			if (record.estado !== 'Aprobado') {
				const deleteBtn = document.createElement('button');
				deleteBtn.type = 'button';
				deleteBtn.className = 'inline-link';
				deleteBtn.textContent = 'Eliminar';
				deleteBtn.addEventListener('click', async () => {
					if (!confirm('¿Eliminar este borrador? Esta acción no se puede deshacer.')) {
						return;
					}
					try {
						await api('deleteDraft', { id_interno: record.id_interno });
						showAlert('Borrador eliminado correctamente.', 'success');
						await refreshRecords();
						if (state.currentId === record.id_interno) {
							resetForm();
						}
					} catch (error) {
						showAlert(error.message, 'error');
					}
				});
				actionsCell.appendChild(deleteBtn);
			}

			elements.recordsBody.appendChild(row);
		});
	}

	function escapeHtml(value) {
		return String(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	async function refreshRecords() {
		clearAlert();
		const response = await api('listDrafts');
		renderRecords(response.records || []);
	}

	async function handleLogin(event) {
		event.preventDefault();
		clearAlert();
		const username = elements.loginUser.value.trim();
		const password = elements.loginPassword.value;

		if (!username || !password) {
			showAlert('Debes completar usuario y clave.', 'error');
			return;
		}

		try {
			const response = await api('login', { username, password });
			setSession(response.token, response.user || username);
			elements.authGrid.hidden = true;
			elements.loginView.hidden = true;
			elements.appView.hidden = false;
			resetForm();
			await refreshRecords();
			showAlert('Sesión iniciada correctamente.', 'success');
		} catch (error) {
			showAlert(error.message, 'error');
		}
	}

	async function saveDraft(event) {
		event.preventDefault();
		clearAlert();
		try {
			const payload = getFormData();
			validatePayload(payload);
			const response = await api('saveDraft', payload);
			state.currentId = response.record.id_interno;
			elements.recordId.value = state.currentId;
			showAlert('Borrador guardado correctamente.', 'success');
			await refreshRecords();
		} catch (error) {
			showAlert(error.message, 'error');
		}
	}

	async function approveRecord() {
		clearAlert();
		try {
			const payload = getFormData();
			validatePayload(payload);
			if (!confirm('La aprobación asigna consecutivo, genera el PDF y envía correos. Esta acción no se puede revertir. ¿Continuar?')) {
				return;
			}
			const response = await api('approve', payload);
			state.currentId = response.record.id_interno;
			elements.recordId.value = state.currentId;
			setDraftState('Aprobado', true, response.record.numero_consecutivo);
			showAlert('Cuenta aprobada y enviada correctamente.', 'success');
			await refreshRecords();
		} catch (error) {
			showAlert(error.message, 'error');
		}
	}

	function bindEvents() {
		elements.loginForm.addEventListener('submit', handleLogin);
		elements.accountForm.addEventListener('submit', saveDraft);
		elements.approveBtn.addEventListener('click', approveRecord);
		elements.addServiceBtn.addEventListener('click', () => {
			elements.servicesBody.appendChild(createEmptyService());
			recalculateTotals();
		});
		elements.totalAbono.addEventListener('input', recalculateTotals);
		elements.logoutBtn.addEventListener('click', () => {
			clearSession();
			resetForm();
		});
		elements.newDraftBtn.addEventListener('click', () => {
			resetForm();
			showAlert('Nuevo borrador listo para editar.', 'success');
		});
	}

	async function bootstrap() {
		elements.garantia.value = sharedDraftGuarantee;
		elements.servicesBody.appendChild(createEmptyService());
		bindEvents();
		recalculateTotals();

		if (state.token && state.user) {
			try {
				elements.authGrid.hidden = true;
				elements.loginView.hidden = true;
				elements.appView.hidden = false;
				elements.sessionLabel.textContent = state.user;
				await refreshRecords();
				return;
			} catch (error) {
				clearSession();
			}
		}

		elements.sessionLabel.textContent = '—';
		elements.authGrid.hidden = false;
		elements.loginView.hidden = false;
		elements.appView.hidden = true;
	}

	bootstrap().catch((error) => {
		showAlert(error.message, 'error');
	});
})();