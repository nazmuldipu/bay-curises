// components/progressive-element.js
"use strict";
var ProgressiveElement = class extends HTMLElement {
  static loadCSS(cssPath) {
    return new Promise((resolve, reject) => {
      const alreadyLoaded = [...document.styleSheets].find((style) => style.href === cssPath);
      if (alreadyLoaded) {
        resolve(alreadyLoaded);
      } else {
        const link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.onload = function() {
          resolve(link);
        };
        link.href = cssPath;
        const headTag = document.getElementsByTagName("head")[0];
        headTag.insertAdjacentElement("beforeend", link);
      }
    });
  }
  constructor(modules) {
    super();
    this._moduleMap = new Map();
    for (const mod of modules) {
      this._registerModule(mod);
    }
  }
  connectedCallback() {
    for (const mod of this._moduleMap.values()) {
      mod.observer.observe(this);
    }
  }
  _registerModule(mod) {
    mod.observer = new ModuleLoadObserver(mod.type, mod.observerConfig, this._onLoad.bind(this, mod.id));
    this._moduleMap.set(mod.id, mod);
  }
  async _onLoad(moduleId) {
    let mod = this._moduleMap.get(moduleId);
    if (mod) {
      mod.observer.destroy();
      const results = [];
      if (mod.stylePaths) {
        const cssResults = await Promise.all(mod.stylePaths.map((stylePath) => ProgressiveElement.loadCSS(stylePath)));
        Array.prototype.push.apply(results, cssResults);
      }
      if (mod.behaviorPath) {
        const jsRes = await import(mod.behaviorPath);
        results.push(jsRes);
        mod.mod = jsRes;
      }
      mod.results = results;
      return mod;
    }
    return this;
  }
};
var progressive_element_default = ProgressiveElement;
var ModuleLoadObserver = class {
  constructor(observerType, observerConfig, callback) {
    this.type = observerType;
    switch (observerType) {
      case "IntersectionObserver":
        this._observer = new IntersectionObserver(callback, observerConfig);
        break;
      default:
        break;
    }
  }
  unobserve(elem) {
    switch (this.type) {
      case "IntersectionObserver":
        this._observer.unobserve(elem);
        break;
      default:
        break;
    }
  }
  observe(elem) {
    switch (this.type) {
      case "IntersectionObserver":
        this._observer.observe(elem);
        break;
      default:
        break;
    }
  }
  destroy() {
    switch (this.type) {
      case "IntersectionObserver":
        this._observer.disconnect();
        break;
      default:
        break;
    }
  }
};

// components/MediaCarousel/index.js
"use strict";
var MediaCarousel = class extends progressive_element_default {
  constructor() {
    super([
      {
        id: "swiper",
        behaviorPath: "../lib/swiper.js",
        stylePaths: [
          "../lib/swiper-bundle.min.css"
        ],
        type: "IntersectionObserver",
        observerConfig: {
          rootMargin: "400px"
        }
      }
    ]);
  }
  _onLoad(moduleId, entries, observer) {
    if (entries.some((entry) => entry.isIntersecting)) {
      super._onLoad(moduleId).then(({mod}) => {
        var _a;
        if (mod.Swiper) {
          this.swiperInstance = new mod.Swiper((_a = this.getElementsByClassName("swiper-container")) == null ? void 0 : _a[0], mod.defaultConfig);
          this.swiperInstance.on("realIndexChange", function(e) {
            this.el.dispatchEvent(new CustomEvent("slideChanged", {
              detail: {
                realIndex: e.realIndex
              }
            }));
          });
        }
      });
    }
  }
};
var MediaCarousel_default = MediaCarousel;
customElements.define("media-carousel", MediaCarousel);

// pages/index/index-defer.js
var app_nav = document.querySelector("#app_nav");
function changeLinkState() {
  if (window.scrollY > 10) {
    app_nav.classList.add("bg-primary");
  } else {
    app_nav.classList.remove("bg-primary");
  }
}
app_nav.classList.remove("bg-primary");
window.addEventListener("scroll", changeLinkState);
