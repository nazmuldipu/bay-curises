'use strict';
import Swiper from './swiper-bundle.esm.browser.min.js';

const defaultConfig = {
    loop: true,
    preloadImages: false,
    lazy: {
        loadPrevNext: true,
    },
    pagination: {
        el: '.carousel-pagination',
        type: 'custom',
        renderCustom: function (swiper, current, total) {
            return `${current} of ${total}`;
        }
    },
    navigation: {
        nextEl: '.carousel-button-next',
        prevEl: '.carousel-button-prev',
    }
};

export {
    Swiper,
    defaultConfig
};