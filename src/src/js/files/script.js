// import { BufferAttribute, Clock, Color, PerspectiveCamera, PlaneGeometry, Points, Scene, ShaderMaterial, WebGLRenderer } from "three";

// import { spollers } from "./functions.js";
// import { flsModules } from "./modules.js";
//========================================================================================================================================================
document.addEventListener('DOMContentLoaded', function () {
	// With country flag and selection
	if (typeof SimplePhoneMask !== 'undefined') {
		new SimplePhoneMask('#phone', {
			countryCode: 'RU',
			showFlag: true,
			allowCountrySelect: false,
		});
	}

	// Form functionality
	const form = document.querySelector('.form-contacts');
	const phone = form.querySelector('[name="form[phone]"]')
	const notificationSuccess = document.querySelector('.notification--success');
	const notificationError = document.querySelector('.notification--error');

	form.addEventListener('submit', async function (e) {
		e.preventDefault();
		const phoneValue = phone.value.trim();
		// Валидация
		if (!phoneValue || phoneValue === '+7' || phoneValue.length != 18) {
			phone.classList.add("_form-error")
			return;
		}
		// Формируем объект для отправки
		// const formData = {
		// 	phone: phone,
		// };
		// // Отправляем запрос 
		// try {
		// 	const response = await fetch('https://mosstroyrent.moscow/api/admins/new-offer', {
		// 		method: 'POST',
		// 		headers: {
		// 			'Content-Type': 'application/json',
		// 		},
		// 		body: JSON.stringify(formData)
		// 	});
		// 	if (response.ok) {
		// 		showNotification(notificationSuccess);
		// 		form.reset();
		// 	} else {
		// 		showNotification(notificationError);
		// 		throw new Error('Ошибка сервера');
		// 	}
		// } catch (error) {
		// 	showNotification(notificationError);
		// }
	});
	
	const trigger = document.querySelector('.menu__icon');
	const menu = document.querySelector('.menu');
	const button = document.querySelector('.header__main-button');
	const cls = 'active';

	if (!trigger || !menu || !button) return;

	// Флаг готовности анимации кнопки
	let buttonAnimationComplete = false;

	// Через 3 секунды разрешаем добавление класса для кнопки
	setTimeout(() => {
		buttonAnimationComplete = true;
	}, 3000);

	const add = () => {
		// Для кнопки проверяем флаг
		if (buttonAnimationComplete) {
			button.classList.add(cls);
		}
		// Для меню добавляем всегда
		menu.classList.add(cls);
	};

	const remove = () => {
		if (buttonAnimationComplete) {
			button.classList.remove(cls);
		}
		menu.classList.remove(cls);
	};

	// Наведение на иконку
	trigger.addEventListener('mouseenter', add);
	trigger.addEventListener('mouseleave', remove);

	// Держим класс только для меню (без кнопки)
	const keepOnHoverTargets = true;
	if (keepOnHoverTargets) {
		menu.addEventListener('mouseenter', add);
		menu.addEventListener('mouseleave', remove);
	}

	// Notifications
	initNotifications();
});
function initNotifications() {
	const notifications = document.querySelectorAll('.notification:not(.notification--cookies)');

	notifications.forEach(notification => {
		// Set initial aria-hidden state based on display
		updateAriaHidden(notification);

		// Find close button inside notification
		const closeButton = notification.querySelector('[data-close-notification]');

		if (closeButton) {
			// Add click event to close button
			closeButton.addEventListener('click', function (e) {
				e.preventDefault();
				hideNotification(notification);
			});
		}
	});
}
function hideNotification(notification) {
	if (!notification) return;

	notification.style.display = 'none';
	notification.setAttribute('aria-hidden', 'true');
}
function showNotification(notification) {
	if (!notification) return;

	notification.style.display = 'flex';
	notification.setAttribute('aria-hidden', 'false');
}
function updateAriaHidden(notification) {
	if (!notification) return;

	const isHidden = notification.style.display === 'none';
	notification.setAttribute('aria-hidden', isHidden ? 'true' : 'false');
}
document.addEventListener('click', function (e) {
	const closeButton = e.target.closest('[data-close-notification]');
	if (closeButton) {
		e.preventDefault();
		const notification = closeButton.closest('.notification');
		if (notification) {
			// Special handling for cookies notification
			if (notification.classList.contains('notification--cookies')) {
				acceptCookies(notification);
			} else {
				hideNotification(notification);
			}
		}
	}
});
function autoHideSuccessNotifications(delay = 5000) {
	document.querySelectorAll('.notification--success').forEach(notification => {
		setTimeout(() => hideNotification(notification), delay);
	});
	document.querySelectorAll('.notification--error').forEach(notification => {
		setTimeout(() => hideNotification(notification), delay);
	});
}
autoHideSuccessNotifications();
//========================================================================================================================================================
function onSubmit(token) {
	document.querySelector(".form-contacts").submit();
}
//========================================================================================================================================================
// const sizes = {
// 	width: window.innerWidth,
// 	height: window.innerHeight
// }
// const canvas = document.querySelector('canvas.webgl')
// const scene = new Scene()

// const camera = new PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
// camera.position.z = 18
// camera.position.y = 2.2
// camera.position.x = 0
// scene.add(camera)

// // geometry: больше по ширине, чтобы было место для левого холма
// const planeGeometry = new PlaneGeometry(28, 18, 200, 120)

// const planeSizesArray = new Float32Array(planeGeometry.attributes.position.count)
// for (let i = 0; i < planeSizesArray.length; i++) {
// 	planeSizesArray[i] = 1.0 + Math.random() * 4.0
// }
// planeGeometry.setAttribute('aSize', new BufferAttribute(planeSizesArray, 1))

// const planeMaterial = new ShaderMaterial({
// 	uniforms: {
// 		uTime: { value: 0 },
// 		uElevation: { value: 0.9 }
// 	},
// 	vertexShader: `
// 		uniform float uTime;
// 		uniform float uElevation;
// 		attribute float aSize;

// 		varying float vPositionY;
// 		varying float vPositionZ;
// 		varying float vX;

// 		void main() {
// 			vec4 modelPosition = modelMatrix * vec4(position, 1.0);

// 			// Явный асимметричный фактор: левее (x ~ -14) амплитуда = 1.6, правее (x ~ 14) = 0.8
// 			float leftFactor = mix(1.6, 0.8, smoothstep(-14.0, 14.0, modelPosition.x));

// 			// фактор по Z: центр ближе сильнее, края по Z "гаснут"
// 			float zFactor = exp(- (modelPosition.z * modelPosition.z) / 120.0);

// 			// волновая функция: комбинация синусов с разной частотой и временем
// 			float waveX = sin(modelPosition.x * 0.55 - uTime * 1.1);
// 			float waveZ = sin(modelPosition.z * 0.45 + uTime * 0.9);
// 			float height = waveX * waveZ * uElevation * leftFactor * (0.6 + zFactor * 0.8);

// 			// плавный спад в передней части (чтобы получить "холмы" как на картинке)
// 			float frontFade = smoothstep(-6.0, 6.0, modelPosition.z);
// 			modelPosition.y = height * (1.0 - 0.5 * frontFade);

// 			vec4 viewPosition = viewMatrix * modelPosition;
// 			gl_Position = projectionMatrix * viewPosition;

// 			// размер точек: базовый aSize, скорректированный расстоянием (перспектива)
// 			float size = 1.8 * aSize;
// 			size *= (1.0 / -viewPosition.z);
// 			size = clamp(size, 0.5, 18.0);
// 			gl_PointSize = size;

// 			vPositionY = modelPosition.y;
// 			vPositionZ = modelPosition.z;
// 			vX = modelPosition.x;
// 		}
// 	`,
// 	fragmentShader: `
// 		varying float vPositionY;
// 		varying float vPositionZ;
// 		varying float vX;

// 		void main() {
// 			vec2 c = gl_PointCoord - vec2(0.5);
// 			float dist = length(c);
// 			float circle = smoothstep(0.5, 0.38, dist);

// 			float baseAlpha = (vPositionY + 1.2) * 0.35;
// 			float depthFade = clamp(1.0 - (vPositionZ + 10.0) / 24.0, 0.0, 1.0);
// 			float sideFade = 0.5 + 0.5 * (1.0 - smoothstep(-14.0, 14.0, vX));

// 			float alpha = baseAlpha * depthFade * sideFade;
// 			alpha *= circle;

// 			gl_FragColor = vec4(vec3(1.0), alpha);
// 		}
// 	`,
// 	transparent: true,
// 	depthWrite: false
// })

// const plane = new Points(planeGeometry, planeMaterial)
// plane.rotation.x = - Math.PI * 0.42
// plane.position.y = -1.6
// scene.add(plane)

// const renderer = new WebGLRenderer({
// 	canvas: canvas,
// 	antialias: true
// })
// renderer.setClearColor('#050505')
// renderer.setSize(sizes.width, sizes.height)
// renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// window.addEventListener('resize', () => {
// 	sizes.width = window.innerWidth
// 	sizes.height = window.innerHeight

// 	camera.aspect = sizes.width / sizes.height
// 	camera.updateProjectionMatrix()

// 	renderer.setSize(sizes.width, sizes.height)
// 	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
// })

// const clock = new Clock()

// const animate = () => {
// 	const elapsedTime = clock.getElapsedTime()

// 	planeMaterial.uniforms.uTime.value = elapsedTime

// 	renderer.render(scene, camera)
// 	window.requestAnimationFrame(animate)
// }

// animate()