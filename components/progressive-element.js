'use strict';

export default class ProgressiveElement extends HTMLElement {
    static loadCSS(cssPath) {
        return new Promise((resolve, reject) => {
            // first, see if the link already exists on the document
            const alreadyLoaded = [...document.styleSheets].find(style => style.href === cssPath);
            if(alreadyLoaded) {
                resolve(alreadyLoaded);
            } else {
                const link = document.createElement('link');
                link.type = 'text/css';
                link.rel = 'stylesheet';
                link.onload = function() { 
                    resolve(link);
                };
                link.href = cssPath;
            
                const headTag = document.getElementsByTagName('head')[0];
                headTag.insertAdjacentElement('beforeend', link);
            }
          }); 
    } 

    constructor(modules) {
        super();
        // load each module.path on module.trigger (some sort of Listener interface)
        this._moduleMap = new Map();
        for (const mod of modules) {
            this._registerModule(mod);
        }
    }

    connectedCallback() {
        for(const mod of this._moduleMap.values()) {
            mod.observer.observe(this);
        }
    }

    _registerModule(mod) {
        mod.observer = new ModuleLoadObserver(mod.type, mod.observerConfig, this._onLoad.bind(this, mod.id));
        this._moduleMap.set(mod.id, mod);
    }

    /**
     * with subclasses, will want to extend (super.onLoad -- to get module reference) and override this
     * @param {String} moduleId 
     */
    async _onLoad(moduleId) {
        let mod = this._moduleMap.get(moduleId)
        if(mod) {
            mod.observer.destroy();
            const results = [];
            if (mod.stylePaths) {
                const cssResults = await Promise.all(
                    mod.stylePaths.map(stylePath => ProgressiveElement.loadCSS(stylePath))
                );
                Array.prototype.push.apply(results, cssResults);
            }
            if (mod.behaviorPath) {
                const jsRes = await import(mod.behaviorPath)
                results.push(jsRes);
                mod.mod = jsRes;
            }
            mod.results = results;
            return mod
        }
        return this
    }
}

class ModuleLoadObserver {

    constructor(observerType, observerConfig, callback) {
        this.type = observerType;
        switch(observerType) {
            // TODO -- this is probably best represented as an enumerable type
            case 'IntersectionObserver':
                this._observer = new IntersectionObserver(callback, observerConfig);
                break;
            default:
                break;
        }
    }

    unobserve(elem) {
        switch(this.type) {
            case 'IntersectionObserver':
                this._observer.unobserve(elem);
                break;
            default:
                break;
        }
    }

    observe(elem) {
        switch(this.type) {
            case 'IntersectionObserver':
                this._observer.observe(elem);
                break;
            default:
                break;
        }
    }

    destroy() {
        switch(this.type) {
            case 'IntersectionObserver':
                this._observer.disconnect();
                break;
            default:
                break;
        } 
    }
}