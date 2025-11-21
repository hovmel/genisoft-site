/*
Документація по роботі у шаблоні: 
Документація слайдера: https://swiperjs.com/
Сніппет(HTML): swiper
*/

// Підключаємо слайдер Swiper з node_modules
// При необхідності підключаємо додаткові модулі слайдера, вказуючи їх у {} через кому
// Приклад: { Navigation, Autoplay }
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
/*
Основні модулі слайдера:
Navigation, Pagination, Autoplay, 
EffectFade, Lazy, Manipulation
Детальніше дивись https://swiperjs.com/
*/

// Стилі Swiper
// Базові стилі
import "../../scss/base/swiper.scss";
// Повний набір стилів з scss/libs/swiper.scss
// import "../../scss/libs/swiper.scss";
// Повний набір стилів з node_modules
// import 'swiper/css';

// Ініціалізація слайдерів
function initSliders() {
	if (document.querySelector('.reviews__slider')) {
		new Swiper('.reviews__slider', {
			modules: [Navigation],
			observer: true,
			observeParents: true,
			slidesPerView: 3,
			spaceBetween: 20,
			speed: 600,
			navigation: {
				prevEl: '.reviews__slider-navigation .swiper-button-prev',
				nextEl: '.reviews__slider-navigation .swiper-button-next',
			},
			breakpoints: {
				310: {
					slidesPerView: 0.75,
					spaceBetween: 20,
				},
				478.98: {
					slidesPerView: 1.2,
				},
				768: {
					slidesPerView: 1.8,
				},
				992: {
					slidesPerView: 3,
				}
			},
		});
	}
}
window.addEventListener("load", function (e) {
	// Запуск ініціалізації слайдерів
	initSliders();
	// Запуск ініціалізації скролла на базі слайдера (за класом swiper_scroll)
	//initSlidersScroll();
});