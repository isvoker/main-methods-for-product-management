// dependencies: libs.d/data-loader.js
const ProductAttribute = function () {
	'use strict';

	/**
	 * Получение данных из схемы атрибутов.
	 */
	const AttributeSchema = function() {
		const controller = 'products.d';

		function loadSchema(typeId) {
			return DataLoader.load({
				controller: controller,
				action: 'getAttributesSchema',
				type: typeId
			});
		}

		function getPropertyFromSchema(schema, attr, property) {
			if ( !schema.hasOwnProperty(attr) ) {
				throw `Attribute "${attr}" is undefined`;
			}

			if ( !schema[attr].hasOwnProperty(property) ) {
				throw `Attribute property "${property}" of "${attr}" is undefined`;
			}

			return schema[attr][property];
		}

		/**
		 * Получение свойства атрибута.
		 * В случае успеха выполнится resolve(property).
		 *
		 * @param {int} typeId
		 * @param {string} attr
		 * @param {string} property
		 * @return {Promise}
		 */
		function loadProperty(typeId, attr, property) {
			return new Promise((resolve, reject) => {
				loadSchema(typeId).then((response) => {
					resolve(
						getPropertyFromSchema(response.schema, attr, property)
					);
				});
			});
		}

		/**
		 * Получение строки-описания атрибута.
		 * В случае успеха выполнится resolve(description).
		 *
		 * @param {int} typeId
		 * @param {string} attr
		 * @return {Promise}
		 */
		function loadDescription(typeId, attr) {
			const PREDEFINED_VALUES = {
				'tags': 'Теги',
				'party': 'Кол-во людей',
				'date_begin': 'Дата начала',
				'date_end': 'Дата окончания',
				'price_min': 'Цена от',
				'price_max': 'Цена до'
			};

			return new Promise((resolve, reject) => {
				if (PREDEFINED_VALUES.hasOwnProperty(attr)) {
					resolve( PREDEFINED_VALUES[attr] );
				} else {
					loadProperty(typeId, attr, 'description')
						.then(resolve);
				}
			});
		}

		return {
			loadProperty: loadProperty,
			loadDescription: loadDescription
		}
	}();

	/**
	 * Загрузка и рендеринг значений для полей ввода атрибутов.
	 */
	const AttributeInput = function () {
		const controller = 'products.d';

		let onInitComplete = null;
		let queueLength = 0;

		function loadValues(typeId, attrCode) {
			return DataLoader.load({
				controller: controller,
				action: 'getAttributeValues',
				type: typeId,
				code: attrCode
			});
		}

		function writeSelectValues(input, values) {
			let html = '<option disabled selected></option>';

			values.forEach((value) => {
				html += `<option value="${value.id}">${value.label}</option>`;
			});

			input.innerHTML = html;
		}

		function writeRadioValues(input, values) {
			let html = '';

			values.forEach((value) => {
				html += '<label class="radio">'
					+ '<input class="radio__choice js__input" type="radio"'
					+ ` name="${input.dataset.code}" value="${value.id}"/>`
					+ `<span class="radio__span">${value.label}</span>`
				+ '</label>';
			});

			input.querySelector('.js__attributes-list-container')
				.insertAdjacentHTML('beforeend', html);
		}

		function writeCheckboxValues(input, values) {
			let html = '';

			values.forEach((value) => {
				html += '<label class="checkbox">'
					+ `<input class="checkbox__choice js__input" type="checkbox" value="${value.id}"/>`
					+ `<span class="checkbox__span">${value.label}</span>`
				+ '</label>';
			});

			input.querySelector('.js__attributes-list-container')
				.insertAdjacentHTML('beforeend', html);
		}

		function writeCheckboxSpecificValues(input, values) {
			let html = '';

			values.forEach((value) => {
				html +=
					 '<label class="checkbox">'
						+ `<input class="checkbox__choice js__input" type="checkbox" value="${value.id}"/>`
						+ '<span class="checkbox__span">'
							+ '<span class="flex ai-c">'
								+ `<svg class="svg-ico f-00 mr-5"><use href="#ico-${value.id}"></use></svg>`
								+ `<span class="f-11">${value.label}</span>`
							+ ' </span>'
						+ '</span>'
					+ '</label>';
			});

			input.innerHTML = html;
		}

		function writeComplexityValues(input, values) {
			let html = '';

			values.forEach((value) => {
				html += `<label class="checkbox complexity-color-${value.id}">`
					+ `<input class="checkbox__choice js__input" type="checkbox" value="${value.id}"/>`
					+ `<span class="checkbox__span checkbox__span--complexity">${value.label}</span>`
				+ '</label>';
			});

			input.querySelector('.js__attributes-list-container')
				.insertAdjacentHTML('beforeend', html);
		}

		function writeComplexitySpanValues(input, values) {
			let html = '';

			values.forEach((value) => {
				html += `<span class="complexity-of-the-tour__item complexity-color-${value.id} js__complexity-item"`
                    + ` data-complexity="${value.id}">`
				+ '</span>';
			});

			input.querySelector('.js__attributes-list-container')
				.insertAdjacentHTML('beforeend', html);
		}

		function writeValues(input, values) {
			switch (input.dataset.fillType) {
				case 'select':
					writeSelectValues(input, values);
					break;

				case 'radio':
					writeRadioValues(input, values);
					break;

				case 'checkbox':
					writeCheckboxValues(input, values);
					break;

				case 'checkbox-specific':
					writeCheckboxSpecificValues(input, values);
					break;

				case 'complexity':
					writeComplexityValues(input, values);
					break;

				case 'complexity-span':
					writeComplexitySpanValues(input, values);
					break;

				default:
					Sensei.showError(
						`Unknown input type ${input.dataset.fillType}`,
						'',
						true
					);
					break;
			}
		}

		/**
		 * Установить начальные значения поля ввода.
		 *
		 * @param {HTMLElement} input
		 * @param {string|int} typeId
		 */
		function initValues(input, typeId) {
			queueLength++;
			loadValues(typeId, input.dataset.code)
				.then((response) => {
					writeValues(input, response.items);
					queueLength--;

					if (
						queueLength === 0
						&& onInitComplete !== null
					) {
						onInitComplete();
						onInitComplete = null;
					}
				});
		}

		/**
		 * Установить функцию, которая будет выполнена
		 * по завершении установки начальных значений всех элементов.
		 *
		 * @param {function} [onSuccess]
		 */
		function onInit(onSuccess) {
			onInitComplete = typeof onSuccess === 'function'
				? onSuccess
				: null;
		}

		return {
			initValues: initValues,
			onInit: onInit
		};
	}();

	/**
	 * Получение текста метки для boolean-атрибута
	 * из предопределённого списка списка.
	 *
	 * @param {string} value
	 * @return {string}
	 */
	function getLabelForBooleanValue(value) {
		const PREDEFINED_VALUES = {
			'15': 'Питание',
			'17': 'Проживание',
			'67': 'Предоплата',
			'69': 'Отмена бронирования'
		};

		return PREDEFINED_VALUES.hasOwnProperty(value)
			? PREDEFINED_VALUES[value]
			: '';
	}

	/**
	 * Отрисовка инпутов.
	 *
	 * @param {(string|int)} typeId
	 * @param {function} [onSuccess]
	 */
	function renderInputs(typeId, onSuccess) {
		AttributeInput.onInit(onSuccess);

		document.querySelectorAll('.js__fill-attribute-values:not(.js__fill-attribute-completed)')
			.forEach((input) => {
				AttributeInput.initValues(input, typeId);
				input.classList.add('js__fill-attribute-completed');
			});
	}

	return {
		loadDescription: AttributeSchema.loadDescription,
		getLabelForBooleanValue: getLabelForBooleanValue,
		renderInputs: renderInputs
	};
}();
