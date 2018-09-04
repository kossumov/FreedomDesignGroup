(function($) {
    var h = $.scrollTo = function(a, b, c) {
        $(window).scrollTo(a, b, c)
    };
    h.defaults = {
        axis: "xy",
        duration: parseFloat($.fn.jquery) >= 1.3 ? 0 : 1,
        limit: true
    };
    h.window = function(a) {
        return $(window)._scrollable()
    };
    $.fn._scrollable = function() {
        return this.map(function() {
            var a = this,
                isWin = !a.nodeName || $.inArray(a.nodeName.toLowerCase(), ["iframe", "#document", "html", "body"]) != -1;
            if (!isWin) return a;
            var b = (a.contentWindow || a).document || (a.ownerDocument || a);
            return /webkit/i.test(navigator.userAgent) || b.compatMode == "BackCompat" ?
                b.body : b.documentElement
        })
    };
    $.fn.scrollTo = function(e, f, g) {
        if (typeof f == "object") {
            g = f;
            f = 0
        }
        if (typeof g == "function") g = {
            onAfter: g
        };
        if (e == "max") e = 9E9;
        g = $.extend({}, h.defaults, g);
        f = f || g.duration;
        g.queue = g.queue && g.axis.length > 1;
        if (g.queue) f /= 2;
        g.offset = both(g.offset);
        g.over = both(g.over);
        return this._scrollable().each(function() {
            if (!e) return;
            var d = this,
                $elem = $(d),
                targ = e,
                toff, attr = {},
                win = $elem.is("html,body");
            switch (typeof targ) {
                case "number":
                case "string":
                    if (/^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(targ)) {
                        targ =
                            both(targ);
                        break
                    }
                    targ = $(targ, this);
                    if (!targ.length) return;
                case "object":
                    if (targ.is || targ.style) toff = (targ = $(targ)).offset()
            }
            $.each(g.axis.split(""), function(i, a) {
                var b = a == "x" ? "Left" : "Top",
                    pos = b.toLowerCase(),
                    key = "scroll" + b,
                    old = d[key],
                    max = h.max(d, a);
                if (toff) {
                    attr[key] = toff[pos] + (win ? 0 : old - $elem.offset()[pos]);
                    if (g.margin) {
                        attr[key] -= parseInt(targ.css("margin" + b)) || 0;
                        attr[key] -= parseInt(targ.css("border" + b + "Width")) || 0
                    }
                    attr[key] += g.offset[pos] || 0;
                    if (g.over[pos]) attr[key] += targ[a == "x" ? "width" : "height"]() *
                        g.over[pos]
                } else {
                    var c = targ[pos];
                    attr[key] = c.slice && c.slice(-1) == "%" ? parseFloat(c) / 100 * max : c
                }
                if (g.limit && /^\d+$/.test(attr[key])) attr[key] = attr[key] <= 0 ? 0 : Math.min(attr[key], max);
                if (!i && g.queue) {
                    if (old != attr[key]) animate(g.onAfterFirst);
                    delete attr[key]
                }
            });
            animate(g.onAfter);

            function animate(a) {
                $elem.animate(attr, f, g.easing, a && function() {
                    a.call(this, e, g)
                })
            }
        }).end()
    };
    h.max = function(a, b) {
        var c = b == "x" ? "Width" : "Height",
            scroll = "scroll" + c;
        if (!$(a).is("html,body")) return a[scroll] - $(a)[c.toLowerCase()]();
        var d = "client" + c,
            html = a.ownerDocument.documentElement,
            body = a.ownerDocument.body;
        return Math.max(html[scroll], body[scroll]) - Math.min(html[d], body[d])
    };

    function both(a) {
        return typeof a == "object" ? a : {
            top: a,
            left: a
        }
    }
})(jQuery);
(function($, window, document, undefined) {
    var OnePageNav = function(elem, options) {
        this.elem = elem;
        this.$elem = $(elem);
        this.options = options;
        this.metadata = this.$elem.data("plugin-options");
        this.$nav = this.$elem.find("a");
        this.$win = $(window);
        this.sections = {};
        this.didScroll = false;
        this.$doc = $(document);
        this.docHeight = this.$doc.height()
    };
    OnePageNav.prototype = {
        defaults: {
            currentClass: "current",
            changeHash: false,
            easing: "swing",
            filter: "",
            scrollSpeed: 750,
            scrollOffset: 0,
            scrollThreshold: 0.5,
            begin: false,
            end: false,
            scrollChange: false
        },
        init: function() {
            var self = this;
            self.config = $.extend({}, self.defaults, self.options, self.metadata);
            if (self.config.filter !== "") self.$nav = self.$nav.filter(self.config.filter);
            self.$nav.on("click.onePageNav", $.proxy(self.handleClick, self));
            self.getPositions();
            self.bindInterval();
            self.$win.on("resize.onePageNav", $.proxy(self.getPositions, self));
            return this
        },
        adjustNav: function(self, $parent) {
            self.$elem.find("." + self.config.currentClass).removeClass(self.config.currentClass);
            $parent.addClass(self.config.currentClass)
        },
        bindInterval: function() {
            var self = this;
            var docHeight;
            self.$win.on("scroll.onePageNav", function() {
                self.didScroll = true
            });
            self.t = setInterval(function() {
                docHeight = self.$doc.height();
                if (self.didScroll) {
                    self.didScroll = false;
                    self.scrollChange()
                }
                if (docHeight !== self.docHeight) {
                    self.docHeight = docHeight;
                    self.getPositions()
                }
            }, 250)
        },
        getHash: function($link) {
            return $link.attr("href").split("#")[1]
        },
        getPositions: function() {
            var self = this;
            var linkHref;
            var topPos;
            var $target;
            self.$nav.each(function() {
                linkHref = self.getHash($(this));
                $target = $("#" + linkHref);
                if ($target.length) {
                    topPos = $target.offset().top;
                    self.sections[linkHref] = Math.round(topPos) - self.config.scrollOffset
                }
            })
        },
        getSection: function(windowPos) {
            var returnValue = null;
            var windowHeight = Math.round(this.$win.height() * this.config.scrollThreshold);
            for (var section in this.sections)
                if (this.sections[section] - windowHeight < windowPos) returnValue = section;
            return returnValue
        },
        handleClick: function(e) {
            var self = this;
            var $link = $(e.currentTarget);
            var $parent = $link.parent();
            var newLoc = "#" +
                self.getHash($link);
            if (!$parent.hasClass(self.config.currentClass)) {
                if (self.config.begin) self.config.begin();
                self.adjustNav(self, $parent);
                self.unbindInterval();
                $.scrollTo(newLoc, self.config.scrollSpeed, {
                    axis: "y",
                    easing: self.config.easing,
                    offset: {
                        top: -self.config.scrollOffset
                    },
                    onAfter: function() {
                        if (self.config.changeHash) window.location.hash = newLoc;
                        self.bindInterval();
                        if (self.config.end) self.config.end()
                    }
                })
            }
            e.preventDefault()
        },
        scrollChange: function() {
            var windowTop = this.$win.scrollTop();
            var position =
                this.getSection(windowTop);
            var $parent;
            if (position !== null) {
                $parent = this.$elem.find('a[href$="#' + position + '"]').parent();
                if (!$parent.hasClass(this.config.currentClass)) {
                    this.adjustNav(this, $parent);
                    if (this.config.scrollChange) this.config.scrollChange($parent)
                }
            }
        },
        unbindInterval: function() {
            clearInterval(this.t);
            this.$win.unbind("scroll.onePageNav")
        }
    };
    OnePageNav.defaults = OnePageNav.prototype.defaults;
    $.fn.onePageNav = function(options) {
        return this.each(function() {
            (new OnePageNav(this, options)).init()
        })
    }
})(jQuery,
    window, document);
(function() {
    var root = typeof exports == "undefined" ? window : exports;
    var config = {
        check_mime_type: true
    };
    root.Retina = Retina;

    function Retina() {}
    Retina.configure = function(options) {
        if (options == null) options = {};
        for (var prop in options) config[prop] = options[prop]
    };
    Retina.init = function(context) {
        if (context == null) context = root;
        var existing_onload = context.onload || new Function;
        context.onload = function() {
            var images = document.getElementsByTagName("img"),
                retinaImages = [],
                i, image;
            for (i = 0; i < images.length; i++) {
                image = images[i];
                retinaImages.push(new RetinaImage(image))
            }
            existing_onload()
        }
    };
    Retina.isRetina = function() {
        var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),                      (min--moz-device-pixel-ratio: 1.5),                      (-o-min-device-pixel-ratio: 3/2),                      (min-resolution: 1.5dppx)";
        if (root.devicePixelRatio > 1) return true;
        if (root.matchMedia && root.matchMedia(mediaQuery).matches) return true;
        return false
    };
    root.RetinaImagePath = RetinaImagePath;

    function RetinaImagePath(path, at_2x_path) {
        this.path =
            path;
        if (typeof at_2x_path !== "undefined" && at_2x_path !== null) {
            this.at_2x_path = at_2x_path;
            this.perform_check = false
        } else {
            this.at_2x_path = path.replace(/\.\w+$/, function(match) {
                return "@2x" + match
            });
            this.perform_check = true
        }
    }
    RetinaImagePath.confirmed_paths = [];
    RetinaImagePath.prototype.is_external = function() {
        return !!(this.path.match(/^https?\:/i) && !this.path.match("//" + document.domain))
    };
    RetinaImagePath.prototype.check_2x_variant = function(callback) {
        var http, that = this;
        if (this.is_external()) return callback(false);
        else if (!this.perform_check && (typeof this.at_2x_path !== "undefined" && this.at_2x_path !== null)) return callback(true);
        else if (this.at_2x_path in RetinaImagePath.confirmed_paths) return callback(true);
        else {
            http = new XMLHttpRequest;
            http.open("HEAD", this.at_2x_path);
            http.onreadystatechange = function() {
                if (http.readyState != 4) return callback(false);
                if (http.status >= 200 && http.status <= 399) {
                    if (config.check_mime_type) {
                        var type = http.getResponseHeader("Content-Type");
                        if (type == null || !type.match(/^image/i)) return callback(false)
                    }
                    RetinaImagePath.confirmed_paths.push(that.at_2x_path);
                    return callback(true)
                } else return callback(false)
            };
            http.send()
        }
    };

    function RetinaImage(el) {
        this.el = el;
        this.path = new RetinaImagePath(this.el.getAttribute("src"), this.el.getAttribute("data-at2x"));
        var that = this;
        this.path.check_2x_variant(function(hasVariant) {
            if (hasVariant) that.swap()
        })
    }
    root.RetinaImage = RetinaImage;
    RetinaImage.prototype.swap = function(path) {
        if (typeof path == "undefined") path = this.path.at_2x_path;
        var that = this;

        function load() {
            if (!that.el.complete) setTimeout(load, 5);
            else {
                that.el.setAttribute("width",
                    that.el.offsetWidth);
                that.el.setAttribute("height", that.el.offsetHeight);
                that.el.setAttribute("src", path)
            }
        }
        load()
    };
    if (Retina.isRetina()) Retina.init(root)
})();
jQuery.easing["jswing"] = jQuery.easing["swing"];
jQuery.extend(jQuery.easing, {
    def: "easeOutQuad",
    swing: function(x, t, b, c, d) {
        return jQuery.easing[jQuery.easing.def](x, t, b, c, d)
    },
    easeInQuad: function(x, t, b, c, d) {
        return c * (t /= d) * t + b
    },
    easeOutQuad: function(x, t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b
    },
    easeInOutQuad: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t + b;
        return -c / 2 * (--t * (t - 2) - 1) + b
    },
    easeInCubic: function(x, t, b, c, d) {
        return c * (t /= d) * t * t + b
    },
    easeOutCubic: function(x, t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b
    },
    easeInOutCubic: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c /
            2 * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t + 2) + b
    },
    easeInQuart: function(x, t, b, c, d) {
        return c * (t /= d) * t * t * t + b
    },
    easeOutQuart: function(x, t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b
    },
    easeInOutQuart: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b
    },
    easeInQuint: function(x, t, b, c, d) {
        return c * (t /= d) * t * t * t * t + b
    },
    easeOutQuint: function(x, t, b, c, d) {
        return c * ((t = t / d - 1) * t * t * t * t + 1) + b
    },
    easeInOutQuint: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b
    },
    easeInSine: function(x,
        t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b
    },
    easeOutSine: function(x, t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b
    },
    easeInOutSine: function(x, t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b
    },
    easeInExpo: function(x, t, b, c, d) {
        return t == 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b
    },
    easeOutExpo: function(x, t, b, c, d) {
        return t == d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b
    },
    easeInOutExpo: function(x, t, b, c, d) {
        if (t == 0) return b;
        if (t == d) return b + c;
        if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b
    },
    easeInCirc: function(x, t, b, c, d) {
        return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b
    },
    easeOutCirc: function(x, t, b, c, d) {
        return c * Math.sqrt(1 - (t = t / d - 1) * t) + b
    },
    easeInOutCirc: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
        return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b
    },
    easeInElastic: function(x, t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (!p) p = d * 0.3;
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 *
            Math.PI) / p)) + b
    },
    easeOutElastic: function(x, t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (!p) p = d * 0.3;
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b
    },
    easeInOutElastic: function(x, t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d / 2) == 2) return b + c;
        if (!p) p = d * (0.3 * 1.5);
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        if (t < 1) return -0.5 * (a * Math.pow(2,
            10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b
    },
    easeInBack: function(x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * (t /= d) * t * ((s + 1) * t - s) + b
    },
    easeOutBack: function(x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b
    },
    easeInOutBack: function(x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
        return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b
    },
    easeInBounce: function(x, t,
        b, c, d) {
        return c - jQuery.easing.easeOutBounce(x, d - t, 0, c, d) + b
    },
    easeOutBounce: function(x, t, b, c, d) {
        if ((t /= d) < 1 / 2.75) return c * (7.5625 * t * t) + b;
        else if (t < 2 / 2.75) return c * (7.5625 * (t -= 1.5 / 2.75) * t + 0.75) + b;
        else if (t < 2.5 / 2.75) return c * (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375) + b;
        else return c * (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375) + b
    },
    easeInOutBounce: function(x, t, b, c, d) {
        if (t < d / 2) return jQuery.easing.easeInBounce(x, t * 2, 0, c, d) * 0.5 + b;
        return jQuery.easing.easeOutBounce(x, t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b
    }
});
(function($) {
    $.fn.appear = function(fn, options) {
        var settings = $.extend({
            data: undefined,
            one: true,
            accX: 0,
            accY: 0
        }, options);
        return this.each(function() {
            var t = $(this);
            t.appeared = false;
            if (!fn) {
                t.trigger("appear", settings.data);
                return
            }
            var w = $(window);
            var check = function() {
                if (!t.is(":visible")) {
                    t.appeared = false;
                    return
                }
                var a = w.scrollLeft();
                var b = w.scrollTop();
                var o = t.offset();
                var x = o.left;
                var y = o.top;
                var ax = settings.accX;
                var ay = settings.accY;
                var th = t.height();
                var wh = w.height();
                var tw = t.width();
                var ww = w.width();
                if (y + th + ay >= b && (y <= b + wh + ay && (x + tw + ax >= a && x <= a + ww + ax))) {
                    if (!t.appeared) t.trigger("appear", settings.data)
                } else t.appeared = false
            };
            var modifiedFn = function() {
                t.appeared = true;
                if (settings.one) {
                    w.unbind("scroll", check);
                    var i = $.inArray(check, $.fn.appear.checks);
                    if (i >= 0) $.fn.appear.checks.splice(i, 1)
                }
                fn.apply(this, arguments)
            };
            if (settings.one) t.one("appear", settings.data, modifiedFn);
            else t.bind("appear", settings.data, modifiedFn);
            w.scroll(check);
            $.fn.appear.checks.push(check);
            check()
        })
    };
    $.extend($.fn.appear, {
        checks: [],
        timeout: null,
        checkAll: function() {
            var length = $.fn.appear.checks.length;
            if (length > 0)
                while (length--) $.fn.appear.checks[length]()
        },
        run: function() {
            if ($.fn.appear.timeout) clearTimeout($.fn.appear.timeout);
            $.fn.appear.timeout = setTimeout($.fn.appear.checkAll, 20)
        }
    });
    $.each(["append", "prepend", "after", "before", "attr", "removeAttr", "addClass", "removeClass", "toggleClass", "remove", "css", "show", "hide"], function(i, n) {
        var old = $.fn[n];
        if (old) $.fn[n] = function() {
            var r = old.apply(this, arguments);
            $.fn.appear.run();
            return r
        }
    })
})(jQuery);
(function(e) {
    var o = "left",
        n = "right",
        d = "up",
        v = "down",
        c = "in",
        w = "out",
        l = "none",
        r = "auto",
        k = "swipe",
        s = "pinch",
        x = "tap",
        i = "doubletap",
        b = "longtap",
        A = "horizontal",
        t = "vertical",
        h = "all",
        q = 10,
        f = "start",
        j = "move",
        g = "end",
        p = "cancel",
        a = "ontouchstart" in window,
        y = "TouchSwipe";
    var m = {
        fingers: 1,
        threshold: 75,
        cancelThreshold: null,
        pinchThreshold: 20,
        maxTimeThreshold: null,
        fingerReleaseThreshold: 250,
        longTapThreshold: 500,
        doubleTapThreshold: 200,
        swipe: null,
        swipeLeft: null,
        swipeRight: null,
        swipeUp: null,
        swipeDown: null,
        swipeStatus: null,
        pinchIn: null,
        pinchOut: null,
        pinchStatus: null,
        click: null,
        tap: null,
        doubleTap: null,
        longTap: null,
        triggerOnTouchEnd: true,
        triggerOnTouchLeave: false,
        allowPageScroll: "auto",
        fallbackToMouseEvents: true,
        excludedElements: "button, input, select, textarea, a, .noSwipe"
    };
    e.fn.swipe = function(D) {
        var C = e(this),
            B = C.data(y);
        if (B && typeof D === "string")
            if (B[D]) return B[D].apply(this, Array.prototype.slice.call(arguments, 1));
            else e.error("Method " + D + " does not exist on jQuery.swipe");
        else if (!B && (typeof D === "object" || !D)) return u.apply(this,
            arguments);
        return C
    };
    e.fn.swipe.defaults = m;
    e.fn.swipe.phases = {
        PHASE_START: f,
        PHASE_MOVE: j,
        PHASE_END: g,
        PHASE_CANCEL: p
    };
    e.fn.swipe.directions = {
        LEFT: o,
        RIGHT: n,
        UP: d,
        DOWN: v,
        IN: c,
        OUT: w
    };
    e.fn.swipe.pageScroll = {
        NONE: l,
        HORIZONTAL: A,
        VERTICAL: t,
        AUTO: r
    };
    e.fn.swipe.fingers = {
        ONE: 1,
        TWO: 2,
        THREE: 3,
        ALL: h
    };

    function u(B) {
        if (B && (B.allowPageScroll === undefined && (B.swipe !== undefined || B.swipeStatus !== undefined))) B.allowPageScroll = l;
        if (B.click !== undefined && B.tap === undefined) B.tap = B.click;
        if (!B) B = {};
        B = e.extend({}, e.fn.swipe.defaults,
            B);
        return this.each(function() {
            var D = e(this);
            var C = D.data(y);
            if (!C) {
                C = new z(this, B);
                D.data(y, C)
            }
        })
    }

    function z(a0, aq) {
        var av = a || !aq.fallbackToMouseEvents,
            G = av ? "touchstart" : "mousedown",
            au = av ? "touchmove" : "mousemove",
            R = av ? "touchend" : "mouseup",
            P = av ? null : "mouseleave",
            az = "touchcancel";
        var ac = 0,
            aL = null,
            Y = 0,
            aX = 0,
            aV = 0,
            D = 1,
            am = 0,
            aF = 0,
            J = null;
        var aN = e(a0);
        var W = "start";
        var T = 0;
        var aM = null;
        var Q = 0,
            aY = 0,
            a1 = 0,
            aa = 0,
            K = 0;
        var aS = null;
        try {
            aN.bind(G, aJ);
            aN.bind(az, a5)
        } catch (ag) {
            e.error("events not supported " + G + "," + az +
                " on jQuery.swipe")
        }
        this.enable = function() {
            aN.bind(G, aJ);
            aN.bind(az, a5);
            return aN
        };
        this.disable = function() {
            aG();
            return aN
        };
        this.destroy = function() {
            aG();
            aN.data(y, null);
            return aN
        };
        this.option = function(a8, a7) {
            if (aq[a8] !== undefined)
                if (a7 === undefined) return aq[a8];
                else aq[a8] = a7;
            else e.error("Option " + a8 + " does not exist on jQuery.swipe.options")
        };

        function aJ(a9) {
            if (ax()) return;
            if (e(a9.target).closest(aq.excludedElements, aN).length > 0) return;
            var ba = a9.originalEvent ? a9.originalEvent : a9;
            var a8, a7 = a ? ba.touches[0] :
                ba;
            W = f;
            if (a) T = ba.touches.length;
            else a9.preventDefault();
            ac = 0;
            aL = null;
            aF = null;
            Y = 0;
            aX = 0;
            aV = 0;
            D = 1;
            am = 0;
            aM = af();
            J = X();
            O();
            if (!a || (T === aq.fingers || aq.fingers === h || aT())) {
                ae(0, a7);
                Q = ao();
                if (T == 2) {
                    ae(1, ba.touches[1]);
                    aX = aV = ap(aM[0].start, aM[1].start)
                }
                if (aq.swipeStatus || aq.pinchStatus) a8 = L(ba, W)
            } else a8 = false;
            if (a8 === false) {
                W = p;
                L(ba, W);
                return a8
            } else ak(true)
        }

        function aZ(ba) {
            var bd = ba.originalEvent ? ba.originalEvent : ba;
            if (W === g || (W === p || ai())) return;
            var a9, a8 = a ? bd.touches[0] : bd;
            var bb = aD(a8);
            aY = ao();
            if (a) T =
                bd.touches.length;
            W = j;
            if (T == 2) {
                if (aX == 0) {
                    ae(1, bd.touches[1]);
                    aX = aV = ap(aM[0].start, aM[1].start)
                } else {
                    aD(bd.touches[1]);
                    aV = ap(aM[0].end, aM[1].end);
                    aF = an(aM[0].end, aM[1].end)
                }
                D = a3(aX, aV);
                am = Math.abs(aX - aV)
            }
            if (T === aq.fingers || aq.fingers === h || (!a || aT())) {
                aL = aH(bb.start, bb.end);
                ah(ba, aL);
                ac = aO(bb.start, bb.end);
                Y = aI();
                aE(aL, ac);
                if (aq.swipeStatus || aq.pinchStatus) a9 = L(bd, W);
                if (!aq.triggerOnTouchEnd || aq.triggerOnTouchLeave) {
                    var a7 = true;
                    if (aq.triggerOnTouchLeave) {
                        var bc = aU(this);
                        a7 = B(bb.end, bc)
                    }
                    if (!aq.triggerOnTouchEnd &&
                        a7) W = ay(j);
                    else if (aq.triggerOnTouchLeave && !a7) W = ay(g);
                    if (W == p || W == g) L(bd, W)
                }
            } else {
                W = p;
                L(bd, W)
            }
            if (a9 === false) {
                W = p;
                L(bd, W)
            }
        }

        function I(a7) {
            var a8 = a7.originalEvent;
            if (a)
                if (a8.touches.length > 0) {
                    C();
                    return true
                }
            if (ai()) T = aa;
            a7.preventDefault();
            aY = ao();
            Y = aI();
            if (a6()) {
                W = p;
                L(a8, W)
            } else if (aq.triggerOnTouchEnd || aq.triggerOnTouchEnd == false && W === j) {
                W = g;
                L(a8, W)
            } else if (!aq.triggerOnTouchEnd && a2()) {
                W = g;
                aB(a8, W, x)
            } else if (W === j) {
                W = p;
                L(a8, W)
            }
            ak(false)
        }

        function a5() {
            T = 0;
            aY = 0;
            Q = 0;
            aX = 0;
            aV = 0;
            D = 1;
            O();
            ak(false)
        }

        function H(a7) {
            var a8 =
                a7.originalEvent;
            if (aq.triggerOnTouchLeave) {
                W = ay(g);
                L(a8, W)
            }
        }

        function aG() {
            aN.unbind(G, aJ);
            aN.unbind(az, a5);
            aN.unbind(au, aZ);
            aN.unbind(R, I);
            if (P) aN.unbind(P, H);
            ak(false)
        }

        function ay(bb) {
            var ba = bb;
            var a9 = aw();
            var a8 = aj();
            var a7 = a6();
            if (!a9 || a7) ba = p;
            else if (a8 && (bb == j && (!aq.triggerOnTouchEnd || aq.triggerOnTouchLeave))) ba = g;
            else if (!a8 && (bb == g && aq.triggerOnTouchLeave)) ba = p;
            return ba
        }

        function L(a9, a7) {
            var a8 = undefined;
            if (F() || S()) a8 = aB(a9, a7, k);
            else if ((M() || aT()) && a8 !== false) a8 = aB(a9, a7, s);
            if (aC() && a8 !==
                false) a8 = aB(a9, a7, i);
            else if (al() && a8 !== false) a8 = aB(a9, a7, b);
            else if (ad() && a8 !== false) a8 = aB(a9, a7, x);
            if (a7 === p) a5(a9);
            if (a7 === g)
                if (a) {
                    if (a9.touches.length == 0) a5(a9)
                } else a5(a9);
            return a8
        }

        function aB(ba, a7, a9) {
            var a8 = undefined;
            if (a9 == k) {
                aN.trigger("swipeStatus", [a7, aL || null, ac || 0, Y || 0, T]);
                if (aq.swipeStatus) {
                    a8 = aq.swipeStatus.call(aN, ba, a7, aL || null, ac || 0, Y || 0, T);
                    if (a8 === false) return false
                }
                if (a7 == g && aR()) {
                    aN.trigger("swipe", [aL, ac, Y, T]);
                    if (aq.swipe) {
                        a8 = aq.swipe.call(aN, ba, aL, ac, Y, T);
                        if (a8 === false) return false
                    }
                    switch (aL) {
                        case o:
                            aN.trigger("swipeLeft", [aL, ac, Y, T]);
                            if (aq.swipeLeft) a8 = aq.swipeLeft.call(aN, ba, aL, ac, Y, T);
                            break;
                        case n:
                            aN.trigger("swipeRight", [aL, ac, Y, T]);
                            if (aq.swipeRight) a8 = aq.swipeRight.call(aN, ba, aL, ac, Y, T);
                            break;
                        case d:
                            aN.trigger("swipeUp", [aL, ac, Y, T]);
                            if (aq.swipeUp) a8 = aq.swipeUp.call(aN, ba, aL, ac, Y, T);
                            break;
                        case v:
                            aN.trigger("swipeDown", [aL, ac, Y, T]);
                            if (aq.swipeDown) a8 = aq.swipeDown.call(aN, ba, aL, ac, Y, T);
                            break
                    }
                }
            }
            if (a9 == s) {
                aN.trigger("pinchStatus", [a7, aF || null, am || 0, Y || 0, T, D]);
                if (aq.pinchStatus) {
                    a8 = aq.pinchStatus.call(aN, ba, a7, aF ||
                        null, am || 0, Y || 0, T, D);
                    if (a8 === false) return false
                }
                if (a7 == g && a4()) switch (aF) {
                    case c:
                        aN.trigger("pinchIn", [aF || null, am || 0, Y || 0, T, D]);
                        if (aq.pinchIn) a8 = aq.pinchIn.call(aN, ba, aF || null, am || 0, Y || 0, T, D);
                        break;
                    case w:
                        aN.trigger("pinchOut", [aF || null, am || 0, Y || 0, T, D]);
                        if (aq.pinchOut) a8 = aq.pinchOut.call(aN, ba, aF || null, am || 0, Y || 0, T, D);
                        break
                }
            }
            if (a9 == x) {
                if (a7 === p || a7 === g) {
                    clearTimeout(aS);
                    if (V() && !E()) {
                        K = ao();
                        aS = setTimeout(e.proxy(function() {
                                K = null;
                                aN.trigger("tap", [ba.target]);
                                if (aq.tap) a8 = aq.tap.call(aN, ba, ba.target)
                            },
                            this), aq.doubleTapThreshold)
                    } else {
                        K = null;
                        aN.trigger("tap", [ba.target]);
                        if (aq.tap) a8 = aq.tap.call(aN, ba, ba.target)
                    }
                }
            } else if (a9 == i) {
                if (a7 === p || a7 === g) {
                    clearTimeout(aS);
                    K = null;
                    aN.trigger("doubletap", [ba.target]);
                    if (aq.doubleTap) a8 = aq.doubleTap.call(aN, ba, ba.target)
                }
            } else if (a9 == b)
                if (a7 === p || a7 === g) {
                    clearTimeout(aS);
                    K = null;
                    aN.trigger("longtap", [ba.target]);
                    if (aq.longTap) a8 = aq.longTap.call(aN, ba, ba.target)
                }
            return a8
        }

        function aj() {
            var a7 = true;
            if (aq.threshold !== null) a7 = ac >= aq.threshold;
            return a7
        }

        function a6() {
            var a7 =
                false;
            if (aq.cancelThreshold !== null && aL !== null) a7 = aP(aL) - ac >= aq.cancelThreshold;
            return a7
        }

        function ab() {
            if (aq.pinchThreshold !== null) return am >= aq.pinchThreshold;
            return true
        }

        function aw() {
            var a7;
            if (aq.maxTimeThreshold)
                if (Y >= aq.maxTimeThreshold) a7 = false;
                else a7 = true;
            else a7 = true;
            return a7
        }

        function ah(a7, a8) {
            if (aq.allowPageScroll === l || aT()) a7.preventDefault();
            else {
                var a9 = aq.allowPageScroll === r;
                switch (a8) {
                    case o:
                        if (aq.swipeLeft && a9 || !a9 && aq.allowPageScroll != A) a7.preventDefault();
                        break;
                    case n:
                        if (aq.swipeRight &&
                            a9 || !a9 && aq.allowPageScroll != A) a7.preventDefault();
                        break;
                    case d:
                        if (aq.swipeUp && a9 || !a9 && aq.allowPageScroll != t) a7.preventDefault();
                        break;
                    case v:
                        if (aq.swipeDown && a9 || !a9 && aq.allowPageScroll != t) a7.preventDefault();
                        break
                }
            }
        }

        function a4() {
            var a8 = aK();
            var a7 = U();
            var a9 = ab();
            return a8 && (a7 && a9)
        }

        function aT() {
            return !!(aq.pinchStatus || (aq.pinchIn || aq.pinchOut))
        }

        function M() {
            return !!(a4() && aT())
        }

        function aR() {
            var ba = aw();
            var bc = aj();
            var a9 = aK();
            var a7 = U();
            var a8 = a6();
            var bb = !a8 && (a7 && (a9 && (bc && ba)));
            return bb
        }

        function S() {
            return !!(aq.swipe || (aq.swipeStatus || (aq.swipeLeft || (aq.swipeRight || (aq.swipeUp || aq.swipeDown)))))
        }

        function F() {
            return !!(aR() && S())
        }

        function aK() {
            return T === aq.fingers || aq.fingers === h || !a
        }

        function U() {
            return aM[0].end.x !== 0
        }

        function a2() {
            return !!aq.tap
        }

        function V() {
            return !!aq.doubleTap
        }

        function aQ() {
            return !!aq.longTap
        }

        function N() {
            if (K == null) return false;
            var a7 = ao();
            return V() && a7 - K <= aq.doubleTapThreshold
        }

        function E() {
            return N()
        }

        function at() {
            return (T === 1 || !a) && (isNaN(ac) || ac === 0)
        }

        function aW() {
            return Y >
                aq.longTapThreshold && ac < q
        }

        function ad() {
            return !!(at() && a2())
        }

        function aC() {
            return !!(N() && V())
        }

        function al() {
            return !!(aW() && aQ())
        }

        function C() {
            a1 = ao();
            aa = event.touches.length + 1
        }

        function O() {
            a1 = 0;
            aa = 0
        }

        function ai() {
            var a7 = false;
            if (a1) {
                var a8 = ao() - a1;
                if (a8 <= aq.fingerReleaseThreshold) a7 = true
            }
            return a7
        }

        function ax() {
            return !!(aN.data(y + "_intouch") === true)
        }

        function ak(a7) {
            if (a7 === true) {
                aN.bind(au, aZ);
                aN.bind(R, I);
                if (P) aN.bind(P, H)
            } else {
                aN.unbind(au, aZ, false);
                aN.unbind(R, I, false);
                if (P) aN.unbind(P, H, false)
            }
            aN.data(y +
                "_intouch", a7 === true)
        }

        function ae(a8, a7) {
            var a9 = a7.identifier !== undefined ? a7.identifier : 0;
            aM[a8].identifier = a9;
            aM[a8].start.x = aM[a8].end.x = a7.pageX || a7.clientX;
            aM[a8].start.y = aM[a8].end.y = a7.pageY || a7.clientY;
            return aM[a8]
        }

        function aD(a7) {
            var a9 = a7.identifier !== undefined ? a7.identifier : 0;
            var a8 = Z(a9);
            a8.end.x = a7.pageX || a7.clientX;
            a8.end.y = a7.pageY || a7.clientY;
            return a8
        }

        function Z(a8) {
            for (var a7 = 0; a7 < aM.length; a7++)
                if (aM[a7].identifier == a8) return aM[a7]
        }

        function af() {
            var a7 = [];
            for (var a8 = 0; a8 <= 5; a8++) a7.push({
                start: {
                    x: 0,
                    y: 0
                },
                end: {
                    x: 0,
                    y: 0
                },
                identifier: 0
            });
            return a7
        }

        function aE(a7, a8) {
            a8 = Math.max(a8, aP(a7));
            J[a7].distance = a8
        }

        function aP(a7) {
            return J[a7].distance
        }

        function X() {
            var a7 = {};
            a7[o] = ar(o);
            a7[n] = ar(n);
            a7[d] = ar(d);
            a7[v] = ar(v);
            return a7
        }

        function ar(a7) {
            return {
                direction: a7,
                distance: 0
            }
        }

        function aI() {
            return aY - Q
        }

        function ap(ba, a9) {
            var a8 = Math.abs(ba.x - a9.x);
            var a7 = Math.abs(ba.y - a9.y);
            return Math.round(Math.sqrt(a8 * a8 + a7 * a7))
        }

        function a3(a7, a8) {
            var a9 = a8 / a7 * 1;
            return a9.toFixed(2)
        }

        function an() {
            if (D < 1) return w;
            else return c
        }

        function aO(a8, a7) {
            return Math.round(Math.sqrt(Math.pow(a7.x - a8.x, 2) + Math.pow(a7.y - a8.y, 2)))
        }

        function aA(ba, a8) {
            var a7 = ba.x - a8.x;
            var bc = a8.y - ba.y;
            var a9 = Math.atan2(bc, a7);
            var bb = Math.round(a9 * 180 / Math.PI);
            if (bb < 0) bb = 360 - Math.abs(bb);
            return bb
        }

        function aH(a8, a7) {
            var a9 = aA(a8, a7);
            if (a9 <= 45 && a9 >= 0) return o;
            else if (a9 <= 360 && a9 >= 315) return o;
            else if (a9 >= 135 && a9 <= 225) return n;
            else if (a9 > 45 && a9 < 135) return v;
            else return d
        }

        function ao() {
            var a7 = new Date;
            return a7.getTime()
        }

        function aU(a7) {
            a7 = e(a7);
            var a9 = a7.offset();
            var a8 = {
                left: a9.left,
                right: a9.left + a7.outerWidth(),
                top: a9.top,
                bottom: a9.top + a7.outerHeight()
            };
            return a8
        }

        function B(a7, a8) {
            return a7.x > a8.left && (a7.x < a8.right && (a7.y > a8.top && a7.y < a8.bottom))
        }
    }
})(jQuery);
if (typeof Object.create !== "function") Object.create = function(b) {
    function a() {}
    a.prototype = b;
    return new a
};
(function(d, c, a, e) {
    var b = {
        makeResponsive: function() {
            var f = this;
            d(f.sliderId + "-wrapper").addClass("ls-responsive").css({
                "max-width": d(f.sliderId + " .panel:first-child").width(),
                width: "100%"
            });
            d(f.sliderId + " .panel-container").css("width", 100 * f.panelCountTotal + f.pSign);
            d(f.sliderId + " .panel").css("width", 100 / f.panelCountTotal + f.pSign);
            if (f.options.hideArrowsWhenMobile) {
                f.leftWrapperPadding = d(f.sliderId + "-wrapper").css("padding-left");
                f.rightWrapperPadding = f.$sliderWrap.css("padding-right")
            }
            f.responsiveEvents();
            d(c).bind("resize", function() {
                f.responsiveEvents();
                clearTimeout(f.resizingTimeout);
                f.resizingTimeout = setTimeout(function() {
                    var g = f.options.autoHeight ? f.getHeight() : f.getHeighestPanel(f.nextPanel);
                    f.adjustHeight(false, g)
                }, 500)
            })
        },
        responsiveEvents: function() {
            var g = this,
                f = g.options.hideArrowsThreshold || (g.options.mobileUIThreshold || g.totalNavWidth + 10);
            if (g.$sliderId.outerWidth() < f) {
                if (g.options.mobileNavigation) {
                    g.navigation.css("display", "none");
                    g.dropdown.css("display", "block");
                    g.dropdownSelect.css("display",
                        "block");
                    d(g.sliderId + "-nav-select").val(g.options.mobileNavDefaultText)
                }
                if (g.options.dynamicArrows)
                    if (g.options.hideArrowsWhenMobile) {
                        g.leftArrow.remove().length = 0;
                        g.rightArrow.remove().length = 0
                    } else if (!g.options.dynamicArrowsGraphical) {
                    g.leftArrow.css("margin-" + g.options.dynamicTabsPosition, "0");
                    g.rightArrow.css("margin-" + g.options.dynamicTabsPosition, "0")
                }
            } else {
                if (g.options.mobileNavigation) {
                    g.navigation.css("display", "block");
                    g.dropdown.css("display", "none");
                    g.dropdownSelect.css("display", "none")
                }
                if (g.options.dynamicArrows)
                    if (g.options.hideArrowsWhenMobile &&
                        (!g.leftArrow.length || !g.rightArrow.length)) {
                        g.addArrows();
                        g.registerArrows()
                    } else if (!g.options.dynamicArrowsGraphical) {
                    g.leftArrow.css("margin-" + g.options.dynamicTabsPosition, g.navigation.css("height"));
                    g.rightArrow.css("margin-" + g.options.dynamicTabsPosition, g.navigation.css("height"))
                }
            }
            d(g.sliderId + "-wrapper").css("width", "100%");
            if (g.options.mobileNavigation) g.dropdownSelect.change(function() {
                g.setNextPanel(parseInt(d(this).val().split("tab")[1], 10) - 1)
            })
        },
        adjustHeight: function(h, f, j, i) {
            var g =
                this;
            if (h || g.useCSS) {
                if (h) g.configureCSSTransitions("0", "0");
                g.$sliderId.height(f);
                if (h) g.configureCSSTransitions();
                return
            }
            g.$sliderId.animate({
                height: f + "px"
            }, {
                easing: j || g.options.heightEaseFunction,
                duration: i || g.options.heightEaseDuration,
                queue: false
            })
        },
        getHeight: function(f) {
            var g = this;
            f = f || g.$panelClass.eq(g.sanatizeNumber(g.nextPanel) - 1).outerHeight(true);
            f = f < g.options.minHeight ? g.options.minHeight : f;
            return f
        },
        addNavigation: function(i) {
            var h = this,
                f = "<" + h.options.navElementTag + ' class="ls-nav"><ul id="' +
                h.$elem.attr("id") + '-nav-ul"></ul></' + h.options.navElementTag + ">";
            if (h.options.dynamicTabsPosition === "bottom") h.$sliderId.after(f);
            else h.$sliderId.before(f);
            if (h.options.mobileNavigation) {
                var j = h.options.mobileNavDefaultText ? '<option disabled="disabled" selected="selected">' + h.options.mobileNavDefaultText + "</option>" : null,
                    g = '<div class="ls-select-box"><select id="' + h.$elem.attr("id") + '-nav-select" name="navigation">' + j + "</select></div>";
                h.navigation = d(h.sliderId + "-nav-ul").before(g);
                h.dropdown = d(h.sliderId +
                    "-wrapper .ls-select-box");
                h.dropdownSelect = d(h.sliderId + "-nav-select");
                d.each(h.$elem.find(h.options.panelTitleSelector), function(k) {
                    d(h.$sliderWrap).find(".ls-select-box select").append('<option value="tab' + (k + 1) + '">' + d(this).text() + "</option>")
                })
            }
            d.each(h.$elem.find(h.options.panelTitleSelector), function(k) {
                d(h.$sliderWrap).find(".ls-nav ul").append('<li class="tab' + (k + 1) + '"><a class="' + (i || "") + '" href="#' + (k + 1) + '">' + h.getNavInsides(this) + "</a></li>");
                if (!h.options.includeTitle) d(this).remove()
            })
        },
        getNavInsides: function(f) {
            return this.options.dynamicTabsHtml ? d(f).html() : d(f).text()
        },
        alignNavigation: function() {
            var f = this,
                g = f.options.dynamicArrowsGraphical ? "-arrow" : "";
            if (f.options.dynamicTabsAlign !== "center") {
                if (!f.options.responsive) d(f.$sliderWrap).find(".ls-nav ul").css("margin-" + f.options.dynamicTabsAlign, d(f.$sliderWrap).find(".ls-nav-" + f.options.dynamicTabsAlign + g).outerWidth(true) + parseInt(f.$sliderId.css("margin-" + f.options.dynamicTabsAlign), 10));
                d(f.$sliderWrap).find(".ls-nav ul").css("float",
                    f.options.dynamicTabsAlign)
            }
            f.totalNavWidth = d(f.$sliderWrap).find(".ls-nav ul").outerWidth(true);
            if (f.options.dynamicTabsAlign === "center") {
                f.totalNavWidth = 0;
                d(f.$sliderWrap).find(".ls-nav li a").each(function() {
                    f.totalNavWidth += d(this).outerWidth(true)
                });
                d(f.$sliderWrap).find(".ls-nav ul").css("width", f.totalNavWidth + 1)
            }
        },
        registerNav: function() {
            var f = this;
            f.$sliderWrap.find("[class^=ls-nav] li").on("click", function() {
                f.setNextPanel(parseInt(d(this).attr("class").split("tab")[1], 10) - 1);
                return false
            })
        },
        registerTouch: function() {
            var f = this,
                g = f.options.swipeArgs || {
                    fallbackToMouseEvents: false,
                    allowPageScroll: "vertical",
                    swipe: function(i, h) {
                        if (h === "up" || h === "down") return false;
                        f.swipeDir = h === "left" ? "right" : "left";
                        f.setNextPanel(f.swipeDir)
                    }
                };
            d(f.sliderId + " .panel").swipe(g)
        },
        init: function(g, h) {
            var f = this;
            f.elem = h;
            f.$elem = d(h);
            d("body").removeClass("no-js");
            f.sliderId = "#" + f.$elem.attr("id");
            f.$sliderId = d(f.sliderId);
            f.options = d.extend({}, d.fn.liquidSlider.options, g);
            f.pSign = f.options.responsive ? "%" : "px";
            if (f.options.responsive) f.determineAnimationType();
            else {
                f.options.mobileNavigation = false;
                f.options.hideArrowsWhenMobile = false
            }
            if (f.options.slideEaseFunction === "animate.css")
                if (!f.useCSS) f.options.slideEaseFunction = f.options.slideEaseFunctionFallback;
                else {
                    f.options.continuous = false;
                    f.animateCSS = true
                }
            f.build();
            f.events();
            if (!f.options.responsive && f.options.dynamicArrows) f.$sliderWrap.width(f.$sliderId.outerWidth(true) + f.leftArrow.outerWidth(true) + f.rightArrow.outerWidth(true));
            f.loaded = true;
            d(c).bind("load",
                function() {
                    f.options.preload.call(f)
                })
        },
        build: function() {
            var f = this,
                h;
            if (f.$sliderId.parent().attr("class") !== "ls-wrapper") f.$sliderId.wrap('<div id="' + f.$elem.attr("id") + '-wrapper" class="ls-wrapper"></div>');
            f.$sliderWrap = d(f.sliderId + "-wrapper");
            if (f.options.preloader) f.addPreloader();
            d(f.sliderId).children().addClass(f.$elem.attr("id") + "-panel panel");
            f.panelClass = f.sliderId + " ." + f.$elem.attr("id") + "-panel:not(.clone)";
            f.$panelClass = d(f.panelClass);
            f.$panelClass.wrapAll('<div class="panel-container"></div>');
            f.$panelClass.wrapInner('<div class="panel-wrapper"></div>');
            f.panelContainer = f.$panelClass.parent();
            f.$panelContainer = f.panelContainer;
            if (f.options.slideEaseFunction === "fade") {
                f.$panelClass.addClass("fade");
                f.options.continuous = false;
                f.fade = true
            }
            if (f.options.dynamicTabs) f.addNavigation();
            else f.options.mobileNavigation = false;
            if (f.options.dynamicArrows) f.addArrows();
            else {
                f.options.hoverArrows = false;
                f.options.hideSideArrows = false;
                f.options.hideArrowsWhenMobile = false
            }
            h = f.$leftArrow && f.$leftArrow.css("position") ===
                "absolute" ? 0 : 1;
            f.totalSliderWidth = f.$sliderId.outerWidth(true) + d(f.$leftArrow).outerWidth(true) * h + d(f.$rightArrow).outerWidth(true) * h;
            d(f.$sliderWrap).css("width", f.totalSliderWidth);
            if (f.options.dynamicTabs) f.alignNavigation();
            if (f.options.hideSideArrows) f.options.continuous = false;
            if (f.options.continuous) {
                f.$panelContainer.prepend(f.$panelContainer.children().last().clone().addClass("clone"));
                f.$panelContainer.append(f.$panelContainer.children().eq(1).clone().addClass("clone"))
            }
            var g = f.options.continuous ?
                2 : 0;
            f.panelCount = d(f.panelClass).length;
            f.panelCountTotal = f.fade ? 1 : f.panelCount + g;
            f.panelWidth = d(f.panelClass).outerWidth();
            f.totalWidth = f.panelCountTotal * f.panelWidth;
            d(f.sliderId + " .panel-container").css("width", f.totalWidth);
            f.slideDistance = f.options.responsive ? 100 : d(f.sliderId).outerWidth();
            if (f.useCSS) {
                f.totalWidth = 100 * f.panelCountTotal;
                f.slideDistance = 100 / f.panelCountTotal
            }
            if (f.options.responsive) f.makeResponsive();
            f.prepareTransition(f.getFirstPanel(), true);
            f.updateClass()
        },
        determineAnimationType: function() {
            var f =
                this,
                l = "animation",
                j = "",
                h = "Webkit Moz O ms Khtml".split(" "),
                k = "",
                g = 0;
            f.useCSS = false;
            if (f.elem.style.animationName) f.useCSS = true;
            if (f.useCSS === false)
                for (g = 0; g < h.length; g++)
                    if (f.elem.style[h[g] + "AnimationName"] !== e) {
                        k = h[g];
                        l = k + "Animation";
                        j = "-" + k.toLowerCase() + "-";
                        f.useCSS = true;
                        break
                    }
            if (a.documentElement.clientWidth > f.options.useCSSMaxWidth) f.useCSS = false
        },
        configureCSSTransitions: function(g, f) {
            var h = this,
                i, j;
            h.easing = {
                easeOutCubic: "cubic-bezier(.215,.61,.355,1)",
                easeInOutCubic: "cubic-bezier(.645,.045,.355,1)",
                easeInCirc: "cubic-bezier(.6,.04,.98,.335)",
                easeOutCirc: "cubic-bezier(.075,.82,.165,1)",
                easeInOutCirc: "cubic-bezier(.785,.135,.15,.86)",
                easeInExpo: "cubic-bezier(.95,.05,.795,.035)",
                easeOutExpo: "cubic-bezier(.19,1,.22,1)",
                easeInOutExpo: "cubic-bezier(1,0,0,1)",
                easeInQuad: "cubic-bezier(.55,.085,.68,.53)",
                easeOutQuad: "cubic-bezier(.25,.46,.45,.94)",
                easeInOutQuad: "cubic-bezier(.455,.03,.515,.955)",
                easeInQuart: "cubic-bezier(.895,.03,.685,.22)",
                easeOutQuart: "cubic-bezier(.165,.84,.44,1)",
                easeInOutQuart: "cubic-bezier(.77,0,.175,1)",
                easeInQuint: "cubic-bezier(.755,.05,.855,.06)",
                easeOutQuint: "cubic-bezier(.23,1,.32,1)",
                easeInOutQuint: "cubic-bezier(.86,0,.07,1)",
                easeInSine: "cubic-bezier(.47,0,.745,.715)",
                easeOutSine: "cubic-bezier(.39,.575,.565,1)",
                easeInOutSine: "cubic-bezier(.445,.05,.55,.95)",
                easeInBack: "cubic-bezier(.6,-.28,.735,.045)",
                easeOutBack: "cubic-bezier(.175,.885,.32,1.275)",
                easeInOutBack: "cubic-bezier(.68,-.55,.265,1.55)"
            };
            if (h.useCSS) {
                i = "all " + (g || h.options.slideEaseDuration) + "ms " + h.easing[h.options.slideEaseFunction];
                j = "all " + (f || h.options.heightEaseDuration) + "ms " + h.easing[h.options.heightEaseFunction];
                d(h.panelContainer).css({
                    "-webkit-transition": i,
                    "-moz-transition": i,
                    "-ms-transition": i,
                    "-o-transition": i,
                    transition: i
                });
                if (h.options.autoHeight) h.$sliderId.css({
                    "-webkit-transition": j,
                    "-moz-transition": j,
                    "-ms-transition": j,
                    "-o-transition": j,
                    transition: j
                })
            }
        },
        transitionFade: function() {
            var f = this;
            d(f.panelClass).eq(f.nextPanel).fadeTo(f.options.fadeInDuration, 1).css("z-index", 1);
            d(f.panelClass).eq(f.prevPanel).fadeTo(f.options.fadeOutDuration,
                0).css("z-index", 0);
            f.callback(f.options.callback, true)
        },
        hover: function() {
            var f = this;
            f.$sliderWrap.hover(function() {
                if (f.options.hoverArrows) f.hideShowArrows(f.options.fadeInDuration, true, true, false);
                if (f.options.pauseOnHover) clearTimeout(f.autoSlideTimeout)
            }, function() {
                if (f.options.hoverArrows) f.hideShowArrows(f.options.fadeOutnDuration, true, false, true);
                if (f.options.pauseOnHover && f.options.autoSlide) f.startAutoSlide()
            })
        },
        events: function() {
            var f = this;
            if (f.options.dynamicArrows) f.registerArrows();
            if (f.options.crossLinks) f.registerCrossLinks();
            if (f.options.dynamicTabs) f.registerNav();
            if (f.options.swipe) f.registerTouch();
            if (f.options.keyboardNavigation) f.registerKeyboard();
            f.$sliderWrap.find("*").on("click", function() {
                if (f.options.forceAutoSlide) f.startAutoSlide(true);
                else if (f.options.autoSlide) f.stopAutoSlide()
            });
            f.hover()
        },
        setNextPanel: function(g) {
            var f = this;
            if (g === f.nextPanel) return;
            f.prevPanel = f.nextPanel;
            if (f.loaded) {
                if (typeof g === "number") f.nextPanel = g;
                else {
                    f.nextPanel += ~~(g === "right") ||
                        -1;
                    if (!f.options.continuous) f.nextPanel = f.nextPanel < 0 ? f.panelCount - 1 : f.nextPanel % f.panelCount
                }
                if (f.fade || f.animateCSS) f.prepareTransition(f.nextPanel);
                else f.verifyPanel()
            }
        },
        getFirstPanel: function() {
            var g = this,
                f;
            if (g.options.hashLinking) {
                f = g.getPanelNumber(c.location.hash, g.options.hashTitleSelector);
                if (typeof f !== "number") f = 0
            }
            return f ? f : g.options.firstPanelToLoad - 1
        },
        getPanelNumber: function(i, h) {
            var g = this,
                j, f = i.replace("#", "").toLowerCase();
            g.$panelClass.each(function(k) {
                j = g.convertRegex(d(this).find(h).text());
                if (j === f) f = k + 1
            });
            return parseInt(f, 10) ? parseInt(f, 10) - 1 : f
        },
        getFromPanel: function(g, h) {
            var f = this;
            return f.convertRegex(f.$panelClass.find(g).eq(h).text())
        },
        convertRegex: function(f) {
            return f.replace(/[^\w -]+/g, "").replace(/ +/g, "-").toLowerCase()
        },
        updateClass: function() {
            var f = this;
            if (f.options.dynamicTabs) d(f.$sliderWrap).find(".tab" + f.sanatizeNumber(f.nextPanel) + ":first a").addClass("current").parent().siblings().children().removeClass("current");
            if (f.options.crossLinks && f.crosslinks) {
                f.crosslinks.not(f.nextPanel).removeClass("currentCrossLink");
                f.crosslinks.each(function() {
                    if (d(this).attr("href") === "#" + f.getFromPanel(f.options.panelTitleSelector, f.sanatizeNumber(f.nextPanel) - 1)) d(this).addClass("currentCrossLink")
                })
            }
            f.$panelClass.eq(f.nextPanel).addClass("currentPanel").siblings().removeClass("currentPanel")
        },
        sanatizeNumber: function(f) {
            var g = this;
            if (f >= g.panelCount) return 1;
            else if (f <= -1) return g.panelCount;
            else return f + 1
        },
        finalize: function() {
            var g = this;
            var f = g.options.autoHeight ? g.getHeight() : g.getHeighestPanel(g.nextPanel);
            if (g.options.autoHeight) g.adjustHeight(true,
                f);
            if (g.options.autoSlide) g.autoSlide();
            if (g.options.preloader) g.removePreloader();
            g.onload()
        },
        callback: function(g, h) {
            var f = this;
            if (g && f.loaded)
                if (f.useCSS && typeof h !== "undefined") d(".panel-container").one("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend", function(i) {
                    g.call(f)
                });
                else setTimeout(function() {
                    g.call(f)
                }, f.options.slideEaseDuration + 50)
        },
        onload: function() {
            var f = this;
            f.options.onload.call(f)
        },
        prepareTransition: function(j, h, g, i) {
            var f = this;
            f.nextPanel = j || 0;
            if (!g) f.pretransition(f.options.pretransition);
            f.noAnimation = h;
            f.noPosttransition = i;
            if (!f.loaded) f.transition();
            else f.options.pretransition.call(f)
        },
        pretransition: function() {
            var f = this,
                g;
            if (f.options.hashLinking) f.updateHashTags();
            if (f.options.mobileNavigation) f.dropdownSelect.val("tab" + (f.nextPanel + 1));
            if (f.options.hideSideArrows) f.hideShowArrows();
            f.updateClass()
        },
        getTransitionMargin: function() {
            var f = this;
            return -(f.nextPanel * f.slideDistance) - f.slideDistance * ~~f.options.continuous
        },
        transition: function() {
            var f =
                this,
                g = f.getTransitionMargin();
            if (f.animateCSS && f.loaded) {
                f.transitionOutAnimateCSS();
                return false
            }
            if (g + f.pSign !== f.panelContainer.css("margin-left") || g !== -100) {
                if (f.options.autoHeight && !f.animateCSS) f.adjustHeight(true, f.getHeight());
                if (f.fade) f.transitionFade();
                else if (f.animateCSS) f.transitionInAnimateCSS(g);
                else if (f.useCSS) f.transitionCSS(g, f.noAnimation);
                else f.transitionjQuery(g, f.noAnimation)
            }
            if (!f.noPosttransition) f.callback(f.options.callback)
        },
        transitionOutAnimateCSS: function() {
            var f = this;
            d(f.panelClass).removeClass(f.options.animateIn + " animated");
            d(f.panelClass).eq(f.prevPanel).addClass("animated " + f.options.animateOut);
            f.callback(f.transitionInAnimateCSS, e)
        },
        transitionInAnimateCSS: function() {
            var f = this;
            if (f.options.autoHeight) f.adjustHeight(false, f.getHeight());
            f.transitionCSS(f.getTransitionMargin(), !f.loaded);
            d(f.panelClass).removeClass(f.options.animateOut + " animated");
            d(f.panelClass).eq(f.nextPanel).addClass("animated " + f.options.animateIn);
            f.callback(f.options.callback, e)
        },
        transitionCSS: function(h, g) {
            var f = this;
            if (g) f.configureCSSTransitions("0", "0");
            f.panelContainer.css({
                "-webkit-transform": "translate3d(" + h + f.pSign + ", 0, 0)",
                "-moz-transform": "translate3d(" + h + f.pSign + ", 0, 0)",
                "-ms-transform": "translate3d(" + h + f.pSign + ", 0, 0)",
                "-o-transform": "translate3d(" + h + f.pSign + ", 0, 0)",
                transform: "translate3d(" + h + f.pSign + ", 0, 0)"
            });
            if (g) f.callback(function() {
                f.configureCSSTransitions()
            });
            else f.configureCSSTransitions()
        },
        transitionjQuery: function(h, g) {
            var f = this;
            if (g) f.panelContainer.css("margin-left",
                h + f.pSign);
            else f.panelContainer.animate({
                "margin-left": h + f.pSign
            }, {
                easing: f.options.slideEaseFunction,
                duration: f.options.slideEaseDuration,
                queue: false
            })
        },
        getHeighestPanel: function() {
            var g = this,
                f, h = 0;
            g.$panelClass.each(function() {
                f = d(this).outerHeight(true);
                h = f > h ? f : h
            });
            if (!g.options.autoHeight) return h
        },
        verifyPanel: function() {
            var g = this,
                f = false;
            if (g.options.continuous)
                if (g.nextPanel > g.panelCount) {
                    g.nextPanel = g.panelCount;
                    g.setNextPanel(g.panelCount)
                } else if (g.nextPanel < -1) {
                g.nextPanel = -1;
                g.setNextPanel(-1)
            } else if (!f &&
                (g.nextPanel === g.panelCount || g.nextPanel === -1)) {
                g.prepareTransition(g.nextPanel);
                g.updateClass();
                clearTimeout(h);
                var h = setTimeout(function() {
                    if (g.nextPanel === g.panelCount) g.prepareTransition(0, true, true, true);
                    else if (g.nextPanel === -1) g.prepareTransition(g.panelCount - 1, true, true, true)
                }, g.options.slideEaseDuration + 50)
            } else {
                f = true;
                g.prepareTransition(g.nextPanel)
            } else {
                if (g.nextPanel === g.panelCount) g.nextPanel = 0;
                else if (g.nextPanel === -1) g.nextPanel = g.panelCount - 1;
                g.prepareTransition(g.nextPanel)
            }
        }
    };
    d.fn.liquidSlider =
        function(f) {
            return this.each(function() {
                var g = Object.create(b);
                g.init(f, this);
                d.data(this, "liquidSlider", g)
            })
        };
    d.fn.liquidSlider.options = {
        autoHeight: true,
        minHeight: 0,
        heightEaseDuration: 1500,
        heightEaseFunction: "easeInOutExpo",
        slideEaseDuration: 1500,
        slideEaseFunction: "easeInOutExpo",
        slideEaseFunctionFallback: "easeInOutExpo",
        animateIn: "bounceInRight",
        animateOut: "bounceOutRight",
        continuous: true,
        fadeInDuration: 500,
        fadeOutDuration: 500,
        autoSlide: false,
        autoSlideDirection: "right",
        autoSlideInterval: 6E3,
        forceAutoSlide: false,
        pauseOnHover: false,
        dynamicArrows: false,
        dynamicArrowsGraphical: true,
        dynamicArrowLeftText: "&#171; left",
        dynamicArrowRightText: "right &#187;",
        hideSideArrows: false,
        hideSideArrowsDuration: 750,
        hoverArrows: false,
        hoverArrowDuration: 250,
        dynamicTabs: true,
        dynamicTabsHtml: true,
        includeTitle: true,
        panelTitleSelector: ".title",
        dynamicTabsAlign: "left",
        dynamicTabsPosition: "top",
        navElementTag: "div",
        firstPanelToLoad: 1,
        crossLinks: false,
        hashLinking: false,
        hashTitleSelector: ".title",
        keyboardNavigation: false,
        leftKey: 39,
        rightKey: 37,
        panelKeys: {
            1: 49,
            2: 50,
            3: 51,
            4: 52
        },
        responsive: true,
        mobileNavigation: true,
        mobileNavDefaultText: "Menu",
        mobileUIThreshold: 0,
        hideArrowsWhenMobile: true,
        hideArrowsThreshold: 0,
        useCSSMaxWidth: 2200,
        preload: function() {
            this.finalize()
        },
        onload: function() {},
        pretransition: function() {
            this.transition()
        },
        callback: function() {},
        preloader: false,
        swipe: true,
        swipeArgs: e
    }
})(jQuery, window, document);
(function($) {
    function maybeCall(thing, ctx) {
        return typeof thing == "function" ? thing.call(ctx) : thing
    }

    function isElementInDOM(ele) {
        while (ele = ele.parentNode)
            if (ele == document) return true;
        return false
    }

    function Tipsy(element, options) {
        this.$element = $(element);
        this.options = options;
        this.enabled = true;
        this.fixTitle()
    }
    Tipsy.prototype = {
        show: function() {
            var title = this.getTitle();
            if (title && this.enabled) {
                var $tip = this.tip();
                $tip.find(".tipsy-inner")[this.options.html ? "html" : "text"](title);
                $tip[0].className = "tipsy";
                $tip.remove().css({
                    top: 0,
                    left: 0,
                    visibility: "hidden",
                    display: "block"
                }).prependTo(document.body);
                var pos = $.extend({}, this.$element.offset(), {
                    width: this.$element[0].offsetWidth,
                    height: this.$element[0].offsetHeight
                });
                var actualWidth = $tip[0].offsetWidth,
                    actualHeight = $tip[0].offsetHeight,
                    gravity = maybeCall(this.options.gravity, this.$element[0]);
                var tp;
                switch (gravity.charAt(0)) {
                    case "n":
                        tp = {
                            top: pos.top + pos.height + this.options.offset,
                            left: pos.left + pos.width / 2 - actualWidth / 2
                        };
                        break;
                    case "s":
                        tp = {
                            top: pos.top - actualHeight - this.options.offset,
                            left: pos.left + pos.width / 2 - actualWidth / 2
                        };
                        break;
                    case "e":
                        tp = {
                            top: pos.top + pos.height / 2 - actualHeight / 2,
                            left: pos.left - actualWidth - this.options.offset
                        };
                        break;
                    case "w":
                        tp = {
                            top: pos.top + pos.height / 2 - actualHeight / 2,
                            left: pos.left + pos.width + this.options.offset
                        };
                        break
                }
                if (gravity.length == 2)
                    if (gravity.charAt(1) == "w") tp.left = pos.left + pos.width / 2 - 15;
                    else tp.left = pos.left + pos.width / 2 - actualWidth + 15;
                $tip.css(tp).addClass("tipsy-" + gravity);
                $tip.find(".tipsy-arrow")[0].className = "tipsy-arrow tipsy-arrow-" + gravity.charAt(0);
                if (this.options.className) $tip.addClass(maybeCall(this.options.className, this.$element[0]));
                if (this.options.fade) $tip.stop().css({
                    opacity: 0,
                    display: "block",
                    visibility: "visible"
                }).animate({
                    opacity: this.options.opacity
                });
                else $tip.css({
                    visibility: "visible",
                    opacity: this.options.opacity
                })
            }
        },
        hide: function() {
            if (this.options.fade) this.tip().stop().fadeOut(function() {
                $(this).remove()
            });
            else this.tip().remove()
        },
        fixTitle: function() {
            var $e = this.$element;
            if ($e.attr("title") || typeof $e.attr("original-title") !=
                "string") $e.attr("original-title", $e.attr("title") || "").removeAttr("title")
        },
        getTitle: function() {
            var title, $e = this.$element,
                o = this.options;
            this.fixTitle();
            var title, o = this.options;
            if (typeof o.title == "string") title = $e.attr(o.title == "title" ? "original-title" : o.title);
            else if (typeof o.title == "function") title = o.title.call($e[0]);
            title = ("" + title).replace(/(^\s*|\s*$)/, "");
            return title || o.fallback
        },
        tip: function() {
            if (!this.$tip) {
                this.$tip = $('<div class="tipsy"></div>').html('<div class="tipsy-arrow"></div><div class="tipsy-inner"></div>');
                this.$tip.data("tipsy-pointee", this.$element[0])
            }
            return this.$tip
        },
        validate: function() {
            if (!this.$element[0].parentNode) {
                this.hide();
                this.$element = null;
                this.options = null
            }
        },
        enable: function() {
            this.enabled = true
        },
        disable: function() {
            this.enabled = false
        },
        toggleEnabled: function() {
            this.enabled = !this.enabled
        }
    };
    $.fn.tipsy = function(options) {
        if (options === true) return this.data("tipsy");
        else if (typeof options == "string") {
            var tipsy = this.data("tipsy");
            if (tipsy) tipsy[options]();
            return this
        }
        options = $.extend({}, $.fn.tipsy.defaults,
            options);

        function get(ele) {
            var tipsy = $.data(ele, "tipsy");
            if (!tipsy) {
                tipsy = new Tipsy(ele, $.fn.tipsy.elementOptions(ele, options));
                $.data(ele, "tipsy", tipsy)
            }
            return tipsy
        }

        function enter() {
            var tipsy = get(this);
            tipsy.hoverState = "in";
            if (options.delayIn == 0) tipsy.show();
            else {
                tipsy.fixTitle();
                setTimeout(function() {
                    if (tipsy.hoverState == "in") tipsy.show()
                }, options.delayIn)
            }
        }

        function leave() {
            var tipsy = get(this);
            tipsy.hoverState = "out";
            if (options.delayOut == 0) tipsy.hide();
            else setTimeout(function() {
                if (tipsy.hoverState ==
                    "out") tipsy.hide()
            }, options.delayOut)
        }
        if (!options.live) this.each(function() {
            get(this)
        });
        if (options.trigger != "manual") {
            var binder = options.live ? "live" : "bind",
                eventIn = options.trigger == "hover" ? "mouseenter" : "focus",
                eventOut = options.trigger == "hover" ? "mouseleave" : "blur";
            this[binder](eventIn, enter)[binder](eventOut, leave)
        }
        return this
    };
    $.fn.tipsy.defaults = {
        className: null,
        delayIn: 0,
        delayOut: 0,
        fade: false,
        fallback: "",
        gravity: "n",
        html: false,
        live: false,
        offset: 0,
        opacity: 0.8,
        title: "title",
        trigger: "hover"
    };
    $.fn.tipsy.revalidate =
        function() {
            $(".tipsy").each(function() {
                var pointee = $.data(this, "tipsy-pointee");
                if (!pointee || !isElementInDOM(pointee)) $(this).remove()
            })
        };
    $.fn.tipsy.elementOptions = function(ele, options) {
        return $.metadata ? $.extend({}, options, $(ele).metadata()) : options
    };
    $.fn.tipsy.autoNS = function() {
        return $(this).offset().top > $(document).scrollTop() + $(window).height() / 2 ? "s" : "n"
    };
    $.fn.tipsy.autoWE = function() {
        return $(this).offset().left > $(document).scrollLeft() + $(window).width() / 2 ? "e" : "w"
    };
    $.fn.tipsy.autoBounds = function(margin,
        prefer) {
        return function() {
            var dir = {
                    ns: prefer[0],
                    ew: prefer.length > 1 ? prefer[1] : false
                },
                boundTop = $(document).scrollTop() + margin,
                boundLeft = $(document).scrollLeft() + margin,
                $this = $(this);
            if ($this.offset().top < boundTop) dir.ns = "n";
            if ($this.offset().left < boundLeft) dir.ew = "w";
            if ($(window).width() + $(document).scrollLeft() - $this.offset().left < margin) dir.ew = "e";
            if ($(window).height() + $(document).scrollTop() - $this.offset().top < margin) dir.ns = "s";
            return dir.ns + (dir.ew ? dir.ew : "")
        }
    }
})(jQuery);
if (jQuery)(function(d) {
    function p(b) {
        b = d.extend({}, g, b || {});
        for (var a = d(this), c = 0, e = a.length; c < e; c++) q(a.eq(c), b);
        return a
    }

    function q(b, a) {
        if (!b.data("scroller")) {
            d.extend(a, b.data("scroller-options"));
            var c;
            c = '<div class="scroller-bar"><div class="scroller-track"><div class="scroller-handle">';
            c += "</div></div></div>";
            a.paddingRight = parseInt(b.css("padding-right"), 10);
            a.paddingBottom = parseInt(b.css("padding-bottom"), 10);
            b.addClass(a.customClass + " scroller").wrapInner('<div class="scroller-content" />').prepend(c);
            a.horizontal && b.addClass("scroller-horizontal");
            a = d.extend({
                $scroller: b,
                $content: b.find(".scroller-content"),
                $bar: b.find(".scroller-bar"),
                $track: b.find(".scroller-track"),
                $handle: b.find(".scroller-handle")
            }, a);
            a.$content.on("scroll.scroller", a, l);
            a.$scroller.on("mousedown.scroller", ".scroller-track", a, r).on("mousedown.scroller", ".scroller-handle", a, s).data("scroller", a);
            h.reset.apply(b, [a]);
            d(window).one("load", function() {
                h.reset.apply(b, [a])
            })
        }
    }

    function l(b) {
        b.preventDefault();
        b.stopPropagation();
        b = b.data;
        if (!0 == b.horizontal) {
            var a = b.$content.scrollLeft();
            0 > a && (a = 0);
            a /= b.scrollRatio;
            a > b.handleBounds.right && (a = b.handleBounds.right);
            b.$handle.css({
                left: a
            })
        } else a = b.$content.scrollTop(), 0 > a && (a = 0), a /= b.scrollRatio, a > b.handleBounds.bottom && (a = b.handleBounds.bottom), b.$handle.css({
            top: a
        })
    }

    function r(b) {
        b.preventDefault();
        b.stopPropagation();
        var a = b.data,
            c = a.$track.offset();
        !0 == a.horizontal ? (a.mouseStart = b.pageX, a.handleLeft = b.pageX - c.left - a.handleWidth / 2, k.apply(a.$scroller, [a, a.handleLeft])) :
            (a.mouseStart = b.pageY, a.handleTop = b.pageY - c.top - a.handleHeight / 2, k.apply(a.$scroller, [a, a.handleTop]));
        a.$scroller.data("scroller", a);
        a.$content.off(".scroller");
        d("body").on("mousemove.scroller", a, m).on("mouseup.scroller", a, n)
    }

    function s(b) {
        b.preventDefault();
        b.stopPropagation();
        var a = b.data;
        !0 == a.horizontal ? (a.mouseStart = b.pageX, a.handleLeft = parseInt(a.$handle.css("left"), 10)) : (a.mouseStart = b.pageY, a.handleTop = parseInt(a.$handle.css("top"), 10));
        a.$scroller.data("scroller", a);
        a.$content.off(".scroller");
        d("body").on("mousemove.scroller", a, m).on("mouseup.scroller", a, n)
    }

    function m(b) {
        b.preventDefault();
        b.stopPropagation();
        var a = b.data,
            c = 0;
        !0 == a.horizontal ? (b = a.mouseStart - b.pageX, c = a.handleLeft - b) : (b = a.mouseStart - b.pageY, c = a.handleTop - b);
        k.apply(a.$scroller, [a, c])
    }

    function n(b) {
        b.preventDefault();
        b.stopPropagation();
        b = b.data;
        b.$content.on("scroll.scroller", b, l);
        d("body").off(".scroller")
    }

    function k(b, a) {
        if (!0 == b.horizontal) {
            a < b.handleBounds.left && (a = b.handleBounds.left);
            a > b.handleBounds.right && (a = b.handleBounds.right);
            var c = Math.round(a * b.scrollRatio);
            b.$handle.css({
                left: a
            });
            b.$content.scrollLeft(c)
        } else a < b.handleBounds.top && (a = b.handleBounds.top), a > b.handleBounds.bottom && (a = b.handleBounds.bottom), c = Math.round(a * b.scrollRatio), b.$handle.css({
            top: a
        }), b.$content.scrollTop(c)
    }
    var g = {
            customClass: "",
            duration: 0,
            handleSize: !1,
            horizontal: !1,
            trackMargin: 0
        },
        h = {
            defaults: function(b) {
                g = d.extend(g, b || {});
                return d(this)
            },
            destroy: function() {
                return d(this).each(function(b) {
                    if (b = d(this).data("scroller")) b.$scroller.removeClass(b.customClass).removeClass("scroller").removeClass("scroller-active"),
                        b.$content.replaceWith(b.$content.html()), b.$bar.remove(), b.$content.off(".scroller"), b.$scroller.off(".scroller").removeData("scroller")
                })
            },
            scroll: function(b, a) {
                return d(this).each(function(a) {
                    a = d(this).data("scroller");
                    var e = e || g.duration;
                    if ("number" != typeof b) {
                        var f = d(b);
                        0 < f.length ? (f = f.position(), b = !0 == a.horizontal ? f.left + a.$content.scrollLeft() : f.top + a.$content.scrollTop()) : b = a.$content.scrollTop()
                    }!0 == a.horizontal ? a.$content.stop().animate({
                        scrollLeft: b
                    }, e) : a.$content.stop().animate({
                            scrollTop: b
                        },
                        e)
                })
            },
            reset: function(b) {
                return d(this).each(function(a) {
                    a = b || d(this).data("scroller");
                    if ("undefined" != typeof a) {
                        a.$scroller.addClass("scroller-setup");
                        if (!0 == a.horizontal) a.barHeight = a.$content[0].offsetHeight - a.$content[0].clientHeight, a.frameWidth = a.$content.outerWidth(), a.trackWidth = a.frameWidth - 2 * a.trackMargin, a.scrollWidth = a.$content[0].scrollWidth, a.ratio = a.trackWidth / a.scrollWidth, a.trackRatio = a.trackWidth / a.scrollWidth, a.handleWidth = a.handleSize ? a.handleSize : a.trackWidth * a.trackRatio, a.scrollRatio =
                            (a.scrollWidth - a.frameWidth) / (a.trackWidth - a.handleWidth), a.handleBounds = {
                                left: 0,
                                right: a.trackWidth - a.handleWidth
                            }, a.$scroller.data("scroller", a), a.$content.css({
                                paddingBottom: a.barHeight + a.paddingBottom
                            }), a.$content.scrollLeft(), a.scrollWidth <= a.frameWidth ? a.$scroller.removeClass("scroller-active") : a.$scroller.addClass("scroller-active"), a.$bar.css({
                                width: a.frameWidth
                            }), a.$track.css({
                                width: a.trackWidth,
                                marginLeft: a.trackMargin,
                                marginRight: a.trackMargin
                            }), a.$handle.css({
                                width: a.handleWidth
                            });
                        else {
                            a.barWidth =
                                a.$content[0].offsetWidth - a.$content[0].clientWidth;
                            a.frameHeight = a.$content.outerHeight();
                            a.trackHeight = a.frameHeight - 2 * a.trackMargin;
                            a.scrollHeight = a.$content[0].scrollHeight;
                            a.ratio = a.trackHeight / a.scrollHeight;
                            a.trackRatio = a.trackHeight / a.scrollHeight;
                            a.handleHeight = a.handleSize ? a.handleSize : a.trackHeight * a.trackRatio;
                            a.scrollRatio = (a.scrollHeight - a.frameHeight) / (a.trackHeight - a.handleHeight);
                            a.handleBounds = {
                                top: 0,
                                bottom: a.trackHeight - a.handleHeight
                            };
                            a.$scroller.data("scroller", a);
                            var c = a.$content.scrollTop() *
                                a.ratio;
                            a.scrollHeight <= a.frameHeight ? a.$scroller.removeClass("scroller-active") : a.$scroller.addClass("scroller-active");
                            a.$bar.css({
                                height: a.frameHeight
                            });
                            a.$track.css({
                                height: a.trackHeight,
                                marginBottom: a.trackMargin,
                                marginTop: a.trackMargin
                            });
                            a.$handle.css({
                                height: a.handleHeight
                            })
                        }
                        k.apply(a.$scroller, [a, c]);
                        a.$scroller.removeClass("scroller-setup")
                    }
                })
            }
        };
    d.fn.scroller = function(b) {
        return h[b] ? h[b].apply(this, Array.prototype.slice.call(arguments, 1)) : "object" !== typeof b && b ? this : p.apply(this, arguments)
    }
})(jQuery);
if (jQuery)(function(e) {
    function u(a) {
        a = e.extend({}, v, a || {});
        for (var b = e(this), f = 0, c = b.length; f < c; f++) {
            var h = b.eq(f),
                g = a;
            if (!h.hasClass("selecter-element")) {
                g.externalLinks && (g.links = !0);
                e.extend(g, h.data("selecter-options"));
                var k = h.find("option, optgroup"),
                    p = k.filter("option"),
                    m = p.filter(":selected"),
                    s = g.defaultLabel ? -1 : p.index(m),
                    t = k.length - 1,
                    w = g.links ? "nav" : "div",
                    x = g.links ? "a" : "span";
                g.multiple = h.prop("multiple");
                g.disabled = h.is(":disabled");
                var d = "<" + w + ' class="selecter ' + g.customClass;
                n ? d += " mobile" :
                    g.cover && (d += " cover");
                d = g.multiple ? d + " multiple" : d + " closed";
                g.disabled && (d += " disabled");
                d += '">';
                g.multiple || (d += '<span class="selecter-selected">', d += e("<span></span").text(y(g.trimOptions, !1 != g.defaultLabel ? g.defaultLabel : m.text())).html(), d += "</span>");
                for (var d = d + '<div class="selecter-options">', m = 0, l = null, q = 0, u = k.length; q < u; q++) l = e(k[q]), "OPTGROUP" == l[0].tagName ? (d += '<span class="selecter-group', l.is(":disabled") && (d += " disabled"), d += '">' + l.attr("label") + "</span>") : (d += "<" + x + ' class="selecter-item',
                    l.is(":selected") && (!g.defaultLabel && (d += " selected")), l.is(":disabled") && (d += " disabled"), 0 == q && (d += " first"), q == t && (d += " last"), d += '" ', d = g.links ? d + ('href="' + l.val() + '"') : d + ('data-value="' + l.val() + '"'), d += ">" + e("<span></span>").text(y(g.trimOptions, l.text())).html() + "</" + x + ">", m++);
                d += "</div>";
                d += "</" + w + ">";
                h.addClass("selecter-element").after(d);
                k = h.next(".selecter");
                g = e.extend({
                    $selectEl: h,
                    $optionEls: p,
                    $selecter: k,
                    $selected: k.find(".selecter-selected"),
                    $itemsWrapper: k.find(".selecter-options"),
                    $items: k.find(".selecter-item"),
                    index: s,
                    guid: z
                }, g);
                void 0 != e.fn.scroller && g.$itemsWrapper.scroller();
                k.on("click.selecter", ".selecter-selected", g, A).on("click.selecter", ".selecter-item", g, B).on("selecter-close", g, r).data("selecter", g);
                if (!g.links && !n || n) {
                    if (h.on("change", g, C).on("blur.selecter", g, D), !n) h.on("focus.selecter", g, E)
                } else h.hide();
                z++
            }
        }
        return b
    }

    function A(a) {
        a.preventDefault();
        a.stopPropagation();
        var b = a.data;
        if (!b.$selectEl.is(":disabled"))
            if (e(".selecter").not(b.$selecter).trigger("selecter-close", [b]), n) a = b.$selectEl[0], document.createEvent ? (b = document.createEvent("MouseEvents"), b.initMouseEvent("mousedown", !0, !0, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), a.dispatchEvent(b)) : element.fireEvent && a.fireEvent("onmousedown");
            else if (b.$selecter.hasClass("closed")) {
            if (a.preventDefault(), a.stopPropagation(), a = a.data, !a.$selecter.hasClass("open")) {
                var b = a.$selecter.offset(),
                    f = e("body").outerHeight(),
                    c = a.$itemsWrapper.outerHeight(!0);
                b.top + c > f && n ? a.$selecter.addClass("bottom") : a.$selecter.removeClass("bottom");
                a.$itemsWrapper.show();
                a.$selecter.removeClass("closed").addClass("open");
                e("body").on("click.selecter-" + a.guid, ":not(.selecter-options)", a, F);
                b = 0 <= a.index ? a.$items.eq(a.index).position() : {
                    left: 0,
                    top: 0
                };
                void 0 != e.fn.scroller ? a.$itemsWrapper.scroller("scroll", a.$itemsWrapper.find(".scroller-content").scrollTop() + b.top, 0).scroller("reset") : a.$itemsWrapper.scrollTop(a.$itemsWrapper.scrollTop() + b.top)
            }
        } else b.$selecter.hasClass("open") && r(a)
    }

    function r(a) {
        a.preventDefault();
        a.stopPropagation();
        a = a.data;
        a.$selecter.hasClass("open") && (a.$itemsWrapper.hide(), a.$selecter.removeClass("open").addClass("closed"), e("body").off(".selecter-" + a.guid))
    }

    function F(a) {
        a.preventDefault();
        a.stopPropagation();
        0 == e(a.currentTarget).parents(".selecter").length && r(a)
    }

    function B(a) {
        a.preventDefault();
        a.stopPropagation();
        var b = e(this),
            f = a.data;
        f.$selectEl.is(":disabled") || (f.$itemsWrapper.is(":visible") && (b = f.$items.index(b), p(b, f, !1)), f.multiple || r(a))
    }

    function C(a, b) {
        if (!b) {
            var f = e(this),
                c = a.data;
            c.links ? n ? m(f.val(),
                c.externalLinks) : m(f.attr("href"), c.externalLinks) : (f = c.$optionEls.index(c.$optionEls.filter("[value='" + G(f.val()) + "']")), p(f, c, !1))
        }
    }

    function E(a) {
        a.preventDefault();
        a.stopPropagation();
        a = a.data;
        a.$selectEl.is(":disabled") || (a.multiple || (a.$selecter.addClass("focus"), e(".selecter").not(a.$selecter).trigger("selecter-close", [a]), e("body").on("keydown.selecter-" + a.guid, a, H)))
    }

    function D(a) {
        a.preventDefault();
        a.stopPropagation();
        a = a.data;
        a.$selecter.removeClass("focus");
        e(".selecter").not(a.$selecter).trigger("selecter-close", [a]);
        e("body").off(".selecter-" + a.guid)
    }

    function H(a) {
        var b = a.data;
        if (b.$selecter.hasClass("open") && 13 == a.keyCode) p(b.index, b, !1), r(a);
        else if (9 != a.keyCode && !(a.metaKey || (a.altKey || (a.ctrlKey || a.shiftKey)))) {
            a.preventDefault();
            a.stopPropagation();
            var f = b.$items.length - 1,
                c = -1;
            if (-1 < e.inArray(a.keyCode, s ? [38, 40, 37, 39] : [38, 40])) c = b.index + (38 == a.keyCode || s && 37 == a.keyCode ? -1 : 1), 0 > c && (c = 0), c > f && (c = f);
            else {
                a = String.fromCharCode(a.keyCode).toUpperCase();
                for (i = b.index + 1; i <= f; i++) {
                    var h = b.$optionEls.eq(i).text().charAt(0).toUpperCase();
                    if (h == a) {
                        c = i;
                        break
                    }
                }
                if (0 > c)
                    for (i = 0; i <= f; i++)
                        if (h = b.$optionEls.eq(i).text().charAt(0).toUpperCase(), h == a) {
                            c = i;
                            break
                        }
            }
            0 <= c && p(c, b, !0)
        }
    }

    function p(a, b, f) {
        var c = b.$items.eq(a),
            e = c.hasClass("selected");
        if (!c.hasClass("disabled")) {
            if (!e || b.links) {
                var g = c.html();
                c.data("value");
                if (b.multiple) b.$optionEls.eq(a).prop("selected", !0);
                else if (b.$selected.html(g), b.$items.filter(".selected").removeClass("selected"), f || (b.$selectEl[0].selectedIndex = a), b.links && !f) {
                    n ? m(b.$selectEl.val(), b.externalLinks) : m(c.attr("href"),
                        b.externalLinks);
                    return
                }
                b.$selectEl.trigger("change", [!0]);
                c.addClass("selected")
            } else b.multiple && (b.$optionEls.eq(a).prop("selected", null), c.removeClass("selected"));
            if (!e || b.multiple) b.callback.call(b.$selecter, b.$selectEl.val(), a), b.index = a
        }
    }

    function y(a, b) {
        return !1 === a ? b : b.length > a ? b.substring(0, a) + "..." : b
    }

    function m(a, b) {
        b ? window.open(a) : window.location.href = a
    }

    function G(a) {
        return a.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, "\\$1")
    }
    var s = -1 < navigator.userAgent.toLowerCase().indexOf("firefox"),
        n = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent || (navigator.vendor || window.opera)),
        v = {
            callback: function() {},
            cover: !1,
            customClass: "",
            defaultLabel: !1,
            externalLinks: !1,
            links: !1,
            trimOptions: !1
        },
        z = 0,
        t = {
            defaults: function(a) {
                v = e.extend(v, a || {});
                return e(this)
            },
            disable: function(a) {
                return e(this).each(function(b, f) {
                    var c = e(f).next(".selecter").data("selecter");
                    if ("undefined" != typeof a) {
                        var h = c.$items.index(c.$items.filter("[data-value=" + a + "]"));
                        c.$items.eq(h).addClass("disabled");
                        c.$optionEls.eq(h).prop("disabled", !0)
                    } else c.$selecter.hasClass("open") && c.$selecter.find(".selecter-selected").trigger("click"), c.$selecter.addClass("disabled"), c.$selectEl.prop("disabled", !0)
                })
            },
            enable: function(a) {
                return e(this).each(function(b, f) {
                    var c = e(f).next(".selecter").data("selecter");
                    if ("undefined" != typeof a) {
                        var h = c.$items.index(c.$items.filter("[data-value=" + a + "]"));
                        c.$items.eq(h).removeClass("disabled");
                        c.$optionEls.eq(h).prop("disabled", !1)
                    } else c.$selecter.removeClass("disabled"), c.$selectEl.prop("disabled", !1)
                })
            },
            destroy: function() {
                return e(this).each(function(a, b) {
                    var f = e(b),
                        c = f.next(".selecter");
                    c.hasClass("open") && c.find(".selecter-selected").trigger("click");
                    void 0 != e.fn.scroller && c.find(".selecter-options").scroller("destroy");
                    f.off(".selecter").removeClass("selecter-element").show();
                    c.off(".selecter").remove()
                })
            }
        };
    e.fn.selecter = function(a) {
        return t[a] ? t[a].apply(this, Array.prototype.slice.call(arguments, 1)) : "object" !== typeof a && a ? this : u.apply(this, arguments)
    }
})(jQuery);
(function(h) {
    function F(a, b, d) {
        var c = a[0],
            e = /er/.test(d) ? m : /bl/.test(d) ? s : l,
            f = d == H ? {
                checked: c[l],
                disabled: c[s],
                indeterminate: "true" == a.attr(m) || "false" == a.attr(w)
            } : c[e];
        if (/^(ch|di|in)/.test(d) && !f) D(a, e);
        else if (/^(un|en|de)/.test(d) && f) t(a, e);
        else if (d == H)
            for (e in f) f[e] ? D(a, e, !0) : t(a, e, !0);
        else if (!b || "toggle" == d) {
            if (!b) a[p]("ifClicked");
            f ? c[n] !== u && t(a, e) : D(a, e)
        }
    }

    function D(a, b, d) {
        var c = a[0],
            e = a.parent(),
            f = b == l,
            A = b == m,
            B = b == s,
            K = A ? w : f ? E : "enabled",
            p = k(a, K + x(c[n])),
            N = k(a, b + x(c[n]));
        if (!0 !== c[b]) {
            if (!d &&
                (b == l && (c[n] == u && c.name))) {
                var C = a.closest("form"),
                    r = 'input[name="' + c.name + '"]',
                    r = C.length ? C.find(r) : h(r);
                r.each(function() {
                    this !== c && (h(this).data(q) && t(h(this), b))
                })
            }
            A ? (c[b] = !0, c[l] && t(a, l, "force")) : (d || (c[b] = !0), f && (c[m] && t(a, m, !1)));
            L(a, f, b, d)
        }
        c[s] && (k(a, y, !0) && e.find("." + I).css(y, "default"));
        e[v](N || (k(a, b) || ""));
        B ? e.attr("aria-disabled", "true") : e.attr("aria-checked", A ? "mixed" : "true");
        e[z](p || (k(a, K) || ""))
    }

    function t(a, b, d) {
        var c = a[0],
            e = a.parent(),
            f = b == l,
            h = b == m,
            q = b == s,
            p = h ? w : f ? E : "enabled",
            t = k(a,
                p + x(c[n])),
            u = k(a, b + x(c[n]));
        if (!1 !== c[b]) {
            if (h || (!d || "force" == d)) c[b] = !1;
            L(a, f, p, d)
        }!c[s] && (k(a, y, !0) && e.find("." + I).css(y, "pointer"));
        e[z](u || (k(a, b) || ""));
        q ? e.attr("aria-disabled", "false") : e.attr("aria-checked", "false");
        e[v](t || (k(a, p) || ""))
    }

    function M(a, b) {
        if (a.data(q)) {
            a.parent().html(a.attr("style", a.data(q).s || ""));
            if (b) a[p](b);
            a.off(".i").unwrap();
            h(G + '[for="' + a[0].id + '"]').add(a.closest(G)).off(".i")
        }
    }

    function k(a, b, d) {
        if (a.data(q)) return a.data(q).o[b + (d ? "" : "Class")]
    }

    function x(a) {
        return a.charAt(0).toUpperCase() +
            a.slice(1)
    }

    function L(a, b, d, c) {
        if (!c) {
            if (b) a[p]("ifToggled");
            a[p]("ifChanged")[p]("if" + x(d))
        }
    }
    var q = "iCheck",
        I = q + "-helper",
        u = "radio",
        l = "checked",
        E = "un" + l,
        s = "disabled",
        w = "determinate",
        m = "in" + w,
        H = "update",
        n = "type",
        v = "addClass",
        z = "removeClass",
        p = "trigger",
        G = "label",
        y = "cursor",
        J = /ipad|iphone|ipod|android|blackberry|windows phone|opera mini|silk/i.test(navigator.userAgent);
    h.fn[q] = function(a, b) {
        var d = 'input[type="checkbox"], input[type="' + u + '"]',
            c = h(),
            e = function(a) {
                a.each(function() {
                    var a = h(this);
                    c = a.is(d) ?
                        c.add(a) : c.add(a.find(d))
                })
            };
        if (/^(check|uncheck|toggle|indeterminate|determinate|disable|enable|update|destroy)$/i.test(a)) return a = a.toLowerCase(), e(this), c.each(function() {
            var c = h(this);
            "destroy" == a ? M(c, "ifDestroyed") : F(c, !0, a);
            h.isFunction(b) && b()
        });
        if ("object" != typeof a && a) return this;
        var f = h.extend({
                checkedClass: l,
                disabledClass: s,
                indeterminateClass: m,
                labelHover: !0,
                aria: !1
            }, a),
            k = f.handle,
            B = f.hoverClass || "hover",
            x = f.focusClass || "focus",
            w = f.activeClass || "active",
            y = !!f.labelHover,
            C = f.labelHoverClass ||
            "hover",
            r = ("" + f.increaseArea).replace("%", "") | 0;
        if ("checkbox" == k || k == u) d = 'input[type="' + k + '"]'; - 50 > r && (r = -50);
        e(this);
        return c.each(function() {
            var a = h(this);
            M(a);
            var c = this,
                b = c.id,
                e = -r + "%",
                d = 100 + 2 * r + "%",
                d = {
                    position: "absolute",
                    top: e,
                    left: e,
                    display: "block",
                    width: d,
                    height: d,
                    margin: 0,
                    padding: 0,
                    background: "#fff",
                    border: 0,
                    opacity: 0
                },
                e = J ? {
                    position: "absolute",
                    visibility: "hidden"
                } : r ? d : {
                    position: "absolute",
                    opacity: 0
                },
                k = "checkbox" == c[n] ? f.checkboxClass || "icheckbox" : f.radioClass || "i" + u,
                m = h(G + '[for="' + b + '"]').add(a.closest(G)),
                A = !!f.aria,
                E = q + "-" + Math.random().toString(36).substr(2, 6),
                g = '<div class="' + k + '" ' + (A ? 'role="' + c[n] + '" ' : "");
            A && m.each(function() {
                g += 'aria-labelledby="';
                this.id ? g += this.id : (this.id = E, g += E);
                g += '"'
            });
            g = a.wrap(g + "/>")[p]("ifCreated").parent().append(f.insert);
            d = h('<ins class="' + I + '"/>').css(d).appendTo(g);
            a.data(q, {
                o: f,
                s: a.attr("style")
            }).css(e);
            f.inheritClass && g[v](c.className || "");
            f.inheritID && (b && g.attr("id", q + "-" + b));
            "static" == g.css("position") && g.css("position", "relative");
            F(a, !0, H);
            if (m.length) m.on("click.i mouseover.i mouseout.i touchbegin.i touchend.i",
                function(b) {
                    var d = b[n],
                        e = h(this);
                    if (!c[s]) {
                        if ("click" == d) {
                            if (h(b.target).is("a")) return;
                            F(a, !1, !0)
                        } else y && (/ut|nd/.test(d) ? (g[z](B), e[z](C)) : (g[v](B), e[v](C)));
                        if (J) b.stopPropagation();
                        else return !1
                    }
                });
            a.on("click.i focus.i blur.i keyup.i keydown.i keypress.i", function(b) {
                var d = b[n];
                b = b.keyCode;
                if ("click" == d) return !1;
                if ("keydown" == d && 32 == b) return c[n] == u && c[l] || (c[l] ? t(a, l) : D(a, l)), !1;
                if ("keyup" == d && c[n] == u) !c[l] && D(a, l);
                else if (/us|ur/.test(d)) g["blur" == d ? z : v](x)
            });
            d.on("click mousedown mouseup mouseover mouseout touchbegin.i touchend.i",
                function(b) {
                    var d = b[n],
                        e = /wn|up/.test(d) ? w : B;
                    if (!c[s]) {
                        if ("click" == d) F(a, !1, !0);
                        else {
                            if (/wn|er|in/.test(d)) g[v](e);
                            else g[z](e + " " + w);
                            if (m.length && (y && e == B)) m[/ut|nd/.test(d) ? z : v](C)
                        }
                        if (J) b.stopPropagation();
                        else return !1
                    }
                })
        })
    }
})(window.jQuery || window.Zepto);
(function(e) {
    if (typeof define === "function" && define.amd) define(["jquery"], e);
    else e(jQuery)
})(function(e) {
    var t = {
        from: 0,
        to: 0,
        runningInterval: null,
        stepInterval: null,
        stepCount: null,
        stepUnit: null,
        format: "%counter%",
        "class": "numinate",
        precision: 0,
        autoStart: true,
        autoRemove: false,
        onCreate: null,
        onStart: null,
        onStep: null,
        onStop: null,
        onComplete: null,
        onRemove: null
    };
    var n = function(e, t) {
        if (!t.runningInterval && !t.stepInterval) return window.console.error("No interval was provided.");
        var n = Math.abs(t.from - t.to);
        if (!t.stepCount &&
            !t.stepUnit) return window.console.error("Provide either stepCount or stepUnit value.");
        if (t.stepUnit && t.stepCount) t.to = t.from + t.stepUnit * t.stepCount;
        if (!t.stepCount) t.stepCount = n / t.stepUnit;
        if (!t.stepUnit) t.stepUnit = n / t.stepCount;
        if (t.runningInterval) t.stepInterval = t.runningInterval / t.stepCount;
        if (n && t.stepUnit > n) {
            t.stepUnit = n;
            t.stepCount = 1
        }
        if (t.stepInterval < 10) {
            var r = 10 / t.stepInterval;
            t.stepInterval *= r;
            t.stepUnit *= r;
            t.stepCount /= r
        }
        this.textBackup = e.text();
        this.element = e;
        this.options = t;
        this.stepper =
            null;
        this.current = t.from;
        this.finished = false;
        this.element.addClass(t["class"]);
        this.fire("onCreate");
        if (this.options.autoStart) this.start()
    };
    n.prototype = {
        constructor: n,
        fire: function(t) {
            if (e.isFunction(this.options[t])) this.options[t](this.element, this.options, this.current)
        },
        stop: function() {
            if (!this.stepper || this.finished) return;
            this.stepper = clearInterval(this.stepper);
            this.fire("onStop")
        },
        start: function() {
            if (this.stepper || this.finished) return;
            this.render();
            this.stepper = setInterval(e.proxy(this.step,
                this), this.options.stepInterval);
            this.fire("onStart")
        },
        step: function() {
            if (!(this.options.from + this.options.to)) this.current += this.options.stepUnit;
            else if (this.options.from < this.options.to) this.current += this.options.stepUnit;
            else if (this.options.from > this.options.to) this.current -= this.options.stepUnit;
            if (this.options.from < this.options.to) {
                if (this.current > this.options.to) return this.completed()
            } else if (this.options.from > this.options.to)
                if (this.current < this.options.to) return this.completed();
            this.fire("onStep");
            this.render()
        },
        completed: function() {
            var e = Math.abs(this.options.from - this.options.to);
            if (e && this.options.current !== this.options.to) {
                this.current = this.options.to;
                this.render()
            }
            this.stop();
            this.finished = true;
            this.fire("onComplete");
            if (this.options.autoRemove) this.remove()
        },
        remove: function() {
            this.fire("onRemove");
            e.removeData(this.element, "numinate");
            this.element.text(this.textBackup ? this.textBackup : "");
            this.element.removeClass(this.options["class"])
        },
        render: function() {
            this.element.text(this.options.format.replace(/\%counter\%/,
                this.current.toFixed(this.options.precision)))
        },
        restart: function() {
            this.finished = false;
            this.current = this.options.from;
            this.stop();
            this.start()
        }
    };
    e.fn.numinate = function(r) {
        var i;
        if (typeof r == "object") {
            r = e.extend(true, {}, t, r);
            i = "init"
        } else if (typeof r == "string") i = r;
        return this.each(function() {
            var t = e(this);
            if (i == "init") t.data("numinate", new n(t, r));
            else t.data("numinate")[i]()
        })
    };
    e.fn.numinate.defaults = t;
    e.fn.numinate.Plugin = n
});
(function(e) {
    function n(n, r, i, s) {
        function f() {
            o.afterLoaded();
            o.settings.hideFramesUntilPreloaded && (o.settings.preloader !== undefined && (o.settings.preloader !== !1 && o.frames.show()));
            if (o.settings.preloader !== undefined && o.settings.preloader !== !1)
                if (o.settings.hidePreloaderUsingCSS && o.transitionsSupported) {
                    o.prependPreloadingCompleteTo = o.settings.prependPreloadingComplete === !0 ? o.settings.preloader : e(o.settings.prependPreloadingComplete);
                    o.prependPreloadingCompleteTo.addClass("preloading-complete");
                    setTimeout(g,
                        o.settings.hidePreloaderDelay)
                } else o.settings.preloader.fadeOut(o.settings.hidePreloaderDelay, function() {
                    clearInterval(o.defaultPreloader);
                    g()
                });
            else g()
        }

        function h(t, n) {
            var r = [];
            if (!n)
                for (var i = t; i > 0; i--) o.frames.eq(o.settings.preloadTheseFrames[i - 1] - 1).find("img").each(function() {
                    r.push(e(this)[0])
                });
            else
                for (var s = t; s > 0; s--) r.push(e("body").find('img[src="' + o.settings.preloadTheseImages[s - 1] + '"]'));
            return r
        }

        function p(t, n) {
            function c() {
                var t = e(f),
                    r = e(l);
                s && (l.length ? s.reject(u, t, r) : s.resolve(u));
                e.isFunction(n) && n.call(i, u, t, r)
            }

            function h(t, n) {
                if (t.src === r || e.inArray(t, a) !== -1) return;
                a.push(t);
                n ? l.push(t) : f.push(t);
                e.data(t, "imagesLoaded", {
                    isBroken: n,
                    src: t.src
                });
                o && s.notifyWith(e(t), [n, u, e(f), e(l)]);
                if (u.length === a.length) {
                    setTimeout(c);
                    u.unbind(".imagesLoaded")
                }
            }
            var r = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
                i = t,
                s = e.isFunction(e.Deferred) ? e.Deferred() : 0,
                o = e.isFunction(s.notify),
                u = i.find("img").add(i.filter("img")),
                a = [],
                f = [],
                l = [];
            e.isPlainObject(n) && e.each(n,
                function(e, t) {
                    e === "callback" ? n = t : s && s[e](t)
                });
            u.length ? u.bind("load.imagesLoaded error.imagesLoaded", function(e) {
                h(e.target, e.type === "error")
            }).each(function(t, n) {
                var i = n.src,
                    s = e.data(n, "imagesLoaded");
                if (s && s.src === i) {
                    h(n, s.isBroken);
                    return
                }
                if (n.complete && n.naturalWidth !== undefined) {
                    h(n, n.naturalWidth === 0 || n.naturalHeight === 0);
                    return
                }
                if (n.readyState || n.complete) {
                    n.src = r;
                    n.src = i
                }
            }) : c()
        }

        function g() {
            function t(e, t) {
                var r, i;
                for (i in t) {
                    i === "left" || i === "right" ? r = n[i] : r = i;
                    e === parseFloat(r) && o._initCustomKeyEvent(t[i])
                }
            }

            function r() {
                o.canvas.on("touchmove.sequence", i);
                u = null;
                f = !1
            }

            function i(e) {
                o.settings.swipePreventsDefault && e.preventDefault();
                if (f) {
                    var t = e.originalEvent.touches[0].pageX,
                        n = e.originalEvent.touches[0].pageY,
                        i = u - t,
                        s = a - n;
                    if (Math.abs(i) >= o.settings.swipeThreshold) {
                        r();
                        i > 0 ? o._initCustomKeyEvent(o.settings.swipeEvents.left) : o._initCustomKeyEvent(o.settings.swipeEvents.right)
                    } else if (Math.abs(s) >= o.settings.swipeThreshold) {
                        r();
                        s > 0 ? o._initCustomKeyEvent(o.settings.swipeEvents.down) : o._initCustomKeyEvent(o.settings.swipeEvents.up)
                    }
                }
            }

            function s(e) {
                if (e.originalEvent.touches.length === 1) {
                    u = e.originalEvent.touches[0].pageX;
                    a = e.originalEvent.touches[0].pageY;
                    f = !0;
                    o.canvas.on("touchmove.sequence", i)
                }
            }
            e(o.settings.preloader).remove();
            o.nextButton = o._renderUiElements(o.settings.nextButton, ".sequence-next");
            o.prevButton = o._renderUiElements(o.settings.prevButton, ".sequence-prev");
            o.pauseButton = o._renderUiElements(o.settings.pauseButton, ".sequence-pause");
            o.pagination = o._renderUiElements(o.settings.pagination, ".sequence-pagination");
            o.nextButton !==
                undefined && (o.nextButton !== !1 && (o.settings.showNextButtonOnInit === !0 && o.nextButton.show()));
            o.prevButton !== undefined && (o.prevButton !== !1 && (o.settings.showPrevButtonOnInit === !0 && o.prevButton.show()));
            o.pauseButton !== undefined && (o.pauseButton !== !1 && (o.settings.showPauseButtonOnInit === !0 && o.pauseButton.show()));
            if (o.settings.pauseIcon !== !1) {
                o.pauseIcon = o._renderUiElements(o.settings.pauseIcon, ".sequence-pause-icon");
                o.pauseIcon !== undefined && o.pauseIcon.hide()
            } else o.pauseIcon = undefined;
            if (o.pagination !==
                undefined && o.pagination !== !1) {
                o.paginationLinks = o.pagination.children();
                o.paginationLinks.on("click.sequence", function() {
                    var t = e(this).index() + 1;
                    o.goTo(t)
                });
                o.settings.showPaginationOnInit === !0 && o.pagination.show()
            }
            o.nextFrameID = o.settings.startingFrameID;
            if (o.settings.hashTags === !0) {
                o.frames.each(function() {
                    o.frameHashID.push(e(this).prop(o.getHashTagFrom))
                });
                o.currentHashTag = location.hash.replace("#", "");
                if (o.currentHashTag === undefined || o.currentHashTag === "") o.nextFrameID = o.settings.startingFrameID;
                else {
                    o.frameHashIndex = e.inArray(o.currentHashTag, o.frameHashID);
                    o.frameHashIndex !== -1 ? o.nextFrameID = o.frameHashIndex + 1 : o.nextFrameID = o.settings.startingFrameID
                }
            }
            o.nextFrame = o.frames.eq(o.nextFrameID - 1);
            o.nextFrameChildren = o.nextFrame.children();
            o.pagination !== undefined && e(o.paginationLinks[o.settings.startingFrameID - 1]).addClass("current");
            if (o.transitionsSupported)
                if (!o.settings.animateStartingFrameIn) {
                    o.currentFrameID = o.nextFrameID;
                    o.settings.moveActiveFrameToTop && o.nextFrame.css("z-index", o.numberOfFrames);
                    o._resetElements(o.transitionPrefix, o.nextFrameChildren, "0s");
                    o.nextFrame.addClass("animate-in");
                    if (o.settings.hashTags && o.settings.hashChangesOnFirstFrame) {
                        o.currentHashTag = o.nextFrame.prop(o.getHashTagFrom);
                        document.location.hash = "#" + o.currentHashTag
                    }
                    setTimeout(function() {
                        o._resetElements(o.transitionPrefix, o.nextFrameChildren, "")
                    }, 100);
                    o._resetAutoPlay(!0, o.settings.autoPlayDelay)
                } else if (o.settings.reverseAnimationsWhenNavigatingBackwards && (o.settings.autoPlayDirection - 1 && o.settings.animateStartingFrameIn)) {
                o._resetElements(o.transitionPrefix,
                    o.nextFrameChildren, "0s");
                o.nextFrame.addClass("animate-out");
                o.goTo(o.nextFrameID, -1, !0)
            } else o.goTo(o.nextFrameID, 1, !0);
            else {
                o.container.addClass("sequence-fallback");
                o.currentFrameID = o.nextFrameID;
                if (o.settings.hashTags && o.settings.hashChangesOnFirstFrame) {
                    o.currentHashTag = o.nextFrame.prop(o.getHashTagFrom);
                    document.location.hash = "#" + o.currentHashTag
                }
                o.frames.addClass("animate-in");
                o.frames.not(":eq(" + (o.nextFrameID - 1) + ")").css({
                    display: "none",
                    opacity: 0
                });
                o._resetAutoPlay(!0, o.settings.autoPlayDelay)
            }
            o.nextButton !==
                undefined && o.nextButton.bind("click.sequence", function() {
                    o.next()
                });
            o.prevButton !== undefined && o.prevButton.bind("click.sequence", function() {
                o.prev()
            });
            o.pauseButton !== undefined && o.pauseButton.bind("click.sequence", function() {
                o.pause(!0)
            });
            if (o.settings.keyNavigation) {
                var n = {
                    left: 37,
                    right: 39
                };
                e(document).bind("keydown.sequence", function(e) {
                    var n = String.fromCharCode(e.keyCode);
                    if (n > 0 && (n <= o.numberOfFrames && o.settings.numericKeysGoToFrames)) {
                        o.nextFrameID = n;
                        o.goTo(o.nextFrameID)
                    }
                    t(e.keyCode, o.settings.keyEvents);
                    t(e.keyCode, o.settings.customKeyEvents)
                })
            }
            o.canvas.on({
                "mouseenter.sequence": function() {
                    if (o.settings.pauseOnHover && (o.settings.autoPlay && !o.hasTouch)) {
                        o.isBeingHoveredOver = !0;
                        o.isHardPaused || o.pause()
                    }
                },
                "mouseleave.sequence": function() {
                    if (o.settings.pauseOnHover && (o.settings.autoPlay && !o.hasTouch)) {
                        o.isBeingHoveredOver = !1;
                        o.isHardPaused || o.unpause()
                    }
                }
            });
            o.settings.hashTags && e(window).bind("hashchange.sequence", function() {
                var t = location.hash.replace("#", "");
                if (o.currentHashTag !== t) {
                    o.currentHashTag =
                        t;
                    o.frameHashIndex = e.inArray(o.currentHashTag, o.frameHashID);
                    if (o.frameHashIndex !== -1) {
                        o.nextFrameID = o.frameHashIndex + 1;
                        o.goTo(o.nextFrameID)
                    }
                }
            });
            if (o.settings.swipeNavigation && o.hasTouch) {
                var u, a, f = !1;
                o.canvas.on("touchstart.sequence", s)
            }
        }
        var o = this;
        o.container = e(n);
        o.canvas = o.container.children(".sequence-canvas");
        o.frames = o.canvas.children("li");
        o._modernizrForSequence();
        var u = {
                WebkitTransition: "-webkit-",
                WebkitAnimation: "-webkit-",
                MozTransition: "-moz-",
                "MozAnimation ": "-moz-",
                OTransition: "-o-",
                OAnimation: "-o-",
                msTransition: "-ms-",
                msAnimation: "-ms-",
                transition: "",
                animation: ""
            },
            a = {
                WebkitTransition: "webkitTransitionEnd.sequence",
                WebkitAnimation: "webkitAnimationEnd.sequence",
                MozTransition: "transitionend.sequence",
                MozAnimation: "animationend.sequence",
                OTransition: "otransitionend.sequence",
                OAnimation: "oanimationend.sequence",
                msTransition: "MSTransitionEnd.sequence",
                msAnimation: "MSAnimationEnd.sequence",
                transition: "transitionend.sequence",
                animation: "animationend.sequence"
            };
        o.transitionPrefix = u[ModernizrForSequence.prefixed("transition")],
            o.animationPrefix = u[ModernizrForSequence.prefixed("animation")], o.transitionProperties = {}, o.transitionEnd = a[ModernizrForSequence.prefixed("transition")] + " " + a[ModernizrForSequence.prefixed("animation")], o.numberOfFrames = o.frames.length, o.transitionsSupported = o.transitionPrefix !== undefined ? !0 : !1, o.hasTouch = "ontouchstart" in window ? !0 : !1, o.isPaused = !1, o.isBeingHoveredOver = !1, o.container.removeClass("sequence-destroyed");
        o.paused = function() {}, o.unpaused = function() {}, o.beforeNextFrameAnimatesIn = function() {},
            o.afterNextFrameAnimatesIn = function() {}, o.beforeCurrentFrameAnimatesOut = function() {}, o.afterCurrentFrameAnimatesOut = function() {}, o.afterLoaded = function() {};
        o.destroyed = function() {};
        o.settings = e.extend({}, i, r);
        o.settings.preloader = o._renderUiElements(o.settings.preloader, ".sequence-preloader");
        o.isStartingFrame = o.settings.animateStartingFrameIn ? !0 : !1;
        o.settings.unpauseDelay = o.settings.unpauseDelay === null ? o.settings.autoPlayDelay : o.settings.unpauseDelay;
        o.getHashTagFrom = o.settings.hashDataAttribute ?
            "data-sequence-hashtag" : "id";
        o.frameHashID = [];
        o.direction = o.settings.autoPlayDirection;
        o.settings.hideFramesUntilPreloaded && (o.settings.preloader !== undefined && (o.settings.preloader !== !1 && o.frames.hide()));
        o.transitionPrefix === "-o-" && (o.transitionsSupported = o._operaTest());
        o.frames.removeClass("animate-in");
        var l = o.settings.preloadTheseFrames.length,
            c = o.settings.preloadTheseImages.length;
        o.settings.windowLoaded === !0 && (t = o.settings.windowLoaded);
        if (o.settings.preloader === undefined || (o.settings.preloader ===
                !1 || l === 0 && c === 0))
            if (t === !0) {
                f();
                e(this).unbind("load.sequence")
            } else e(window).bind("load.sequence", function() {
                f();
                e(this).unbind("load.sequence")
            });
        else {
            var d = h(l),
                v = h(c, !0),
                m = e(d.concat(v));
            p(m, f)
        }
    }
    var t = !1;
    e(window).bind("load", function() {
        t = !0
    });
    n.prototype = {
        startAutoPlay: function(e) {
            var t = this;
            e = e === undefined ? t.settings.autoPlayDelay : e;
            t.unpause();
            t._resetAutoPlay();
            t.autoPlayTimer = setTimeout(function() {
                t.settings.autoPlayDirection === 1 ? t.next() : t.prev()
            }, e)
        },
        stopAutoPlay: function() {
            var e = this;
            e.pause(!0);
            clearTimeout(e.autoPlayTimer)
        },
        pause: function(e) {
            var t = this;
            if (!t.isSoftPaused) {
                if (t.pauseButton !== undefined) {
                    t.pauseButton.addClass("paused");
                    t.pauseIcon !== undefined && t.pauseIcon.show()
                }
                t.paused();
                t.isSoftPaused = !0;
                t.isHardPaused = e ? !0 : !1;
                t.isPaused = !0;
                t._resetAutoPlay()
            } else t.unpause()
        },
        unpause: function(e) {
            var t = this;
            if (t.pauseButton !== undefined) {
                t.pauseButton.removeClass("paused");
                t.pauseIcon !== undefined && t.pauseIcon.hide()
            }
            t.isSoftPaused = !1;
            t.isHardPaused = !1;
            t.isPaused = !1;
            if (!t.active) {
                e !==
                    !1 && t.unpaused();
                t._resetAutoPlay(!0, t.settings.unpauseDelay)
            } else t.delayUnpause = !0
        },
        next: function() {
            var e = this;
            id = e.currentFrameID !== e.numberOfFrames ? e.currentFrameID + 1 : 1;
            e.active === !1 || e.active === undefined ? e.goTo(id, 1) : e.goTo(id, 1, !0)
        },
        prev: function() {
            var e = this;
            id = e.currentFrameID === 1 ? e.numberOfFrames : e.currentFrameID - 1;
            e.active === !1 || e.active === undefined ? e.goTo(id, -1) : e.goTo(id, -1, !0)
        },
        goTo: function(t, n, r) {
            var i = this;
            i.nextFrameID = parseFloat(t);
            var s = r === !0 ? 0 : i.settings.transitionThreshold;
            if (i.nextFrameID ===
                i.currentFrameID || (i.settings.navigationSkip && i.navigationSkipThresholdActive || (!i.settings.navigationSkip && i.active || (!i.transitionsSupported && i.active || (!i.settings.cycle && (n === 1 && i.currentFrameID === i.numberOfFrames) || (!i.settings.cycle && (n === -1 && i.currentFrameID === 1) || i.settings.preventReverseSkipping && (i.direction !== n && i.active))))))) return !1;
            if (i.settings.navigationSkip && i.active) {
                i.navigationSkipThresholdActive = !0;
                i.settings.fadeFrameWhenSkipped && i.nextFrame.stop().animate({
                    opacity: 0
                }, i.settings.fadeFrameTime);
                clearTimeout(i.transitionThresholdTimer);
                setTimeout(function() {
                    i.navigationSkipThresholdActive = !1
                }, i.settings.navigationSkipThreshold)
            }
            if (!i.active || i.settings.navigationSkip) {
                i.active = !0;
                i._resetAutoPlay();
                n === undefined ? i.direction = i.nextFrameID > i.currentFrameID ? 1 : -1 : i.direction = n;
                i.currentFrame = i.canvas.children(".animate-in");
                i.nextFrame = i.frames.eq(i.nextFrameID - 1);
                i.currentFrameChildren = i.currentFrame.children();
                i.nextFrameChildren = i.nextFrame.children();
                if (i.pagination !== undefined) {
                    i.paginationLinks.removeClass("current");
                    e(i.paginationLinks[i.nextFrameID - 1]).addClass("current")
                }
                if (i.transitionsSupported) {
                    if (i.currentFrame.length !== undefined) {
                        i.beforeCurrentFrameAnimatesOut();
                        i.settings.moveActiveFrameToTop && i.currentFrame.css("z-index", 1);
                        i._resetElements(i.transitionPrefix, i.nextFrameChildren, "0s");
                        if (!i.settings.reverseAnimationsWhenNavigatingBackwards || i.direction === 1) {
                            i.nextFrame.removeClass("animate-out");
                            i._resetElements(i.transitionPrefix, i.currentFrameChildren, "")
                        } else if (i.settings.reverseAnimationsWhenNavigatingBackwards &&
                            i.direction === -1) {
                            i.nextFrame.addClass("animate-out");
                            i._reverseTransitionProperties()
                        }
                    } else i.isStartingFrame = !1;
                    i.active = !0;
                    i.currentFrame.unbind(i.transitionEnd);
                    i.nextFrame.unbind(i.transitionEnd);
                    i.settings.fadeFrameWhenSkipped && (i.settings.navigationSkip && i.nextFrame.css("opacity", 1));
                    i.beforeNextFrameAnimatesIn();
                    i.settings.moveActiveFrameToTop && i.nextFrame.css("z-index", i.numberOfFrames);
                    if (!i.settings.reverseAnimationsWhenNavigatingBackwards || i.direction === 1) {
                        setTimeout(function() {
                            i._resetElements(i.transitionPrefix,
                                i.nextFrameChildren, "");
                            i._waitForAnimationsToComplete(i.nextFrame, i.nextFrameChildren, "in");
                            (i.afterCurrentFrameAnimatesOut !== "function () {}" || i.settings.transitionThreshold === !0 && r !== !0) && i._waitForAnimationsToComplete(i.currentFrame, i.currentFrameChildren, "out", !0, 1)
                        }, 50);
                        setTimeout(function() {
                            if (i.settings.transitionThreshold === !1 || (i.settings.transitionThreshold === 0 || r === !0)) {
                                i.currentFrame.toggleClass("animate-out animate-in");
                                i.nextFrame.addClass("animate-in")
                            } else {
                                i.currentFrame.toggleClass("animate-out animate-in");
                                i.settings.transitionThreshold !== !0 && (i.transitionThresholdTimer = setTimeout(function() {
                                    i.nextFrame.addClass("animate-in")
                                }, s))
                            }
                        }, 50)
                    } else if (i.settings.reverseAnimationsWhenNavigatingBackwards && i.direction === -1) {
                        setTimeout(function() {
                            i._resetElements(i.transitionPrefix, i.currentFrameChildren, "");
                            i._resetElements(i.transitionPrefix, i.nextFrameChildren, "");
                            i._reverseTransitionProperties();
                            i._waitForAnimationsToComplete(i.nextFrame, i.nextFrameChildren, "in");
                            (i.afterCurrentFrameAnimatesOut !== "function () {}" ||
                                i.settings.transitionThreshold === !0 && r !== !0) && i._waitForAnimationsToComplete(i.currentFrame, i.currentFrameChildren, "out", !0, -1)
                        }, 50);
                        setTimeout(function() {
                            if (i.settings.transitionThreshold === !1 || (i.settings.transitionThreshold === 0 || r === !0)) {
                                i.currentFrame.removeClass("animate-in");
                                i.nextFrame.toggleClass("animate-out animate-in")
                            } else {
                                i.currentFrame.removeClass("animate-in");
                                i.settings.transitionThreshold !== !0 && (i.transitionThresholdTimer = setTimeout(function() {
                                        i.nextFrame.toggleClass("animate-out animate-in")
                                    },
                                    s))
                            }
                        }, 50)
                    }
                } else {
                    function o() {
                        i._setHashTag();
                        i.active = !1;
                        i._resetAutoPlay(!0, i.settings.autoPlayDelay)
                    }
                    switch (i.settings.fallback.theme) {
                        case "fade":
                            i.frames.css({
                                position: "relative"
                            });
                            i.beforeCurrentFrameAnimatesOut();
                            i.currentFrame = i.frames.eq(i.currentFrameID - 1);
                            i.currentFrame.animate({
                                opacity: 0
                            }, i.settings.fallback.speed, function() {
                                i.currentFrame.css({
                                    display: "none",
                                    "z-index": "1"
                                });
                                i.afterCurrentFrameAnimatesOut();
                                i.beforeNextFrameAnimatesIn();
                                i.nextFrame.css({
                                    display: "block",
                                    "z-index": i.numberOfFrames
                                }).animate({
                                        opacity: 1
                                    },
                                    500,
                                    function() {
                                        i.afterNextFrameAnimatesIn()
                                    });
                                o()
                            });
                            i.frames.css({
                                position: "relative"
                            });
                            break;
                        case "slide":
                        default:
                            var u = {},
                                a = {},
                                f = {};
                            if (i.direction === 1) {
                                u.left = "-100%";
                                a.left = "100%"
                            } else {
                                u.left = "100%";
                                a.left = "-100%"
                            }
                            f.left = "0";
                            f.opacity = 1;
                            i.currentFrame = i.frames.eq(i.currentFrameID - 1);
                            i.beforeCurrentFrameAnimatesOut();
                            i.currentFrame.animate(u, i.settings.fallback.speed, function() {
                                i.currentFrame.css({
                                    display: "none",
                                    "z-index": "1"
                                });
                                i.afterCurrentFrameAnimatesOut()
                            });
                            i.beforeNextFrameAnimatesIn();
                            i.nextFrame.show().css(a);
                            i.nextFrame.css({
                                display: "block",
                                "z-index": i.numberOfFrames
                            }).animate(f, i.settings.fallback.speed, function() {
                                o();
                                i.afterNextFrameAnimatesIn()
                            })
                    }
                }
                i.currentFrameID = i.nextFrameID
            }
        },
        destroy: function(t) {
            var n = this;
            n.container.addClass("sequence-destroyed");
            n.nextButton !== undefined && n.nextButton.unbind("click.sequence");
            n.prevButton !== undefined && n.prevButton.unbind("click.sequence");
            n.pauseButton !== undefined && n.pauseButton.unbind("click.sequence");
            n.pagination !== undefined && n.paginationLinks.unbind("click.sequence");
            e(document).unbind("keydown.sequence");
            n.canvas.unbind("mouseenter.sequence, mouseleave.sequence, touchstart.sequence, touchmove.sequence");
            e(window).unbind("hashchange.sequence");
            n.stopAutoPlay();
            clearTimeout(n.transitionThresholdTimer);
            n.canvas.children("li").remove();
            n.canvas.prepend(n.frames);
            n.frames.removeClass("animate-in animate-out").removeAttr("style");
            n.frames.eq(n.currentFrameID - 1).addClass("animate-in");
            n.nextButton !== undefined && (n.nextButton !== !1 && n.nextButton.hide());
            n.prevButton !==
                undefined && (n.prevButton !== !1 && n.prevButton.hide());
            n.pauseButton !== undefined && (n.pauseButton !== !1 && n.pauseButton.hide());
            n.pauseIcon !== undefined && (n.pauseIcon !== !1 && n.pauseIcon.hide());
            n.pagination !== undefined && (n.pagination !== !1 && n.pagination.hide());
            t !== undefined && t();
            n.destroyed();
            n.container.removeData()
        },
        _initCustomKeyEvent: function(e) {
            var t = this;
            switch (e) {
                case "next":
                    t.next();
                    break;
                case "prev":
                    t.prev();
                    break;
                case "pause":
                    t.pause(!0)
            }
        },
        _resetElements: function(e, t, n) {
            var r = this;
            t.css(r._prefixCSS(e, {
                "transition-duration": n,
                "transition-delay": n,
                "transition-timing-function": ""
            }))
        },
        _reverseTransitionProperties: function() {
            var t = this,
                n = [],
                r = [];
            t.currentFrameChildren.each(function() {
                n.push(parseFloat(e(this).css(t.transitionPrefix + "transition-duration").replace("s", "")) + parseFloat(e(this).css(t.transitionPrefix + "transition-delay").replace("s", "")))
            });
            t.nextFrameChildren.each(function() {
                r.push(parseFloat(e(this).css(t.transitionPrefix + "transition-duration").replace("s", "")) + parseFloat(e(this).css(t.transitionPrefix +
                    "transition-delay").replace("s", "")))
            });
            var i = Math.max.apply(Math, n),
                s = Math.max.apply(Math, r),
                o = i - s,
                u = 0,
                a = 0;
            o < 0 && !t.settings.preventDelayWhenReversingAnimations ? u = Math.abs(o) : o > 0 && (a = Math.abs(o));
            var f = function(n, r, i, s) {
                function o(e) {
                    e = e.split(",")[0];
                    var t = {
                        linear: "cubic-bezier(0.0,0.0,1.0,1.0)",
                        ease: "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
                        "ease-in": "cubic-bezier(0.42, 0.0, 1.0, 1.0)",
                        "ease-in-out": "cubic-bezier(0.42, 0.0, 0.58, 1.0)",
                        "ease-out": "cubic-bezier(0.0, 0.0, 0.58, 1.0)"
                    };
                    e.indexOf("cubic-bezier") <
                        0 && (e = t[e]);
                    return e
                }
                r.each(function() {
                    var r = parseFloat(e(this).css(t.transitionPrefix + "transition-duration").replace("s", "")),
                        u = parseFloat(e(this).css(t.transitionPrefix + "transition-delay").replace("s", "")),
                        a = e(this).css(t.transitionPrefix + "transition-timing-function");
                    if (a.indexOf("cubic") === -1) var a = o(a);
                    if (t.settings.reverseEaseWhenNavigatingBackwards) {
                        var f = a.replace("cubic-bezier(", "").replace(")", "").split(",");
                        e.each(f, function(e, t) {
                            f[e] = parseFloat(t)
                        });
                        var l = [1 - f[2], 1 - f[3], 1 - f[0], 1 - f[1]];
                        a = "cubic-bezier(" + l + ")"
                    }
                    var c = r + u;
                    n["transition-duration"] = r + "s";
                    n["transition-delay"] = i - c + s + "s";
                    n["transition-timing-function"] = a;
                    e(this).css(t._prefixCSS(t.transitionPrefix, n))
                })
            };
            f(t.transitionProperties, t.currentFrameChildren, i, u);
            f(t.transitionProperties, t.nextFrameChildren, s, a)
        },
        _prefixCSS: function(e, t) {
            var n = this,
                r = {};
            for (var i in t) r[e + i] = t[i];
            return r
        },
        _resetAutoPlay: function(e, t) {
            var n = this;
            if (e === !0) {
                if (n.settings.autoPlay && !n.isSoftPaused) {
                    clearTimeout(n.autoPlayTimer);
                    n.autoPlayTimer =
                        setTimeout(function() {
                            n.settings.autoPlayDirection === 1 ? n.next() : n.prev()
                        }, t)
                }
            } else clearTimeout(n.autoPlayTimer)
        },
        _renderUiElements: function(t, n) {
            var r = this;
            switch (t) {
                case !1:
                    return undefined;
                case !0:
                    n === ".sequence-preloader" && r._defaultPreloader(r.container, r.transitionsSupported, r.animationPrefix);
                    return e(n, r.container);
                default:
                    return e(t, r.container)
            }
        },
        _waitForAnimationsToComplete: function(t, n, r, i, s) {
            var o = this;
            if (r === "out") var u = function() {
                o.afterCurrentFrameAnimatesOut();
                o.settings.transitionThreshold ===
                    !0 && (s === 1 ? o.nextFrame.addClass("animate-in") : s === -1 && o.nextFrame.toggleClass("animate-out animate-in"))
            };
            else if (r === "in") var u = function() {
                o.afterNextFrameAnimatesIn();
                o._setHashTag();
                o.active = !1;
                if (!o.isHardPaused && !o.isBeingHoveredOver)
                    if (!o.delayUnpause) o.unpause(!1);
                    else {
                        o.delayUnpause = !1;
                        o.unpause()
                    }
            };
            n.data("animationEnded", !1);
            t.bind(o.transitionEnd, function(r) {
                e(r.target).data("animationEnded", !0);
                var i = !0;
                n.each(function() {
                    if (e(this).data("animationEnded") === !1) {
                        i = !1;
                        return !1
                    }
                });
                if (i) {
                    t.unbind(o.transitionEnd);
                    u()
                }
            })
        },
        _setHashTag: function() {
            var t = this;
            if (t.settings.hashTags) {
                t.currentHashTag = t.nextFrame.prop(t.getHashTagFrom);
                t.frameHashIndex = e.inArray(t.currentHashTag, t.frameHashID);
                if (t.frameHashIndex !== -1 && (t.settings.hashChangesOnFirstFrame || (!t.isStartingFrame || !t.transitionsSupported))) {
                    t.nextFrameID = t.frameHashIndex + 1;
                    document.location.hash = "#" + t.currentHashTag
                } else {
                    t.nextFrameID = t.settings.startingFrameID;
                    t.isStartingFrame = !1
                }
            }
        },
        _modernizrForSequence: function() {
            window.ModernizrForSequence = function(e,
                t, n) {
                function r(e) {
                    v.cssText = e
                }

                function i(e, t) {
                    return r(prefixes.join(e + ";") + (t || ""))
                }

                function s(e, t) {
                    return typeof e === t
                }

                function o(e, t) {
                    return !!~("" + e).indexOf(t)
                }

                function u(e, t) {
                    for (var r in e) {
                        var i = e[r];
                        if (!o(i, "-") && v[i] !== n) return t == "pfx" ? i : !0
                    }
                    return !1
                }

                function a(e, t, r) {
                    for (var i in e) {
                        var o = t[e[i]];
                        if (o !== n) return r === !1 ? e[i] : s(o, "function") ? o.bind(r || t) : o
                    }
                    return !1
                }

                function f(e, t, n) {
                    var r = e.charAt(0).toUpperCase() + e.slice(1),
                        i = (e + " " + b.join(r + " ") + r).split(" ");
                    return s(t, "string") || s(t,
                        "undefined") ? u(i, t) : (i = (e + " " + w.join(r + " ") + r).split(" "), a(i, t, n))
                }
                var l = "2.6.1",
                    c = {},
                    h = t.documentElement,
                    p = "modernizrForSequence",
                    d = t.createElement(p),
                    v = d.style,
                    m, g = {}.toString,
                    y = "Webkit Moz O ms",
                    b = y.split(" "),
                    w = y.toLowerCase().split(" "),
                    E = {
                        svg: "http://www.w3.org/2000/svg"
                    },
                    S = {},
                    x = {},
                    T = {},
                    N = [],
                    C = N.slice,
                    k, L = {}.hasOwnProperty,
                    A;
                !s(L, "undefined") && !s(L.call, "undefined") ? A = function(e, t) {
                        return L.call(e, t)
                    } : A = function(e, t) {
                        return t in e && s(e.constructor.prototype[t], "undefined")
                    }, Function.prototype.bind ||
                    (Function.prototype.bind = function(e) {
                        var t = self;
                        if (typeof t != "function") throw new TypeError;
                        var n = C.call(arguments, 1),
                            r = function() {
                                if (self instanceof r) {
                                    var i = function() {};
                                    i.prototype = t.prototype;
                                    var s = new i,
                                        o = t.apply(s, n.concat(C.call(arguments)));
                                    return Object(o) === o ? o : s
                                }
                                return t.apply(e, n.concat(C.call(arguments)))
                            };
                        return r
                    }), S.svg = function() {
                        return !!t.createElementNS && !!t.createElementNS(E.svg, "svg").createSVGRect
                    };
                for (var O in S) A(S, O) && (k = O.toLowerCase(), c[k] = S[O](), N.push((c[k] ? "" : "no-") +
                    k));
                return c.addTest = function(e, t) {
                    if (typeof e == "object")
                        for (var r in e) A(e, r) && c.addTest(r, e[r]);
                    else {
                        e = e.toLowerCase();
                        if (c[e] !== n) return c;
                        t = typeof t == "function" ? t() : t, enableClasses && (h.className += " " + (t ? "" : "no-") + e), c[e] = t
                    }
                    return c
                }, r(""), d = m = null, c._version = l, c._domPrefixes = w, c._cssomPrefixes = b, c.testProp = function(e) {
                    return u([e])
                }, c.testAllProps = f, c.prefixed = function(e, t, n) {
                    return t ? f(e, t, n) : f(e, "pfx")
                }, c
            }(self, self.document)
        },
        _defaultPreloader: function(t, n, r) {
            var i = '<div class="sequence-preloader"><svg class="preloading" xmlns="http://www.w3.org/2000/svg"><circle class="circle" cx="6" cy="6" r="6" /><circle class="circle" cx="22" cy="6" r="6" /><circle class="circle" cx="38" cy="6" r="6" /></svg></div>';
            e("head").append("<style>.sequence-preloader{height: 100%;position: absolute;width: 100%;z-index: 999999;}@" + r + "keyframes preload{0%{opacity: 1;}50%{opacity: 0;}100%{opacity: 1;}}.sequence-preloader .preloading .circle{fill: #ff9442;display: inline-block;height: 12px;position: relative;top: -50%;width: 12px;" + r + "animation: preload 1s infinite; animation: preload 1s infinite;}.preloading{display:block;height: 12px;margin: 0 auto;top: 50%;margin-top:-6px;position: relative;width: 48px;}.sequence-preloader .preloading .circle:nth-child(2){" +
                r + "animation-delay: .15s; animation-delay: .15s;}.sequence-preloader .preloading .circle:nth-child(3){" + r + "animation-delay: .3s; animation-delay: .3s;}.preloading-complete{opacity: 0;visibility: hidden;" + r + "transition-duration: 1s; transition-duration: 1s;}div.inline{background-color: #ff9442; margin-right: 4px; float: left;}</style>");
            t.prepend(i);
            if (!ModernizrForSequence.svg && !n) {
                e(".sequence-preloader").prepend('<div class="preloading"><div class="circle inline"></div><div class="circle inline"></div><div class="circle inline"></div></div>');
                setInterval(function() {
                    e(".sequence-preloader .circle").fadeToggle(500)
                }, 500)
            } else n || setInterval(function() {
                e(".sequence-preloader").fadeToggle(500)
            }, 500)
        },
        _operaTest: function() {
            e("body").append('<span id="sequence-opera-test"></span>');
            var t = e("#sequence-opera-test");
            t.css("-o-transition", "1s");
            if (t.css("-o-transition") !== "1s") {
                t.remove();
                return !1
            }
            t.remove();
            return !0
        }
    };
    var r = {
        startingFrameID: 1,
        cycle: !0,
        animateStartingFrameIn: !1,
        transitionThreshold: !1,
        reverseAnimationsWhenNavigatingBackwards: !0,
        reverseEaseWhenNavigatingBackwards: !0,
        preventDelayWhenReversingAnimations: !1,
        moveActiveFrameToTop: !0,
        windowLoaded: !1,
        autoPlay: !1,
        autoPlayDirection: 1,
        autoPlayDelay: 5E3,
        navigationSkip: !0,
        navigationSkipThreshold: 250,
        fadeFrameWhenSkipped: !0,
        fadeFrameTime: 150,
        preventReverseSkipping: !1,
        nextButton: !1,
        showNextButtonOnInit: !0,
        prevButton: !1,
        showPrevButtonOnInit: !0,
        pauseButton: !1,
        unpauseDelay: null,
        pauseOnHover: !0,
        pauseIcon: !1,
        showPauseButtonOnInit: !0,
        pagination: !1,
        showPaginationOnInit: !0,
        preloader: !1,
        preloadTheseFrames: [1],
        preloadTheseImages: [],
        hideFramesUntilPreloaded: !0,
        prependPreloadingComplete: !0,
        hidePreloaderUsingCSS: !0,
        hidePreloaderDelay: 0,
        keyNavigation: !0,
        numericKeysGoToFrames: !0,
        keyEvents: {
            left: "prev",
            right: "next"
        },
        customKeyEvents: {},
        swipeNavigation: !0,
        swipeThreshold: 20,
        swipePreventsDefault: !1,
        swipeEvents: {
            left: "prev",
            right: "next",
            up: !1,
            down: !1
        },
        hashTags: !1,
        hashDataAttribute: !1,
        hashChangesOnFirstFrame: !1,
        fallback: {
            theme: "slide",
            speed: 500
        }
    };
    e.fn.sequence = function(t) {
        return this.each(function() {
            e.data(this, "sequence") ||
                e.data(this, "sequence", new n(e(this), t, r))
        })
    }
})(jQuery);
eval(function(p, a, c, k, e, r) {
    e = function(c) {
        return (c < a ? "" : e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36))
    };
    if (!"".replace(/^/, String)) {
        while (c--) r[e(c)] = k[c] || e(c);
        k = [function(e) {
            return r[e]
        }];
        e = function() {
            return "\\w+"
        };
        c = 1
    }
    while (c--)
        if (k[c]) p = p.replace(new RegExp("\\b" + e(c) + "\\b", "g"), k[c]);
    return p
}('7(A 3c.3q!=="9"){3c.3q=9(e){9 t(){}t.5S=e;p 5R t}}(9(e,t,n){h r={1N:9(t,n){h r=c;r.$k=e(n);r.6=e.4M({},e.37.2B.6,r.$k.v(),t);r.2A=t;r.4L()},4L:9(){9 r(e){h n,r="";7(A t.6.33==="9"){t.6.33.R(c,[e])}l{1A(n 38 e.d){7(e.d.5M(n)){r+=e.d[n].1K}}t.$k.2y(r)}t.3t()}h t=c,n;7(A t.6.2H==="9"){t.6.2H.R(c,[t.$k])}7(A t.6.2O==="2Y"){n=t.6.2O;e.5K(n,r)}l{t.3t()}},3t:9(){h e=c;e.$k.v("d-4I",e.$k.2x("2w")).v("d-4F",e.$k.2x("H"));e.$k.z({2u:0});e.2t=e.6.q;e.4E();e.5v=0;e.1X=14;e.23()},23:9(){h e=c;7(e.$k.25().N===0){p b}e.1M();e.4C();e.$S=e.$k.25();e.E=e.$S.N;e.4B();e.$G=e.$k.17(".d-1K");e.$K=e.$k.17(".d-1p");e.3u="U";e.13=0;e.26=[0];e.m=0;e.4A();e.4z()},4z:9(){h e=c;e.2V();e.2W();e.4t();e.30();e.4r();e.4q();e.2p();e.4o();7(e.6.2o!==b){e.4n(e.6.2o)}7(e.6.O===j){e.6.O=4Q}e.19();e.$k.17(".d-1p").z("4i","4h");7(!e.$k.2m(":3n")){e.3o()}l{e.$k.z("2u",1)}e.5O=b;e.2l();7(A e.6.3s==="9"){e.6.3s.R(c,[e.$k])}},2l:9(){h e=c;7(e.6.1Z===j){e.1Z()}7(e.6.1B===j){e.1B()}e.4g();7(A e.6.3w==="9"){e.6.3w.R(c,[e.$k])}},3x:9(){h e=c;7(A e.6.3B==="9"){e.6.3B.R(c,[e.$k])}e.3o();e.2V();e.2W();e.4f();e.30();e.2l();7(A e.6.3D==="9"){e.6.3D.R(c,[e.$k])}},3F:9(){h e=c;t.1c(9(){e.3x()},0)},3o:9(){h e=c;7(e.$k.2m(":3n")===b){e.$k.z({2u:0});t.18(e.1C);t.18(e.1X)}l{p b}e.1X=t.4d(9(){7(e.$k.2m(":3n")){e.3F();e.$k.4b({2u:1},2M);t.18(e.1X)}},5x)},4B:9(){h e=c;e.$S.5n(\'<L H="d-1p">\').4a(\'<L H="d-1K"></L>\');e.$k.17(".d-1p").4a(\'<L H="d-1p-49">\');e.1H=e.$k.17(".d-1p-49");e.$k.z("4i","4h")},1M:9(){h e=c,t=e.$k.1I(e.6.1M),n=e.$k.1I(e.6.2i);7(!t){e.$k.I(e.6.1M)}7(!n){e.$k.I(e.6.2i)}},2V:9(){h t=c,n,r;7(t.6.2Z===b){p b}7(t.6.48===j){t.6.q=t.2t=1;t.6.1h=b;t.6.1s=b;t.6.1O=b;t.6.22=b;t.6.1Q=b;t.6.1R=b;p b}n=e(t.6.47).1f();7(n>(t.6.1s[0]||t.2t)){t.6.q=t.2t}7(t.6.1h!==b){t.6.1h.5g(9(e,t){p e[0]-t[0]});1A(r=0;r<t.6.1h.N;r+=1){7(t.6.1h[r][0]<=n){t.6.q=t.6.1h[r][1]}}}l{7(n<=t.6.1s[0]&&t.6.1s!==b){t.6.q=t.6.1s[1]}7(n<=t.6.1O[0]&&t.6.1O!==b){t.6.q=t.6.1O[1]}7(n<=t.6.22[0]&&t.6.22!==b){t.6.q=t.6.22[1]}7(n<=t.6.1Q[0]&&t.6.1Q!==b){t.6.q=t.6.1Q[1]}7(n<=t.6.1R[0]&&t.6.1R!==b){t.6.q=t.6.1R[1]}}7(t.6.q>t.E&&t.6.46===j){t.6.q=t.E}},4r:9(){h n=c,r,i;7(n.6.2Z!==j){p b}i=e(t).1f();n.3d=9(){7(e(t).1f()!==i){7(n.6.O!==b){t.18(n.1C)}t.5d(r);r=t.1c(9(){i=e(t).1f();n.3x()},n.6.45)}};e(t).44(n.3d)},4f:9(){h e=c;e.2g(e.m);7(e.6.O!==b){e.3j()}},43:9(){h t=c,n=0,r=t.E-t.6.q;t.$G.2f(9(i){h s=e(c);s.z({1f:t.M}).v("d-1K",3p(i));7(i%t.6.q===0||i===r){7(!(i>r)){n+=1}}s.v("d-24",n)})},42:9(){h e=c,t=e.$G.N*e.M;e.$K.z({1f:t*2,T:0});e.43()},2W:9(){h e=c;e.40();e.42();e.3Z();e.3v()},40:9(){h e=c;e.M=1F.4O(e.$k.1f()/e.6.q)},3v:9(){h e=c,t=(e.E*e.M-e.6.q*e.M)*-1;7(e.6.q>e.E){e.D=0;t=0;e.3z=0}l{e.D=e.E-e.6.q;e.3z=t}p t},3Y:9(){p 0},3Z:9(){h t=c,n=0,r=0,i,s,o;t.J=[0];t.3E=[];1A(i=0;i<t.E;i+=1){r+=t.M;t.J.2D(-r);7(t.6.12===j){s=e(t.$G[i]);o=s.v("d-24");7(o!==n){t.3E[n]=t.J[i];n=o}}}},4t:9(){h t=c;7(t.6.2a===j||t.6.1v===j){t.B=e(\'<L H="d-5A"/>\').5m("5l",!t.F.15).5c(t.$k)}7(t.6.1v===j){t.3T()}7(t.6.2a===j){t.3S()}},3S:9(){h t=c,n=e(\'<L H="d-4U"/>\');t.B.1o(n);t.1u=e("<L/>",{"H":"d-1n",2y:t.6.2U[0]||""});t.1q=e("<L/>",{"H":"d-U",2y:t.6.2U[1]||""});n.1o(t.1u).1o(t.1q);n.w("2X.B 21.B",\'L[H^="d"]\',9(e){e.1l()});n.w("2n.B 28.B",\'L[H^="d"]\',9(n){n.1l();7(e(c).1I("d-U")){t.U()}l{t.1n()}})},3T:9(){h t=c;t.1k=e(\'<L H="d-1v"/>\');t.B.1o(t.1k);t.1k.w("2n.B 28.B",".d-1j",9(n){n.1l();7(3p(e(c).v("d-1j"))!==t.m){t.1g(3p(e(c).v("d-1j")),j)}})},3P:9(){h t=c,n,r,i,s,o,u;7(t.6.1v===b){p b}t.1k.2y("");n=0;r=t.E-t.E%t.6.q;1A(s=0;s<t.E;s+=1){7(s%t.6.q===0){n+=1;7(r===s){i=t.E-t.6.q}o=e("<L/>",{"H":"d-1j"});u=e("<3N></3N>",{4R:t.6.39===j?n:"","H":t.6.39===j?"d-59":""});o.1o(u);o.v("d-1j",r===s?i:s);o.v("d-24",n);t.1k.1o(o)}}t.35()},35:9(){h t=c;7(t.6.1v===b){p b}t.1k.17(".d-1j").2f(9(){7(e(c).v("d-24")===e(t.$G[t.m]).v("d-24")){t.1k.17(".d-1j").Z("2d");e(c).I("2d")}})},3e:9(){h e=c;7(e.6.2a===b){p b}7(e.6.2e===b){7(e.m===0&&e.D===0){e.1u.I("1b");e.1q.I("1b")}l 7(e.m===0&&e.D!==0){e.1u.I("1b");e.1q.Z("1b")}l 7(e.m===e.D){e.1u.Z("1b");e.1q.I("1b")}l 7(e.m!==0&&e.m!==e.D){e.1u.Z("1b");e.1q.Z("1b")}}},30:9(){h e=c;e.3P();e.3e();7(e.B){7(e.6.q>=e.E){e.B.3K()}l{e.B.3J()}}},55:9(){h e=c;7(e.B){e.B.3k()}},U:9(e){h t=c;7(t.1E){p b}t.m+=t.6.12===j?t.6.q:1;7(t.m>t.D+(t.6.12===j?t.6.q-1:0)){7(t.6.2e===j){t.m=0;e="2k"}l{t.m=t.D;p b}}t.1g(t.m,e)},1n:9(e){h t=c;7(t.1E){p b}7(t.6.12===j&&t.m>0&&t.m<t.6.q){t.m=0}l{t.m-=t.6.12===j?t.6.q:1}7(t.m<0){7(t.6.2e===j){t.m=t.D;e="2k"}l{t.m=0;p b}}t.1g(t.m,e)},1g:9(e,n,r){h i=c,s;7(i.1E){p b}7(A i.6.1Y==="9"){i.6.1Y.R(c,[i.$k])}7(e>=i.D){e=i.D}l 7(e<=0){e=0}i.m=i.d.m=e;7(i.6.2o!==b&&r!=="4e"&&i.6.q===1&&i.F.1x===j){i.1t(0);7(i.F.1x===j){i.1L(i.J[e])}l{i.1r(i.J[e],1)}i.2r();i.4l();p b}s=i.J[e];7(i.F.1x===j){i.1T=b;7(n===j){i.1t("1w");t.1c(9(){i.1T=j},i.6.1w)}l 7(n==="2k"){i.1t(i.6.2v);t.1c(9(){i.1T=j},i.6.2v)}l{i.1t("1m");t.1c(9(){i.1T=j},i.6.1m)}i.1L(s)}l{7(n===j){i.1r(s,i.6.1w)}l 7(n==="2k"){i.1r(s,i.6.2v)}l{i.1r(s,i.6.1m)}}i.2r()},2g:9(e){h t=c;7(A t.6.1Y==="9"){t.6.1Y.R(c,[t.$k])}7(e>=t.D||e===-1){e=t.D}l 7(e<=0){e=0}t.1t(0);7(t.F.1x===j){t.1L(t.J[e])}l{t.1r(t.J[e],1)}t.m=t.d.m=e;t.2r()},2r:9(){h e=c;e.26.2D(e.m);e.13=e.d.13=e.26[e.26.N-2];e.26.5f(0);7(e.13!==e.m){e.35();e.3e();e.2l();7(e.6.O!==b){e.3j()}}7(A e.6.3y==="9"&&e.13!==e.m){e.6.3y.R(c,[e.$k])}},X:9(){h e=c;e.3A="X";t.18(e.1C)},3j:9(){h e=c;7(e.3A!=="X"){e.19()}},19:9(){h e=c;e.3A="19";7(e.6.O===b){p b}t.18(e.1C);e.1C=t.4d(9(){e.U(j)},e.6.O)},1t:9(e){h t=c;7(e==="1m"){t.$K.z(t.2z(t.6.1m))}l 7(e==="1w"){t.$K.z(t.2z(t.6.1w))}l 7(A e!=="2Y"){t.$K.z(t.2z(e))}},2z:9(e){p{"-1G-1a":"2C "+e+"1z 2s","-1W-1a":"2C "+e+"1z 2s","-o-1a":"2C "+e+"1z 2s",1a:"2C "+e+"1z 2s"}},3H:9(){p{"-1G-1a":"","-1W-1a":"","-o-1a":"",1a:""}},3I:9(e){p{"-1G-P":"1i("+e+"V, C, C)","-1W-P":"1i("+e+"V, C, C)","-o-P":"1i("+e+"V, C, C)","-1z-P":"1i("+e+"V, C, C)",P:"1i("+e+"V, C,C)"}},1L:9(e){h t=c;t.$K.z(t.3I(e))},3L:9(e){h t=c;t.$K.z({T:e})},1r:9(e,t){h n=c;n.29=b;n.$K.X(j,j).4b({T:e},{54:t||n.6.1m,3M:9(){n.29=j}})},4E:9(){h e=c,r="1i(C, C, C)",i=n.56("L"),s,o,u,a;i.2w.3O="  -1W-P:"+r+"; -1z-P:"+r+"; -o-P:"+r+"; -1G-P:"+r+"; P:"+r;s=/1i\\(C, C, C\\)/g;o=i.2w.3O.5i(s);u=o!==14&&o.N===1;a="5z"38 t||t.5Q.4P;e.F={1x:u,15:a}},4q:9(){h e=c;7(e.6.27!==b||e.6.1U!==b){e.3Q();e.3R()}},4C:9(){h e=c,t=["s","e","x"];e.16={};7(e.6.27===j&&e.6.1U===j){t=["2X.d 21.d","2N.d 3U.d","2n.d 3V.d 28.d"]}l 7(e.6.27===b&&e.6.1U===j){t=["2X.d","2N.d","2n.d 3V.d"]}l 7(e.6.27===j&&e.6.1U===b){t=["21.d","3U.d","28.d"]}e.16.3W=t[0];e.16.2K=t[1];e.16.2J=t[2]},3R:9(){h t=c;t.$k.w("5y.d",9(e){e.1l()});t.$k.w("21.3X",9(t){p e(t.1d).2m("5C, 5E, 5F, 5N")})},3Q:9(){9 s(e){7(e.2b!==W){p{x:e.2b[0].2c,y:e.2b[0].41}}7(e.2b===W){7(e.2c!==W){p{x:e.2c,y:e.41}}7(e.2c===W){p{x:e.52,y:e.53}}}}9 o(t){7(t==="w"){e(n).w(r.16.2K,a);e(n).w(r.16.2J,f)}l 7(t==="Q"){e(n).Q(r.16.2K);e(n).Q(r.16.2J)}}9 u(n){h u=n.3h||n||t.3g,a;7(u.5a===3){p b}7(r.E<=r.6.q){p}7(r.29===b&&!r.6.3f){p b}7(r.1T===b&&!r.6.3f){p b}7(r.6.O!==b){t.18(r.1C)}7(r.F.15!==j&&!r.$K.1I("3b")){r.$K.I("3b")}r.11=0;r.Y=0;e(c).z(r.3H());a=e(c).2h();i.2S=a.T;i.2R=s(u).x-a.T;i.2P=s(u).y-a.5o;o("w");i.2j=b;i.2L=u.1d||u.4c}9 a(o){h u=o.3h||o||t.3g,a,f;r.11=s(u).x-i.2R;r.2I=s(u).y-i.2P;r.Y=r.11-i.2S;7(A r.6.2E==="9"&&i.3C!==j&&r.Y!==0){i.3C=j;r.6.2E.R(r,[r.$k])}7((r.Y>8||r.Y<-8)&&r.F.15===j){7(u.1l!==W){u.1l()}l{u.5L=b}i.2j=j}7((r.2I>10||r.2I<-10)&&i.2j===b){e(n).Q("2N.d")}a=9(){p r.Y/5};f=9(){p r.3z+r.Y/5};r.11=1F.3v(1F.3Y(r.11,a()),f());7(r.F.1x===j){r.1L(r.11)}l{r.3L(r.11)}}9 f(n){h s=n.3h||n||t.3g,u,a,f;s.1d=s.1d||s.4c;i.3C=b;7(r.F.15!==j){r.$K.Z("3b")}7(r.Y<0){r.1y=r.d.1y="T"}l{r.1y=r.d.1y="3i"}7(r.Y!==0){u=r.4j();r.1g(u,b,"4e");7(i.2L===s.1d&&r.F.15!==j){e(s.1d).w("3a.4k",9(t){t.4S();t.4T();t.1l();e(t.1d).Q("3a.4k")});a=e.4N(s.1d,"4V").3a;f=a.4W();a.4X(0,0,f)}}o("Q")}h r=c,i={2R:0,2P:0,4Y:0,2S:0,2h:14,4Z:14,50:14,2j:14,51:14,2L:14};r.29=j;r.$k.w(r.16.3W,".d-1p",u)},4j:9(){h e=c,t=e.4m();7(t>e.D){e.m=e.D;t=e.D}l 7(e.11>=0){t=0;e.m=0}p t},4m:9(){h t=c,n=t.6.12===j?t.3E:t.J,r=t.11,i=14;e.2f(n,9(s,o){7(r-t.M/20>n[s+1]&&r-t.M/20<o&&t.34()==="T"){i=o;7(t.6.12===j){t.m=e.4p(i,t.J)}l{t.m=s}}l 7(r+t.M/20<o&&r+t.M/20>(n[s+1]||n[s]-t.M)&&t.34()==="3i"){7(t.6.12===j){i=n[s+1]||n[n.N-1];t.m=e.4p(i,t.J)}l{i=n[s+1];t.m=s+1}}});p t.m},34:9(){h e=c,t;7(e.Y<0){t="3i";e.3u="U"}l{t="T";e.3u="1n"}p t},4A:9(){h e=c;e.$k.w("d.U",9(){e.U()});e.$k.w("d.1n",9(){e.1n()});e.$k.w("d.19",9(t,n){e.6.O=n;e.19();e.32="19"});e.$k.w("d.X",9(){e.X();e.32="X"});e.$k.w("d.1g",9(t,n){e.1g(n)});e.$k.w("d.2g",9(t,n){e.2g(n)})},2p:9(){h e=c;7(e.6.2p===j&&e.F.15!==j&&e.6.O!==b){e.$k.w("57",9(){e.X()});e.$k.w("58",9(){7(e.32!=="X"){e.19()}})}},1Z:9(){h t=c,n,r,i,s,o;7(t.6.1Z===b){p b}1A(n=0;n<t.E;n+=1){r=e(t.$G[n]);7(r.v("d-1e")==="1e"){4s}i=r.v("d-1K");s=r.17(".5b");7(A s.v("1J")!=="2Y"){r.v("d-1e","1e");4s}7(r.v("d-1e")===W){s.3K();r.I("4u").v("d-1e","5e")}7(t.6.4v===j){o=i>=t.m}l{o=j}7(o&&i<t.m+t.6.q&&s.N){t.4w(r,s)}}},4w:9(e,n){9 o(){e.v("d-1e","1e").Z("4u");n.5h("v-1J");7(r.6.4x==="4y"){n.5j(5k)}l{n.3J()}7(A r.6.2T==="9"){r.6.2T.R(c,[r.$k])}}9 u(){i+=1;7(r.2Q(n.3l(0))||s===j){o()}l 7(i<=2q){t.1c(u,2q)}l{o()}}h r=c,i=0,s;7(n.5p("5q")==="5r"){n.z("5s-5t","5u("+n.v("1J")+")");s=j}l{n[0].1J=n.v("1J")}u()},1B:9(){9 s(){h r=e(n.$G[n.m]).2G();n.1H.z("2G",r+"V");7(!n.1H.1I("1B")){t.1c(9(){n.1H.I("1B")},0)}}9 o(){i+=1;7(n.2Q(r.3l(0))){s()}l 7(i<=2q){t.1c(o,2q)}l{n.1H.z("2G","")}}h n=c,r=e(n.$G[n.m]).17("5w"),i;7(r.3l(0)!==W){i=0;o()}l{s()}},2Q:9(e){h t;7(!e.3M){p b}t=A e.4D;7(t!=="W"&&e.4D===0){p b}p j},4g:9(){h t=c,n;7(t.6.2F===j){t.$G.Z("2d")}t.1D=[];1A(n=t.m;n<t.m+t.6.q;n+=1){t.1D.2D(n);7(t.6.2F===j){e(t.$G[n]).I("2d")}}t.d.1D=t.1D},4n:9(e){h t=c;t.4G="d-"+e+"-5B";t.4H="d-"+e+"-38"},4l:9(){9 a(e){p{2h:"5D",T:e+"V"}}h e=c,t=e.4G,n=e.4H,r=e.$G.1S(e.m),i=e.$G.1S(e.13),s=1F.4J(e.J[e.m])+e.J[e.13],o=1F.4J(e.J[e.m])+e.M/2,u="5G 5H 5I 5J";e.1E=j;e.$K.I("d-1P").z({"-1G-P-1P":o+"V","-1W-4K-1P":o+"V","4K-1P":o+"V"});i.z(a(s,10)).I(t).w(u,9(){e.3m=j;i.Q(u);e.31(i,t)});r.I(n).w(u,9(){e.36=j;r.Q(u);e.31(r,n)})},31:9(e,t){h n=c;e.z({2h:"",T:""}).Z(t);7(n.3m&&n.36){n.$K.Z("d-1P");n.3m=b;n.36=b;n.1E=b}},4o:9(){h e=c;e.d={2A:e.2A,5P:e.$k,S:e.$S,G:e.$G,m:e.m,13:e.13,1D:e.1D,15:e.F.15,F:e.F,1y:e.1y}},3G:9(){h r=c;r.$k.Q(".d d 21.3X");e(n).Q(".d d");e(t).Q("44",r.3d)},1V:9(){h e=c;7(e.$k.25().N!==0){e.$K.3r();e.$S.3r().3r();7(e.B){e.B.3k()}}e.3G();e.$k.2x("2w",e.$k.v("d-4I")||"").2x("H",e.$k.v("d-4F"))},5T:9(){h e=c;e.X();t.18(e.1X);e.1V();e.$k.5U()},5V:9(t){h n=c,r=e.4M({},n.2A,t);n.1V();n.1N(r,n.$k)},5W:9(e,t){h n=c,r;7(!e){p b}7(n.$k.25().N===0){n.$k.1o(e);n.23();p b}n.1V();7(t===W||t===-1){r=-1}l{r=t}7(r>=n.$S.N||r===-1){n.$S.1S(-1).5X(e)}l{n.$S.1S(r).5Y(e)}n.23()},5Z:9(e){h t=c,n;7(t.$k.25().N===0){p b}7(e===W||e===-1){n=-1}l{n=e}t.1V();t.$S.1S(n).3k();t.23()}};e.37.2B=9(t){p c.2f(9(){7(e(c).v("d-1N")===j){p b}e(c).v("d-1N",j);h n=3c.3q(r);n.1N(t,c);e.v(c,"2B",n)})};e.37.2B.6={q:5,1h:b,1s:[60,4],1O:[61,3],22:[62,2],1Q:b,1R:[63,1],48:b,46:b,1m:2M,1w:64,2v:65,O:b,2p:b,2a:b,2U:["1n","U"],2e:j,12:b,1v:j,39:b,2Z:j,45:2M,47:t,1M:"d-66",2i:"d-2i",1Z:b,4v:j,4x:"4y",1B:b,2O:b,33:b,3f:j,27:j,1U:j,2F:b,2o:b,3B:b,3D:b,2H:b,3s:b,1Y:b,3y:b,3w:b,2E:b,2T:b}})(67,68,69)',
    62, 382, "||||||options|if||function||false|this|owl||||var||true|elem|else|currentItem|||return|items|||||data|on|||css|typeof|owlControls|0px|maximumItem|itemsAmount|browser|owlItems|class|addClass|positionsInArray|owlWrapper|div|itemWidth|length|autoPlay|transform|off|apply|userItems|left|next|px|undefined|stop|newRelativeX|removeClass||newPosX|scrollPerPage|prevItem|null|isTouch|ev_types|find|clearInterval|play|transition|disabled|setTimeout|target|loaded|width|goTo|itemsCustom|translate3d|page|paginationWrapper|preventDefault|slideSpeed|prev|append|wrapper|buttonNext|css2slide|itemsDesktop|swapSpeed|buttonPrev|pagination|paginationSpeed|support3d|dragDirection|ms|for|autoHeight|autoPlayInterval|visibleItems|isTransition|Math|webkit|wrapperOuter|hasClass|src|item|transition3d|baseClass|init|itemsDesktopSmall|origin|itemsTabletSmall|itemsMobile|eq|isCss3Finish|touchDrag|unWrap|moz|checkVisible|beforeMove|lazyLoad||mousedown|itemsTablet|setVars|roundPages|children|prevArr|mouseDrag|mouseup|isCssFinish|navigation|touches|pageX|active|rewindNav|each|jumpTo|position|theme|sliding|rewind|eachMoveUpdate|is|touchend|transitionStyle|stopOnHover|100|afterGo|ease|orignalItems|opacity|rewindSpeed|style|attr|html|addCssSpeed|userOptions|owlCarousel|all|push|startDragging|addClassActive|height|beforeInit|newPosY|end|move|targetElement|200|touchmove|jsonPath|offsetY|completeImg|offsetX|relativePos|afterLazyLoad|navigationText|updateItems|calculateAll|touchstart|string|responsive|updateControls|clearTransStyle|hoverStatus|jsonSuccess|moveDirection|checkPagination|endCurrent|fn|in|paginationNumbers|click|grabbing|Object|resizer|checkNavigation|dragBeforeAnimFinish|event|originalEvent|right|checkAp|remove|get|endPrev|visible|watchVisibility|Number|create|unwrap|afterInit|logIn|playDirection|max|afterAction|updateVars|afterMove|maximumPixels|apStatus|beforeUpdate|dragging|afterUpdate|pagesInArray|reload|clearEvents|removeTransition|doTranslate|show|hide|css2move|complete|span|cssText|updatePagination|gestures|disabledEvents|buildButtons|buildPagination|mousemove|touchcancel|start|disableTextSelect|min|loops|calculateWidth|pageY|appendWrapperSizes|appendItemsSizes|resize|responsiveRefreshRate|itemsScaleUp|responsiveBaseWidth|singleItem|outer|wrap|animate|srcElement|setInterval|drag|updatePosition|onVisibleItems|block|display|getNewPosition|disable|singleItemTransition|closestItem|transitionTypes|owlStatus|inArray|moveEvents|response|continue|buildControls|loading|lazyFollow|lazyPreload|lazyEffect|fade|onStartup|customEvents|wrapItems|eventTypes|naturalWidth|checkBrowser|originalClasses|outClass|inClass|originalStyles|abs|perspective|loadContent|extend|_data|round|msMaxTouchPoints|5e3|text|stopImmediatePropagation|stopPropagation|buttons|events|pop|splice|baseElWidth|minSwipe|maxSwipe|dargging|clientX|clientY|duration|destroyControls|createElement|mouseover|mouseout|numbers|which|lazyOwl|appendTo|clearTimeout|checked|shift|sort|removeAttr|match|fadeIn|400|clickable|toggleClass|wrapAll|top|prop|tagName|DIV|background|image|url|wrapperWidth|img|500|dragstart|ontouchstart|controls|out|input|relative|textarea|select|webkitAnimationEnd|oAnimationEnd|MSAnimationEnd|animationend|getJSON|returnValue|hasOwnProperty|option|onstartup|baseElement|navigator|new|prototype|destroy|removeData|reinit|addItem|after|before|removeItem|1199|979|768|479|800|1e3|carousel|jQuery|window|document".split("|"),
    0, {}));
(function($) {
    var eventNamespace = "waitForImages";
    $.waitForImages = {
        hasImageProperties: ["backgroundImage", "listStyleImage", "borderImage", "borderCornerImage", "cursor"]
    };
    $.expr[":"].uncached = function(obj) {
        if (!$(obj).is('img[src!=""]')) return false;
        var img = new Image;
        img.src = obj.src;
        return !img.complete
    };
    $.fn.waitForImages = function(finishedCallback, eachCallback, waitForAll) {
        var allImgsLength = 0;
        var allImgsLoaded = 0;
        if ($.isPlainObject(arguments[0])) {
            waitForAll = arguments[0].waitForAll;
            eachCallback = arguments[0].each;
            finishedCallback = arguments[0].finished
        }
        finishedCallback = finishedCallback || $.noop;
        eachCallback = eachCallback || $.noop;
        waitForAll = !!waitForAll;
        if (!$.isFunction(finishedCallback) || !$.isFunction(eachCallback)) throw new TypeError("An invalid callback was supplied.");
        return this.each(function() {
            var obj = $(this);
            var allImgs = [];
            var hasImgProperties = $.waitForImages.hasImageProperties || [];
            var matchUrl = /url\(\s*(['"]?)(.*?)\1\s*\)/g;
            if (waitForAll) obj.find("*").addBack().each(function() {
                var element = $(this);
                if (element.is("img:uncached")) allImgs.push({
                    src: element.attr("src"),
                    element: element[0]
                });
                $.each(hasImgProperties, function(i, property) {
                    var propertyValue = element.css(property);
                    var match;
                    if (!propertyValue) return true;
                    while (match = matchUrl.exec(propertyValue)) allImgs.push({
                        src: match[2],
                        element: element[0]
                    })
                })
            });
            else obj.find("img:uncached").each(function() {
                allImgs.push({
                    src: this.src,
                    element: this
                })
            });
            allImgsLength = allImgs.length;
            allImgsLoaded = 0;
            if (allImgsLength === 0) finishedCallback.call(obj[0]);
            $.each(allImgs, function(i, img) {
                var image = new Image;
                $(image).on("load." + eventNamespace +
                    " error." + eventNamespace,
                    function(event) {
                        allImgsLoaded++;
                        eachCallback.call(img.element, allImgsLoaded, allImgsLength, event.type == "load");
                        if (allImgsLoaded == allImgsLength) {
                            finishedCallback.call(obj[0]);
                            return false
                        }
                    });
                image.src = img.src
            })
        })
    }
})(jQuery);

(function(e) {
    var t = function(t, n) {
        var r = e.extend({}, e.fn.nivoSlider.defaults, n);
        var i = {
            currentSlide: 0,
            currentImage: "",
            totalSlides: 0,
            running: false,
            paused: false,
            stop: false,
            controlNavEl: false
        };
        var s = e(t);
        s.data("nivo:vars", i).addClass("nivoSlider");
        var o = s.children();
        o.each(function() {
            var t = e(this);
            var n = "";
            if (!t.is("img")) {
                if (t.is("a")) {
                    t.addClass("nivo-imageLink");
                    n = t
                }
                t = t.find("img:first")
            }
            var r = r === 0 ? t.attr("width") : t.width(),
                s = s === 0 ? t.attr("height") : t.height();
            if (n !== "") n.css("display", "none");
            t.css("display",
                "none");
            i.totalSlides++
        });
        if (r.randomStart) r.startSlide = Math.floor(Math.random() * i.totalSlides);
        if (r.startSlide > 0) {
            if (r.startSlide >= i.totalSlides) r.startSlide = i.totalSlides - 1;
            i.currentSlide = r.startSlide
        }
        if (e(o[i.currentSlide]).is("img")) i.currentImage = e(o[i.currentSlide]);
        else i.currentImage = e(o[i.currentSlide]).find("img:first");
        if (e(o[i.currentSlide]).is("a")) e(o[i.currentSlide]).css("display", "block");
        var u = e("<img/>").addClass("nivo-main-image");
        u.attr("src", i.currentImage.attr("src")).show();
        s.append(u);
        e(window).resize(function() {
            s.children("img").width(s.width());
            u.attr("src", i.currentImage.attr("src"));
            u.stop().height("auto");
            e(".nivo-slice").remove();
            e(".nivo-box").remove()
        });
        s.append(e('<div class="nivo-caption"></div>'));
        var a = function(t) {
            var n = e(".nivo-caption", s);
            if (i.currentImage.attr("title") != "" && i.currentImage.attr("title") != undefined) {
                var r = i.currentImage.attr("title");
                if (r.substr(0, 1) == "#") r = e(r).html();
                if (n.css("display") == "block") setTimeout(function() {
                    n.html(r)
                }, t.animSpeed);
                else {
                    n.html(r);
                    n.stop().fadeIn(t.animSpeed)
                }
            } else n.stop().fadeOut(t.animSpeed)
        };
        a(r);
        var f = 0;
        if (!r.manualAdvance && o.length > 1) f = setInterval(function() {
            d(s, o, r, false)
        }, r.pauseTime);
        if (r.directionNav) {
            s.append('<div class="nivo-directionNav"><a class="nivo-prevNav">' + r.prevText + '</a><a class="nivo-nextNav">' + r.nextText + "</a></div>");
            e(s).on("click", "a.nivo-prevNav", function() {
                if (i.running) return false;
                clearInterval(f);
                f = "";
                i.currentSlide -= 2;
                d(s, o, r, "prev")
            });
            e(s).on("click", "a.nivo-nextNav", function() {
                if (i.running) return false;
                clearInterval(f);
                f = "";
                d(s, o, r, "next")
            })
        }
        if (r.controlNav) {
            i.controlNavEl = e('<div class="nivo-controlNav"></div>');
            s.after(i.controlNavEl);
            for (var l = 0; l < o.length; l++)
                if (r.controlNavThumbs) {
                    i.controlNavEl.addClass("nivo-thumbs-enabled");
                    var c = o.eq(l);
                    if (!c.is("img")) c = c.find("img:first");
                    if (c.attr("data-thumb")) i.controlNavEl.append('<a class="nivo-control" rel="' + l + '"><img src="' + c.attr("data-thumb") + '" alt="" /></a>')
                } else i.controlNavEl.append('<a class="nivo-control" rel="' + l + '">' + (l + 1) + "</a>");
            e("a:eq(" + i.currentSlide + ")", i.controlNavEl).addClass("active");
            e("a", i.controlNavEl).bind("click", function() {
                if (i.running) return false;
                if (e(this).hasClass("active")) return false;
                clearInterval(f);
                f = "";
                u.attr("src", i.currentImage.attr("src"));
                i.currentSlide = e(this).attr("rel") - 1;
                d(s, o, r, "control")
            })
        }
        if (r.pauseOnHover) s.hover(function() {
            i.paused = true;
            clearInterval(f);
            f = ""
        }, function() {
            i.paused = false;
            if (f === "" && !r.manualAdvance) f = setInterval(function() {
                d(s, o, r, false)
            }, r.pauseTime)
        });
        s.bind("nivo:animFinished",
            function() {
                u.attr("src", i.currentImage.attr("src"));
                i.running = false;
                e(o).each(function() {
                    if (e(this).is("a")) e(this).css("display", "none")
                });
                if (e(o[i.currentSlide]).is("a")) e(o[i.currentSlide]).css("display", "block");
                if (f === "" && (!i.paused && !r.manualAdvance)) f = setInterval(function() {
                    d(s, o, r, false)
                }, r.pauseTime);
                r.afterChange.call(this)
            });
        var h = function(t, n, r) {
            if (e(r.currentImage).parent().is("a")) e(r.currentImage).parent().css("display", "block");
            e('img[src="' + r.currentImage.attr("src") + '"]', t).not(".nivo-main-image,.nivo-control img").width(t.width()).css("visibility",
                "hidden").show();
            var i = e('img[src="' + r.currentImage.attr("src") + '"]', t).not(".nivo-main-image,.nivo-control img").parent().is("a") ? e('img[src="' + r.currentImage.attr("src") + '"]', t).not(".nivo-main-image,.nivo-control img").parent().height() : e('img[src="' + r.currentImage.attr("src") + '"]', t).not(".nivo-main-image,.nivo-control img").height();
            for (var s = 0; s < n.slices; s++) {
                var o = Math.round(t.width() / n.slices);
                if (s === n.slices - 1) t.append(e('<div class="nivo-slice" name="' + s + '"><img src="' + r.currentImage.attr("src") +
                    '" style="position:absolute; width:' + t.width() + "px; height:auto; display:block !important; top:0; left:-" + (o + s * o - o) + 'px;" /></div>').css({
                    left: o * s + "px",
                    width: t.width() - o * s + "px",
                    height: i + "px",
                    opacity: "0",
                    overflow: "hidden"
                }));
                else t.append(e('<div class="nivo-slice" name="' + s + '"><img src="' + r.currentImage.attr("src") + '" style="position:absolute; width:' + t.width() + "px; height:auto; display:block !important; top:0; left:-" + (o + s * o - o) + 'px;" /></div>').css({
                    left: o * s + "px",
                    width: o + "px",
                    height: i + "px",
                    opacity: "0",
                    overflow: "hidden"
                }))
            }
            e(".nivo-slice", t).height(i);
            u.stop().animate({
                height: e(r.currentImage).height()
            }, n.animSpeed)
        };
        var p = function(t, n, r) {
            if (e(r.currentImage).parent().is("a")) e(r.currentImage).parent().css("display", "block");
            e('img[src="' + r.currentImage.attr("src") + '"]', t).not(".nivo-main-image,.nivo-control img").width(t.width()).css("visibility", "hidden").show();
            var i = Math.round(t.width() / n.boxCols),
                s = Math.round(e('img[src="' + r.currentImage.attr("src") + '"]', t).not(".nivo-main-image,.nivo-control img").height() /
                    n.boxRows);
            for (var o = 0; o < n.boxRows; o++)
                for (var a = 0; a < n.boxCols; a++)
                    if (a === n.boxCols - 1) {
                        t.append(e('<div class="nivo-box" name="' + a + '" rel="' + o + '"><img src="' + r.currentImage.attr("src") + '" style="position:absolute; width:' + t.width() + "px; height:auto; display:block; top:-" + s * o + "px; left:-" + i * a + 'px;" /></div>').css({
                            opacity: 0,
                            left: i * a + "px",
                            top: s * o + "px",
                            width: t.width() - i * a + "px"
                        }));
                        e('.nivo-box[name="' + a + '"]', t).height(e('.nivo-box[name="' + a + '"] img', t).height() + "px")
                    } else {
                        t.append(e('<div class="nivo-box" name="' +
                            a + '" rel="' + o + '"><img src="' + r.currentImage.attr("src") + '" style="position:absolute; width:' + t.width() + "px; height:auto; display:block; top:-" + s * o + "px; left:-" + i * a + 'px;" /></div>').css({
                            opacity: 0,
                            left: i * a + "px",
                            top: s * o + "px",
                            width: i + "px"
                        }));
                        e('.nivo-box[name="' + a + '"]', t).height(e('.nivo-box[name="' + a + '"] img', t).height() + "px")
                    }
            u.stop().animate({
                height: e(r.currentImage).height()
            }, n.animSpeed)
        };
        var d = function(t, n, r, i) {
            var s = t.data("nivo:vars");
            if (s && s.currentSlide === s.totalSlides - 1) r.lastSlide.call(this);
            if ((!s || s.stop) && !i) return false;
            r.beforeChange.call(this);
            if (!i) u.attr("src", s.currentImage.attr("src"));
            else {
                if (i === "prev") u.attr("src", s.currentImage.attr("src"));
                if (i === "next") u.attr("src", s.currentImage.attr("src"))
            }
            s.currentSlide++;
            if (s.currentSlide === s.totalSlides) {
                s.currentSlide = 0;
                r.slideshowEnd.call(this)
            }
            if (s.currentSlide < 0) s.currentSlide = s.totalSlides - 1;
            if (e(n[s.currentSlide]).is("img")) s.currentImage = e(n[s.currentSlide]);
            else s.currentImage = e(n[s.currentSlide]).find("img:first");
            if (r.controlNav) {
                e("a",
                    s.controlNavEl).removeClass("active");
                e("a:eq(" + s.currentSlide + ")", s.controlNavEl).addClass("active")
            }
            a(r);
            e(".nivo-slice", t).remove();
            e(".nivo-box", t).remove();
            var o = r.effect,
                f = "";
            if (r.effect === "random") {
                f = new Array("sliceDownRight", "sliceDownLeft", "sliceUpRight", "sliceUpLeft", "sliceUpDown", "sliceUpDownLeft", "fold", "fade", "boxRandom", "boxRain", "boxRainReverse", "boxRainGrow", "boxRainGrowReverse");
                o = f[Math.floor(Math.random() * (f.length + 1))];
                if (o === undefined) o = "fade"
            }
            if (r.effect.indexOf(",") !== -1) {
                f =
                    r.effect.split(",");
                o = f[Math.floor(Math.random() * f.length)];
                if (o === undefined) o = "fade"
            }
            if (s.currentImage.attr("data-transition")) o = s.currentImage.attr("data-transition");
            s.running = true;
            var l = 0,
                c = 0,
                d = "",
                m = "",
                g = "",
                y = "";
            if (o === "sliceDown" || (o === "sliceDownRight" || o === "sliceDownLeft")) {
                h(t, r, s);
                l = 0;
                c = 0;
                d = e(".nivo-slice", t);
                if (o === "sliceDownLeft") d = e(".nivo-slice", t)._reverse();
                d.each(function() {
                    var n = e(this);
                    n.css({
                        top: "0px"
                    });
                    if (c === r.slices - 1) setTimeout(function() {
                        n.animate({
                                opacity: "1.0"
                            }, r.animSpeed,
                            "",
                            function() {
                                t.trigger("nivo:animFinished")
                            })
                    }, 100 + l);
                    else setTimeout(function() {
                        n.animate({
                            opacity: "1.0"
                        }, r.animSpeed)
                    }, 100 + l);
                    l += 50;
                    c++
                })
            } else if (o === "sliceUp" || (o === "sliceUpRight" || o === "sliceUpLeft")) {
                h(t, r, s);
                l = 0;
                c = 0;
                d = e(".nivo-slice", t);
                if (o === "sliceUpLeft") d = e(".nivo-slice", t)._reverse();
                d.each(function() {
                    var n = e(this);
                    n.css({
                        bottom: "0px"
                    });
                    if (c === r.slices - 1) setTimeout(function() {
                        n.animate({
                            opacity: "1.0"
                        }, r.animSpeed, "", function() {
                            t.trigger("nivo:animFinished")
                        })
                    }, 100 + l);
                    else setTimeout(function() {
                        n.animate({
                                opacity: "1.0"
                            },
                            r.animSpeed)
                    }, 100 + l);
                    l += 50;
                    c++
                })
            } else if (o === "sliceUpDown" || (o === "sliceUpDownRight" || o === "sliceUpDownLeft")) {
                h(t, r, s);
                l = 0;
                c = 0;
                var b = 0;
                d = e(".nivo-slice", t);
                if (o === "sliceUpDownLeft") d = e(".nivo-slice", t)._reverse();
                d.each(function() {
                    var n = e(this);
                    if (c === 0) {
                        n.css("top", "0px");
                        c++
                    } else {
                        n.css("bottom", "0px");
                        c = 0
                    }
                    if (b === r.slices - 1) setTimeout(function() {
                        n.animate({
                            opacity: "1.0"
                        }, r.animSpeed, "", function() {
                            t.trigger("nivo:animFinished")
                        })
                    }, 100 + l);
                    else setTimeout(function() {
                            n.animate({
                                opacity: "1.0"
                            }, r.animSpeed)
                        },
                        100 + l);
                    l += 50;
                    b++
                })
            } else if (o === "fold") {
                h(t, r, s);
                l = 0;
                c = 0;
                e(".nivo-slice", t).each(function() {
                    var n = e(this);
                    var i = n.width();
                    n.css({
                        top: "0px",
                        width: "0px"
                    });
                    if (c === r.slices - 1) setTimeout(function() {
                        n.animate({
                            width: i,
                            opacity: "1.0"
                        }, r.animSpeed, "", function() {
                            t.trigger("nivo:animFinished")
                        })
                    }, 100 + l);
                    else setTimeout(function() {
                        n.animate({
                            width: i,
                            opacity: "1.0"
                        }, r.animSpeed)
                    }, 100 + l);
                    l += 50;
                    c++
                })
            } else if (o === "fade") {
                h(t, r, s);
                m = e(".nivo-slice:first", t);
                m.css({
                    width: t.width() + "px"
                });
                m.animate({
                        opacity: "1.0"
                    }, r.animSpeed *
                    2, "",
                    function() {
                        t.trigger("nivo:animFinished")
                    })
            } else if (o === "slideInRight") {
                h(t, r, s);
                m = e(".nivo-slice:first", t);
                m.css({
                    width: "0px",
                    opacity: "1"
                });
                m.animate({
                    width: t.width() + "px"
                }, r.animSpeed * 2, "", function() {
                    t.trigger("nivo:animFinished")
                })
            } else if (o === "slideInLeft") {
                h(t, r, s);
                m = e(".nivo-slice:first", t);
                m.css({
                    width: "0px",
                    opacity: "1",
                    left: "",
                    right: "0px"
                });
                m.animate({
                    width: t.width() + "px"
                }, r.animSpeed * 2, "", function() {
                    m.css({
                        left: "0px",
                        right: ""
                    });
                    t.trigger("nivo:animFinished")
                })
            } else if (o === "boxRandom") {
                p(t,
                    r, s);
                g = r.boxCols * r.boxRows;
                c = 0;
                l = 0;
                y = v(e(".nivo-box", t));
                y.each(function() {
                    var n = e(this);
                    if (c === g - 1) setTimeout(function() {
                        n.animate({
                            opacity: "1"
                        }, r.animSpeed, "", function() {
                            t.trigger("nivo:animFinished")
                        })
                    }, 100 + l);
                    else setTimeout(function() {
                        n.animate({
                            opacity: "1"
                        }, r.animSpeed)
                    }, 100 + l);
                    l += 20;
                    c++
                })
            } else if (o === "boxRain" || (o === "boxRainReverse" || (o === "boxRainGrow" || o === "boxRainGrowReverse"))) {
                p(t, r, s);
                g = r.boxCols * r.boxRows;
                c = 0;
                l = 0;
                var w = 0;
                var E = 0;
                var S = [];
                S[w] = [];
                y = e(".nivo-box", t);
                if (o === "boxRainReverse" ||
                    o === "boxRainGrowReverse") y = e(".nivo-box", t)._reverse();
                y.each(function() {
                    S[w][E] = e(this);
                    E++;
                    if (E === r.boxCols) {
                        w++;
                        E = 0;
                        S[w] = []
                    }
                });
                for (var x = 0; x < r.boxCols * 2; x++) {
                    var T = x;
                    for (var N = 0; N < r.boxRows; N++) {
                        if (T >= 0 && T < r.boxCols) {
                            (function(n, i, s, u, a) {
                                var f = e(S[n][i]);
                                var l = f.width();
                                var c = f.height();
                                if (o === "boxRainGrow" || o === "boxRainGrowReverse") f.width(0).height(0);
                                if (u === a - 1) setTimeout(function() {
                                        f.animate({
                                            opacity: "1",
                                            width: l,
                                            height: c
                                        }, r.animSpeed / 1.3, "", function() {
                                            t.trigger("nivo:animFinished")
                                        })
                                    }, 100 +
                                    s);
                                else setTimeout(function() {
                                    f.animate({
                                        opacity: "1",
                                        width: l,
                                        height: c
                                    }, r.animSpeed / 1.3)
                                }, 100 + s)
                            })(N, T, l, c, g);
                            c++
                        }
                        T--
                    }
                    l += 100
                }
            }
        };
        var v = function(e) {
            for (var t, n, r = e.length; r; t = parseInt(Math.random() * r, 10), n = e[--r], e[r] = e[t], e[t] = n);
            return e
        };
        var m = function(e) {
            if (this.console && typeof console.log !== "undefined") console.log(e)
        };
        this.stop = function() {
            if (!e(t).data("nivo:vars").stop) {
                e(t).data("nivo:vars").stop = true;
                m("Stop Slider")
            }
        };
        this.start = function() {
            if (e(t).data("nivo:vars").stop) {
                e(t).data("nivo:vars").stop =
                    false;
                m("Start Slider")
            }
        };
        r.afterLoad.call(this);
        return this
    };
    e.fn.nivoSlider = function(n) {
        return this.each(function(r, i) {
            var s = e(this);
            if (s.data("nivoslider")) return s.data("nivoslider");
            var o = new t(this, n);
            s.data("nivoslider", o)
        })
    };
    e.fn.nivoSlider.defaults = {
        effect: "slideInLeft",
        slices: 15,
        boxCols: 8,
        boxRows: 4,
        animSpeed: 500,
        pauseTime: 3E3,
        startSlide: 0,
        directionNav: true,
        controlNav: true,
        controlNavThumbs: false,
        pauseOnHover: true,
        manualAdvance: false,
        prevText: "Prev",
        nextText: "Next",
        randomStart: false,
        beforeChange: function() {},
        afterChange: function() {},
        slideshowEnd: function() {},
        lastSlide: function() {},
        afterLoad: function() {}
    };
    e.fn._reverse = [].reverse
})(jQuery);



(function(e, t, n, r) {
    function o(t, n) {
        this.el = t;
        this.$el = e(this.el);
        this.options = e.extend({}, s, n);
        this._defaults = s;
        this._name = i;
        this.init()
    }
    var i = "nivoLightbox",
        s = {
            effect: "fade",
            theme: "default",
            keyboardNav: true,
            onInit: function() {},
            beforeShowLightbox: function() {},
            afterShowLightbox: function(e) {},
            beforeHideLightbox: function() {},
            afterHideLightbox: function() {},
            onPrev: function(e) {},
            onNext: function(e) {},
            errorMessage: "The requested content cannot be loaded. Please try again later."
        };
    o.prototype = {
        init: function() {
            var t =
                this;
            this.$el.on("click", function(e) {
                e.preventDefault();
                t.showLightbox()
            });
            if (this.options.keyboardNav) e("body").off("keyup").on("keyup", function(n) {
                var r = n.keyCode ? n.keyCode : n.which;
                if (r == 27) t.destructLightbox();
                if (r == 37) e(".nivo-lightbox-prev").trigger("click");
                if (r == 39) e(".nivo-lightbox-next").trigger("click")
            });
            this.options.onInit.call(this)
        },
        showLightbox: function() {
            var t = this;
            this.options.beforeShowLightbox.call(this);
            var n = this.constructLightbox();
            if (!n) return;
            var r = n.find(".nivo-lightbox-content");
            if (!r) return;
            var i = this.$el;
            e("body").addClass("nivo-lightbox-body-effect-" + this.options.effect);
            this.processContent(r, i);
            if (this.$el.attr("data-lightbox-gallery")) {
                var t = this,
                    s = e('[data-lightbox-gallery="' + this.$el.attr("data-lightbox-gallery") + '"]');
                e(".nivo-lightbox-nav").show();
                e(".nivo-lightbox-prev").off("click").on("click", function(n) {
                    n.preventDefault();
                    var o = s.index(i);
                    i = s.eq(o - 1);
                    if (!e(i).length) i = s.last();
                    t.processContent(r, i);
                    t.options.onPrev.call(this, [i])
                });
                e(".nivo-lightbox-next").off("click").on("click",
                    function(n) {
                        n.preventDefault();
                        var o = s.index(i);
                        i = s.eq(o + 1);
                        if (!e(i).length) i = s.first();
                        t.processContent(r, i);
                        t.options.onNext.call(this, [i])
                    })
            }
            setTimeout(function() {
                n.addClass("nivo-lightbox-open");
                t.options.afterShowLightbox.call(this, [n])
            }, 1)
        },
        processContent: function(n, r) {
            var i = this;
            var s = r.attr("href");
            n.html("").addClass("nivo-lightbox-loading");
            if (this.isHidpi() && r.attr("data-lightbox-hidpi")) s = r.attr("data-lightbox-hidpi");
            if (s.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                var o = e("<img>", {
                    src: s
                });
                o.one("load", function() {
                    var r = e('<div class="nivo-lightbox-image" />');
                    r.append(o);
                    n.html(r).removeClass("nivo-lightbox-loading");
                    r.css({
                        "line-height": e(".nivo-lightbox-content").height() + "px",
                        height: e(".nivo-lightbox-content").height() + "px"
                    });
                    e(t).resize(function() {
                        r.css({
                            "line-height": e(".nivo-lightbox-content").height() + "px",
                            height: e(".nivo-lightbox-content").height() + "px"
                        })
                    })
                }).each(function() {
                    if (this.complete) e(this).load()
                });
                o.error(function() {
                    var t = e('<div class="nivo-lightbox-error"><p>' +
                        i.options.errorMessage + "</p></div>");
                    n.html(t).removeClass("nivo-lightbox-loading")
                })
            } else if (video = s.match(/(youtube|youtu|vimeo)\.(com|be)\/(watch\?v=(\w+)|(\w+))/)) {
                var u = "",
                    a = "nivo-lightbox-video";
                if (video[1] == "youtube") {
                    u = "http://www.youtube.com/v/" + video[4];
                    a = "nivo-lightbox-youtube"
                }
                if (video[1] == "youtu") {
                    u = "http://www.youtube.com/v/" + video[3];
                    a = "nivo-lightbox-youtube"
                }
                if (video[1] == "vimeo") {
                    u = "http://player.vimeo.com/video/" + video[3];
                    a = "nivo-lightbox-vimeo"
                }
                if (u) {
                    var f = e("<iframe>", {
                        src: u,
                        "class": a,
                        frameborder: 0,
                        vspace: 0,
                        hspace: 0,
                        scrolling: "auto"
                    });
                    n.html(f);
                    f.load(function() {
                        n.removeClass("nivo-lightbox-loading")
                    })
                }
            } else if (r.attr("data-lightbox-type") == "ajax") {
                var i = this;
                e.ajax({
                    url: s,
                    cache: false,
                    success: function(r) {
                        var i = e('<div class="nivo-lightbox-ajax" />');
                        i.append(r);
                        n.html(i).removeClass("nivo-lightbox-loading");
                        if (i.outerHeight() < n.height()) i.css({
                            position: "relative",
                            top: "50%",
                            "margin-top": -(i.outerHeight() / 2) + "px"
                        });
                        e(t).resize(function() {
                            if (i.outerHeight() < n.height()) i.css({
                                position: "relative",
                                top: "50%",
                                "margin-top": -(i.outerHeight() / 2) + "px"
                            })
                        })
                    },
                    error: function() {
                        var t = e('<div class="nivo-lightbox-error"><p>' + i.options.errorMessage + "</p></div>");
                        n.html(t).removeClass("nivo-lightbox-loading")
                    }
                })
            } else if (s.substring(0, 1) == "#")
                if (e(s).length) {
                    var l = e('<div class="nivo-lightbox-inline" />');
                    l.append(e(s).clone().show());
                    n.html(l).removeClass("nivo-lightbox-loading");
                    if (l.outerHeight() < n.height()) l.css({
                        position: "relative",
                        top: "50%",
                        "margin-top": -(l.outerHeight() / 2) + "px"
                    });
                    e(t).resize(function() {
                        if (l.outerHeight() <
                            n.height()) l.css({
                            position: "relative",
                            top: "50%",
                            "margin-top": -(l.outerHeight() / 2) + "px"
                        })
                    })
                } else {
                    var l = e('<div class="nivo-lightbox-error"><p>' + i.options.errorMessage + "</p></div>");
                    n.html(l).removeClass("nivo-lightbox-loading")
                }
            else {
                var f = e("<iframe>", {
                    src: s,
                    "class": "nivo-lightbox-item",
                    frameborder: 0,
                    vspace: 0,
                    hspace: 0,
                    scrolling: "auto"
                });
                n.html(f);
                f.load(function() {
                    n.removeClass("nivo-lightbox-loading")
                })
            }
            if (r.attr("title")) {
                var c = e("<span>", {
                    "class": "nivo-lightbox-title"
                });
                c.text(r.attr("title"));
                e(".nivo-lightbox-title-wrap").html(c)
            } else e(".nivo-lightbox-title-wrap").html("")
        },
        constructLightbox: function() {
            if (e(".nivo-lightbox-overlay").length) return e(".nivo-lightbox-overlay");
            var t = e("<div>", {
                "class": "nivo-lightbox-overlay nivo-lightbox-theme-" + this.options.theme + " nivo-lightbox-effect-" + this.options.effect
            });
            var n = e("<div>", {
                "class": "nivo-lightbox-wrap"
            });
            var r = e("<div>", {
                "class": "nivo-lightbox-content"
            });
            var i = e('<a href="#" class="nivo-lightbox-nav nivo-lightbox-prev">Previous</a><a href="#" class="nivo-lightbox-nav nivo-lightbox-next">Next</a>');
            var s = e('<a href="#" class="nivo-lightbox-close" title="Close">Close</a>');
            var o = e("<div>", {
                "class": "nivo-lightbox-title-wrap"
            });
            var u = 0;
            if (u) t.addClass("nivo-lightbox-ie");
            n.append(r);
            n.append(o);
            t.append(n);
            t.append(i);
            t.append(s);
            e("body").append(t);
            var a = this;
            t.on("click", function(t) {
                if (t.target === this || (e(t.target).hasClass("nivo-lightbox-content") || e(t.target).hasClass("nivo-lightbox-image"))) a.destructLightbox()
            });
            s.on("click", function(e) {
                e.preventDefault();
                a.destructLightbox()
            });
            return t
        },
        destructLightbox: function() {
            var t = this;
            this.options.beforeHideLightbox.call(this);
            e(".nivo-lightbox-overlay").removeClass("nivo-lightbox-open");
            e(".nivo-lightbox-nav").hide();
            e("body").removeClass("nivo-lightbox-body-effect-" + t.options.effect);
            var n = 0;
            if (n) {
                e(".nivo-lightbox-overlay iframe").attr("src", " ");
                e(".nivo-lightbox-overlay iframe").remove()
            }
            e(".nivo-lightbox-prev").off("click");
            e(".nivo-lightbox-next").off("click");
            this.options.afterHideLightbox.call(this)
        },
        isHidpi: function() {
            var e = "(-webkit-min-device-pixel-ratio: 1.5),\t\t\t\t\t\t\t  (min--moz-device-pixel-ratio: 1.5),\t\t\t\t\t\t\t  (-o-min-device-pixel-ratio: 3/2),\t\t\t\t\t\t\t  (min-resolution: 1.5dppx)";
            if (t.devicePixelRatio > 1) return true;
            if (t.matchMedia && t.matchMedia(e).matches) return true;
            return false
        }
    };
    e.fn[i] = function(t) {
        return this.each(function() {
            if (!e.data(this, i)) e.data(this, i, new o(this, t))
        })
    }
})(jQuery, window, document);
var Swiper = function(selector, params) {
    if (document.body.__defineGetter__)
        if (HTMLElement) {
            var element = HTMLElement.prototype;
            if (element.__defineGetter__) element.__defineGetter__("outerHTML", function() {
                return (new XMLSerializer).serializeToString(this)
            })
        }
    if (!window.getComputedStyle) window.getComputedStyle = function(el, pseudo) {
        this.el = el;
        this.getPropertyValue = function(prop) {
            var re = /(\-([a-z]){1})/g;
            if (prop === "float") prop = "styleFloat";
            if (re.test(prop)) prop = prop.replace(re, function() {
                return arguments[2].toUpperCase()
            });
            return el.currentStyle[prop] ? el.currentStyle[prop] : null
        };
        return this
    };
    if (!Array.prototype.indexOf) Array.prototype.indexOf = function(obj, start) {
        for (var i = start || 0, j = this.length; i < j; i++)
            if (this[i] === obj) return i;
        return -1
    };
    if (!document.querySelectorAll)
        if (!window.jQuery) return;

    function $$(selector, context) {
        if (document.querySelectorAll) return (context || document).querySelectorAll(selector);
        else return jQuery(selector, context)
    }
    if (typeof selector === "undefined") return;
    if (!selector.nodeType)
        if ($$(selector).length ===
            0) return;
    var _this = this;
    _this.touches = {
        start: 0,
        startX: 0,
        startY: 0,
        current: 0,
        currentX: 0,
        currentY: 0,
        diff: 0,
        abs: 0
    };
    _this.positions = {
        start: 0,
        abs: 0,
        diff: 0,
        current: 0
    };
    _this.times = {
        start: 0,
        end: 0
    };
    _this.id = (new Date).getTime();
    _this.container = selector.nodeType ? selector : $$(selector)[0];
    _this.isTouched = false;
    _this.isMoved = false;
    _this.activeIndex = 0;
    _this.centerIndex = 0;
    _this.activeLoaderIndex = 0;
    _this.activeLoopIndex = 0;
    _this.previousIndex = null;
    _this.velocity = 0;
    _this.snapGrid = [];
    _this.slidesGrid = [];
    _this.imagesToLoad = [];
    _this.imagesLoaded = 0;
    _this.wrapperLeft = 0;
    _this.wrapperRight = 0;
    _this.wrapperTop = 0;
    _this.wrapperBottom = 0;
    _this.isAndroid = navigator.userAgent.toLowerCase().indexOf("android") >= 0;
    var wrapper, slideSize, wrapperSize, direction, isScrolling, containerSize;
    var defaults = {
        eventTarget: "wrapper",
        mode: "horizontal",
        touchRatio: 1,
        speed: 300,
        freeMode: false,
        freeModeFluid: false,
        momentumRatio: 1,
        momentumBounce: true,
        momentumBounceRatio: 1,
        slidesPerView: 1,
        slidesPerGroup: 1,
        simulateTouch: true,
        followFinger: true,
        shortSwipes: true,
        longSwipesRatio: 0.5,
        moveStartThreshold: false,
        onlyExternal: false,
        createPagination: true,
        pagination: false,
        paginationElement: "span",
        paginationClickable: false,
        paginationAsRange: true,
        resistance: true,
        scrollContainer: false,
        preventLinks: true,
        preventLinksPropagation: false,
        noSwiping: false,
        noSwipingClass: "swiper-no-swiping",
        initialSlide: 0,
        keyboardControl: false,
        mousewheelControl: false,
        mousewheelControlForceToAxis: false,
        useCSS3Transforms: true,
        autoplay: false,
        autoplayDisableOnInteraction: true,
        autoplayStopOnLast: false,
        loop: false,
        loopAdditionalSlides: 0,
        calculateHeight: false,
        cssWidthAndHeight: false,
        updateOnImagesReady: true,
        releaseFormElements: true,
        watchActiveIndex: false,
        visibilityFullFit: false,
        offsetPxBefore: 0,
        offsetPxAfter: 0,
        offsetSlidesBefore: 0,
        offsetSlidesAfter: 0,
        centeredSlides: false,
        queueStartCallbacks: false,
        queueEndCallbacks: false,
        autoResize: true,
        resizeReInit: false,
        DOMAnimation: true,
        loader: {
            slides: [],
            slidesHTMLType: "inner",
            surroundGroups: 1,
            logic: "reload",
            loadAllSlides: false
        },
        slideElement: "div",
        slideClass: "swiper-slide",
        slideActiveClass: "swiper-slide-active",
        slideVisibleClass: "swiper-slide-visible",
        slideDuplicateClass: "swiper-slide-duplicate",
        wrapperClass: "swiper-wrapper",
        paginationElementClass: "swiper-pagination-switch",
        paginationActiveClass: "swiper-active-switch",
        paginationVisibleClass: "swiper-visible-switch"
    };
    params = params || {};
    for (var prop in defaults)
        if (prop in params && typeof params[prop] === "object")
            for (var subProp in defaults[prop]) {
                if (!(subProp in params[prop])) params[prop][subProp] = defaults[prop][subProp]
            } else if (!(prop in
                    params)) params[prop] = defaults[prop];
    _this.params = params;
    if (params.scrollContainer) {
        params.freeMode = true;
        params.freeModeFluid = true
    }
    if (params.loop) params.resistance = "100%";
    var isH = params.mode === "horizontal";
    var desktopEvents = ["mousedown", "mousemove", "mouseup"];
    if (_this.browser.ie10) desktopEvents = ["MSPointerDown", "MSPointerMove", "MSPointerUp"];
    if (_this.browser.ie11) desktopEvents = ["pointerdown", "pointermove", "pointerup"];
    _this.touchEvents = {
        touchStart: _this.support.touch || !params.simulateTouch ? "touchstart" : desktopEvents[0],
        touchMove: _this.support.touch || !params.simulateTouch ? "touchmove" : desktopEvents[1],
        touchEnd: _this.support.touch || !params.simulateTouch ? "touchend" : desktopEvents[2]
    };
    for (var i = _this.container.childNodes.length - 1; i >= 0; i--)
        if (_this.container.childNodes[i].className) {
            var _wrapperClasses = _this.container.childNodes[i].className.split(/\s+/);
            for (var j = 0; j < _wrapperClasses.length; j++)
                if (_wrapperClasses[j] === params.wrapperClass) wrapper = _this.container.childNodes[i]
        }
    _this.wrapper = wrapper;
    _this._extendSwiperSlide =
        function(el) {
            el.append = function() {
                if (params.loop) el.insertAfter(_this.slides.length - _this.loopedSlides);
                else {
                    _this.wrapper.appendChild(el);
                    _this.reInit()
                }
                return el
            };
            el.prepend = function() {
                if (params.loop) {
                    _this.wrapper.insertBefore(el, _this.slides[_this.loopedSlides]);
                    _this.removeLoopedSlides();
                    _this.calcSlides();
                    _this.createLoop()
                } else _this.wrapper.insertBefore(el, _this.wrapper.firstChild);
                _this.reInit();
                return el
            };
            el.insertAfter = function(index) {
                if (typeof index === "undefined") return false;
                var beforeSlide;
                if (params.loop) {
                    beforeSlide = _this.slides[index + 1 + _this.loopedSlides];
                    if (beforeSlide) _this.wrapper.insertBefore(el, beforeSlide);
                    else _this.wrapper.appendChild(el);
                    _this.removeLoopedSlides();
                    _this.calcSlides();
                    _this.createLoop()
                } else {
                    beforeSlide = _this.slides[index + 1];
                    _this.wrapper.insertBefore(el, beforeSlide)
                }
                _this.reInit();
                return el
            };
            el.clone = function() {
                return _this._extendSwiperSlide(el.cloneNode(true))
            };
            el.remove = function() {
                _this.wrapper.removeChild(el);
                _this.reInit()
            };
            el.html = function(html) {
                if (typeof html ===
                    "undefined") return el.innerHTML;
                else {
                    el.innerHTML = html;
                    return el
                }
            };
            el.index = function() {
                var index;
                for (var i = _this.slides.length - 1; i >= 0; i--)
                    if (el === _this.slides[i]) index = i;
                return index
            };
            el.isActive = function() {
                if (el.index() === _this.activeIndex) return true;
                else return false
            };
            if (!el.swiperSlideDataStorage) el.swiperSlideDataStorage = {};
            el.getData = function(name) {
                return el.swiperSlideDataStorage[name]
            };
            el.setData = function(name, value) {
                el.swiperSlideDataStorage[name] = value;
                return el
            };
            el.data = function(name, value) {
                if (typeof value ===
                    "undefined") return el.getAttribute("data-" + name);
                else {
                    el.setAttribute("data-" + name, value);
                    return el
                }
            };
            el.getWidth = function(outer) {
                return _this.h.getWidth(el, outer)
            };
            el.getHeight = function(outer) {
                return _this.h.getHeight(el, outer)
            };
            el.getOffset = function() {
                return _this.h.getOffset(el)
            };
            return el
        };
    _this.calcSlides = function(forceCalcSlides) {
        var oldNumber = _this.slides ? _this.slides.length : false;
        _this.slides = [];
        _this.displaySlides = [];
        for (var i = 0; i < _this.wrapper.childNodes.length; i++)
            if (_this.wrapper.childNodes[i].className) {
                var _className =
                    _this.wrapper.childNodes[i].className;
                var _slideClasses = _className.split(/\s+/);
                for (var j = 0; j < _slideClasses.length; j++)
                    if (_slideClasses[j] === params.slideClass) _this.slides.push(_this.wrapper.childNodes[i])
            }
        for (i = _this.slides.length - 1; i >= 0; i--) _this._extendSwiperSlide(_this.slides[i]);
        if (oldNumber === false) return;
        if (oldNumber !== _this.slides.length || forceCalcSlides) {
            removeSlideEvents();
            addSlideEvents();
            _this.updateActiveSlide();
            if (_this.params.pagination) _this.createPagination();
            _this.callPlugins("numberOfSlidesChanged")
        }
    };
    _this.createSlide = function(html, slideClassList, el) {
        slideClassList = slideClassList || _this.params.slideClass;
        el = el || params.slideElement;
        var newSlide = document.createElement(el);
        newSlide.innerHTML = html || "";
        newSlide.className = slideClassList;
        return _this._extendSwiperSlide(newSlide)
    };
    _this.appendSlide = function(html, slideClassList, el) {
        if (!html) return;
        if (html.nodeType) return _this._extendSwiperSlide(html).append();
        else return _this.createSlide(html, slideClassList, el).append()
    };
    _this.prependSlide = function(html,
        slideClassList, el) {
        if (!html) return;
        if (html.nodeType) return _this._extendSwiperSlide(html).prepend();
        else return _this.createSlide(html, slideClassList, el).prepend()
    };
    _this.insertSlideAfter = function(index, html, slideClassList, el) {
        if (typeof index === "undefined") return false;
        if (html.nodeType) return _this._extendSwiperSlide(html).insertAfter(index);
        else return _this.createSlide(html, slideClassList, el).insertAfter(index)
    };
    _this.removeSlide = function(index) {
        if (_this.slides[index]) {
            if (params.loop) {
                if (!_this.slides[index +
                        _this.loopedSlides]) return false;
                _this.slides[index + _this.loopedSlides].remove();
                _this.removeLoopedSlides();
                _this.calcSlides();
                _this.createLoop()
            } else _this.slides[index].remove();
            return true
        } else return false
    };
    _this.removeLastSlide = function() {
        if (_this.slides.length > 0) {
            if (params.loop) {
                _this.slides[_this.slides.length - 1 - _this.loopedSlides].remove();
                _this.removeLoopedSlides();
                _this.calcSlides();
                _this.createLoop()
            } else _this.slides[_this.slides.length - 1].remove();
            return true
        } else return false
    };
    _this.removeAllSlides =
        function() {
            for (var i = _this.slides.length - 1; i >= 0; i--) _this.slides[i].remove()
        };
    _this.getSlide = function(index) {
        return _this.slides[index]
    };
    _this.getLastSlide = function() {
        return _this.slides[_this.slides.length - 1]
    };
    _this.getFirstSlide = function() {
        return _this.slides[0]
    };
    _this.activeSlide = function() {
        return _this.slides[_this.activeIndex]
    };
    _this.fireCallback = function() {
        var callback = arguments[0];
        if (Object.prototype.toString.call(callback) === "[object Array]")
            for (var i = 0; i < callback.length; i++) {
                if (typeof callback[i] ===
                    "function") callback[i](arguments[1], arguments[2], arguments[3], arguments[4], arguments[5])
            } else if (Object.prototype.toString.call(callback) === "[object String]") {
                if (params["on" + callback]) _this.fireCallback(params["on" + callback])
            } else callback(arguments[1], arguments[2], arguments[3], arguments[4], arguments[5])
    };

    function isArray(obj) {
        if (Object.prototype.toString.apply(obj) === "[object Array]") return true;
        return false
    }
    _this.addCallback = function(callback, func) {
        var _this = this,
            tempFunc;
        if (_this.params["on" + callback])
            if (isArray(this.params["on" +
                    callback])) return this.params["on" + callback].push(func);
            else {
                if (typeof this.params["on" + callback] === "function") {
                    tempFunc = this.params["on" + callback];
                    this.params["on" + callback] = [];
                    this.params["on" + callback].push(tempFunc);
                    return this.params["on" + callback].push(func)
                }
            }
        else {
            this.params["on" + callback] = [];
            return this.params["on" + callback].push(func)
        }
    };
    _this.removeCallbacks = function(callback) {
        if (_this.params["on" + callback]) _this.params["on" + callback] = null
    };
    var _plugins = [];
    for (var plugin in _this.plugins)
        if (params[plugin]) {
            var p =
                _this.plugins[plugin](_this, params[plugin]);
            if (p) _plugins.push(p)
        }
    _this.callPlugins = function(method, args) {
        if (!args) args = {};
        for (var i = 0; i < _plugins.length; i++)
            if (method in _plugins[i]) _plugins[i][method](args)
    };
    if ((_this.browser.ie10 || _this.browser.ie11) && !params.onlyExternal) _this.wrapper.classList.add("swiper-wp8-" + (isH ? "horizontal" : "vertical"));
    if (params.freeMode) _this.container.className += " swiper-free-mode";
    _this.initialized = false;
    _this.init = function(force, forceCalcSlides) {
        var _width = _this.h.getWidth(_this.container);
        var _height = _this.h.getHeight(_this.container);
        if (_width === _this.width && (_height === _this.height && !force)) return;
        _this.width = _width;
        _this.height = _height;
        var slideWidth, slideHeight, slideMaxHeight, wrapperWidth, wrapperHeight, slideLeft;
        var i;
        containerSize = isH ? _width : _height;
        var wrapper = _this.wrapper;
        if (force) _this.calcSlides(forceCalcSlides);
        if (params.slidesPerView === "auto") {
            var slidesWidth = 0;
            var slidesHeight = 0;
            if (params.slidesOffset > 0) {
                wrapper.style.paddingLeft = "";
                wrapper.style.paddingRight = "";
                wrapper.style.paddingTop =
                    "";
                wrapper.style.paddingBottom = ""
            }
            wrapper.style.width = "";
            wrapper.style.height = "";
            if (params.offsetPxBefore > 0)
                if (isH) _this.wrapperLeft = params.offsetPxBefore;
                else _this.wrapperTop = params.offsetPxBefore;
            if (params.offsetPxAfter > 0)
                if (isH) _this.wrapperRight = params.offsetPxAfter;
                else _this.wrapperBottom = params.offsetPxAfter;
            if (params.centeredSlides)
                if (isH) {
                    _this.wrapperLeft = (containerSize - this.slides[0].getWidth(true)) / 2;
                    _this.wrapperRight = (containerSize - _this.slides[_this.slides.length - 1].getWidth(true)) /
                        2
                } else {
                    _this.wrapperTop = (containerSize - _this.slides[0].getHeight(true)) / 2;
                    _this.wrapperBottom = (containerSize - _this.slides[_this.slides.length - 1].getHeight(true)) / 2
                }
            if (isH) {
                if (_this.wrapperLeft >= 0) wrapper.style.paddingLeft = _this.wrapperLeft + "px";
                if (_this.wrapperRight >= 0) wrapper.style.paddingRight = _this.wrapperRight + "px"
            } else {
                if (_this.wrapperTop >= 0) wrapper.style.paddingTop = _this.wrapperTop + "px";
                if (_this.wrapperBottom >= 0) wrapper.style.paddingBottom = _this.wrapperBottom + "px"
            }
            slideLeft = 0;
            var centeredSlideLeft =
                0;
            _this.snapGrid = [];
            _this.slidesGrid = [];
            slideMaxHeight = 0;
            for (i = 0; i < _this.slides.length; i++) {
                slideWidth = _this.slides[i].getWidth(true);
                slideHeight = _this.slides[i].getHeight(true);
                if (params.calculateHeight) slideMaxHeight = Math.max(slideMaxHeight, slideHeight);
                var _slideSize = isH ? slideWidth : slideHeight;
                if (params.centeredSlides) {
                    var nextSlideWidth = i === _this.slides.length - 1 ? 0 : _this.slides[i + 1].getWidth(true);
                    var nextSlideHeight = i === _this.slides.length - 1 ? 0 : _this.slides[i + 1].getHeight(true);
                    var nextSlideSize =
                        isH ? nextSlideWidth : nextSlideHeight;
                    if (_slideSize > containerSize) {
                        for (var j = 0; j <= Math.floor(_slideSize / (containerSize + _this.wrapperLeft)); j++)
                            if (j === 0) _this.snapGrid.push(slideLeft + _this.wrapperLeft);
                            else _this.snapGrid.push(slideLeft + _this.wrapperLeft + containerSize * j);
                        _this.slidesGrid.push(slideLeft + _this.wrapperLeft)
                    } else {
                        _this.snapGrid.push(centeredSlideLeft);
                        _this.slidesGrid.push(centeredSlideLeft)
                    }
                    centeredSlideLeft += _slideSize / 2 + nextSlideSize / 2
                } else {
                    if (_slideSize > containerSize)
                        for (var k = 0; k <= Math.floor(_slideSize /
                                containerSize); k++) _this.snapGrid.push(slideLeft + containerSize * k);
                    else _this.snapGrid.push(slideLeft);
                    _this.slidesGrid.push(slideLeft)
                }
                slideLeft += _slideSize;
                slidesWidth += slideWidth;
                slidesHeight += slideHeight
            }
            if (params.calculateHeight) _this.height = slideMaxHeight;
            if (isH) {
                wrapperSize = slidesWidth + _this.wrapperRight + _this.wrapperLeft;
                wrapper.style.width = slidesWidth + "px";
                wrapper.style.height = _this.height + "px"
            } else {
                wrapperSize = slidesHeight + _this.wrapperTop + _this.wrapperBottom;
                wrapper.style.width = _this.width +
                    "px";
                wrapper.style.height = slidesHeight + "px"
            }
        } else if (params.scrollContainer) {
            wrapper.style.width = "";
            wrapper.style.height = "";
            wrapperWidth = _this.slides[0].getWidth(true);
            wrapperHeight = _this.slides[0].getHeight(true);
            wrapperSize = isH ? wrapperWidth : wrapperHeight;
            wrapper.style.width = wrapperWidth + "px";
            wrapper.style.height = wrapperHeight + "px";
            slideSize = isH ? wrapperWidth : wrapperHeight
        } else {
            if (params.calculateHeight) {
                slideMaxHeight = 0;
                wrapperHeight = 0;
                if (!isH) _this.container.style.height = "";
                wrapper.style.height =
                    "";
                for (i = 0; i < _this.slides.length; i++) {
                    _this.slides[i].style.height = "";
                    slideMaxHeight = Math.max(_this.slides[i].getHeight(true), slideMaxHeight);
                    if (!isH) wrapperHeight += _this.slides[i].getHeight(true)
                }
                slideHeight = slideMaxHeight;
                _this.height = slideHeight;
                if (isH) wrapperHeight = slideHeight;
                else {
                    containerSize = slideHeight;
                    _this.container.style.height = containerSize + "px"
                }
            } else {
                slideHeight = isH ? _this.height : _this.height / params.slidesPerView;
                wrapperHeight = isH ? _this.height : _this.slides.length * slideHeight
            }
            slideWidth =
                isH ? _this.width / params.slidesPerView : _this.width;
            wrapperWidth = isH ? _this.slides.length * slideWidth : _this.width;
            slideSize = isH ? slideWidth : slideHeight;
            if (params.offsetSlidesBefore > 0)
                if (isH) _this.wrapperLeft = slideSize * params.offsetSlidesBefore;
                else _this.wrapperTop = slideSize * params.offsetSlidesBefore;
            if (params.offsetSlidesAfter > 0)
                if (isH) _this.wrapperRight = slideSize * params.offsetSlidesAfter;
                else _this.wrapperBottom = slideSize * params.offsetSlidesAfter;
            if (params.offsetPxBefore > 0)
                if (isH) _this.wrapperLeft = params.offsetPxBefore;
                else _this.wrapperTop = params.offsetPxBefore;
            if (params.offsetPxAfter > 0)
                if (isH) _this.wrapperRight = params.offsetPxAfter;
                else _this.wrapperBottom = params.offsetPxAfter;
            if (params.centeredSlides)
                if (isH) {
                    _this.wrapperLeft = (containerSize - slideSize) / 2;
                    _this.wrapperRight = (containerSize - slideSize) / 2
                } else {
                    _this.wrapperTop = (containerSize - slideSize) / 2;
                    _this.wrapperBottom = (containerSize - slideSize) / 2
                }
            if (isH) {
                if (_this.wrapperLeft > 0) wrapper.style.paddingLeft = _this.wrapperLeft + "px";
                if (_this.wrapperRight > 0) wrapper.style.paddingRight =
                    _this.wrapperRight + "px"
            } else {
                if (_this.wrapperTop > 0) wrapper.style.paddingTop = _this.wrapperTop + "px";
                if (_this.wrapperBottom > 0) wrapper.style.paddingBottom = _this.wrapperBottom + "px"
            }
            wrapperSize = isH ? wrapperWidth + _this.wrapperRight + _this.wrapperLeft : wrapperHeight + _this.wrapperTop + _this.wrapperBottom;
            if (!params.cssWidthAndHeight) {
                if (parseFloat(wrapperWidth) > 0) wrapper.style.width = wrapperWidth + "px";
                if (parseFloat(wrapperHeight) > 0) wrapper.style.height = wrapperHeight + "px"
            }
            slideLeft = 0;
            _this.snapGrid = [];
            _this.slidesGrid = [];
            for (i = 0; i < _this.slides.length; i++) {
                _this.snapGrid.push(slideLeft);
                _this.slidesGrid.push(slideLeft);
                slideLeft += slideSize;
                if (!params.cssWidthAndHeight) {
                    if (parseFloat(slideWidth) > 0) _this.slides[i].style.width = slideWidth + "px";
                    if (parseFloat(slideHeight) > 0) _this.slides[i].style.height = slideHeight + "px"
                }
            }
        }
        if (!_this.initialized) {
            _this.callPlugins("onFirstInit");
            if (params.onFirstInit) _this.fireCallback(params.onFirstInit, _this)
        } else {
            _this.callPlugins("onInit");
            if (params.onInit) _this.fireCallback(params.onInit,
                _this)
        }
        _this.initialized = true
    };
    _this.reInit = function(forceCalcSlides) {
        _this.init(true, forceCalcSlides)
    };
    _this.resizeFix = function(reInit) {
        _this.callPlugins("beforeResizeFix");
        _this.init(params.resizeReInit || reInit);
        if (!params.freeMode) {
            _this.swipeTo(params.loop ? _this.activeLoopIndex : _this.activeIndex, 0, false);
            if (params.autoplay)
                if (_this.support.transitions && typeof autoplayTimeoutId !== "undefined") {
                    if (typeof autoplayTimeoutId !== "undefined") {
                        clearTimeout(autoplayTimeoutId);
                        autoplayTimeoutId = undefined;
                        _this.startAutoplay()
                    }
                } else if (typeof autoplayIntervalId !== "undefined") {
                clearInterval(autoplayIntervalId);
                autoplayIntervalId = undefined;
                _this.startAutoplay()
            }
        } else if (_this.getWrapperTranslate() < -maxWrapperPosition()) {
            _this.setWrapperTransition(0);
            _this.setWrapperTranslate(-maxWrapperPosition())
        }
        _this.callPlugins("afterResizeFix")
    };

    function maxWrapperPosition() {
        var a = wrapperSize - containerSize;
        if (params.freeMode) a = wrapperSize - containerSize;
        if (params.slidesPerView > _this.slides.length) a = 0;
        if (a < 0) a = 0;
        return a
    }

    function minWrapperPosition() {
        var a = 0;
        return a
    }

    function initEvents() {
        var bind = _this.h.addEventListener;
        var eventTarget = params.eventTarget === "wrapper" ? _this.wrapper : _this.container;
        if (!(_this.browser.ie10 || _this.browser.ie11)) {
            if (_this.support.touch) {
                bind(eventTarget, "touchstart", onTouchStart);
                bind(eventTarget, "touchmove", onTouchMove);
                bind(eventTarget, "touchend", onTouchEnd)
            }
            if (params.simulateTouch) {
                bind(eventTarget, "mousedown", onTouchStart);
                bind(document, "mousemove", onTouchMove);
                bind(document,
                    "mouseup", onTouchEnd)
            }
        } else {
            bind(eventTarget, _this.touchEvents.touchStart, onTouchStart);
            bind(document, _this.touchEvents.touchMove, onTouchMove);
            bind(document, _this.touchEvents.touchEnd, onTouchEnd)
        }
        if (params.autoResize) bind(window, "resize", _this.resizeFix);
        addSlideEvents();
        _this._wheelEvent = false;
        if (params.mousewheelControl) {
            if (document.onmousewheel !== undefined) _this._wheelEvent = "mousewheel";
            try {
                new WheelEvent("wheel");
                _this._wheelEvent = "wheel"
            } catch (e) {}
            if (!_this._wheelEvent) _this._wheelEvent = "DOMMouseScroll";
            if (_this._wheelEvent) bind(_this.container, _this._wheelEvent, handleMousewheel)
        }

        function _loadImage(src) {
            var image = new Image;
            image.onload = function() {
                _this.imagesLoaded++;
                if (_this.imagesLoaded === _this.imagesToLoad.length) {
                    _this.reInit();
                    if (params.onImagesReady) _this.fireCallback(params.onImagesReady, _this)
                }
            };
            image.src = src
        }
        if (params.keyboardControl) bind(document, "keydown", handleKeyboardKeys);
        if (params.updateOnImagesReady) {
            _this.imagesToLoad = $$("img", _this.container);
            for (var i = 0; i < _this.imagesToLoad.length; i++) _loadImage(_this.imagesToLoad[i].getAttribute("src"))
        }
    }
    _this.destroy = function() {
        var unbind = _this.h.removeEventListener;
        var eventTarget = params.eventTarget === "wrapper" ? _this.wrapper : _this.container;
        if (!(_this.browser.ie10 || _this.browser.ie11)) {
            if (_this.support.touch) {
                unbind(eventTarget, "touchstart", onTouchStart);
                unbind(eventTarget, "touchmove", onTouchMove);
                unbind(eventTarget, "touchend", onTouchEnd)
            }
            if (params.simulateTouch) {
                unbind(eventTarget, "mousedown", onTouchStart);
                unbind(document, "mousemove", onTouchMove);
                unbind(document, "mouseup", onTouchEnd)
            }
        } else {
            unbind(eventTarget,
                _this.touchEvents.touchStart, onTouchStart);
            unbind(document, _this.touchEvents.touchMove, onTouchMove);
            unbind(document, _this.touchEvents.touchEnd, onTouchEnd)
        }
        if (params.autoResize) unbind(window, "resize", _this.resizeFix);
        removeSlideEvents();
        if (params.paginationClickable) removePaginationEvents();
        if (params.mousewheelControl && _this._wheelEvent) unbind(_this.container, _this._wheelEvent, handleMousewheel);
        if (params.keyboardControl) unbind(document, "keydown", handleKeyboardKeys);
        if (params.autoplay) _this.stopAutoplay();
        _this.callPlugins("onDestroy");
        _this = null
    };

    function addSlideEvents() {
        var bind = _this.h.addEventListener,
            i;
        if (params.preventLinks) {
            var links = $$("a", _this.container);
            for (i = 0; i < links.length; i++) bind(links[i], "click", preventClick)
        }
        if (params.releaseFormElements) {
            var formElements = $$("input, textarea, select", _this.container);
            for (i = 0; i < formElements.length; i++) bind(formElements[i], _this.touchEvents.touchStart, releaseForms, true)
        }
        if (params.onSlideClick)
            for (i = 0; i < _this.slides.length; i++) bind(_this.slides[i],
                "click", slideClick);
        if (params.onSlideTouch)
            for (i = 0; i < _this.slides.length; i++) bind(_this.slides[i], _this.touchEvents.touchStart, slideTouch)
    }

    function removeSlideEvents() {
        var unbind = _this.h.removeEventListener,
            i;
        if (params.onSlideClick)
            for (i = 0; i < _this.slides.length; i++) unbind(_this.slides[i], "click", slideClick);
        if (params.onSlideTouch)
            for (i = 0; i < _this.slides.length; i++) unbind(_this.slides[i], _this.touchEvents.touchStart, slideTouch);
        if (params.releaseFormElements) {
            var formElements = $$("input, textarea, select",
                _this.container);
            for (i = 0; i < formElements.length; i++) unbind(formElements[i], _this.touchEvents.touchStart, releaseForms, true)
        }
        if (params.preventLinks) {
            var links = $$("a", _this.container);
            for (i = 0; i < links.length; i++) unbind(links[i], "click", preventClick)
        }
    }

    function handleKeyboardKeys(e) {
        var kc = e.keyCode || e.charCode;
        if (e.shiftKey || (e.altKey || (e.ctrlKey || e.metaKey))) return;
        if (kc === 37 || (kc === 39 || (kc === 38 || kc === 40))) {
            var inView = false;
            var swiperOffset = _this.h.getOffset(_this.container);
            var scrollLeft = _this.h.windowScroll().left;
            var scrollTop = _this.h.windowScroll().top;
            var windowWidth = _this.h.windowWidth();
            var windowHeight = _this.h.windowHeight();
            var swiperCoord = [
                [swiperOffset.left, swiperOffset.top],
                [swiperOffset.left + _this.width, swiperOffset.top],
                [swiperOffset.left, swiperOffset.top + _this.height],
                [swiperOffset.left + _this.width, swiperOffset.top + _this.height]
            ];
            for (var i = 0; i < swiperCoord.length; i++) {
                var point = swiperCoord[i];
                if (point[0] >= scrollLeft && (point[0] <= scrollLeft + windowWidth && (point[1] >= scrollTop && point[1] <= scrollTop + windowHeight))) inView =
                    true
            }
            if (!inView) return
        }
        if (isH) {
            if (kc === 37 || kc === 39)
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;
            if (kc === 39) _this.swipeNext();
            if (kc === 37) _this.swipePrev()
        } else {
            if (kc === 38 || kc === 40)
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;
            if (kc === 40) _this.swipeNext();
            if (kc === 38) _this.swipePrev()
        }
    }
    var lastScrollTime = (new Date).getTime();

    function handleMousewheel(e) {
        var we = _this._wheelEvent;
        var delta = 0;
        if (e.detail) delta = -e.detail;
        else if (we === "mousewheel")
            if (params.mousewheelControlForceToAxis)
                if (isH)
                    if (Math.abs(e.wheelDeltaX) >
                        Math.abs(e.wheelDeltaY)) delta = e.wheelDeltaX;
                    else return;
        else if (Math.abs(e.wheelDeltaY) > Math.abs(e.wheelDeltaX)) delta = e.wheelDeltaY;
        else return;
        else delta = e.wheelDelta;
        else if (we === "DOMMouseScroll") delta = -e.detail;
        else if (we === "wheel")
            if (params.mousewheelControlForceToAxis)
                if (isH)
                    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) delta = -e.deltaX;
                    else return;
        else if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) delta = -e.deltaY;
        else return;
        else delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? -e.deltaX : -e.deltaY;
        if (!params.freeMode) {
            if ((new Date).getTime() -
                lastScrollTime > 60)
                if (delta < 0) _this.swipeNext();
                else _this.swipePrev();
            lastScrollTime = (new Date).getTime()
        } else {
            var position = _this.getWrapperTranslate() + delta;
            if (position > 0) position = 0;
            if (position < -maxWrapperPosition()) position = -maxWrapperPosition();
            _this.setWrapperTransition(0);
            _this.setWrapperTranslate(position);
            _this.updateActiveSlide(position);
            if (position === 0 || position === -maxWrapperPosition()) return
        }
        if (params.autoplay) _this.stopAutoplay(true);
        if (e.preventDefault) e.preventDefault();
        else e.returnValue =
            false;
        return false
    }
    if (params.grabCursor) {
        var containerStyle = _this.container.style;
        containerStyle.cursor = "move";
        containerStyle.cursor = "grab";
        containerStyle.cursor = "-moz-grab";
        containerStyle.cursor = "-webkit-grab"
    }
    _this.allowSlideClick = true;

    function slideClick(event) {
        if (_this.allowSlideClick) {
            setClickedSlide(event);
            _this.fireCallback(params.onSlideClick, _this, event)
        }
    }

    function slideTouch(event) {
        setClickedSlide(event);
        _this.fireCallback(params.onSlideTouch, _this, event)
    }

    function setClickedSlide(event) {
        if (!event.currentTarget) {
            var element =
                event.srcElement;
            do {
                if (element.className.indexOf(params.slideClass) > -1) break;
                element = element.parentNode
            } while (element);
            _this.clickedSlide = element
        } else _this.clickedSlide = event.currentTarget;
        _this.clickedSlideIndex = _this.slides.indexOf(_this.clickedSlide);
        _this.clickedSlideLoopIndex = _this.clickedSlideIndex - (_this.loopedSlides || 0)
    }
    _this.allowLinks = true;

    function preventClick(e) {
        if (!_this.allowLinks) {
            if (e.preventDefault) e.preventDefault();
            else e.returnValue = false;
            if (params.preventLinksPropagation && "stopPropagation" in
                e) e.stopPropagation();
            return false
        }
    }

    function releaseForms(e) {
        if (e.stopPropagation) e.stopPropagation();
        else e.returnValue = false;
        return false
    }
    var isTouchEvent = false;
    var allowThresholdMove;
    var allowMomentumBounce = true;

    function onTouchStart(event) {
        if (params.preventLinks) _this.allowLinks = true;
        if (_this.isTouched || params.onlyExternal) return false;
        if (params.noSwiping && ((event.target || event.srcElement) && noSwipingSlide(event.target || event.srcElement))) return false;
        allowMomentumBounce = false;
        _this.isTouched =
            true;
        isTouchEvent = event.type === "touchstart";
        if (!isTouchEvent || event.targetTouches.length === 1) {
            _this.callPlugins("onTouchStartBegin");
            if (!isTouchEvent && !_this.isAndroid)
                if (event.preventDefault) event.preventDefault();
                else event.returnValue = false;
            var pageX = isTouchEvent ? event.targetTouches[0].pageX : event.pageX || event.clientX;
            var pageY = isTouchEvent ? event.targetTouches[0].pageY : event.pageY || event.clientY;
            _this.touches.startX = _this.touches.currentX = pageX;
            _this.touches.startY = _this.touches.currentY = pageY;
            _this.touches.start = _this.touches.current = isH ? pageX : pageY;
            _this.setWrapperTransition(0);
            _this.positions.start = _this.positions.current = _this.getWrapperTranslate();
            _this.setWrapperTranslate(_this.positions.start);
            _this.times.start = (new Date).getTime();
            isScrolling = undefined;
            if (params.moveStartThreshold > 0) allowThresholdMove = false;
            if (params.onTouchStart) _this.fireCallback(params.onTouchStart, _this);
            _this.callPlugins("onTouchStartEnd")
        }
    }
    var velocityPrevPosition, velocityPrevTime;

    function onTouchMove(event) {
        if (!_this.isTouched ||
            params.onlyExternal) return;
        if (isTouchEvent && event.type === "mousemove") return;
        var pageX = isTouchEvent ? event.targetTouches[0].pageX : event.pageX || event.clientX;
        var pageY = isTouchEvent ? event.targetTouches[0].pageY : event.pageY || event.clientY;
        if (typeof isScrolling === "undefined" && isH) isScrolling = !!(isScrolling || Math.abs(pageY - _this.touches.startY) > Math.abs(pageX - _this.touches.startX));
        if (typeof isScrolling === "undefined" && !isH) isScrolling = !!(isScrolling || Math.abs(pageY - _this.touches.startY) < Math.abs(pageX - _this.touches.startX));
        if (isScrolling) {
            _this.isTouched = false;
            return
        }
        if (event.assignedToSwiper) {
            _this.isTouched = false;
            return
        }
        event.assignedToSwiper = true;
        if (params.preventLinks) _this.allowLinks = false;
        if (params.onSlideClick) _this.allowSlideClick = false;
        if (params.autoplay) _this.stopAutoplay(true);
        if (!isTouchEvent || event.touches.length === 1) {
            if (!_this.isMoved) {
                _this.callPlugins("onTouchMoveStart");
                if (params.loop) {
                    _this.fixLoop();
                    _this.positions.start = _this.getWrapperTranslate()
                }
                if (params.onTouchMoveStart) _this.fireCallback(params.onTouchMoveStart,
                    _this)
            }
            _this.isMoved = true;
            if (event.preventDefault) event.preventDefault();
            else event.returnValue = false;
            _this.touches.current = isH ? pageX : pageY;
            _this.positions.current = (_this.touches.current - _this.touches.start) * params.touchRatio + _this.positions.start;
            if (_this.positions.current > 0 && params.onResistanceBefore) _this.fireCallback(params.onResistanceBefore, _this, _this.positions.current);
            if (_this.positions.current < -maxWrapperPosition() && params.onResistanceAfter) _this.fireCallback(params.onResistanceAfter, _this,
                Math.abs(_this.positions.current + maxWrapperPosition()));
            if (params.resistance && params.resistance !== "100%") {
                var resistance;
                if (_this.positions.current > 0) {
                    resistance = 1 - _this.positions.current / containerSize / 2;
                    if (resistance < 0.5) _this.positions.current = containerSize / 2;
                    else _this.positions.current = _this.positions.current * resistance
                }
                if (_this.positions.current < -maxWrapperPosition()) {
                    var diff = (_this.touches.current - _this.touches.start) * params.touchRatio + (maxWrapperPosition() + _this.positions.start);
                    resistance =
                        (containerSize + diff) / containerSize;
                    var newPos = _this.positions.current - diff * (1 - resistance) / 2;
                    var stopPos = -maxWrapperPosition() - containerSize / 2;
                    if (newPos < stopPos || resistance <= 0) _this.positions.current = stopPos;
                    else _this.positions.current = newPos
                }
            }
            if (params.resistance && params.resistance === "100%") {
                if (_this.positions.current > 0 && !(params.freeMode && !params.freeModeFluid)) _this.positions.current = 0;
                if (_this.positions.current < -maxWrapperPosition() && !(params.freeMode && !params.freeModeFluid)) _this.positions.current = -maxWrapperPosition()
            }
            if (!params.followFinger) return;
            if (!params.moveStartThreshold) _this.setWrapperTranslate(_this.positions.current);
            else if (Math.abs(_this.touches.current - _this.touches.start) > params.moveStartThreshold || allowThresholdMove) {
                if (!allowThresholdMove) {
                    allowThresholdMove = true;
                    _this.touches.start = _this.touches.current;
                    return
                }
                _this.setWrapperTranslate(_this.positions.current)
            } else _this.positions.current = _this.positions.start;
            if (params.freeMode || params.watchActiveIndex) _this.updateActiveSlide(_this.positions.current);
            if (params.grabCursor) {
                _this.container.style.cursor = "move";
                _this.container.style.cursor = "grabbing";
                _this.container.style.cursor = "-moz-grabbin";
                _this.container.style.cursor = "-webkit-grabbing"
            }
            if (!velocityPrevPosition) velocityPrevPosition = _this.touches.current;
            if (!velocityPrevTime) velocityPrevTime = (new Date).getTime();
            _this.velocity = (_this.touches.current - velocityPrevPosition) / ((new Date).getTime() - velocityPrevTime) / 2;
            if (Math.abs(_this.touches.current - velocityPrevPosition) < 2) _this.velocity = 0;
            velocityPrevPosition =
                _this.touches.current;
            velocityPrevTime = (new Date).getTime();
            _this.callPlugins("onTouchMoveEnd");
            if (params.onTouchMove) _this.fireCallback(params.onTouchMove, _this);
            return false
        }
    }

    function onTouchEnd(event) {
        if (isScrolling) _this.swipeReset();
        if (params.onlyExternal || !_this.isTouched) return;
        _this.isTouched = false;
        if (params.grabCursor) {
            _this.container.style.cursor = "move";
            _this.container.style.cursor = "grab";
            _this.container.style.cursor = "-moz-grab";
            _this.container.style.cursor = "-webkit-grab"
        }
        if (!_this.positions.current &&
            _this.positions.current !== 0) _this.positions.current = _this.positions.start;
        if (params.followFinger) _this.setWrapperTranslate(_this.positions.current);
        _this.times.end = (new Date).getTime();
        _this.touches.diff = _this.touches.current - _this.touches.start;
        _this.touches.abs = Math.abs(_this.touches.diff);
        _this.positions.diff = _this.positions.current - _this.positions.start;
        _this.positions.abs = Math.abs(_this.positions.diff);
        var diff = _this.positions.diff;
        var diffAbs = _this.positions.abs;
        var timeDiff = _this.times.end -
            _this.times.start;
        if (diffAbs < 5 && (timeDiff < 300 && _this.allowLinks === false)) {
            if (!params.freeMode && diffAbs !== 0) _this.swipeReset();
            if (params.preventLinks) _this.allowLinks = true;
            if (params.onSlideClick) _this.allowSlideClick = true
        }
        setTimeout(function() {
            if (params.preventLinks) _this.allowLinks = true;
            if (params.onSlideClick) _this.allowSlideClick = true
        }, 100);
        var maxPosition = maxWrapperPosition();
        if (!_this.isMoved && params.freeMode) {
            _this.isMoved = false;
            if (params.onTouchEnd) _this.fireCallback(params.onTouchEnd, _this);
            _this.callPlugins("onTouchEnd");
            return
        }
        if (!_this.isMoved || (_this.positions.current > 0 || _this.positions.current < -maxPosition)) {
            _this.swipeReset();
            if (params.onTouchEnd) _this.fireCallback(params.onTouchEnd, _this);
            _this.callPlugins("onTouchEnd");
            return
        }
        _this.isMoved = false;
        if (params.freeMode) {
            if (params.freeModeFluid) {
                var momentumDuration = 1E3 * params.momentumRatio;
                var momentumDistance = _this.velocity * momentumDuration;
                var newPosition = _this.positions.current + momentumDistance;
                var doBounce = false;
                var afterBouncePosition;
                var bounceAmount = Math.abs(_this.velocity) * 20 * params.momentumBounceRatio;
                if (newPosition < -maxPosition)
                    if (params.momentumBounce && _this.support.transitions) {
                        if (newPosition + maxPosition < -bounceAmount) newPosition = -maxPosition - bounceAmount;
                        afterBouncePosition = -maxPosition;
                        doBounce = true;
                        allowMomentumBounce = true
                    } else newPosition = -maxPosition;
                if (newPosition > 0)
                    if (params.momentumBounce && _this.support.transitions) {
                        if (newPosition > bounceAmount) newPosition = bounceAmount;
                        afterBouncePosition = 0;
                        doBounce = true;
                        allowMomentumBounce =
                            true
                    } else newPosition = 0;
                if (_this.velocity !== 0) momentumDuration = Math.abs((newPosition - _this.positions.current) / _this.velocity);
                _this.setWrapperTranslate(newPosition);
                _this.setWrapperTransition(momentumDuration);
                if (params.momentumBounce && doBounce) _this.wrapperTransitionEnd(function() {
                    if (!allowMomentumBounce) return;
                    if (params.onMomentumBounce) _this.fireCallback(params.onMomentumBounce, _this);
                    _this.callPlugins("onMomentumBounce");
                    _this.setWrapperTranslate(afterBouncePosition);
                    _this.setWrapperTransition(300)
                });
                _this.updateActiveSlide(newPosition)
            }
            if (!params.freeModeFluid || timeDiff >= 300) _this.updateActiveSlide(_this.positions.current);
            if (params.onTouchEnd) _this.fireCallback(params.onTouchEnd, _this);
            _this.callPlugins("onTouchEnd");
            return
        }
        direction = diff < 0 ? "toNext" : "toPrev";
        if (direction === "toNext" && timeDiff <= 300)
            if (diffAbs < 30 || !params.shortSwipes) _this.swipeReset();
            else _this.swipeNext(true);
        if (direction === "toPrev" && timeDiff <= 300)
            if (diffAbs < 30 || !params.shortSwipes) _this.swipeReset();
            else _this.swipePrev(true);
        var targetSlideSize = 0;
        if (params.slidesPerView === "auto") {
            var currentPosition = Math.abs(_this.getWrapperTranslate());
            var slidesOffset = 0;
            var _slideSize;
            for (var i = 0; i < _this.slides.length; i++) {
                _slideSize = isH ? _this.slides[i].getWidth(true) : _this.slides[i].getHeight(true);
                slidesOffset += _slideSize;
                if (slidesOffset > currentPosition) {
                    targetSlideSize = _slideSize;
                    break
                }
            }
            if (targetSlideSize > containerSize) targetSlideSize = containerSize
        } else targetSlideSize = slideSize * params.slidesPerView;
        if (direction === "toNext" && timeDiff >
            300)
            if (diffAbs >= targetSlideSize * params.longSwipesRatio) _this.swipeNext(true);
            else _this.swipeReset();
        if (direction === "toPrev" && timeDiff > 300)
            if (diffAbs >= targetSlideSize * params.longSwipesRatio) _this.swipePrev(true);
            else _this.swipeReset();
        if (params.onTouchEnd) _this.fireCallback(params.onTouchEnd, _this);
        _this.callPlugins("onTouchEnd")
    }

    function noSwipingSlide(el) {
        var noSwiping = false;
        do {
            if (el.className.indexOf(params.noSwipingClass) > -1) noSwiping = true;
            el = el.parentElement
        } while (!noSwiping && (el.parentElement &&
                el.className.indexOf(params.wrapperClass) === -1));
        if (!noSwiping && (el.className.indexOf(params.wrapperClass) > -1 && el.className.indexOf(params.noSwipingClass) > -1)) noSwiping = true;
        return noSwiping
    }

    function addClassToHtmlString(klass, outerHtml) {
        var par = document.createElement("div");
        var child;
        par.innerHTML = outerHtml;
        child = par.firstChild;
        child.className += " " + klass;
        return child.outerHTML
    }
    _this.swipeNext = function(internal) {
        if (!internal && params.loop) _this.fixLoop();
        if (!internal && params.autoplay) _this.stopAutoplay(true);
        _this.callPlugins("onSwipeNext");
        var currentPosition = _this.getWrapperTranslate();
        var newPosition = currentPosition;
        if (params.slidesPerView === "auto")
            for (var i = 0; i < _this.snapGrid.length; i++) {
                if (-currentPosition >= _this.snapGrid[i] && -currentPosition < _this.snapGrid[i + 1]) {
                    newPosition = -_this.snapGrid[i + 1];
                    break
                }
            } else {
                var groupSize = slideSize * params.slidesPerGroup;
                newPosition = -(Math.floor(Math.abs(currentPosition) / Math.floor(groupSize)) * groupSize + groupSize)
            }
        if (newPosition < -maxWrapperPosition()) newPosition = -maxWrapperPosition();
        if (newPosition === currentPosition) return false;
        swipeToPosition(newPosition, "next");
        return true
    };
    _this.swipePrev = function(internal) {
        if (!internal && params.loop) _this.fixLoop();
        if (!internal && params.autoplay) _this.stopAutoplay(true);
        _this.callPlugins("onSwipePrev");
        var currentPosition = Math.ceil(_this.getWrapperTranslate());
        var newPosition;
        if (params.slidesPerView === "auto") {
            newPosition = 0;
            for (var i = 1; i < _this.snapGrid.length; i++) {
                if (-currentPosition === _this.snapGrid[i]) {
                    newPosition = -_this.snapGrid[i - 1];
                    break
                }
                if (-currentPosition >
                    _this.snapGrid[i] && -currentPosition < _this.snapGrid[i + 1]) {
                    newPosition = -_this.snapGrid[i];
                    break
                }
            }
        } else {
            var groupSize = slideSize * params.slidesPerGroup;
            newPosition = -(Math.ceil(-currentPosition / groupSize) - 1) * groupSize
        }
        if (newPosition > 0) newPosition = 0;
        if (newPosition === currentPosition) return false;
        swipeToPosition(newPosition, "prev");
        return true
    };
    _this.swipeReset = function() {
        _this.callPlugins("onSwipeReset");
        var currentPosition = _this.getWrapperTranslate();
        var groupSize = slideSize * params.slidesPerGroup;
        var newPosition;
        var maxPosition = -maxWrapperPosition();
        if (params.slidesPerView === "auto") {
            newPosition = 0;
            for (var i = 0; i < _this.snapGrid.length; i++) {
                if (-currentPosition === _this.snapGrid[i]) return;
                if (-currentPosition >= _this.snapGrid[i] && -currentPosition < _this.snapGrid[i + 1]) {
                    if (_this.positions.diff > 0) newPosition = -_this.snapGrid[i + 1];
                    else newPosition = -_this.snapGrid[i];
                    break
                }
            }
            if (-currentPosition >= _this.snapGrid[_this.snapGrid.length - 1]) newPosition = -_this.snapGrid[_this.snapGrid.length - 1];
            if (currentPosition <= -maxWrapperPosition()) newPosition = -maxWrapperPosition()
        } else newPosition = currentPosition < 0 ? Math.round(currentPosition / groupSize) * groupSize : 0;
        if (params.scrollContainer) newPosition = currentPosition < 0 ? currentPosition : 0;
        if (newPosition < -maxWrapperPosition()) newPosition = -maxWrapperPosition();
        if (params.scrollContainer && containerSize > slideSize) newPosition = 0;
        if (newPosition === currentPosition) return false;
        swipeToPosition(newPosition, "reset");
        return true
    };
    _this.swipeTo = function(index, speed, runCallbacks) {
        index = parseInt(index, 10);
        _this.callPlugins("onSwipeTo", {
            index: index,
            speed: speed
        });
        if (params.loop) index = index + _this.loopedSlides;
        var currentPosition = _this.getWrapperTranslate();
        if (index > _this.slides.length - 1 || index < 0) return;
        var newPosition;
        if (params.slidesPerView === "auto") newPosition = -_this.slidesGrid[index];
        else newPosition = -index * slideSize;
        if (newPosition < -maxWrapperPosition()) newPosition = -maxWrapperPosition();
        if (newPosition === currentPosition) return false;
        runCallbacks = runCallbacks === false ? false : true;
        swipeToPosition(newPosition, "to", {
            index: index,
            speed: speed,
            runCallbacks: runCallbacks
        });
        return true
    };

    function swipeToPosition(newPosition, action, toOptions) {
        var speed = action === "to" && toOptions.speed >= 0 ? toOptions.speed : params.speed;
        var timeOld = +new Date;

        function anim() {
            var timeNew = +new Date;
            var time = timeNew - timeOld;
            currentPosition += animationStep * time / (1E3 / 60);
            condition = direction === "toNext" ? currentPosition > newPosition : currentPosition < newPosition;
            if (condition) {
                _this.setWrapperTranslate(Math.round(currentPosition));
                _this._DOMAnimating = true;
                window.setTimeout(function() {
                        anim()
                    },
                    1E3 / 60)
            } else {
                if (params.onSlideChangeEnd) _this.fireCallback(params.onSlideChangeEnd, _this);
                _this.setWrapperTranslate(newPosition);
                _this._DOMAnimating = false
            }
        }
        if (_this.support.transitions || !params.DOMAnimation) {
            _this.setWrapperTranslate(newPosition);
            _this.setWrapperTransition(speed)
        } else {
            var currentPosition = _this.getWrapperTranslate();
            var animationStep = Math.ceil((newPosition - currentPosition) / speed * (1E3 / 60));
            var direction = currentPosition > newPosition ? "toNext" : "toPrev";
            var condition = direction === "toNext" ?
                currentPosition > newPosition : currentPosition < newPosition;
            if (_this._DOMAnimating) return;
            anim()
        }
        _this.updateActiveSlide(newPosition);
        if (params.onSlideNext && action === "next") _this.fireCallback(params.onSlideNext, _this, newPosition);
        if (params.onSlidePrev && action === "prev") _this.fireCallback(params.onSlidePrev, _this, newPosition);
        if (params.onSlideReset && action === "reset") _this.fireCallback(params.onSlideReset, _this, newPosition);
        if (action === "next" || (action === "prev" || action === "to" && toOptions.runCallbacks === true)) slideChangeCallbacks(action)
    }
    _this._queueStartCallbacks = false;
    _this._queueEndCallbacks = false;

    function slideChangeCallbacks(direction) {
        _this.callPlugins("onSlideChangeStart");
        if (params.onSlideChangeStart)
            if (params.queueStartCallbacks && _this.support.transitions) {
                if (_this._queueStartCallbacks) return;
                _this._queueStartCallbacks = true;
                _this.fireCallback(params.onSlideChangeStart, _this, direction);
                _this.wrapperTransitionEnd(function() {
                    _this._queueStartCallbacks = false
                })
            } else _this.fireCallback(params.onSlideChangeStart, _this, direction);
        if (params.onSlideChangeEnd)
            if (_this.support.transitions)
                if (params.queueEndCallbacks) {
                    if (_this._queueEndCallbacks) return;
                    _this._queueEndCallbacks = true;
                    _this.wrapperTransitionEnd(function(swiper) {
                        _this.fireCallback(params.onSlideChangeEnd, swiper, direction)
                    })
                } else _this.wrapperTransitionEnd(function(swiper) {
                    _this.fireCallback(params.onSlideChangeEnd, swiper, direction)
                });
        else if (!params.DOMAnimation) setTimeout(function() {
            _this.fireCallback(params.onSlideChangeEnd, _this, direction)
        }, 10)
    }
    _this.updateActiveSlide =
        function(position) {
            if (!_this.initialized) return;
            if (_this.slides.length === 0) return;
            _this.previousIndex = _this.activeIndex;
            if (typeof position === "undefined") position = _this.getWrapperTranslate();
            if (position > 0) position = 0;
            if (params.slidesPerView === "auto") {
                var slidesOffset = 0;
                _this.activeIndex = _this.slidesGrid.indexOf(-position);
                if (_this.activeIndex < 0) {
                    for (var i = 0; i < _this.slidesGrid.length - 1; i++)
                        if (-position > _this.slidesGrid[i] && -position < _this.slidesGrid[i + 1]) break;
                    var leftDistance = Math.abs(_this.slidesGrid[i] +
                        position);
                    var rightDistance = Math.abs(_this.slidesGrid[i + 1] + position);
                    if (leftDistance <= rightDistance) _this.activeIndex = i;
                    else _this.activeIndex = i + 1
                }
            } else _this.activeIndex = Math[params.visibilityFullFit ? "ceil" : "round"](-position / slideSize);
            if (_this.activeIndex === _this.slides.length) _this.activeIndex = _this.slides.length - 1;
            if (_this.activeIndex < 0) _this.activeIndex = 0;
            if (!_this.slides[_this.activeIndex]) return;
            _this.calcVisibleSlides(position);
            var activeClassRegexp = new RegExp("\\s*" + params.slideActiveClass);
            var inViewClassRegexp = new RegExp("\\s*" + params.slideVisibleClass);
            for (var j = 0; j < _this.slides.length; j++) {
                _this.slides[j].className = _this.slides[j].className.replace(activeClassRegexp, "").replace(inViewClassRegexp, "");
                if (_this.visibleSlides.indexOf(_this.slides[j]) >= 0) _this.slides[j].className += " " + params.slideVisibleClass
            }
            _this.slides[_this.activeIndex].className += " " + params.slideActiveClass;
            if (params.loop) {
                var ls = _this.loopedSlides;
                _this.activeLoopIndex = _this.activeIndex - ls;
                if (_this.activeLoopIndex >=
                    _this.slides.length - ls * 2) _this.activeLoopIndex = _this.slides.length - ls * 2 - _this.activeLoopIndex;
                if (_this.activeLoopIndex < 0) _this.activeLoopIndex = _this.slides.length - ls * 2 + _this.activeLoopIndex;
                if (_this.activeLoopIndex < 0) _this.activeLoopIndex = 0
            } else _this.activeLoopIndex = _this.activeIndex;
            if (params.pagination) _this.updatePagination(position)
        };
    _this.createPagination = function(firstInit) {
        if (params.paginationClickable && _this.paginationButtons) removePaginationEvents();
        _this.paginationContainer = params.pagination.nodeType ?
            params.pagination : $$(params.pagination)[0];
        if (params.createPagination) {
            var paginationHTML = "";
            var numOfSlides = _this.slides.length;
            var numOfButtons = numOfSlides;
            if (params.loop) numOfButtons -= _this.loopedSlides * 2;
            for (var i = 0; i < numOfButtons; i++) paginationHTML += "<" + params.paginationElement + ' class="' + params.paginationElementClass + '"></' + params.paginationElement + ">";
            _this.paginationContainer.innerHTML = paginationHTML
        }
        _this.paginationButtons = $$("." + params.paginationElementClass, _this.paginationContainer);
        if (!firstInit) _this.updatePagination();
        _this.callPlugins("onCreatePagination");
        if (params.paginationClickable) addPaginationEvents()
    };

    function removePaginationEvents() {
        var pagers = _this.paginationButtons;
        if (pagers)
            for (var i = 0; i < pagers.length; i++) _this.h.removeEventListener(pagers[i], "click", paginationClick)
    }

    function addPaginationEvents() {
        var pagers = _this.paginationButtons;
        if (pagers)
            for (var i = 0; i < pagers.length; i++) _this.h.addEventListener(pagers[i], "click", paginationClick)
    }

    function paginationClick(e) {
        var index;
        var target = e.target || e.srcElement;
        var pagers = _this.paginationButtons;
        for (var i = 0; i < pagers.length; i++)
            if (target === pagers[i]) index = i;
        _this.swipeTo(index)
    }
    _this.updatePagination = function(position) {
        if (!params.pagination) return;
        if (_this.slides.length < 1) return;
        var activePagers = $$("." + params.paginationActiveClass, _this.paginationContainer);
        if (!activePagers) return;
        var pagers = _this.paginationButtons;
        if (pagers.length === 0) return;
        for (var i = 0; i < pagers.length; i++) pagers[i].className = params.paginationElementClass;
        var indexOffset = params.loop ? _this.loopedSlides :
            0;
        if (params.paginationAsRange) {
            if (!_this.visibleSlides) _this.calcVisibleSlides(position);
            var visibleIndexes = [];
            var j;
            for (j = 0; j < _this.visibleSlides.length; j++) {
                var visIndex = _this.slides.indexOf(_this.visibleSlides[j]) - indexOffset;
                if (params.loop && visIndex < 0) visIndex = _this.slides.length - _this.loopedSlides * 2 + visIndex;
                if (params.loop && visIndex >= _this.slides.length - _this.loopedSlides * 2) {
                    visIndex = _this.slides.length - _this.loopedSlides * 2 - visIndex;
                    visIndex = Math.abs(visIndex)
                }
                visibleIndexes.push(visIndex)
            }
            for (j =
                0; j < visibleIndexes.length; j++)
                if (pagers[visibleIndexes[j]]) pagers[visibleIndexes[j]].className += " " + params.paginationVisibleClass;
            if (params.loop) {
                if (pagers[_this.activeLoopIndex] !== undefined) pagers[_this.activeLoopIndex].className += " " + params.paginationActiveClass
            } else pagers[_this.activeIndex].className += " " + params.paginationActiveClass
        } else if (params.loop) {
            if (pagers[_this.activeLoopIndex]) pagers[_this.activeLoopIndex].className += " " + params.paginationActiveClass + " " + params.paginationVisibleClass
        } else pagers[_this.activeIndex].className +=
            " " + params.paginationActiveClass + " " + params.paginationVisibleClass
    };
    _this.calcVisibleSlides = function(position) {
        var visibleSlides = [];
        var _slideLeft = 0,
            _slideSize = 0,
            _slideRight = 0;
        if (isH && _this.wrapperLeft > 0) position = position + _this.wrapperLeft;
        if (!isH && _this.wrapperTop > 0) position = position + _this.wrapperTop;
        for (var i = 0; i < _this.slides.length; i++) {
            _slideLeft += _slideSize;
            if (params.slidesPerView === "auto") _slideSize = isH ? _this.h.getWidth(_this.slides[i], true) : _this.h.getHeight(_this.slides[i], true);
            else _slideSize =
                slideSize;
            _slideRight = _slideLeft + _slideSize;
            var isVisibile = false;
            if (params.visibilityFullFit) {
                if (_slideLeft >= -position && _slideRight <= -position + containerSize) isVisibile = true;
                if (_slideLeft <= -position && _slideRight >= -position + containerSize) isVisibile = true
            } else {
                if (_slideRight > -position && _slideRight <= -position + containerSize) isVisibile = true;
                if (_slideLeft >= -position && _slideLeft < -position + containerSize) isVisibile = true;
                if (_slideLeft < -position && _slideRight > -position + containerSize) isVisibile = true
            }
            if (isVisibile) visibleSlides.push(_this.slides[i])
        }
        if (visibleSlides.length ===
            0) visibleSlides = [_this.slides[_this.activeIndex]];
        _this.visibleSlides = visibleSlides
    };
    var autoplayTimeoutId, autoplayIntervalId;
    _this.startAutoplay = function() {
        if (_this.support.transitions) {
            if (typeof autoplayTimeoutId !== "undefined") return false;
            if (!params.autoplay) return;
            _this.callPlugins("onAutoplayStart");
            autoplay()
        } else {
            if (typeof autoplayIntervalId !== "undefined") return false;
            if (!params.autoplay) return;
            _this.callPlugins("onAutoplayStart");
            autoplayIntervalId = setInterval(function() {
                if (params.loop) {
                    _this.fixLoop();
                    _this.swipeNext(true)
                } else if (!_this.swipeNext(true))
                    if (!params.autoplayStopOnLast) _this.swipeTo(0);
                    else {
                        clearInterval(autoplayIntervalId);
                        autoplayIntervalId = undefined
                    }
            }, params.autoplay)
        }
    };
    _this.stopAutoplay = function(internal) {
        if (_this.support.transitions) {
            if (!autoplayTimeoutId) return;
            if (autoplayTimeoutId) clearTimeout(autoplayTimeoutId);
            autoplayTimeoutId = undefined;
            if (internal && !params.autoplayDisableOnInteraction) _this.wrapperTransitionEnd(function() {
                autoplay()
            });
            _this.callPlugins("onAutoplayStop")
        } else {
            if (autoplayIntervalId) clearInterval(autoplayIntervalId);
            autoplayIntervalId = undefined;
            _this.callPlugins("onAutoplayStop")
        }
    };

    function autoplay() {
        autoplayTimeoutId = setTimeout(function() {
            if (params.loop) {
                _this.fixLoop();
                _this.swipeNext(true)
            } else if (!_this.swipeNext(true))
                if (!params.autoplayStopOnLast) _this.swipeTo(0);
                else {
                    clearTimeout(autoplayTimeoutId);
                    autoplayTimeoutId = undefined
                }
            _this.wrapperTransitionEnd(function() {
                if (typeof autoplayTimeoutId !== "undefined") autoplay()
            })
        }, params.autoplay)
    }
    _this.loopCreated = false;
    _this.removeLoopedSlides = function() {
        if (_this.loopCreated)
            for (var i =
                    0; i < _this.slides.length; i++)
                if (_this.slides[i].getData("looped") === true) _this.wrapper.removeChild(_this.slides[i])
    };
    _this.createLoop = function() {
        if (_this.slides.length === 0) return;
        if (params.slidesPerView === "auto") _this.loopedSlides = params.loopedSlides || 1;
        else _this.loopedSlides = params.slidesPerView + params.loopAdditionalSlides;
        if (_this.loopedSlides > _this.slides.length) _this.loopedSlides = _this.slides.length;
        var slideFirstHTML = "",
            slideLastHTML = "",
            i;
        var slidesSetFullHTML = "";
        var numSlides = _this.slides.length;
        var fullSlideSets = Math.floor(_this.loopedSlides / numSlides);
        var remainderSlides = _this.loopedSlides % numSlides;
        for (i = 0; i < fullSlideSets * numSlides; i++) {
            var j = i;
            if (i >= numSlides) {
                var over = Math.floor(i / numSlides);
                j = i - numSlides * over
            }
            slidesSetFullHTML += _this.slides[j].outerHTML
        }
        for (i = 0; i < remainderSlides; i++) slideLastHTML += addClassToHtmlString(params.slideDuplicateClass, _this.slides[i].outerHTML);
        for (i = numSlides - remainderSlides; i < numSlides; i++) slideFirstHTML += addClassToHtmlString(params.slideDuplicateClass,
            _this.slides[i].outerHTML);
        var slides = slideFirstHTML + slidesSetFullHTML + wrapper.innerHTML + slidesSetFullHTML + slideLastHTML;
        wrapper.innerHTML = slides;
        _this.loopCreated = true;
        _this.calcSlides();
        for (i = 0; i < _this.slides.length; i++)
            if (i < _this.loopedSlides || i >= _this.slides.length - _this.loopedSlides) _this.slides[i].setData("looped", true);
        _this.callPlugins("onCreateLoop")
    };
    _this.fixLoop = function() {
        var newIndex;
        if (_this.activeIndex < _this.loopedSlides) {
            newIndex = _this.slides.length - _this.loopedSlides * 3 + _this.activeIndex;
            _this.swipeTo(newIndex, 0, false)
        } else if (params.slidesPerView === "auto" && _this.activeIndex >= _this.loopedSlides * 2 || _this.activeIndex > _this.slides.length - params.slidesPerView * 2) {
            newIndex = -_this.slides.length + _this.activeIndex + _this.loopedSlides;
            _this.swipeTo(newIndex, 0, false)
        }
    };
    _this.loadSlides = function() {
        var slidesHTML = "";
        _this.activeLoaderIndex = 0;
        var slides = params.loader.slides;
        var slidesToLoad = params.loader.loadAllSlides ? slides.length : params.slidesPerView * (1 + params.loader.surroundGroups);
        for (var i =
                0; i < slidesToLoad; i++)
            if (params.loader.slidesHTMLType === "outer") slidesHTML += slides[i];
            else slidesHTML += "<" + params.slideElement + ' class="' + params.slideClass + '" data-swiperindex="' + i + '">' + slides[i] + "</" + params.slideElement + ">";
        _this.wrapper.innerHTML = slidesHTML;
        _this.calcSlides(true);
        if (!params.loader.loadAllSlides) _this.wrapperTransitionEnd(_this.reloadSlides, true)
    };
    _this.reloadSlides = function() {
        var slides = params.loader.slides;
        var newActiveIndex = parseInt(_this.activeSlide().data("swiperindex"), 10);
        if (newActiveIndex < 0 || newActiveIndex > slides.length - 1) return;
        _this.activeLoaderIndex = newActiveIndex;
        var firstIndex = Math.max(0, newActiveIndex - params.slidesPerView * params.loader.surroundGroups);
        var lastIndex = Math.min(newActiveIndex + params.slidesPerView * (1 + params.loader.surroundGroups) - 1, slides.length - 1);
        if (newActiveIndex > 0) {
            var newTransform = -slideSize * (newActiveIndex - firstIndex);
            _this.setWrapperTranslate(newTransform);
            _this.setWrapperTransition(0)
        }
        var i;
        if (params.loader.logic === "reload") {
            _this.wrapper.innerHTML =
                "";
            var slidesHTML = "";
            for (i = firstIndex; i <= lastIndex; i++) slidesHTML += params.loader.slidesHTMLType === "outer" ? slides[i] : "<" + params.slideElement + ' class="' + params.slideClass + '" data-swiperindex="' + i + '">' + slides[i] + "</" + params.slideElement + ">";
            _this.wrapper.innerHTML = slidesHTML
        } else {
            var minExistIndex = 1E3;
            var maxExistIndex = 0;
            for (i = 0; i < _this.slides.length; i++) {
                var index = _this.slides[i].data("swiperindex");
                if (index < firstIndex || index > lastIndex) _this.wrapper.removeChild(_this.slides[i]);
                else {
                    minExistIndex = Math.min(index,
                        minExistIndex);
                    maxExistIndex = Math.max(index, maxExistIndex)
                }
            }
            for (i = firstIndex; i <= lastIndex; i++) {
                var newSlide;
                if (i < minExistIndex) {
                    newSlide = document.createElement(params.slideElement);
                    newSlide.className = params.slideClass;
                    newSlide.setAttribute("data-swiperindex", i);
                    newSlide.innerHTML = slides[i];
                    _this.wrapper.insertBefore(newSlide, _this.wrapper.firstChild)
                }
                if (i > maxExistIndex) {
                    newSlide = document.createElement(params.slideElement);
                    newSlide.className = params.slideClass;
                    newSlide.setAttribute("data-swiperindex",
                        i);
                    newSlide.innerHTML = slides[i];
                    _this.wrapper.appendChild(newSlide)
                }
            }
        }
        _this.reInit(true)
    };

    function makeSwiper() {
        _this.calcSlides();
        if (params.loader.slides.length > 0 && _this.slides.length === 0) _this.loadSlides();
        if (params.loop) _this.createLoop();
        _this.init();
        initEvents();
        if (params.pagination) _this.createPagination(true);
        if (params.loop || params.initialSlide > 0) _this.swipeTo(params.initialSlide, 0, false);
        else _this.updateActiveSlide(0);
        if (params.autoplay) _this.startAutoplay();
        _this.centerIndex = _this.activeIndex;
        if (params.onSwiperCreated) _this.fireCallback(params.onSwiperCreated, _this);
        _this.callPlugins("onSwiperCreated")
    }
    makeSwiper()
};
Swiper.prototype = {
    plugins: {},
    wrapperTransitionEnd: function(callback, permanent) {
        var a = this,
            el = a.wrapper,
            events = ["webkitTransitionEnd", "transitionend", "oTransitionEnd", "MSTransitionEnd", "msTransitionEnd"],
            i;

        function fireCallBack() {
            callback(a);
            if (a.params.queueEndCallbacks) a._queueEndCallbacks = false;
            if (!permanent)
                for (i = 0; i < events.length; i++) a.h.removeEventListener(el, events[i], fireCallBack)
        }
        if (callback)
            for (i = 0; i < events.length; i++) a.h.addEventListener(el, events[i], fireCallBack)
    },
    getWrapperTranslate: function(axis) {
        var el =
            this.wrapper,
            matrix, curTransform, curStyle, transformMatrix;
        if (typeof axis === "undefined") axis = this.params.mode === "horizontal" ? "x" : "y";
        if (this.support.transforms && this.params.useCSS3Transforms) {
            curStyle = window.getComputedStyle(el, null);
            if (window.WebKitCSSMatrix) transformMatrix = new WebKitCSSMatrix(curStyle.webkitTransform);
            else {
                transformMatrix = curStyle.MozTransform || (curStyle.OTransform || (curStyle.MsTransform || (curStyle.msTransform || (curStyle.transform || curStyle.getPropertyValue("transform").replace("translate(",
                    "matrix(1, 0, 0, 1,")))));
                matrix = transformMatrix.toString().split(",")
            }
            if (axis === "x")
                if (window.WebKitCSSMatrix) curTransform = transformMatrix.m41;
                else if (matrix.length === 16) curTransform = parseFloat(matrix[12]);
            else curTransform = parseFloat(matrix[4]);
            if (axis === "y")
                if (window.WebKitCSSMatrix) curTransform = transformMatrix.m42;
                else if (matrix.length === 16) curTransform = parseFloat(matrix[13]);
            else curTransform = parseFloat(matrix[5])
        } else {
            if (axis === "x") curTransform = parseFloat(el.style.left, 10) || 0;
            if (axis === "y") curTransform =
                parseFloat(el.style.top, 10) || 0
        }
        return curTransform || 0
    },
    setWrapperTranslate: function(x, y, z) {
        var es = this.wrapper.style,
            coords = {
                x: 0,
                y: 0,
                z: 0
            },
            translate;
        if (arguments.length === 3) {
            coords.x = x;
            coords.y = y;
            coords.z = z
        } else {
            if (typeof y === "undefined") y = this.params.mode === "horizontal" ? "x" : "y";
            coords[y] = x
        }
        if (this.support.transforms && this.params.useCSS3Transforms) {
            translate = this.support.transforms3d ? "translate3d(" + coords.x + "px, " + coords.y + "px, " + coords.z + "px)" : "translate(" + coords.x + "px, " + coords.y + "px)";
            es.webkitTransform =
                es.MsTransform = es.msTransform = es.MozTransform = es.OTransform = es.transform = translate
        } else {
            es.left = coords.x + "px";
            es.top = coords.y + "px"
        }
        this.callPlugins("onSetWrapperTransform", coords);
        if (this.params.onSetWrapperTransform) this.fireCallback(this.params.onSetWrapperTransform, this, coords)
    },
    setWrapperTransition: function(duration) {
        var es = this.wrapper.style;
        es.webkitTransitionDuration = es.MsTransitionDuration = es.msTransitionDuration = es.MozTransitionDuration = es.OTransitionDuration = es.transitionDuration = duration /
            1E3 + "s";
        this.callPlugins("onSetWrapperTransition", {
            duration: duration
        });
        if (this.params.onSetWrapperTransition) this.fireCallback(this.params.onSetWrapperTransition, this, duration)
    },
    h: {
        getWidth: function(el, outer) {
            var width = window.getComputedStyle(el, null).getPropertyValue("width");
            var returnWidth = parseFloat(width);
            if (isNaN(returnWidth) || width.indexOf("%") > 0) returnWidth = el.offsetWidth - parseFloat(window.getComputedStyle(el, null).getPropertyValue("padding-left")) - parseFloat(window.getComputedStyle(el, null).getPropertyValue("padding-right"));
            if (outer) returnWidth += parseFloat(window.getComputedStyle(el, null).getPropertyValue("padding-left")) + parseFloat(window.getComputedStyle(el, null).getPropertyValue("padding-right"));
            return returnWidth
        },
        getHeight: function(el, outer) {
            if (outer) return el.offsetHeight;
            var height = window.getComputedStyle(el, null).getPropertyValue("height");
            var returnHeight = parseFloat(height);
            if (isNaN(returnHeight) || height.indexOf("%") > 0) returnHeight = el.offsetHeight - parseFloat(window.getComputedStyle(el, null).getPropertyValue("padding-top")) -
                parseFloat(window.getComputedStyle(el, null).getPropertyValue("padding-bottom"));
            if (outer) returnHeight += parseFloat(window.getComputedStyle(el, null).getPropertyValue("padding-top")) + parseFloat(window.getComputedStyle(el, null).getPropertyValue("padding-bottom"));
            return returnHeight
        },
        getOffset: function(el) {
            var box = el.getBoundingClientRect();
            var body = document.body;
            var clientTop = el.clientTop || (body.clientTop || 0);
            var clientLeft = el.clientLeft || (body.clientLeft || 0);
            var scrollTop = window.pageYOffset || el.scrollTop;
            var scrollLeft = window.pageXOffset || el.scrollLeft;
            if (document.documentElement && !window.pageYOffset) {
                scrollTop = document.documentElement.scrollTop;
                scrollLeft = document.documentElement.scrollLeft
            }
            return {
                top: box.top + scrollTop - clientTop,
                left: box.left + scrollLeft - clientLeft
            }
        },
        windowWidth: function() {
            if (window.innerWidth) return window.innerWidth;
            else if (document.documentElement && document.documentElement.clientWidth) return document.documentElement.clientWidth
        },
        windowHeight: function() {
            if (window.innerHeight) return window.innerHeight;
            else if (document.documentElement && document.documentElement.clientHeight) return document.documentElement.clientHeight
        },
        windowScroll: function() {
            var left = 0,
                top = 0;
            if (typeof pageYOffset !== "undefined") return {
                left: window.pageXOffset,
                top: window.pageYOffset
            };
            else if (document.documentElement) return {
                left: document.documentElement.scrollLeft,
                top: document.documentElement.scrollTop
            }
        },
        addEventListener: function(el, event, listener, useCapture) {
            if (typeof useCapture === "undefined") useCapture = false;
            if (el.addEventListener) el.addEventListener(event,
                listener, useCapture);
            else if (el.attachEvent) el.attachEvent("on" + event, listener)
        },
        removeEventListener: function(el, event, listener, useCapture) {
            if (typeof useCapture === "undefined") useCapture = false;
            if (el.removeEventListener) el.removeEventListener(event, listener, useCapture);
            else if (el.detachEvent) el.detachEvent("on" + event, listener)
        }
    },
    setTransform: function(el, transform) {
        var es = el.style;
        es.webkitTransform = es.MsTransform = es.msTransform = es.MozTransform = es.OTransform = es.transform = transform
    },
    setTranslate: function(el,
        translate) {
        var es = el.style;
        var pos = {
            x: translate.x || 0,
            y: translate.y || 0,
            z: translate.z || 0
        };
        var transformString = this.support.transforms3d ? "translate3d(" + pos.x + "px," + pos.y + "px," + pos.z + "px)" : "translate(" + pos.x + "px," + pos.y + "px)";
        es.webkitTransform = es.MsTransform = es.msTransform = es.MozTransform = es.OTransform = es.transform = transformString;
        if (!this.support.transforms) {
            es.left = pos.x + "px";
            es.top = pos.y + "px"
        }
    },
    setTransition: function(el, duration) {
        var es = el.style;
        es.webkitTransitionDuration = es.MsTransitionDuration =
            es.msTransitionDuration = es.MozTransitionDuration = es.OTransitionDuration = es.transitionDuration = duration + "ms"
    },
    support: {
        touch: window.Modernizr && Modernizr.touch === true || function() {
            return !!("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch)
        }(),
        transforms3d: window.Modernizr && Modernizr.csstransforms3d === true || function() {
            var div = document.createElement("div").style;
            return "webkitPerspective" in div || ("MozPerspective" in div || ("OPerspective" in div || ("MsPerspective" in div || "perspective" in
                div)))
        }(),
        transforms: window.Modernizr && Modernizr.csstransforms === true || function() {
            var div = document.createElement("div").style;
            return "transform" in div || ("WebkitTransform" in div || ("MozTransform" in div || ("msTransform" in div || ("MsTransform" in div || "OTransform" in div))))
        }(),
        transitions: window.Modernizr && Modernizr.csstransitions === true || function() {
            var div = document.createElement("div").style;
            return "transition" in div || ("WebkitTransition" in div || ("MozTransition" in div || ("msTransition" in div || ("MsTransition" in
                div || "OTransition" in div))))
        }()
    },
    browser: {
        ie8: function() {
            var rv = -1;
            if (navigator.appName === "Microsoft Internet Explorer") {
                var ua = navigator.userAgent;
                var re = new RegExp(/MSIE ([0-9]{1,}[\.0-9]{0,})/);
                if (re.exec(ua) != null) rv = parseFloat(RegExp.$1)
            }
            return rv !== -1 && rv < 9
        }(),
        ie10: window.navigator.msPointerEnabled,
        ie11: window.navigator.pointerEnabled
    }
};
if (window.jQuery || window.Zepto)(function($) {
    $.fn.swiper = function(params) {
        var s = new Swiper($(this)[0], params);
        $(this).data("swiper", s);
        return s
    }
})(window.jQuery || window.Zepto);
if (typeof module !== "undefined") module.exports = Swiper;
Swiper.prototype.plugins.scrollbar = function(swiper, params) {
    var enabled = params && params.container;
    if (!enabled) return;
    var defaults = {
        hide: true,
        draggable: true,
        snapOnRelease: false
    };
    params = params || {};
    for (var prop in defaults)
        if (!(prop in params)) params[prop] = defaults[prop];
    if (!document.querySelectorAll)
        if (!window.jQuery) return;

    function $$(s) {
        return document.querySelectorAll ? document.querySelectorAll(s) : jQuery(s)
    }
    if (!params.container.nodeType)
        if ($$(params.container).length === 0) return;
    var container = params.container.nodeType ?
        params.container : $$(params.container)[0];
    var isH = swiper.params.mode === "horizontal",
        track = container,
        trackWidth, trackHeight, divider, moveDivider, dragWidth, dragHeight;
    var drag = document.createElement("div");
    drag.className = "swiper-scrollbar-drag";
    if (params.draggable) drag.className += " swiper-scrollbar-cursor-drag";
    track.appendChild(drag);
    if (params.hide) track.style.opacity = 0;
    var te = swiper.touchEvents;
    var dragStart, dragMove, dragEnd, setDragPosition;
    if (params.draggable) {
        var isTouched = false;
        dragStart = function(e) {
            isTouched =
                true;
            if (e.preventDefault) e.preventDefault();
            else e.returnValue = false;
            setDragPosition(e);
            clearTimeout(timeout);
            swiper.setTransition(track, 0);
            track.style.opacity = 1;
            swiper.setWrapperTransition(100);
            swiper.setTransition(drag, 100);
            if (params.onScrollbarDrag) params.onScrollbarDrag(swiper)
        };
        dragMove = function(e) {
            if (!isTouched) return;
            if (e.preventDefault) e.preventDefault();
            else e.returnValue = false;
            setDragPosition(e);
            swiper.setWrapperTransition(0);
            swiper.setTransition(track, 0);
            swiper.setTransition(drag, 0);
            if (params.onScrollbarDrag) params.onScrollbarDrag(swiper)
        };
        dragEnd = function(e) {
            isTouched = false;
            if (params.hide) {
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    track.style.opacity = 0;
                    swiper.setTransition(track, 400)
                }, 1E3)
            }
            if (params.snapOnRelease) swiper.swipeReset()
        };
        var lestenEl = swiper.support.touch ? track : document;
        swiper.h.addEventListener(track, te.touchStart, dragStart, false);
        swiper.h.addEventListener(lestenEl, te.touchMove, dragMove, false);
        swiper.h.addEventListener(lestenEl, te.touchEnd, dragEnd, false);
        setDragPosition = function(e) {
            var x = 0,
                y = 0;
            var position;
            if (isH) {
                var pageX =
                    e.type === "touchstart" || e.type === "touchmove" ? e.targetTouches[0].pageX : e.pageX || e.clientX;
                x = pageX - swiper.h.getOffset(track).left - dragWidth / 2;
                if (x < 0) x = 0;
                else if (x + dragWidth > trackWidth) x = trackWidth - dragWidth
            } else {
                var pageY = e.type === "touchstart" || e.type === "touchmove" ? e.targetTouches[0].pageY : e.pageY || e.clientY;
                y = pageY - swiper.h.getOffset(track).top - dragHeight / 2;
                if (y < 0) y = 0;
                else if (y + dragHeight > trackHeight) y = trackHeight - dragHeight
            }
            swiper.setTranslate(drag, {
                x: x,
                y: y
            });
            var wrapX = -x / moveDivider;
            var wrapY = -y /
                moveDivider;
            swiper.setWrapperTranslate(wrapX, wrapY, 0);
            swiper.updateActiveSlide(isH ? wrapX : wrapY)
        }
    }

    function setScrollBars() {
        drag.style.width = "";
        drag.style.height = "";
        if (isH) {
            trackWidth = swiper.h.getWidth(track, true);
            divider = swiper.width / (swiper.h.getWidth(swiper.wrapper) + swiper.wrapperLeft + swiper.wrapperRight);
            moveDivider = divider * (trackWidth / swiper.width);
            dragWidth = trackWidth * divider;
            drag.style.width = dragWidth + "px"
        } else {
            trackHeight = swiper.h.getHeight(track, true);
            divider = swiper.height / (swiper.h.getHeight(swiper.wrapper) +
                swiper.wrapperTop + swiper.wrapperBottom);
            moveDivider = divider * (trackHeight / swiper.height);
            dragHeight = trackHeight * divider;
            if (dragHeight > trackHeight) dragHeight = trackHeight;
            drag.style.height = dragHeight + "px"
        }
        if (divider >= 1) container.style.display = "none";
        else container.style.display = ""
    }
    var timeout;
    return {
        onFirstInit: function(args) {
            setScrollBars()
        },
        onInit: function(args) {
            setScrollBars()
        },
        onTouchMoveEnd: function(args) {
            if (params.hide) {
                clearTimeout(timeout);
                track.style.opacity = 1;
                swiper.setTransition(track, 200)
            }
        },
        onTouchEnd: function(args) {
            if (params.hide) {
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    track.style.opacity = 0;
                    swiper.setTransition(track, 400)
                }, 1E3)
            }
        },
        onSetWrapperTransform: function(pos) {
            var diff;
            if (isH) {
                var newLeft = pos.x * moveDivider;
                var newWidth = dragWidth;
                if (newLeft > 0) {
                    diff = newLeft;
                    newLeft = 0;
                    newWidth = dragWidth - diff
                } else if (-newLeft + dragWidth > trackWidth) newWidth = trackWidth + newLeft;
                swiper.setTranslate(drag, {
                    x: -newLeft
                });
                drag.style.width = newWidth + "px"
            } else {
                var newTop = pos.y * moveDivider;
                var newHeight =
                    dragHeight;
                if (newTop > 0) {
                    diff = newTop;
                    newTop = 0;
                    newHeight = dragHeight - diff
                } else if (-newTop + dragHeight > trackHeight) newHeight = trackHeight + newTop;
                swiper.setTranslate(drag, {
                    y: -newTop
                });
                drag.style.height = newHeight + "px"
            }
            if (swiper.params.freeMode && params.hide) {
                clearTimeout(timeout);
                track.style.opacity = 1;
                timeout = setTimeout(function() {
                    track.style.opacity = 0;
                    swiper.setTransition(track, 400)
                }, 1E3)
            }
        },
        onSetWrapperTransition: function(args) {
            swiper.setTransition(drag, args.duration)
        },
        onDestroy: function() {
            var lestenEl = swiper.support.touch ?
                track : document;
            swiper.h.removeEventListener(track, te.touchStart, dragStart, false);
            swiper.h.removeEventListener(lestenEl, te.touchMove, dragMove, false);
            swiper.h.removeEventListener(lestenEl, te.touchEnd, dragEnd, false)
        }
    }
};
(function($) {
    $.fn.UItoTop = function(options) {
        var defaults = {
                text: "To Top",
                min: 200,
                inDelay: 600,
                outDelay: 400,
                containerID: "toTop",
                containerHoverID: "toTopHover",
                scrollSpeed: 1200,
                easingType: "linear"
            },
            settings = $.extend(defaults, options),
            containerIDhash = "#" + settings.containerID,
            containerHoverIDHash = "#" + settings.containerHoverID;
        $("body").append('<a href="#" id="' + settings.containerID + '">' + settings.text + "</a>");
        $(containerIDhash).hide().on("click.UItoTop", function() {
            $("html, body").animate({
                    scrollTop: 0
                }, settings.scrollSpeed,
                settings.easingType);
            $("#" + settings.containerHoverID, this).stop().animate({
                "opacity": 0
            }, settings.inDelay, settings.easingType);
            return false
        }).prepend('<span id="' + settings.containerHoverID + '"></span>').hover(function() {
            $(containerHoverIDHash, this).stop().animate({
                "opacity": 1
            }, 600, "linear")
        }, function() {
            $(containerHoverIDHash, this).stop().animate({
                "opacity": 0
            }, 700, "linear")
        });
        $(window).scroll(function() {
            var sd = $(window).scrollTop();
            if (typeof document.body.style.maxHeight === "undefined") $(containerIDhash).css({
                "position": "absolute",
                "top": sd + $(window).height() - 50
            });
            if (sd > settings.min) $(containerIDhash).fadeIn(settings.inDelay);
            else $(containerIDhash).fadeOut(settings.Outdelay)
        })
    }
})(jQuery);
(function(t) {
    function e() {}

    function i(t) {
        function i(e) {
            e.prototype.option || (e.prototype.option = function(e) {
                t.isPlainObject(e) && (this.options = t.extend(!0, this.options, e))
            })
        }

        function o(e, i) {
            t.fn[e] = function(o) {
                if ("string" == typeof o) {
                    for (var s = n.call(arguments, 1), a = 0, h = this.length; h > a; a++) {
                        var p = this[a],
                            u = t.data(p, e);
                        if (u)
                            if (t.isFunction(u[o]) && "_" !== o.charAt(0)) {
                                var f = u[o].apply(u, s);
                                if (void 0 !== f) return f
                            } else r("no such method '" + o + "' for " + e + " instance");
                        else r("cannot call methods on " + e + " prior to initialization; " +
                            "attempted to call '" + o + "'")
                    }
                    return this
                }
                return this.each(function() {
                    var n = t.data(this, e);
                    n ? (n.option(o), n._init()) : (n = new i(this, o), t.data(this, e, n))
                })
            }
        }
        if (t) {
            var r = "undefined" == typeof console ? e : function(t) {
                console.error(t)
            };
            return t.bridget = function(t, e) {
                i(e), o(t, e)
            }, t.bridget
        }
    }
    var n = Array.prototype.slice;
    "function" == typeof define && define.amd ? define("jquery-bridget/jquery.bridget", ["jquery"], i) : i(t.jQuery)
})(window),
function(t) {
    function e(e) {
        var i = t.event;
        return i.target = i.target || (i.srcElement ||
            e), i
    }
    var i = document.documentElement,
        n = function() {};
    i.addEventListener ? n = function(t, e, i) {
        t.addEventListener(e, i, !1)
    } : i.attachEvent && (n = function(t, i, n) {
        t[i + n] = n.handleEvent ? function() {
            var i = e(t);
            n.handleEvent.call(n, i)
        } : function() {
            var i = e(t);
            n.call(t, i)
        }, t.attachEvent("on" + i, t[i + n])
    });
    var o = function() {};
    i.removeEventListener ? o = function(t, e, i) {
        t.removeEventListener(e, i, !1)
    } : i.detachEvent && (o = function(t, e, i) {
        t.detachEvent("on" + e, t[e + i]);
        try {
            delete t[e + i]
        } catch (n) {
            t[e + i] = void 0
        }
    });
    var r = {
        bind: n,
        unbind: o
    };
    "function" == typeof define && define.amd ? define("eventie/eventie", r) : "object" == typeof exports ? module.exports = r : t.eventie = r
}(this),
function(t) {
    function e(t) {
        "function" == typeof t && (e.isReady ? t() : r.push(t))
    }

    function i(t) {
        var i = "readystatechange" === t.type && "complete" !== o.readyState;
        if (!e.isReady && !i) {
            e.isReady = !0;
            for (var n = 0, s = r.length; s > n; n++) {
                var a = r[n];
                a()
            }
        }
    }

    function n(n) {
        return n.bind(o, "DOMContentLoaded", i), n.bind(o, "readystatechange", i), n.bind(t, "load", i), e
    }
    var o = t.document,
        r = [];
    e.isReady = !1, "function" ==
        typeof define && define.amd ? (e.isReady = "function" == typeof requirejs, define("doc-ready/doc-ready", ["eventie/eventie"], n)) : t.docReady = n(t.eventie)
}(this),
function() {
    function t() {}

    function e(t, e) {
        for (var i = t.length; i--;)
            if (t[i].listener === e) return i;
        return -1
    }

    function i(t) {
        return function() {
            return this[t].apply(this, arguments)
        }
    }
    var n = t.prototype,
        o = this,
        r = o.EventEmitter;
    n.getListeners = function(t) {
            var e, i, n = this._getEvents();
            if (t instanceof RegExp) {
                e = {};
                for (i in n) n.hasOwnProperty(i) && (t.test(i) && (e[i] = n[i]))
            } else e =
                n[t] || (n[t] = []);
            return e
        }, n.flattenListeners = function(t) {
            var e, i = [];
            for (e = 0; t.length > e; e += 1) i.push(t[e].listener);
            return i
        }, n.getListenersAsObject = function(t) {
            var e, i = this.getListeners(t);
            return i instanceof Array && (e = {}, e[t] = i), e || i
        }, n.addListener = function(t, i) {
            var n, o = this.getListenersAsObject(t),
                r = "object" == typeof i;
            for (n in o) o.hasOwnProperty(n) && (-1 === e(o[n], i) && o[n].push(r ? i : {
                listener: i,
                once: !1
            }));
            return this
        }, n.on = i("addListener"), n.addOnceListener = function(t, e) {
            return this.addListener(t, {
                listener: e,
                once: !0
            })
        }, n.once = i("addOnceListener"), n.defineEvent = function(t) {
            return this.getListeners(t), this
        }, n.defineEvents = function(t) {
            for (var e = 0; t.length > e; e += 1) this.defineEvent(t[e]);
            return this
        }, n.removeListener = function(t, i) {
            var n, o, r = this.getListenersAsObject(t);
            for (o in r) r.hasOwnProperty(o) && (n = e(r[o], i), -1 !== n && r[o].splice(n, 1));
            return this
        }, n.off = i("removeListener"), n.addListeners = function(t, e) {
            return this.manipulateListeners(!1, t, e)
        }, n.removeListeners = function(t, e) {
            return this.manipulateListeners(!0,
                t, e)
        }, n.manipulateListeners = function(t, e, i) {
            var n, o, r = t ? this.removeListener : this.addListener,
                s = t ? this.removeListeners : this.addListeners;
            if ("object" != typeof e || e instanceof RegExp)
                for (n = i.length; n--;) r.call(this, e, i[n]);
            else
                for (n in e) e.hasOwnProperty(n) && ((o = e[n]) && ("function" == typeof o ? r.call(this, n, o) : s.call(this, n, o)));
            return this
        }, n.removeEvent = function(t) {
            var e, i = typeof t,
                n = this._getEvents();
            if ("string" === i) delete n[t];
            else if (t instanceof RegExp)
                for (e in n) n.hasOwnProperty(e) && (t.test(e) &&
                    delete n[e]);
            else delete this._events;
            return this
        }, n.removeAllListeners = i("removeEvent"), n.emitEvent = function(t, e) {
            var i, n, o, r, s = this.getListenersAsObject(t);
            for (o in s)
                if (s.hasOwnProperty(o))
                    for (n = s[o].length; n--;) i = s[o][n], i.once === !0 && this.removeListener(t, i.listener), r = i.listener.apply(this, e || []), r === this._getOnceReturnValue() && this.removeListener(t, i.listener);
            return this
        }, n.trigger = i("emitEvent"), n.emit = function(t) {
            var e = Array.prototype.slice.call(arguments, 1);
            return this.emitEvent(t, e)
        }, n.setOnceReturnValue =
        function(t) {
            return this._onceReturnValue = t, this
        }, n._getOnceReturnValue = function() {
            return this.hasOwnProperty("_onceReturnValue") ? this._onceReturnValue : !0
        }, n._getEvents = function() {
            return this._events || (this._events = {})
        }, t.noConflict = function() {
            return o.EventEmitter = r, t
        }, "function" == typeof define && define.amd ? define("eventEmitter/EventEmitter", [], function() {
            return t
        }) : "object" == typeof module && module.exports ? module.exports = t : this.EventEmitter = t
}.call(this),
    function(t) {
        function e(t) {
            if (t) {
                if ("string" ==
                    typeof n[t]) return t;
                t = t.charAt(0).toUpperCase() + t.slice(1);
                for (var e, o = 0, r = i.length; r > o; o++)
                    if (e = i[o] + t, "string" == typeof n[e]) return e
            }
        }
        var i = "Webkit Moz ms Ms O".split(" "),
            n = document.documentElement.style;
        "function" == typeof define && define.amd ? define("get-style-property/get-style-property", [], function() {
            return e
        }) : "object" == typeof exports ? module.exports = e : t.getStyleProperty = e
    }(window),
    function(t) {
        function e(t) {
            var e = parseFloat(t),
                i = -1 === t.indexOf("%") && !isNaN(e);
            return i && e
        }

        function i() {
            for (var t = {
                    width: 0,
                    height: 0,
                    innerWidth: 0,
                    innerHeight: 0,
                    outerWidth: 0,
                    outerHeight: 0
                }, e = 0, i = s.length; i > e; e++) {
                var n = s[e];
                t[n] = 0
            }
            return t
        }

        function n(t) {
            function n(t) {
                if ("string" == typeof t && (t = document.querySelector(t)), t && ("object" == typeof t && t.nodeType)) {
                    var n = r(t);
                    if ("none" === n.display) return i();
                    var o = {};
                    o.width = t.offsetWidth, o.height = t.offsetHeight;
                    for (var u = o.isBorderBox = !(!p || (!n[p] || "border-box" !== n[p])), f = 0, c = s.length; c > f; f++) {
                        var d = s[f],
                            l = n[d];
                        l = a(t, l);
                        var m = parseFloat(l);
                        o[d] = isNaN(m) ? 0 : m
                    }
                    var y = o.paddingLeft +
                        o.paddingRight,
                        g = o.paddingTop + o.paddingBottom,
                        v = o.marginLeft + o.marginRight,
                        b = o.marginTop + o.marginBottom,
                        _ = o.borderLeftWidth + o.borderRightWidth,
                        E = o.borderTopWidth + o.borderBottomWidth,
                        L = u && h,
                        x = e(n.width);
                    x !== !1 && (o.width = x + (L ? 0 : y + _));
                    var z = e(n.height);
                    return z !== !1 && (o.height = z + (L ? 0 : g + E)), o.innerWidth = o.width - (y + _), o.innerHeight = o.height - (g + E), o.outerWidth = o.width + v, o.outerHeight = o.height + b, o
                }
            }

            function a(t, e) {
                if (o || -1 === e.indexOf("%")) return e;
                var i = t.style,
                    n = i.left,
                    r = t.runtimeStyle,
                    s = r && r.left;
                return s &&
                    (r.left = t.currentStyle.left), i.left = e, e = i.pixelLeft, i.left = n, s && (r.left = s), e
            }
            var h, p = t("boxSizing");
            return function() {
                if (p) {
                    var t = document.createElement("div");
                    t.style.width = "200px", t.style.padding = "1px 2px 3px 4px", t.style.borderStyle = "solid", t.style.borderWidth = "1px 2px 3px 4px", t.style[p] = "border-box";
                    var i = document.body || document.documentElement;
                    i.appendChild(t);
                    var n = r(t);
                    h = 200 === e(n.width), i.removeChild(t)
                }
            }(), n
        }
        var o = t.getComputedStyle,
            r = o ? function(t) {
                return o(t, null)
            } : function(t) {
                return t.currentStyle
            },
            s = ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "marginLeft", "marginRight", "marginTop", "marginBottom", "borderLeftWidth", "borderRightWidth", "borderTopWidth", "borderBottomWidth"];
        "function" == typeof define && define.amd ? define("get-size/get-size", ["get-style-property/get-style-property"], n) : "object" == typeof exports ? module.exports = n(require("get-style-property")) : t.getSize = n(t.getStyleProperty)
    }(window),
    function(t, e) {
        function i(t, e) {
            return t[a](e)
        }

        function n(t) {
            if (!t.parentNode) {
                var e = document.createDocumentFragment();
                e.appendChild(t)
            }
        }

        function o(t, e) {
            n(t);
            for (var i = t.parentNode.querySelectorAll(e), o = 0, r = i.length; r > o; o++)
                if (i[o] === t) return !0;
            return !1
        }

        function r(t, e) {
            return n(t), i(t, e)
        }
        var s, a = function() {
            if (e.matchesSelector) return "matchesSelector";
            for (var t = ["webkit", "moz", "ms", "o"], i = 0, n = t.length; n > i; i++) {
                var o = t[i],
                    r = o + "MatchesSelector";
                if (e[r]) return r
            }
        }();
        if (a) {
            var h = document.createElement("div"),
                p = i(h, "div");
            s = p ? i : r
        } else s = o;
        "function" == typeof define && define.amd ? define("matches-selector/matches-selector", [], function() {
            return s
        }) : window.matchesSelector = s
    }(this, Element.prototype),
    function(t) {
        function e(t, e) {
            for (var i in e) t[i] = e[i];
            return t
        }

        function i(t) {
            for (var e in t) return !1;
            return e = null, !0
        }

        function n(t) {
            return t.replace(/([A-Z])/g, function(t) {
                return "-" + t.toLowerCase()
            })
        }

        function o(t, o, r) {
            function a(t, e) {
                t && (this.element = t, this.layout = e, this.position = {
                    x: 0,
                    y: 0
                }, this._create())
            }
            var h = r("transition"),
                p = r("transform"),
                u = h && p,
                f = !!r("perspective"),
                c = {
                    WebkitTransition: "webkitTransitionEnd",
                    MozTransition: "transitionend",
                    OTransition: "otransitionend",
                    transition: "transitionend"
                } [h],
                d = ["transform", "transition", "transitionDuration", "transitionProperty"],
                l = function() {
                    for (var t = {}, e = 0, i = d.length; i > e; e++) {
                        var n = d[e],
                            o = r(n);
                        o && (o !== n && (t[n] = o))
                    }
                    return t
                }();
            e(a.prototype, t.prototype), a.prototype._create = function() {
                    this._transn = {
                        ingProperties: {},
                        clean: {},
                        onEnd: {}
                    }, this.css({
                        position: "absolute"
                    })
                }, a.prototype.handleEvent = function(t) {
                    var e = "on" + t.type;
                    this[e] && this[e](t)
                }, a.prototype.getSize = function() {
                    this.size = o(this.element)
                },
                a.prototype.css = function(t) {
                    var e = this.element.style;
                    for (var i in t) {
                        var n = l[i] || i;
                        e[n] = t[i]
                    }
                }, a.prototype.getPosition = function() {
                    var t = s(this.element),
                        e = this.layout.options,
                        i = e.isOriginLeft,
                        n = e.isOriginTop,
                        o = parseInt(t[i ? "left" : "right"], 10),
                        r = parseInt(t[n ? "top" : "bottom"], 10);
                    o = isNaN(o) ? 0 : o, r = isNaN(r) ? 0 : r;
                    var a = this.layout.size;
                    o -= i ? a.paddingLeft : a.paddingRight, r -= n ? a.paddingTop : a.paddingBottom, this.position.x = o, this.position.y = r
                }, a.prototype.layoutPosition = function() {
                    var t = this.layout.size,
                        e = this.layout.options,
                        i = {};
                    e.isOriginLeft ? (i.left = this.position.x + t.paddingLeft + "px", i.right = "") : (i.right = this.position.x + t.paddingRight + "px", i.left = ""), e.isOriginTop ? (i.top = this.position.y + t.paddingTop + "px", i.bottom = "") : (i.bottom = this.position.y + t.paddingBottom + "px", i.top = ""), this.css(i), this.emitEvent("layout", [this])
                };
            var m = f ? function(t, e) {
                return "translate3d(" + t + "px, " + e + "px, 0)"
            } : function(t, e) {
                return "translate(" + t + "px, " + e + "px)"
            };
            a.prototype._transitionTo = function(t, e) {
                    this.getPosition();
                    var i = this.position.x,
                        n = this.position.y,
                        o = parseInt(t, 10),
                        r = parseInt(e, 10),
                        s = o === this.position.x && r === this.position.y;
                    if (this.setPosition(t, e), s && !this.isTransitioning) return this.layoutPosition(), void 0;
                    var a = t - i,
                        h = e - n,
                        p = {},
                        u = this.layout.options;
                    a = u.isOriginLeft ? a : -a, h = u.isOriginTop ? h : -h, p.transform = m(a, h), this.transition({
                        to: p,
                        onTransitionEnd: {
                            transform: this.layoutPosition
                        },
                        isCleaning: !0
                    })
                }, a.prototype.goTo = function(t, e) {
                    this.setPosition(t, e), this.layoutPosition()
                }, a.prototype.moveTo = u ? a.prototype._transitionTo : a.prototype.goTo, a.prototype.setPosition =
                function(t, e) {
                    this.position.x = parseInt(t, 10), this.position.y = parseInt(e, 10)
                }, a.prototype._nonTransition = function(t) {
                    this.css(t.to), t.isCleaning && this._removeStyles(t.to);
                    for (var e in t.onTransitionEnd) t.onTransitionEnd[e].call(this)
                }, a.prototype._transition = function(t) {
                    if (!parseFloat(this.layout.options.transitionDuration)) return this._nonTransition(t), void 0;
                    var e = this._transn;
                    for (var i in t.onTransitionEnd) e.onEnd[i] = t.onTransitionEnd[i];
                    for (i in t.to) e.ingProperties[i] = !0, t.isCleaning && (e.clean[i] = !0);
                    if (t.from) {
                        this.css(t.from);
                        var n = this.element.offsetHeight;
                        n = null
                    }
                    this.enableTransition(t.to), this.css(t.to), this.isTransitioning = !0
                };
            var y = p && n(p) + ",opacity";
            a.prototype.enableTransition = function() {
                    this.isTransitioning || (this.css({
                        transitionProperty: y,
                        transitionDuration: this.layout.options.transitionDuration
                    }), this.element.addEventListener(c, this, !1))
                }, a.prototype.transition = a.prototype[h ? "_transition" : "_nonTransition"], a.prototype.onwebkitTransitionEnd = function(t) {
                    this.ontransitionend(t)
                },
                a.prototype.onotransitionend = function(t) {
                    this.ontransitionend(t)
                };
            var g = {
                "-webkit-transform": "transform",
                "-moz-transform": "transform",
                "-o-transform": "transform"
            };
            a.prototype.ontransitionend = function(t) {
                if (t.target === this.element) {
                    var e = this._transn,
                        n = g[t.propertyName] || t.propertyName;
                    if (delete e.ingProperties[n], i(e.ingProperties) && this.disableTransition(), n in e.clean && (this.element.style[t.propertyName] = "", delete e.clean[n]), n in e.onEnd) {
                        var o = e.onEnd[n];
                        o.call(this), delete e.onEnd[n]
                    }
                    this.emitEvent("transitionEnd", [this])
                }
            }, a.prototype.disableTransition = function() {
                this.removeTransitionStyles(), this.element.removeEventListener(c, this, !1), this.isTransitioning = !1
            }, a.prototype._removeStyles = function(t) {
                var e = {};
                for (var i in t) e[i] = "";
                this.css(e)
            };
            var v = {
                transitionProperty: "",
                transitionDuration: ""
            };
            return a.prototype.removeTransitionStyles = function() {
                this.css(v)
            }, a.prototype.removeElem = function() {
                this.element.parentNode.removeChild(this.element), this.emitEvent("remove", [this])
            }, a.prototype.remove = function() {
                if (!h ||
                    !parseFloat(this.layout.options.transitionDuration)) return this.removeElem(), void 0;
                var t = this;
                this.on("transitionEnd", function() {
                    return t.removeElem(), !0
                }), this.hide()
            }, a.prototype.reveal = function() {
                delete this.isHidden, this.css({
                    display: ""
                });
                var t = this.layout.options;
                this.transition({
                    from: t.hiddenStyle,
                    to: t.visibleStyle,
                    isCleaning: !0
                })
            }, a.prototype.hide = function() {
                this.isHidden = !0, this.css({
                    display: ""
                });
                var t = this.layout.options;
                this.transition({
                    from: t.visibleStyle,
                    to: t.hiddenStyle,
                    isCleaning: !0,
                    onTransitionEnd: {
                        opacity: function() {
                            this.isHidden && this.css({
                                display: "none"
                            })
                        }
                    }
                })
            }, a.prototype.destroy = function() {
                this.css({
                    position: "",
                    left: "",
                    right: "",
                    top: "",
                    bottom: "",
                    transition: "",
                    transform: ""
                })
            }, a
        }
        var r = document.defaultView,
            s = r && r.getComputedStyle ? function(t) {
                return r.getComputedStyle(t, null)
            } : function(t) {
                return t.currentStyle
            };
        "function" == typeof define && define.amd ? define("outlayer/item", ["eventEmitter/EventEmitter", "get-size/get-size", "get-style-property/get-style-property"], o) : (t.Outlayer = {}, t.Outlayer.Item = o(t.EventEmitter, t.getSize, t.getStyleProperty))
    }(window),
    function(t) {
        function e(t, e) {
            for (var i in e) t[i] = e[i];
            return t
        }

        function i(t) {
            return "[object Array]" === f.call(t)
        }

        function n(t) {
            var e = [];
            if (i(t)) e = t;
            else if (t && "number" == typeof t.length)
                for (var n = 0, o = t.length; o > n; n++) e.push(t[n]);
            else e.push(t);
            return e
        }

        function o(t, e) {
            var i = d(e, t); - 1 !== i && e.splice(i, 1)
        }

        function r(t) {
            return t.replace(/(.)([A-Z])/g, function(t, e, i) {
                return e + "-" + i
            }).toLowerCase()
        }

        function s(i, s, f, d, l, m) {
            function y(t,
                i) {
                if ("string" == typeof t && (t = a.querySelector(t)), !t || !c(t)) return h && h.error("Bad " + this.constructor.namespace + " element: " + t), void 0;
                this.element = t, this.options = e({}, this.options), this.option(i);
                var n = ++v;
                this.element.outlayerGUID = n, b[n] = this, this._create(), this.options.isInitLayout && this.layout()
            }

            function g(t, i) {
                t.prototype[i] = e({}, y.prototype[i])
            }
            var v = 0,
                b = {};
            return y.namespace = "outlayer", y.Item = m, y.prototype.options = {
                    containerStyle: {
                        position: "relative"
                    },
                    isInitLayout: !0,
                    isOriginLeft: !0,
                    isOriginTop: !0,
                    isResizeBound: !0,
                    transitionDuration: "0.4s",
                    hiddenStyle: {
                        opacity: 0,
                        transform: "scale(0.001)"
                    },
                    visibleStyle: {
                        opacity: 1,
                        transform: "scale(1)"
                    }
                }, e(y.prototype, f.prototype), y.prototype.option = function(t) {
                    e(this.options, t)
                }, y.prototype._create = function() {
                    this.reloadItems(), this.stamps = [], this.stamp(this.options.stamp), e(this.element.style, this.options.containerStyle), this.options.isResizeBound && this.bindResize()
                }, y.prototype.reloadItems = function() {
                    this.items = this._itemize(this.element.children)
                }, y.prototype._itemize =
                function(t) {
                    for (var e = this._filterFindItemElements(t), i = this.constructor.Item, n = [], o = 0, r = e.length; r > o; o++) {
                        var s = e[o],
                            a = new i(s, this);
                        n.push(a)
                    }
                    return n
                }, y.prototype._filterFindItemElements = function(t) {
                    t = n(t);
                    for (var e = this.options.itemSelector, i = [], o = 0, r = t.length; r > o; o++) {
                        var s = t[o];
                        if (c(s))
                            if (e) {
                                l(s, e) && i.push(s);
                                for (var a = s.querySelectorAll(e), h = 0, p = a.length; p > h; h++) i.push(a[h])
                            } else i.push(s)
                    }
                    return i
                }, y.prototype.getItemElements = function() {
                    for (var t = [], e = 0, i = this.items.length; i > e; e++) t.push(this.items[e].element);
                    return t
                }, y.prototype.layout = function() {
                    this._resetLayout(), this._manageStamps();
                    var t = void 0 !== this.options.isLayoutInstant ? this.options.isLayoutInstant : !this._isLayoutInited;
                    this.layoutItems(this.items, t), this._isLayoutInited = !0
                }, y.prototype._init = y.prototype.layout, y.prototype._resetLayout = function() {
                    this.getSize()
                }, y.prototype.getSize = function() {
                    this.size = d(this.element)
                }, y.prototype._getMeasurement = function(t, e) {
                    var i, n = this.options[t];
                    n ? ("string" == typeof n ? i = this.element.querySelector(n) : c(n) &&
                        (i = n), this[t] = i ? d(i)[e] : n) : this[t] = 0
                }, y.prototype.layoutItems = function(t, e) {
                    t = this._getItemsForLayout(t), this._layoutItems(t, e), this._postLayout()
                }, y.prototype._getItemsForLayout = function(t) {
                    for (var e = [], i = 0, n = t.length; n > i; i++) {
                        var o = t[i];
                        o.isIgnored || e.push(o)
                    }
                    return e
                }, y.prototype._layoutItems = function(t, e) {
                    function i() {
                        n.emitEvent("layoutComplete", [n, t])
                    }
                    var n = this;
                    if (!t || !t.length) return i(), void 0;
                    this._itemsOn(t, "layout", i);
                    for (var o = [], r = 0, s = t.length; s > r; r++) {
                        var a = t[r],
                            h = this._getItemLayoutPosition(a);
                        h.item = a, h.isInstant = e || a.isLayoutInstant, o.push(h)
                    }
                    this._processLayoutQueue(o)
                }, y.prototype._getItemLayoutPosition = function() {
                    return {
                        x: 0,
                        y: 0
                    }
                }, y.prototype._processLayoutQueue = function(t) {
                    for (var e = 0, i = t.length; i > e; e++) {
                        var n = t[e];
                        this._positionItem(n.item, n.x, n.y, n.isInstant)
                    }
                }, y.prototype._positionItem = function(t, e, i, n) {
                    n ? t.goTo(e, i) : t.moveTo(e, i)
                }, y.prototype._postLayout = function() {
                    var t = this._getContainerSize();
                    t && (this._setContainerMeasure(t.width, !0), this._setContainerMeasure(t.height, !1))
                },
                y.prototype._getContainerSize = u, y.prototype._setContainerMeasure = function(t, e) {
                    if (void 0 !== t) {
                        var i = this.size;
                        i.isBorderBox && (t += e ? i.paddingLeft + i.paddingRight + i.borderLeftWidth + i.borderRightWidth : i.paddingBottom + i.paddingTop + i.borderTopWidth + i.borderBottomWidth), t = Math.max(t, 0), this.element.style[e ? "width" : "height"] = t + "px"
                    }
                }, y.prototype._itemsOn = function(t, e, i) {
                    function n() {
                        return o++, o === r && i.call(s), !0
                    }
                    for (var o = 0, r = t.length, s = this, a = 0, h = t.length; h > a; a++) {
                        var p = t[a];
                        p.on(e, n)
                    }
                }, y.prototype.ignore =
                function(t) {
                    var e = this.getItem(t);
                    e && (e.isIgnored = !0)
                }, y.prototype.unignore = function(t) {
                    var e = this.getItem(t);
                    e && delete e.isIgnored
                }, y.prototype.stamp = function(t) {
                    if (t = this._find(t)) {
                        this.stamps = this.stamps.concat(t);
                        for (var e = 0, i = t.length; i > e; e++) {
                            var n = t[e];
                            this.ignore(n)
                        }
                    }
                }, y.prototype.unstamp = function(t) {
                    if (t = this._find(t))
                        for (var e = 0, i = t.length; i > e; e++) {
                            var n = t[e];
                            o(n, this.stamps), this.unignore(n)
                        }
                }, y.prototype._find = function(t) {
                    return t ? ("string" == typeof t && (t = this.element.querySelectorAll(t)),
                        t = n(t)) : void 0
                }, y.prototype._manageStamps = function() {
                    if (this.stamps && this.stamps.length) {
                        this._getBoundingRect();
                        for (var t = 0, e = this.stamps.length; e > t; t++) {
                            var i = this.stamps[t];
                            this._manageStamp(i)
                        }
                    }
                }, y.prototype._getBoundingRect = function() {
                    var t = this.element.getBoundingClientRect(),
                        e = this.size;
                    this._boundingRect = {
                        left: t.left + e.paddingLeft + e.borderLeftWidth,
                        top: t.top + e.paddingTop + e.borderTopWidth,
                        right: t.right - (e.paddingRight + e.borderRightWidth),
                        bottom: t.bottom - (e.paddingBottom + e.borderBottomWidth)
                    }
                },
                y.prototype._manageStamp = u, y.prototype._getElementOffset = function(t) {
                    var e = t.getBoundingClientRect(),
                        i = this._boundingRect,
                        n = d(t),
                        o = {
                            left: e.left - i.left - n.marginLeft,
                            top: e.top - i.top - n.marginTop,
                            right: i.right - e.right - n.marginRight,
                            bottom: i.bottom - e.bottom - n.marginBottom
                        };
                    return o
                }, y.prototype.handleEvent = function(t) {
                    var e = "on" + t.type;
                    this[e] && this[e](t)
                }, y.prototype.bindResize = function() {
                    this.isResizeBound || (i.bind(t, "resize", this), this.isResizeBound = !0)
                }, y.prototype.unbindResize = function() {
                    i.unbind(t,
                        "resize", this), this.isResizeBound = !1
                }, y.prototype.onresize = function() {
                    function t() {
                        e.resize(), delete e.resizeTimeout
                    }
                    this.resizeTimeout && clearTimeout(this.resizeTimeout);
                    var e = this;
                    this.resizeTimeout = setTimeout(t, 100)
                }, y.prototype.resize = function() {
                    var t = d(this.element),
                        e = this.size && t;
                    e && t.innerWidth === this.size.innerWidth || this.layout()
                }, y.prototype.addItems = function(t) {
                    var e = this._itemize(t);
                    return e.length && (this.items = this.items.concat(e)), e
                }, y.prototype.appended = function(t) {
                    var e = this.addItems(t);
                    e.length && (this.layoutItems(e, !0), this.reveal(e))
                }, y.prototype.prepended = function(t) {
                    var e = this._itemize(t);
                    if (e.length) {
                        var i = this.items.slice(0);
                        this.items = e.concat(i), this._resetLayout(), this._manageStamps(), this.layoutItems(e, !0), this.reveal(e), this.layoutItems(i)
                    }
                }, y.prototype.reveal = function(t) {
                    var e = t && t.length;
                    if (e)
                        for (var i = 0; e > i; i++) {
                            var n = t[i];
                            n.reveal()
                        }
                }, y.prototype.hide = function(t) {
                    var e = t && t.length;
                    if (e)
                        for (var i = 0; e > i; i++) {
                            var n = t[i];
                            n.hide()
                        }
                }, y.prototype.getItem = function(t) {
                    for (var e =
                            0, i = this.items.length; i > e; e++) {
                        var n = this.items[e];
                        if (n.element === t) return n
                    }
                }, y.prototype.getItems = function(t) {
                    if (t && t.length) {
                        for (var e = [], i = 0, n = t.length; n > i; i++) {
                            var o = t[i],
                                r = this.getItem(o);
                            r && e.push(r)
                        }
                        return e
                    }
                }, y.prototype.remove = function(t) {
                    t = n(t);
                    var e = this.getItems(t);
                    if (e && e.length) {
                        this._itemsOn(e, "remove", function() {
                            this.emitEvent("removeComplete", [this, e])
                        });
                        for (var i = 0, r = e.length; r > i; i++) {
                            var s = e[i];
                            s.remove(), o(s, this.items)
                        }
                    }
                }, y.prototype.destroy = function() {
                    var t = this.element.style;
                    t.height = "", t.position = "", t.width = "";
                    for (var e = 0, i = this.items.length; i > e; e++) {
                        var n = this.items[e];
                        n.destroy()
                    }
                    this.unbindResize(), delete this.element.outlayerGUID, p && p.removeData(this.element, this.constructor.namespace)
                }, y.data = function(t) {
                    var e = t && t.outlayerGUID;
                    return e && b[e]
                }, y.create = function(t, i) {
                    function n() {
                        y.apply(this, arguments)
                    }
                    return Object.create ? n.prototype = Object.create(y.prototype) : e(n.prototype, y.prototype), n.prototype.constructor = n, g(n, "options"), e(n.prototype.options, i), n.namespace =
                        t, n.data = y.data, n.Item = function() {
                            m.apply(this, arguments)
                        }, n.Item.prototype = new m, s(function() {
                            for (var e = r(t), i = a.querySelectorAll(".js-" + e), o = "data-" + e + "-options", s = 0, u = i.length; u > s; s++) {
                                var f, c = i[s],
                                    d = c.getAttribute(o);
                                try {
                                    f = d && JSON.parse(d)
                                } catch (l) {
                                    h && h.error("Error parsing " + o + " on " + c.nodeName.toLowerCase() + (c.id ? "#" + c.id : "") + ": " + l);
                                    continue
                                }
                                var m = new n(c, f);
                                p && p.data(c, t, m)
                            }
                        }), p && (p.bridget && p.bridget(t, n)), n
                }, y.Item = m, y
        }
        var a = t.document,
            h = t.console,
            p = t.jQuery,
            u = function() {},
            f = Object.prototype.toString,
            c = "object" == typeof HTMLElement ? function(t) {
                return t instanceof HTMLElement
            } : function(t) {
                return t && ("object" == typeof t && (1 === t.nodeType && "string" == typeof t.nodeName))
            },
            d = Array.prototype.indexOf ? function(t, e) {
                return t.indexOf(e)
            } : function(t, e) {
                for (var i = 0, n = t.length; n > i; i++)
                    if (t[i] === e) return i;
                return -1
            };
        "function" == typeof define && define.amd ? define("outlayer/outlayer", ["eventie/eventie", "doc-ready/doc-ready", "eventEmitter/EventEmitter", "get-size/get-size", "matches-selector/matches-selector", "./item"],
            s) : t.Outlayer = s(t.eventie, t.docReady, t.EventEmitter, t.getSize, t.matchesSelector, t.Outlayer.Item)
    }(window),
    function(t) {
        function e(t, e) {
            var n = t.create("masonry");
            return n.prototype._resetLayout = function() {
                this.getSize(), this._getMeasurement("columnWidth", "outerWidth"), this._getMeasurement("gutter", "outerWidth"), this.measureColumns();
                var t = this.cols;
                for (this.colYs = []; t--;) this.colYs.push(0);
                this.maxY = 0
            }, n.prototype.measureColumns = function() {
                if (this.getContainerWidth(), !this.columnWidth) {
                    var t = this.items[0],
                        i = t && t.element;
                    this.columnWidth = i && e(i).outerWidth || this.containerWidth
                }
                this.columnWidth += this.gutter, this.cols = Math.floor((this.containerWidth + this.gutter) / this.columnWidth), this.cols = Math.max(this.cols, 1)
            }, n.prototype.getContainerWidth = function() {
                var t = this.options.isFitWidth ? this.element.parentNode : this.element,
                    i = e(t);
                this.containerWidth = i && i.innerWidth
            }, n.prototype._getItemLayoutPosition = function(t) {
                t.getSize();
                var e = t.size.outerWidth % this.columnWidth,
                    n = e && 1 > e ? "round" : "ceil",
                    o = Math[n](t.size.outerWidth /
                        this.columnWidth);
                o = Math.min(o, this.cols);
                for (var r = this._getColGroup(o), s = Math.min.apply(Math, r), a = i(r, s), h = {
                        x: this.columnWidth * a,
                        y: s
                    }, p = s + t.size.outerHeight, u = this.cols + 1 - r.length, f = 0; u > f; f++) this.colYs[a + f] = p;
                return h
            }, n.prototype._getColGroup = function(t) {
                if (2 > t) return this.colYs;
                for (var e = [], i = this.cols + 1 - t, n = 0; i > n; n++) {
                    var o = this.colYs.slice(n, n + t);
                    e[n] = Math.max.apply(Math, o)
                }
                return e
            }, n.prototype._manageStamp = function(t) {
                var i = e(t),
                    n = this._getElementOffset(t),
                    o = this.options.isOriginLeft ? n.left :
                    n.right,
                    r = o + i.outerWidth,
                    s = Math.floor(o / this.columnWidth);
                s = Math.max(0, s);
                var a = Math.floor(r / this.columnWidth);
                a -= r % this.columnWidth ? 0 : 1, a = Math.min(this.cols - 1, a);
                for (var h = (this.options.isOriginTop ? n.top : n.bottom) + i.outerHeight, p = s; a >= p; p++) this.colYs[p] = Math.max(h, this.colYs[p])
            }, n.prototype._getContainerSize = function() {
                this.maxY = Math.max.apply(Math, this.colYs);
                var t = {
                    height: this.maxY
                };
                return this.options.isFitWidth && (t.width = this._getContainerFitWidth()), t
            }, n.prototype._getContainerFitWidth = function() {
                for (var t =
                        0, e = this.cols; --e && 0 === this.colYs[e];) t++;
                return (this.cols - t) * this.columnWidth - this.gutter
            }, n.prototype.resize = function() {
                var t = this.containerWidth;
                this.getContainerWidth(), t !== this.containerWidth && this.layout()
            }, n
        }
        var i = Array.prototype.indexOf ? function(t, e) {
            return t.indexOf(e)
        } : function(t, e) {
            for (var i = 0, n = t.length; n > i; i++) {
                var o = t[i];
                if (o === e) return i
            }
            return -1
        };
        "function" == typeof define && define.amd ? define(["outlayer/outlayer", "get-size/get-size"], e) : t.Masonry = e(t.Outlayer, t.getSize)
    }(window);