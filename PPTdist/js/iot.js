(function ( document, window ) {
    'use strict';
    

    var pfx = (function () {
        
        var style = document.createElement('dummy').style,
            prefixes = 'Webkit Moz O ms Khtml'.split(' '),
            memory = {};
        
        return function ( prop ) {
            if ( typeof memory[ prop ] === "undefined" ) {
                
                var ucProp  = prop.charAt(0).toUpperCase() + prop.substr(1),
                    props   = (prop + ' ' + prefixes.join(ucProp + ' ') + ucProp).split(' ');
                
                memory[ prop ] = null;
                for ( var i in props ) {
                    if ( style[ props[i] ] !== undefined ) {
                        memory[ prop ] = props[i];
                        break;
                    }
                }
            
            }
            
            return memory[ prop ];
        };
    
    })();
    

    var arrayify = function ( a ) {
        return [].slice.call( a );
    };
    

    var css = function ( el, props ) {
        var key, pkey;
        for ( key in props ) {
            if ( props.hasOwnProperty(key) ) {
                pkey = pfx(key);
                if ( pkey !== null ) {
                    el.style[pkey] = props[key];
                }
            }
        }
        return el;
    };
    

    var toNumber = function (numeric, fallback) {
        return isNaN(numeric) ? (fallback || 0) : Number(numeric);
    };
    

    var byId = function ( id ) {
        return document.getElementById(id);
    };
    

    var $ = function ( selector, context ) {
        context = context || document;
        return context.querySelector(selector);
    };
    

    var $$ = function ( selector, context ) {
        context = context || document;
        return arrayify( context.querySelectorAll(selector) );
    };
    
  
    var triggerEvent = function (el, eventName, detail) {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(eventName, true, true, detail);
        el.dispatchEvent(event);
    };
    

    var translate = function ( t ) {
        return " translate3d(" + t.x + "px," + t.y + "px," + t.z + "px) ";
    };
    
   
    var rotate = function ( r, revert ) {
        var rX = " rotateX(" + r.x + "deg) ",
            rY = " rotateY(" + r.y + "deg) ",
            rZ = " rotateZ(" + r.z + "deg) ";
        
        return revert ? rZ+rY+rX : rX+rY+rZ;
    };
    

    var scale = function ( s ) {
        return " scale(" + s + ") ";
    };
    
    var perspective = function ( p ) {
        return " perspective(" + p + "px) ";
    };
    
 
    var getElementFromHash = function () {

        return byId( window.location.hash.replace(/^#\/?/,"") );
    };
  
    var computeWindowScale = function ( config ) {
        var hScale = window.innerHeight / config.height,
            wScale = window.innerWidth / config.width,
            scale = hScale > wScale ? wScale : hScale;
        
        if (config.maxScale && scale > config.maxScale) {
            scale = config.maxScale;
        }
        
        if (config.minScale && scale < config.minScale) {
            scale = config.minScale;
        }
        
        return scale;
    };
    

    var body = document.body;
    
    var ua = navigator.userAgent.toLowerCase();
    var impressSupported = 
                          
                           ( pfx("perspective") !== null ) &&
                           
                          
                           ( body.classList ) &&
                           ( body.dataset ) &&
                           
                      
                           ( ua.search(/(iphone)|(ipod)|(android)/) === -1 );
    
    if (!impressSupported) {

        body.className += " impress-not-supported ";
    } else {
        body.classList.remove("impress-not-supported");
        body.classList.add("impress-supported");
    }
    
 
    var roots = {};
    

    var defaults = {
        width: 1024,
        height: 768,
        maxScale: 1,
        minScale: 0,
        
        perspective: 1000,
        
        transitionDuration: 1000
    };
    
   
    var empty = function () { return false; };
    
    
    var impress = window.impress = function ( rootId ) {
        
     
        if (!impressSupported) {
            return {
                init: empty,
                goto: empty,
                prev: empty,
                next: empty
            };
        }
        
        rootId = rootId || "impress";
        

        if (roots["impress-root-" + rootId]) {
            return roots["impress-root-" + rootId];
        }
        
     
        var stepsData = {};
        
 
        var activeStep = null;
        

        var currentState = null;
        
      
        var steps = null;
        
     
        var config = null;
        
    
        var windowScale = null;        
        
      
        var root = byId( rootId );
        var canvas = document.createElement("div");
        
        var initialized = false;
        
    
        var lastEntered = null;
        

        var onStepEnter = function (step) {
            if (lastEntered !== step) {
                triggerEvent(step, "impress:stepenter");
                lastEntered = step;
            }
        };
        
      
        var onStepLeave = function (step) {
            if (lastEntered === step) {
                triggerEvent(step, "impress:stepleave");
                lastEntered = null;
            }
        };
        
      
        var initStep = function ( el, idx ) {
            var data = el.dataset,
                step = {
                    translate: {
                        x: toNumber(data.x),
                        y: toNumber(data.y),
                        z: toNumber(data.z)
                    },
                    rotate: {
                        x: toNumber(data.rotateX),
                        y: toNumber(data.rotateY),
                        z: toNumber(data.rotateZ || data.rotate)
                    },
                    scale: toNumber(data.scale, 1),
                    el: el
                };
            
            if ( !el.id ) {
                el.id = "step-" + (idx + 1);
            }
            
            stepsData["impress-" + el.id] = step;
            
            css(el, {
                position: "absolute",
                transform: "translate(-50%,-50%)" +
                           translate(step.translate) +
                           rotate(step.rotate) +
                           scale(step.scale),
                transformStyle: "preserve-3d"
            });
        };
        
        // `init` API function that initializes (and runs) the presentation.
        var init = function () {
            if (initialized) { return; }
            
            // First we set up the viewport for mobile devices.
            // For some reason iPad goes nuts when it is not done properly.
            var meta = $("meta[name='viewport']") || document.createElement("meta");
            meta.content = "width=device-width, minimum-scale=1, maximum-scale=1, user-scalable=no";
            if (meta.parentNode !== document.head) {
                meta.name = 'viewport';
                document.head.appendChild(meta);
            }
            
            // initialize configuration object
            var rootData = root.dataset;
            config = {
                width: toNumber( rootData.width, defaults.width ),
                height: toNumber( rootData.height, defaults.height ),
                maxScale: toNumber( rootData.maxScale, defaults.maxScale ),
                minScale: toNumber( rootData.minScale, defaults.minScale ),                
                perspective: toNumber( rootData.perspective, defaults.perspective ),
                transitionDuration: toNumber( rootData.transitionDuration, defaults.transitionDuration )
            };
            
            windowScale = computeWindowScale( config );
            
            // wrap steps with "canvas" element
            arrayify( root.childNodes ).forEach(function ( el ) {
                canvas.appendChild( el );
            });
            root.appendChild(canvas);
            
            // set initial styles
            document.documentElement.style.height = "100%";
            
            css(body, {
                height: "100%",
                overflow: "hidden"
            });
            
            var rootStyles = {
                position: "absolute",
                transformOrigin: "top left",
                transition: "all 0s ease-in-out",
                transformStyle: "preserve-3d"
            };
            
            css(root, rootStyles);
            css(root, {
                top: "50%",
                left: "50%",
                transform: perspective( config.perspective/windowScale ) + scale( windowScale )
            });
            css(canvas, rootStyles);
            
            body.classList.remove("impress-disabled");
            body.classList.add("impress-enabled");
            
            // get and init steps
            steps = $$(".step", root);
            steps.forEach( initStep );
            
            // set a default initial state of the canvas
            currentState = {
                translate: { x: 0, y: 0, z: 0 },
                rotate:    { x: 0, y: 0, z: 0 },
                scale:     1
            };
            
            initialized = true;
            
            triggerEvent(root, "impress:init", { api: roots[ "impress-root-" + rootId ] });
        };
        

        var getStep = function ( step ) {
            if (typeof step === "number") {
                step = step < 0 ? steps[ steps.length + step] : steps[ step ];
            } else if (typeof step === "string") {
                step = byId(step);
            }
            return (step && step.id && stepsData["impress-" + step.id]) ? step : null;
        };
        
        // used to reset timeout for `impress:stepenter` event
        var stepEnterTimeout = null;
        
        // `goto` API function that moves to step given with `el` parameter (by index, id or element),
        // with a transition `duration` optionally given as second parameter.
        var goto = function ( el, duration ) {
            
            if ( !initialized || !(el = getStep(el)) ) {
                // presentation not initialized or given element is not a step
                return false;
            }
            
           
            window.scrollTo(0, 0);
            
            var step = stepsData["impress-" + el.id];
            
            if ( activeStep ) {
                activeStep.classList.remove("active");
                body.classList.remove("impress-on-" + activeStep.id);
            }
            el.classList.add("active");
            
            body.classList.add("impress-on-" + el.id);
            
            // compute target state of the canvas based on given step
            var target = {
                rotate: {
                    x: -step.rotate.x,
                    y: -step.rotate.y,
                    z: -step.rotate.z
                },
                translate: {
                    x: -step.translate.x,
                    y: -step.translate.y,
                    z: -step.translate.z
                },
                scale: 1 / step.scale
            };
            

            var zoomin = target.scale >= currentState.scale;
            
            duration = toNumber(duration, config.transitionDuration);
            var delay = (duration / 2);
            
            // if the same step is re-selected, force computing window scaling,
            // because it is likely to be caused by window resize
            if (el === activeStep) {
                windowScale = computeWindowScale(config);
            }
            
            var targetScale = target.scale * windowScale;
            
            // trigger leave of currently active element (if it's not the same step again)
            if (activeStep && activeStep !== el) {
                onStepLeave(activeStep);
            }

            css(root, {

                transform: perspective( config.perspective / targetScale ) + scale( targetScale ),
                transitionDuration: duration + "ms",
                transitionDelay: (zoomin ? delay : 0) + "ms"
            });
            
            css(canvas, {
                transform: rotate(target.rotate, true) + translate(target.translate),
                transitionDuration: duration + "ms",
                transitionDelay: (zoomin ? 0 : delay) + "ms"
            });
          
            if ( currentState.scale === target.scale ||
                (currentState.rotate.x === target.rotate.x && currentState.rotate.y === target.rotate.y &&
                 currentState.rotate.z === target.rotate.z && currentState.translate.x === target.translate.x &&
                 currentState.translate.y === target.translate.y && currentState.translate.z === target.translate.z) ) {
                delay = 0;
            }
            
            // store current state
            currentState = target;
            activeStep = el;
        
            window.clearTimeout(stepEnterTimeout);
            stepEnterTimeout = window.setTimeout(function() {
                onStepEnter(activeStep);
            }, duration + delay);
            
            return el;
        };
        
        // `prev` API function goes to previous step (in document order)
        var prev = function () {
            var prev = steps.indexOf( activeStep ) - 1;
            prev = prev >= 0 ? steps[ prev ] : steps[ steps.length-1 ];
            
            return goto(prev);
        };
        
        // `next` API function goes to next step (in document order)
        var next = function () {
            var next = steps.indexOf( activeStep ) + 1;
            next = next < steps.length ? steps[ next ] : steps[ 0 ];
            
            return goto(next);
        };
        
       
        root.addEventListener("impress:init", function(){
            // STEP CLASSES
            steps.forEach(function (step) {
                step.classList.add("future");
            });
            
            root.addEventListener("impress:stepenter", function (event) {
                event.target.classList.remove("past");
                event.target.classList.remove("future");
                event.target.classList.add("present");
            }, false);
            
            root.addEventListener("impress:stepleave", function (event) {
                event.target.classList.remove("present");
                event.target.classList.add("past");
            }, false);
            
        }, false);
        
        // Adding hash change support.
        root.addEventListener("impress:init", function(){
            
            // last hash detected
            var lastHash = "";
         
            root.addEventListener("impress:stepenter", function (event) {
                window.location.hash = lastHash = "#/" + event.target.id;
            }, false);
            
            window.addEventListener("hashchange", function () {
                // When the step is entered hash in the location is updated
                // (just few lines above from here), so the hash change is 
                // triggered and we would call `goto` again on the same element.
                //
                // To avoid this we store last entered hash and compare.
                if (window.location.hash !== lastHash) {
                    goto( getElementFromHash() );
                }
            }, false);
            
            // START 
            // by selecting step defined in url or first step of the presentation
            goto(getElementFromHash() || steps[0], 0);
        }, false);
        
        body.classList.add("impress-disabled");
        
        // store and return API for given impress.js root element
        return (roots[ "impress-root-" + rootId ] = {
            init: init,
            goto: goto,
            next: next,
            prev: prev
        });

    };
    
    // flag that can be used in JS to check if browser have passed the support test
    impress.supported = impressSupported;
    
})(document, window);


(function ( document, window ) {
    'use strict';
    

    var throttle = function (fn, delay) {
        var timer = null;
        return function () {
            var context = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    };
    
    // wait for impress.js to be initialized
    document.addEventListener("impress:init", function (event) {

        var api = event.detail.api;
        
        // KEYBOARD NAVIGATION HANDLERS
        
        // Prevent default keydown action when one of supported key is pressed.
        document.addEventListener("keydown", function ( event ) {
            if ( event.keyCode === 9 || ( event.keyCode >= 32 && event.keyCode <= 34 ) || (event.keyCode >= 37 && event.keyCode <= 40) ) {
                event.preventDefault();
            }
        }, false);
        

        document.addEventListener("keyup", function ( event ) {
            if ( event.keyCode === 9 || ( event.keyCode >= 32 && event.keyCode <= 34 ) || (event.keyCode >= 37 && event.keyCode <= 40) ) {
                switch( event.keyCode ) {
                    case 33: // pg up
                    case 37: // left
                    case 38: // up
                             api.prev();
                             break;
                    case 9:  // tab
                    case 32: // space
                    case 34: // pg down
                    case 39: // right
                    case 40: // down
                             api.next();
                             break;
                }
                
                event.preventDefault();
            }
        }, false);
        
        // delegated handler for clicking on the links to presentation steps
        document.addEventListener("click", function ( event ) {
            // event delegation with "bubbling"
            // check if event target (or any of its parents is a link)
            var target = event.target;
            while ( (target.tagName !== "A") &&
                    (target !== document.documentElement) ) {
                target = target.parentNode;
            }
            
            if ( target.tagName === "A" ) {
                var href = target.getAttribute("href");
                
                // if it's a link to presentation step, target this step
                if ( href && href[0] === '#' ) {
                    target = document.getElementById( href.slice(1) );
                }
            }
            
            if ( api.goto(target) ) {
                event.stopImmediatePropagation();
                event.preventDefault();
            }
        }, false);
        
        // delegated handler for clicking on step elements
        document.addEventListener("click", function ( event ) {
            var target = event.target;
            // find closest step element that is not active
            while ( !(target.classList.contains("step") && !target.classList.contains("active")) &&
                    (target !== document.documentElement) ) {
                target = target.parentNode;
            }
            
            if ( api.goto(target) ) {
                event.preventDefault();
            }
        }, false);
        

        document.addEventListener("touchstart", function ( event ) {
            if (event.touches.length === 1) {
                var x = event.touches[0].clientX,
                    width = window.innerWidth * 0.3,
                    result = null;
                    
                if ( x < width ) {
                    result = api.prev();
                } else if ( x > window.innerWidth - width ) {
                    result = api.next();
                }
                
                if (result) {
                    event.preventDefault();
                }
            }
        }, false);
        
        // rescale presentation when window is resized
        window.addEventListener("resize", throttle(function () {
            // force going to active step again, to trigger rescaling
            api.goto( document.querySelector(".step.active"), 500 );
        }, 250), false);
        
    }, false);
        
})(document, window);
