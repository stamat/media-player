/* media-player v0.1.0 | https://stamat.github.io/media-player/ | MIT License */
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/hydrargyri/node_modules/book-of-spells/src/helpers.mjs
function stringToBoolean(str) {
  if (/^\s*(true|false)\s*$/i.test(str)) return str.trim().toLowerCase() === "true";
}
function stringToNumber(str) {
  if (/^\s*-?\d+\s*$/.test(str)) return parseInt(str);
  if (/^\s*-?\d+\.\d+\s*$/.test(str)) return parseFloat(str);
}
function stringToPrimitive(str) {
  if (/^\s*null\s*$/.test(str)) return null;
  const bool = stringToBoolean(str);
  if (bool !== void 0) return bool;
  return stringToNumber(str) ?? str;
}
function isArray(o) {
  return Array.isArray(o);
}
function transformDashToCamelCase(str) {
  return str.replace(/-([a-z])/g, function(g) {
    return g[1].toUpperCase();
  });
}
function getObjectValueByPath(obj, path) {
  if (typeof path === "string") path = path.split(".");
  return path.reduce((acc, part) => acc !== null && acc !== void 0 ? acc[part] : void 0, obj);
}

// node_modules/hydrargyri/src/scripts/hydrargyri.js
var hgTags = /* @__PURE__ */ new Set();
var hgSelector = "";
var BIND_TYPES = /* @__PURE__ */ new Set(["text", "html", "value", "attr", "prop", "class", "if", "unless"]);
var NAMED_BIND_TYPES = /* @__PURE__ */ new Set(["attr", "prop", "class"]);
var RESERVED = /* @__PURE__ */ new Set(["handlers", "conditions", "formatters", "_state", "_binds", "_listeners", "_reflected", "_attrTypes", "_jsonCache", "_subscriptions", "_assigned", "_initialized", "_deferredInit"]);
var reactiveSubs = /* @__PURE__ */ new WeakMap();
function propertyNames(properties) {
  return isArray(properties) ? properties : Object.keys(properties);
}
function camelKeys(obj) {
  const out = {};
  for (const key in obj) out[transformDashToCamelCase(key)] = obj[key];
  return out;
}
function parseAttributeValue(raw) {
  if (raw === null) return null;
  if (raw === "") return true;
  return stringToPrimitive(raw);
}
function parseAttributeEntry(entry) {
  const colon = entry.indexOf(":");
  if (colon === -1) return { name: entry.trim(), type: null };
  return { name: entry.slice(0, colon).trim(), type: entry.slice(colon + 1).trim() };
}
function deepFreeze(value) {
  if (value === null || typeof value !== "object") return value;
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}
function parseBinds(raw) {
  const entries = [];
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const pipes = trimmed.split("|");
    if (pipes.length > 2) {
      console.warn(`hydrargyri: unknown bind "${trimmed}" \u2014 one |formatter per entry, chaining is not supported`);
      continue;
    }
    let format = null;
    if (pipes.length === 2) {
      const segments = pipes[1].split(":").map((s) => s.trim());
      if (segments.some((s) => !s)) {
        console.warn(`hydrargyri: unknown bind "${trimmed}" \u2014 expected |formatter[:arg[:arg]]`);
        continue;
      }
      format = { name: segments[0], args: segments.slice(1).map((arg) => arg.split(".")) };
    }
    const bindPart = pipes[0].trim();
    const colon = bindPart.indexOf(":");
    const pathPart = colon === -1 ? bindPart : bindPart.slice(0, colon);
    const typePart = colon === -1 ? "" : bindPart.slice(colon + 1);
    const path = pathPart.trim().split(".");
    let type = "text";
    let attr = null;
    if (typePart) {
      const hash = typePart.indexOf("#");
      type = (hash === -1 ? typePart : typePart.slice(0, hash)).trim();
      attr = hash === -1 ? null : typePart.slice(hash + 1).trim();
    }
    if (!BIND_TYPES.has(type) || NAMED_BIND_TYPES.has(type) && !attr) {
      console.warn(`hydrargyri: unknown bind "${trimmed}" \u2014 expected path[:text|html|value|attr#name|prop#name|class#name|if#condition|unless#condition]`);
      continue;
    }
    if (format && (type === "if" || type === "unless")) {
      console.warn(`hydrargyri: bind "${trimmed}" \u2014 a formatter cannot shape an ${type} bind, that is a condition's job; formatter ignored`);
      format = null;
    }
    entries.push({ path, type, attr, format });
  }
  return entries;
}
var _HgElement = class _HgElement extends HTMLElement {
  static get observedAttributes() {
    return this.attributes.map((entry) => parseAttributeEntry(entry).name);
  }
  /**
   * Hand a value to every instance of this element, present and future —
   * the tag-wide form of `el.key = value`. Share a `reactive()` model and
   * every mutation reaches every instance from then on.
   *
   * Property keys only: an attribute-backed key is refused, because the
   * attribute is the markup's state, per instance by design. An instance
   * assignment outranks share on that instance, forever — reconnects included.
   *
   * @param {Object} values Map of property key → value
   *
   * @example
   * const Crew = hg('user-card', { properties: ['user'] })
   * Crew.share({ user: reactive({ name: 'Ada' }) })
   */
  static share(values) {
    const owned = new Set(propertyNames(this.properties).map(transformDashToCamelCase));
    const accepted = {};
    for (const key in values) {
      const name = transformDashToCamelCase(key);
      if (owned.has(name)) accepted[name] = values[key];
      else console.warn(`hydrargyri: share() takes declared properties \u2014 "${key}" ignored`);
    }
    this._shared = Object.assign({}, this._shared, accepted);
    if (!this._tag) return;
    document.querySelectorAll(this._tag).forEach((el) => {
      if (typeof el._applyShared === "function") el._applyShared(accepted);
    });
  }
  // Everything shared with this class: object-form property defaults under a
  // later share() of the same key — a runtime call overrides the declaration.
  static _sharedAll() {
    const declared = isArray(this.properties) ? null : camelKeys(this.properties);
    if (!declared && !this._shared) return null;
    return Object.assign({}, declared, this._shared);
  }
  constructor() {
    super();
    const tag = this.tagName.toLowerCase();
    if (!hgTags.has(tag)) {
      hgTags.add(tag);
      hgSelector = [...hgTags].join(",");
    }
    this.constructor._tag = tag;
    this._state = {};
    this._binds = {};
    this._listeners = [];
    this._reflected = {};
    this._attrTypes = {};
    this._jsonCache = {};
    this._subscriptions = [];
    this._assigned = /* @__PURE__ */ new Set();
    this._initialized = false;
    this._deferredInit = null;
    this.handlers = Object.assign({}, this.constructor.handlers);
    this.conditions = Object.assign({}, this.constructor.conditions);
    this.formatters = Object.assign({}, this.constructor.formatters);
    for (const entry of this.constructor.attributes) {
      const { name, type } = parseAttributeEntry(entry);
      this._defineAccessor(name, name, type);
    }
    for (const prop of propertyNames(this.constructor.properties)) this._defineAccessor(prop, null, null);
  }
  connectedCallback() {
    if (this._initialized) return;
    if (document.readyState === "loading") {
      this._deferredInit = () => this._init();
      document.addEventListener("DOMContentLoaded", this._deferredInit, { once: true });
      return;
    }
    this._init();
  }
  disconnectedCallback() {
    if (this._deferredInit) {
      document.removeEventListener("DOMContentLoaded", this._deferredInit);
      this._deferredInit = null;
      return;
    }
    if (!this._initialized) return;
    this._teardownHandlers();
    this._teardownSubscriptions();
    this._initialized = false;
    if (typeof this.disconnected === "function") this.disconnected(this);
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this.update(transformDashToCamelCase(name));
    if (this._initialized && typeof this.attributeChanged === "function") {
      this.attributeChanged(name, this._parseAttribute(name, oldValue), this._parseAttribute(name, newValue));
    }
  }
  // A string-typed attribute is a verbatim channel: the exact attribute text,
  // `''` included — only absent still reads null. A json-typed one hands out
  // the frozen parse. Everything else takes the HTML-boolean-and-primitive
  // reading of parseAttributeValue.
  _parseAttribute(attribute, raw) {
    const type = this._attrTypes[attribute];
    if (type === "string") return raw;
    if (type === "json") return this._parseJson(attribute, raw);
    return parseAttributeValue(raw);
  }
  // One parse per attribute value, cached by the raw string — every read of an
  // unchanged attribute returns the same frozen object, so identity survives
  // between paints. Malformed JSON (a valueless attribute included) warns and
  // reads null, and the cache is what keeps that warning to once per value
  // rather than once per read.
  _parseJson(attribute, raw) {
    if (raw === null) return null;
    const cached = this._jsonCache[attribute];
    if (cached && cached.raw === raw) return cached.value;
    let value = null;
    try {
      value = deepFreeze(JSON.parse(raw));
    } catch {
      console.warn(`hydrargyri: <${this.tagName.toLowerCase()}> attribute "${attribute}" holds malformed JSON \u2014 read as null`);
    }
    this._jsonCache[attribute] = { raw, value };
    return value;
  }
  /**
   * Repaint bound nodes — all of them, or only those bound to one key.
   * The escape hatch after mutating inside an object property, which no
   * setter sees: `el.user.name = 'x'; el.update('user')`.
   */
  update(key) {
    if (!this._initialized) return;
    if (key) {
      this._applyBinds(key);
      return;
    }
    for (const k in this._binds) this._applyBinds(k);
  }
  _defineAccessor(name, attribute, type) {
    const key = transformDashToCamelCase(name);
    if (type !== null && type !== "string" && type !== "json") {
      console.warn(`hydrargyri: <${this.tagName.toLowerCase()}> attribute "${name}:${type}" \u2014 string and json are the only types; reading as auto`);
      type = null;
    }
    if (attribute && type) this._attrTypes[attribute] = type;
    if (RESERVED.has(key)) {
      console.warn(`hydrargyri: <${this.tagName.toLowerCase()}> cannot observe "${name}" \u2014 "${key}" is reserved by hydrargyri`);
      return;
    }
    let preset;
    if (Object.prototype.hasOwnProperty.call(this, key)) {
      preset = this[key];
      delete this[key];
    }
    if (key in this) {
      console.warn(`hydrargyri: <${this.tagName.toLowerCase()}> cannot observe "${name}" \u2014 "${key}" already exists on the element`);
      return;
    }
    if (attribute) this._reflected[key] = attribute;
    else if (!(key in this._state)) this._state[key] = null;
    Object.defineProperty(this, key, attribute ? {
      get: () => this._parseAttribute(attribute, this.getAttribute(attribute)),
      set: (value) => {
        if (value === null || value === void 0) this.removeAttribute(attribute);
        else if (type === "json") this.setAttribute(attribute, JSON.stringify(value));
        else if (value === false) this.removeAttribute(attribute);
        else if (value === true) this.setAttribute(attribute, "");
        else this.setAttribute(attribute, value);
      }
    } : {
      get: () => this._state[key],
      set: (value) => {
        this._unsubscribe(key);
        this._state[key] = value;
        this._assigned.add(key);
        if (this._initialized) this._subscribe(key, value);
        this.update(key);
      }
    });
    if (preset !== void 0) this[key] = preset;
  }
  // Runs through the property setters, then erases the assigned mark they
  // leave — share-applied values must stay overwritable by the next share().
  _applyShared(values) {
    for (const key in values) {
      if (!(key in this._state)) continue;
      if (this._assigned.has(key)) continue;
      this[key] = values[key];
      this._assigned.delete(key);
    }
  }
  _init() {
    this._deferredInit = null;
    const shared = this.constructor._sharedAll();
    if (shared) this._applyShared(shared);
    this._initialized = true;
    this.setAttribute("hg", "");
    for (const key in this._state) this._subscribe(key, this._state[key]);
    this._scanBinds();
    this._scanHandlers();
    this._wireCommands();
    this.update();
    if (typeof this.connected === "function") this.connected(this);
  }
  /**
   * Re-collect binds and handlers from the current subtree and repaint — the
   * door for markup that changed under an initialized element, e.g. a handler
   * swapping innerHTML. Detached nodes drop their binds and listeners, new
   * ones wire and paint. A no-op before init: connect is the first scan.
   */
  rescan() {
    if (!this._initialized) return;
    this._scanBinds();
    this._scanHandlers();
    this._wireCommands();
    this.update();
  }
  // Always wired, even with no command keys declared: a handler assigned at
  // runtime then routes without the author re-wiring anything. Registered
  // in _listeners after the handler scan tears the old set down, so both
  // teardown and rescan unhook it with the rest.
  _wireCommands() {
    const listener = (e) => this._act(e);
    this.addEventListener("command", listener);
    this._listeners.push({ el: this, event: "command", listener });
  }
  // The nearest hydrargyri ancestor owns a node — any hydrargyri tag, not only this
  // element's own, so different hydrargyri elements nest without stealing binds.
  // The selector grows with every tag ever defined and closest() pays for it
  // per scanned node — the ceiling is scan cost on pages defining many tags;
  // a per-scan ancestor cache is the upgrade if it ever shows up in a profile.
  _scope(el) {
    return el.closest(hgSelector) === this;
  }
  _owns(key) {
    return key in this._reflected || key in this._state;
  }
  _scanBinds() {
    this._binds = {};
    const collect = (el) => {
      if (!this._scope(el)) return;
      const raw = el.getAttribute("bind") || el.getAttribute("data-bind");
      if (!raw) return;
      for (const entry of parseBinds(raw)) {
        const keys = /* @__PURE__ */ new Set([entry.path[0]]);
        if (entry.format) for (const arg of entry.format.args) keys.add(arg[0]);
        const unknown = [...keys].find((key) => !this._owns(key));
        if (unknown !== void 0) {
          console.warn(`hydrargyri: <${this.tagName.toLowerCase()}> has no attribute or property "${unknown}" for bind "${raw}"`);
          continue;
        }
        if (el === this && entry.type === "prop" && entry.attr && this._owns(transformDashToCamelCase(entry.attr))) {
          console.warn(`hydrargyri: <${this.tagName.toLowerCase()}> bind "${raw}" writes its own reactive "${entry.attr}" \u2014 a feedback loop; assign the property from a handler instead`);
          continue;
        }
        entry.el = el;
        for (const key of keys) {
          if (!this._binds[key]) this._binds[key] = [];
          this._binds[key].push(entry);
        }
      }
    };
    collect(this);
    this.querySelectorAll("[bind],[data-bind]").forEach(collect);
  }
  _scanHandlers() {
    this._teardownHandlers();
    const collect = (el) => {
      if (this._scope(el)) this._wireHandlers(el);
    };
    collect(this);
    this.querySelectorAll("[on],[data-on]").forEach(collect);
  }
  // One node's `on`/`data-on` parsed and wired — the unit _scanHandlers sweeps
  // with, callable alone for nodes that arrive after the scan (hydrargyri-each
  // wires fresh rows with it, without rescanning the standing ones). Scope is
  // the caller's to check; calling twice on one node doubles its listeners.
  _wireHandlers(el) {
    const raw = el.getAttribute("on") || el.getAttribute("data-on");
    if (!raw) return;
    for (const part of raw.split(";")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const colon = trimmed.indexOf(":");
      if (colon === -1) {
        console.warn(`hydrargyri: unknown handler "${trimmed}" \u2014 expected event:name`);
        continue;
      }
      let event = trimmed.slice(0, colon).trim();
      const name = trimmed.slice(colon + 1).trim();
      let target = el;
      const at = event.lastIndexOf("@");
      if (at !== -1) {
        const where = event.slice(at + 1);
        target = where === "window" ? window : where === "document" ? document : null;
        if (!target) {
          console.warn(`hydrargyri: unknown handler target "${trimmed}" \u2014 expected event@window or event@document`);
          continue;
        }
        event = event.slice(0, at);
      }
      const listener = (e) => this._handle(name, e);
      target.addEventListener(event, listener);
      this._listeners.push({ el: target, event, listener });
    }
  }
  _teardownHandlers() {
    for (const { el, event, listener } of this._listeners) el.removeEventListener(event, listener);
    this._listeners = [];
  }
  _subscribe(key, value) {
    const subs = reactiveSubs.get(value);
    if (!subs) return;
    const fn = () => this.update(key);
    subs.add(fn);
    this._subscriptions.push({ key, subs, fn });
  }
  // Leaving a stale subscription behind on reassignment would keep the old
  // model repainting this element — and keep the element alive — forever.
  _unsubscribe(key) {
    this._subscriptions = this._subscriptions.filter((sub) => {
      if (sub.key !== key) return true;
      sub.subs.delete(sub.fn);
      return false;
    });
  }
  _teardownSubscriptions() {
    for (const { subs, fn } of this._subscriptions) subs.delete(fn);
    this._subscriptions = [];
  }
  // A subclass method wins over the handlers registry, and only one runs —
  // first match, so a registry entry cannot double-fire behind it. Authored
  // methods only, found below HgElement in the chain: without that floor,
  // `on="click:remove"` reaches Element.prototype.remove and the click
  // silently detaches the element itself.
  _handle(name, e) {
    if (this._authoredMethod(name)) return this[name](e, this);
    if (typeof this.handlers[name] === "function") return this.handlers[name](e, this);
    if (typeof this[name] === "function") {
      console.warn(`hydrargyri: <${this.tagName.toLowerCase()}> handler "${name}" only matches the platform's ${name}() \u2014 not called; declare it in handlers`);
      return;
    }
    console.warn(`hydrargyri: <${this.tagName.toLowerCase()}> has no handler "${name}"`);
  }
  // Walks from the instance down to HgElement.prototype, exclusive — what is
  // found on the way was written by an author; what sits at or past the base
  // class is hydrargyri's API or the platform's, and neither is a handler.
  _authoredMethod(name) {
    if (typeof this[name] !== "function") return false;
    let proto = this;
    while (proto && proto !== _HgElement.prototype) {
      if (Object.prototype.hasOwnProperty.call(proto, name)) return true;
      proto = Object.getPrototypeOf(proto);
    }
    return false;
  }
  // Commands look up handlers by the exact command string, dashes and all —
  // no name transformation to reason backwards through, and custom commands
  // must start with `--`, so command keys cannot collide with handler names.
  // Registry only, no method lookup: a subclass method must not become
  // command-invokable by its name alone. Unknown commands warn only when some
  // `--` key is declared, because commands may be handled by an `on` listener
  // instead; only a declared command key makes an unknown one a typo worth naming.
  _act(e) {
    const action = this.handlers[e.command];
    if (typeof action === "function") return action(e, this);
    if (Object.keys(this.handlers).some((key) => key.startsWith("--"))) {
      console.warn(`hydrargyri: <${this.tagName.toLowerCase()}> has no handler for command "${e.command}"`);
    }
  }
  _applyBinds(key) {
    const binds = this._binds[key];
    if (!binds) return;
    for (const bind of binds) {
      this._render(bind, this._resolve(bind.path));
    }
  }
  _resolve(path) {
    const value = this[path[0]];
    return path.length > 1 ? getObjectValueByPath(value, path.slice(1)) : value;
  }
  // Stateless on purpose: no memory of the last painted value, so an unchanged
  // value is written again, and a bind registered under two keys (its own and a
  // formatter argument's) paints once per key in a full update(). Nothing can go
  // stale across a rescan; a per-entry last-value memo is the upgrade if
  // repaint cost ever earns it.
  _render({ el, type, attr, format }, value) {
    if (value === void 0) return;
    if (format) {
      const formatter = this.formatters[format.name];
      if (typeof formatter !== "function") {
        console.warn(`hydrargyri: <${this.tagName.toLowerCase()}> has no formatter "${format.name}"`);
      } else {
        value = formatter(value, this, ...format.args.map((arg) => this._resolve(arg)));
        if (value === void 0) return;
      }
    }
    switch (type) {
      case "text":
        el.textContent = value === null ? "" : value;
        break;
      case "html":
        el.innerHTML = value === null ? "" : value;
        break;
      case "value":
        el.value = value === null ? "" : value;
        break;
      case "attr":
        if (value === null || value === false) el.removeAttribute(attr);
        else el.setAttribute(attr, value === true ? "" : value);
        break;
      // No coercion and no absent state: an attribute can only hold a string,
      // which is why an array or an object reaching another element has to come
      // this way. `null` writes null, because a property has no "removed".
      case "prop":
        el[attr] = value;
        break;
      // One class token, toggled on truthiness — never the whole attribute, so
      // the author's classes and any other script's survive, and there is no
      // record of the last paint to go stale across a rescan.
      case "class":
        el.classList.toggle(attr, !!value);
        break;
      case "if":
      case "unless": {
        let truth = value;
        if (attr) {
          const condition = this.conditions[attr];
          if (typeof condition !== "function") {
            console.warn(`hydrargyri: <${this.tagName.toLowerCase()}> has no condition "${attr}"`);
            break;
          }
          truth = condition(value, this);
        }
        el.toggleAttribute("hidden", type === "unless" ? !!truth : !truth);
        break;
      }
    }
  }
};
/** Observed attributes, each becoming a reactive camelCase property reflected to the DOM. An entry may carry a type — `'zip:string'` reads verbatim, `'config:json'` parses to a frozen object. */
__publicField(_HgElement, "attributes", []);
/** Reactive properties that live only in JS, never written to an attribute — an array of names, or an object of name → class-wide default (define-time share). */
__publicField(_HgElement, "properties", []);
/** Named event handlers reachable from `on="event:name"`, shared by all instances. A key that is an exact `command` string (`'--add-item'`) also answers that Invoker Command, called as (event, element). */
__publicField(_HgElement, "handlers", {});
/** Named predicates for `bind="key:if#name"` and `key:unless#name`, called as (value, element) at paint — truthy shows the node under `if`, hides it under `unless`. */
__publicField(_HgElement, "conditions", {});
/** Named formatters for `bind="key|name[:arg…]"`, called as (value, element, ...args) at paint — the return value is what lands in the node. Args are property paths resolved on the element, never literals. */
__publicField(_HgElement, "formatters", {});
var HgElement = _HgElement;

// node_modules/book-of-spells/src/elements.mjs
var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
};
function define(tag, ctor) {
  if (typeof customElements === "undefined" || customElements.get(tag)) return;
  customElements.define(tag, ctor);
}
function stepIndex(current, key, length) {
  if (length === 0) return null;
  const to = key === "ArrowDown" || key === "ArrowRight" ? current + 1 : key === "ArrowUp" || key === "ArrowLeft" ? current - 1 : key === "Home" ? 0 : key === "End" ? length - 1 : null;
  if (to === null || to < 0 || to >= length) return null;
  return to;
}

// node_modules/book-of-elementals/src/elementals/slider/index.js
function ratio(value, min, max) {
  if (!(max > min) || !Number.isFinite(value)) return 0;
  if (value <= min) return 0;
  if (value >= max) return 1;
  return (value - min) / (max - min);
}
function clampPair(start, end, gap, moved, min, max, step) {
  if (end - start >= gap) return [start, end];
  if (moved === "start") {
    const pushed2 = end - gap;
    if (pushed2 >= min) return [snapToStep(pushed2, min, max, step, -1), end];
    return [min, snapToStep(Math.min(min + gap, max), min, max, step, 1)];
  }
  const pushed = start + gap;
  if (pushed <= max) return [start, snapToStep(pushed, min, max, step, 1)];
  return [snapToStep(Math.max(max - gap, min), min, max, step, -1), max];
}
function stackedThumb(start, end, max) {
  if (start !== end) return null;
  return end >= max ? "start" : "end";
}
function nearerThumb(value, start, end) {
  const toStart = Math.abs(value - start);
  const toEnd = Math.abs(value - end);
  if (toStart === toEnd) return value > end ? "end" : "start";
  return toStart < toEnd ? "start" : "end";
}
function alongTrack(x, left, width, thumb, rtl) {
  const travel = width - thumb;
  if (!(travel > 0)) return 0;
  const along = (x - left - thumb / 2) / travel;
  return Math.min(Math.max(rtl ? 1 - along : along, 0), 1);
}
function decimals(value) {
  const text = String(value);
  return text.includes("e") ? 0 : (text.split(".")[1] || "").length;
}
function snapToStep(value, min, max, step, direction) {
  if (!(step > 0)) return Math.min(Math.max(value, min), max);
  const places = Math.max(decimals(step), decimals(min));
  const trim = (number) => places ? Number(number.toFixed(places)) : number;
  const steps = (value - min) / step;
  const nearest = Math.round(steps);
  const count = Math.abs(steps - nearest) < 1e-9 ? nearest : direction < 0 ? Math.floor(steps) : direction > 0 ? Math.ceil(steps) : nearest;
  const snapped = min + count * step;
  if (snapped < min) return min;
  if (snapped > max) return trim(min + Math.floor((max - min) / step) * step);
  return trim(snapped);
}
function stepOf(input) {
  return input.step === "any" ? 0 : bound(input.step, 1);
}
function thumbUnder(x, left, width, thumb, ratios, rtl) {
  const travel = Math.max(width - thumb, 0);
  for (let i = 0; i < ratios.length; i++) {
    const at = rtl ? 1 - ratios[i] : ratios[i];
    if (Math.abs(x - (left + thumb / 2 + at * travel)) <= thumb / 2) return i;
  }
  return -1;
}
function draggedThumb(under, count) {
  if (under >= 0) return under;
  return count === 1 ? 0 : -1;
}
function tooltipModes(value) {
  if (value === null || value === void 0) return { thumb: false, track: false };
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return { thumb: true, track: false };
  return { thumb: tokens.includes("thumb"), track: tokens.includes("track") };
}
function bound(value, fallback) {
  const number = parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
}
var SliderElemental = class extends ElementBase {
  static get observedAttributes() {
    return ["gap", "tooltip"];
  }
  /** The thumbs, in document order. Direct children, so a range input inside a card this
   * element happens to wrap is not mistaken for one of them. */
  get inputs() {
    return Array.from(this.querySelectorAll(':scope > input[type="range"]'));
  }
  /**
   * The readouts, in document order, each following the input at the same index.
   *
   * Anywhere inside, unlike the inputs: a readout is nearly always wrapped in the
   * punctuation that gives it meaning - a currency symbol, a unit, the word "to" between a
   * pair - and a rule that only saw direct children would refuse the shape everybody
   * writes. `closest` is what keeps a nested slider's readouts its own.
   *
   * The `tooltip` bubble is an `<output>` too and is not one of these. Counted in, it would
   * take an index off the end of the list and the readouts would each be showing the value
   * of the thumb before their own.
   */
  get outputs() {
    return Array.from(this.querySelectorAll("output:not([data-tooltip])")).filter((output) => output.closest("slider-elemental") === this);
  }
  /** Least distance between the two thumbs, in the scale's own units. */
  get gap() {
    return bound(this.getAttribute("gap"), 0);
  }
  set gap(value) {
    this.setAttribute("gap", value);
  }
  /** Whether the control runs right to left. Computed style rather than `:dir()`, which
   * throws on the browsers that do not know it instead of quietly not matching. */
  get rtl() {
    return typeof getComputedStyle === "function" && getComputedStyle(this).direction === "rtl";
  }
  connectedCallback() {
    if (this.initialized) return;
    const inputs = this.inputs;
    if (!inputs.length) return;
    this.initialized = true;
    this.apply = this.apply.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onReset = this.onReset.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onTooltipDown = this.onTooltipDown.bind(this);
    this.onTooltipUp = this.onTooltipUp.bind(this);
    this.tooltipX = null;
    this.tooltipElement = null;
    this.format = null;
    this.dragging = -1;
    this.addEventListener("input", this.onInput, true);
    this.form = this.closest("form");
    if (this.form) this.form.addEventListener("reset", this.onReset);
    if (typeof window !== "undefined") window.addEventListener("pageshow", this.apply);
    if (inputs.length > 1) {
      this.addEventListener("pointerdown", this.onPointerDown);
      if (!this.hasAttribute("role") && (this.hasAttribute("aria-label") || this.hasAttribute("aria-labelledby"))) {
        this.setAttribute("role", "group");
        this.wroteRole = true;
      }
    }
    this.apply();
    this.syncTooltip();
  }
  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener("input", this.onInput, true);
    this.removeEventListener("pointerdown", this.onPointerDown);
    if (this.form) this.form.removeEventListener("reset", this.onReset);
    if (typeof window !== "undefined") window.removeEventListener("pageshow", this.apply);
    this.form = null;
    this.removeTooltip();
    this.style.removeProperty("--slider-elemental-start");
    this.style.removeProperty("--slider-elemental-end");
    this.removeAttribute("data-stacked");
    if (this.wroteRole) this.removeAttribute("role");
    this.wroteRole = false;
    this.initialized = false;
  }
  /** A new `gap` is a new distance the thumbs may already be inside of. */
  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    if (name === "tooltip") {
      this.syncTooltip();
      return;
    }
    this.clamp("end");
    this.apply();
  }
  /** A form is only put back to its defaults once the `reset` event has been dispatched,
   * so the values are read on the next task rather than in the handler. */
  onReset() {
    setTimeout(this.apply);
  }
  onInput(e) {
    const inputs = this.inputs;
    const index = inputs.indexOf(e.target);
    if (index < 0) return;
    if (index < 2) this.clamp(index === 0 ? "start" : "end");
    this.apply();
  }
  /**
   * Stop the two thumbs crossing, and keep `gap` between them. Public because it is what
   * catches up a pair moved by script, which fires no `input` of its own.
   *
   * Both inputs keep the `min` and `max` the markup gave them, rather than the low one's
   * `max` being pulled down to the high one's value as the
   * [multi-thumb pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/)
   * describes: these are stacked native inputs, so shrinking one's scale moves every pixel
   * on it and the two tracks stop agreeing about where a value is. The pattern's
   * `aria-valuemin`/`aria-valuemax` go with it, and are not written for a second reason -
   * [HTML-ARIA says authors should not put them on `input type=range`](https://www.w3.org/TR/html-aria/),
   * where the browser computes them from `min`, `max` and `value` already.
   */
  clamp(moved) {
    const inputs = this.inputs;
    if (inputs.length < 2) return;
    const min = bound(inputs[0].min, 0);
    const max = bound(inputs[0].max, 100);
    const start = bound(inputs[0].value, min);
    const end = bound(inputs[1].value, max);
    const clamped = clampPair(start, end, this.gap, moved, min, max, stepOf(inputs[0]));
    if (clamped[0] !== start) inputs[0].value = clamped[0];
    if (clamped[1] !== end) inputs[1].value = clamped[1];
  }
  /**
   * Push the thumb positions onto the element, where the CSS reads them. Public because the
   * inputs are read here: swap one out, or move it from script, and this is the one call
   * that catches up.
   */
  apply() {
    const inputs = this.inputs;
    if (!inputs.length) return;
    const min = bound(inputs[0].min, 0);
    const max = bound(inputs[0].max, 100);
    const first = bound(inputs[0].value, min);
    const second = inputs.length > 1 ? bound(inputs[1].value, max) : null;
    this.style.setProperty("--slider-elemental-start", second === null ? 0 : ratio(first, min, max));
    this.style.setProperty("--slider-elemental-end", ratio(second === null ? first : second, min, max));
    const stacked = second === null ? null : stackedThumb(first, second, max);
    if (stacked) {
      this.setAttribute("data-stacked", stacked);
    } else {
      this.removeAttribute("data-stacked");
    }
    const outputs = this.outputs;
    for (let i = 0; i < outputs.length && i < inputs.length; i++) {
      outputs[i].textContent = inputs[i].value;
    }
    if (this.tooltipX !== null) this.showTooltipAt(this.tooltipX);
  }
  /**
   * Put the value bubble in, or take it out, to match the `tooltip` attribute.
   *
   * Written by this element rather than asked of the author: a box reading out where the
   * *pointer* is has no markup anyone would have written anyway, and an `<output>` the page
   * forgot would be a tooltip that silently never appeared. `aria-hidden`, because the input
   * beneath it announces its own value already.
   */
  syncTooltip() {
    const modes = tooltipModes(this.getAttribute("tooltip"));
    const wanted = modes.thumb || modes.track;
    if (wanted && !this.tooltipElement) {
      const bubble = document.createElement("output");
      bubble.setAttribute("aria-hidden", "true");
      bubble.dataset.tooltip = "thumb";
      bubble.hidden = true;
      this.appendChild(bubble);
      this.tooltipElement = bubble;
      this.addEventListener("pointermove", this.onPointerMove);
      this.addEventListener("pointerleave", this.onPointerLeave);
      this.addEventListener("pointerdown", this.onTooltipDown);
      this.addEventListener("pointerup", this.onTooltipUp);
      this.addEventListener("pointercancel", this.onTooltipUp);
    }
    if (!wanted) this.removeTooltip();
    if (this.tooltipElement && this.tooltipX !== null) this.showTooltipAt(this.tooltipX);
  }
  /** The bubble and the listeners that draw it, gone together. The element wrote the bubble,
   * so the element is what takes it back off the page. */
  removeTooltip() {
    if (!this.tooltipElement) return;
    this.removeEventListener("pointermove", this.onPointerMove);
    this.removeEventListener("pointerleave", this.onPointerLeave);
    this.removeEventListener("pointerdown", this.onTooltipDown);
    this.removeEventListener("pointerup", this.onTooltipUp);
    this.removeEventListener("pointercancel", this.onTooltipUp);
    this.tooltipElement.remove();
    this.tooltipElement = null;
    this.tooltipX = null;
    this.dragging = -1;
  }
  onPointerMove(e) {
    if (e.pointerType === "touch") return;
    this.tooltipX = e.clientX;
    this.showTooltipAt(e.clientX);
  }
  /** A press pins the bubble to whatever it is about to drag, for as long as it is held. */
  onTooltipDown(e) {
    if (e.pointerType === "touch") return;
    const m = this.metrics(e.clientX);
    this.dragging = m ? draggedThumb(m.under, m.inputs.length) : -1;
    this.tooltipX = e.clientX;
    this.showTooltipAt(e.clientX);
  }
  /**
   * Let go, and where the pointer is decides again - including that it may have been let go
   * somewhere the bubble has no business still being.
   *
   * Answered from the coordinates rather than from `target` or from a `pointerleave` that
   * follows, because neither survives the drag. A range input holds pointer capture until
   * the release, so `target` is the input wherever on the screen the pointer actually is;
   * and the leave that would have covered it is not something every engine sends - Chromium
   * fires one after the capture ends and WebKit fires none at all, which is a bubble left
   * on the page after every drag that ended off the control.
   */
  onTooltipUp(e) {
    if (e.pointerType === "touch") return;
    this.dragging = -1;
    const rect = this.getBoundingClientRect();
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (inside) this.showTooltipAt(e.clientX);
    else this.onPointerLeave();
  }
  onPointerLeave() {
    if (this.dragging >= 0) return;
    this.tooltipX = null;
    if (this.tooltipElement) this.tooltipElement.hidden = true;
  }
  /**
   * Everything a bubble is drawn from, measured in one go: the scale, where each thumb sits
   * on it, and which one a pointer at `x` is over. `null` where there is nothing to measure.
   */
  metrics(x) {
    const inputs = this.inputs;
    if (!inputs.length) return null;
    const rect = this.getBoundingClientRect();
    const thumb = inputs[0].getBoundingClientRect().height;
    const rtl = this.rtl;
    const min = bound(inputs[0].min, 0);
    const max = bound(inputs[0].max, 100);
    const ratios = inputs.map((input) => ratio(bound(input.value, min), min, max));
    return { inputs, rect, thumb, rtl, min, max, ratios, under: thumbUnder(x, rect.left, rect.width, thumb, ratios, rtl) };
  }
  /**
   * Draw the bubble for a pointer at `x`, in viewport coordinates, or hide it where the
   * attribute did not ask for a bubble at that spot.
   *
   * A thumb reads out its input's own `value`, which the browser has already put on a step
   * and written the way it writes numbers. The track is the only one with a value to work
   * out, and it is worked out the way a press on the track is - same travel, same rounding -
   * so the number previewed is the number a click there would produce.
   *
   * A drag in progress overrules the pointer: `dragging` is the thumb the press pinned this
   * to, and it holds until the release. Without it the bubble answers where the pointer is,
   * which during a drag is beside the thumb half the time.
   */
  showTooltipAt(x) {
    const bubble = this.tooltipElement;
    if (!bubble) return;
    const m = this.metrics(x);
    if (!m) return;
    const modes = tooltipModes(this.getAttribute("tooltip"));
    const over = this.dragging >= 0 && this.dragging < m.inputs.length ? this.dragging : m.under;
    const on = over < 0 ? "track" : "thumb";
    if (!modes[on]) {
      bubble.hidden = true;
      return;
    }
    let at = m.ratios[over];
    let text = over < 0 ? "" : m.inputs[over].value;
    let value = over < 0 ? 0 : Number(m.inputs[over].value);
    if (over < 0) {
      at = alongTrack(x, m.rect.left, m.rect.width, m.thumb, m.rtl);
      value = snapToStep(m.min + at * (m.max - m.min), m.min, m.max, stepOf(m.inputs[0]));
      text = String(value);
    }
    bubble.dataset.tooltip = on;
    bubble.textContent = this.formatValue(value, text);
    bubble.style.setProperty("--slider-elemental-at", at);
    bubble.hidden = false;
  }
  /**
   * What the bubble says for a value, once `format` has had it.
   *
   * `fallback` is the browser's own spelling of the same number and is what shows whenever
   * there is no formatter, so an element nobody has assigned one to reads exactly as it did
   * before this hook existed. A formatter returning nothing falls back too - a bubble that
   * went blank because a function forgot a `return` looks like a broken element rather than
   * a bug in the page.
   */
  formatValue(value, fallback) {
    if (typeof this.format !== "function") return fallback;
    const formatted = this.format(value, this);
    return formatted === void 0 || formatted === null ? fallback : String(formatted);
  }
  /**
   * A press on the track, which stacked inputs would otherwise eat: the one on top covers
   * the whole width, so the stylesheet takes its pointer events away and leaves them on the
   * thumbs. That is what makes both thumbs grabbable, and it is also what leaves the track
   * dead until this runs - the nearer thumb takes the value and the focus.
   */
  onPointerDown(e) {
    if (e.target !== this) return;
    const inputs = this.inputs;
    if (inputs.length < 2) return;
    const rect = this.getBoundingClientRect();
    const thumb = inputs[0].getBoundingClientRect().height;
    if (rect.width <= thumb) return;
    const min = bound(inputs[0].min, 0);
    const max = bound(inputs[0].max, 100);
    const value = min + alongTrack(e.clientX, rect.left, rect.width, thumb, this.rtl) * (max - min);
    const input = inputs[nearerThumb(value, bound(inputs[0].value, min), bound(inputs[1].value, max)) === "start" ? 0 : 1];
    input.value = value;
    e.preventDefault();
    input.focus();
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
};
define("slider-elemental", SliderElemental);

// node_modules/book-of-elementals/src/elementals/progress/index.js
function percent(value, max) {
  if (!(max > 0) || !Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= max) return 100;
  return value * 100 / max;
}
var ProgressElemental = class extends ElementBase {
  static get observedAttributes() {
    return ["buffer"];
  }
  /** The bar. Direct child, so a `<progress>` inside a card this element happens to wrap
   * is not mistaken for the one being measured. */
  get progress() {
    return this.querySelector(":scope > progress");
  }
  /**
   * The value, or `null` while there is none. Setting `null` takes the attribute off and
   * puts the bar back to indeterminate, which is what
   * [MDN says to do](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress)
   * and the only way there is.
   */
  get value() {
    const progress = this.progress;
    return progress && progress.hasAttribute("value") ? progress.value : null;
  }
  set value(value) {
    const progress = this.progress;
    if (!progress) return;
    if (value === null || value === void 0) {
      progress.removeAttribute("value");
      return;
    }
    progress.value = value;
  }
  /** What counts as done. The `<progress>`'s own, which is `1` when it has none. */
  get max() {
    const progress = this.progress;
    return progress ? progress.max : null;
  }
  set max(value) {
    const progress = this.progress;
    if (progress) progress.max = value;
  }
  /** The second value, on the same scale. `null` is no buffer bar. */
  get buffer() {
    const value = this.getAttribute("buffer");
    if (value === null || value === "") return null;
    const number = parseFloat(value);
    return Number.isFinite(number) ? number : null;
  }
  set buffer(value) {
    if (value === null || value === void 0 || value === "") {
      this.removeAttribute("buffer");
      return;
    }
    this.setAttribute("buffer", value);
  }
  connectedCallback() {
    if (this.initialized) return;
    const progress = this.progress;
    if (!progress) return;
    this.initialized = true;
    this.apply = this.apply.bind(this);
    this.observer = new MutationObserver(this.apply);
    this.observer.observe(progress, { attributes: true, attributeFilter: ["value", "max"] });
    this.apply();
  }
  disconnectedCallback() {
    if (!this.initialized) return;
    this.observer.disconnect();
    this.observer = null;
    this.style.removeProperty("--progress-elemental-value");
    this.style.removeProperty("--progress-elemental-buffer");
    this.removeAttribute("data-indeterminate");
    this.initialized = false;
  }
  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    this.apply();
  }
  /**
   * Push the bar's state onto the element, where the CSS reads it. Public because a
   * `<progress>` swapped out from under this element is not something the observer is
   * watching for: replace the child and call this.
   *
   * `data-indeterminate` as well as the missing percentage, because CSS cannot ask whether
   * a custom property was set - an unset one inside `calc()` is a bar sitting at zero, and
   * a bar at zero is a claim that nothing has happened yet rather than that nobody knows.
   */
  apply() {
    const progress = this.progress;
    if (!progress) return;
    const max = progress.max;
    if (progress.hasAttribute("value")) {
      this.removeAttribute("data-indeterminate");
      this.style.setProperty("--progress-elemental-value", `${percent(progress.value, max)}%`);
    } else {
      this.setAttribute("data-indeterminate", "");
      this.style.removeProperty("--progress-elemental-value");
    }
    const buffer = this.buffer;
    if (buffer === null) {
      this.style.removeProperty("--progress-elemental-buffer");
      return;
    }
    this.style.setProperty("--progress-elemental-buffer", `${percent(buffer, max)}%`);
  }
};
define("progress-elemental", ProgressElemental);

// node_modules/book-of-elementals/src/elementals/toolbar/index.js
function toolbarKey(key, vertical) {
  if (key === "Home" || key === "End") return key;
  if (key === (vertical ? "ArrowDown" : "ArrowRight")) return key;
  if (key === (vertical ? "ArrowUp" : "ArrowLeft")) return key;
  return null;
}
var CONTROLS = "button, a[href]";
var ToolbarElemental = class extends ElementBase {
  static get observedAttributes() {
    return ["vertical"];
  }
  /** Whether the bar runs down the page. Reflected, so `[vertical]` is a styling hook. */
  get vertical() {
    return this.hasAttribute("vertical");
  }
  set vertical(value) {
    this.toggleAttribute("vertical", !!value);
  }
  /**
   * The controls the arrows walk, in document order.
   *
   * A `disabled` button is left out because the platform will not focus one, and a cursor
   * that lands where focus cannot follow is a bar that stops moving. Keeping such a control
   * reachable is `aria-disabled` on it instead - still focusable, still announced, and this
   * list still has it.
   */
  get controls() {
    return Array.from(this.querySelectorAll(CONTROLS)).filter((control) => !control.disabled);
  }
  connectedCallback() {
    if (this.initialized) return;
    if (!this.controls.length) return;
    this.initialized = true;
    this.setAttribute("role", "toolbar");
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onFocusIn = this.onFocusIn.bind(this);
    this.addEventListener("keydown", this.onKeyDown);
    this.addEventListener("focusin", this.onFocusIn);
    this.observer = new MutationObserver(() => this.wire());
    this.observer.observe(this, { childList: true, subtree: true, attributeFilter: ["disabled"] });
    this.wire();
  }
  disconnectedCallback() {
    if (!this.initialized) return;
    this.initialized = false;
    if (this.observer) this.observer.disconnect();
    this.observer = null;
    this.removeEventListener("keydown", this.onKeyDown);
    this.removeEventListener("focusin", this.onFocusIn);
    this.removeAttribute("role");
    this.removeAttribute("aria-orientation");
    for (const control of this.controls) control.removeAttribute("tabindex");
  }
  /**
   * Put the axis on the bar and the single tab stop inside it.
   *
   * The stop follows focus where there is any, so a bar entered by clicking its last button
   * is a bar the arrows carry on from there rather than one that jumps back to the start.
   */
  wire() {
    if (this.vertical) this.setAttribute("aria-orientation", "vertical");
    else this.removeAttribute("aria-orientation");
    const controls = this.controls;
    if (!controls.length) return;
    const focused = controls.find((control) => control === document.activeElement);
    const held = controls.find((control) => control.getAttribute("tabindex") === "0");
    const stop = focused || held || controls[0];
    for (const control of controls) control.tabIndex = control === stop ? 0 : -1;
  }
  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    this.wire();
  }
  onFocusIn() {
    this.wire();
  }
  onKeyDown(e) {
    const key = toolbarKey(e.key, this.vertical);
    if (!key) return;
    const controls = this.controls;
    const at = controls.indexOf(e.target);
    if (at === -1) return;
    const to = stepIndex(at, key, controls.length);
    if (to === null) return;
    e.preventDefault();
    controls[to].focus();
  }
};
define("toolbar-elemental", ToolbarElemental);

// src/scripts/media-player.js
var LIVE_DURATION = 2 ** 32;
var VOLUME_SCALE = 100;
var VOLUME_STEP = 0.1;
var CONTROLS_LINGER = 5e3;
var VOLUME_SETTLE = 500;
function pad(value) {
  return value < 10 ? `0${value}` : `${value}`;
}
function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const secs = total % 60;
  const mins = Math.floor(total / 60) % 60;
  const hrs = Math.floor(total / 3600);
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}
function clampVolume(value) {
  if (value > 0.9) return 1;
  if (value < 0.1) return 0;
  return value;
}
function volumeState(value) {
  if (value < 0.1) return "mute";
  if (value < 0.6) return "mid";
  return "full";
}
var MediaPlayer = class extends HgElement {
  connected() {
    this.media = this.querySelector("audio, video");
    if (!this.media) {
      console.warn("media-player: no <audio> or <video> inside \u2014 nothing to play");
      return;
    }
    this.isVideo = this.media.tagName === "VIDEO";
    this.frame = 0;
    this.linger = null;
    if (this.isVideo) {
      this.noFullscreen = !(document.fullscreenEnabled || this.media.webkitEnterFullscreen);
    }
    this.hadControls = this.media.controls;
    this.media.controls = false;
    if (this.isReady) {
      this.resume();
      return;
    }
    this.duration = 0;
    this.currentTime = 0;
    this.remaining = 0;
    this.buffered = 0;
    this.isBuffering = true;
    this.playLabel = "Play";
    this.muteLabel = "Mute";
    this.captionsLabel = "Enable captions";
    this.timeFormatter = formatTime;
    this.track = this.media.querySelector("track");
    if (this.track) this.hasCaptions = true;
    this.restore();
    if (this.media.readyState > 0) this.loaded();
  }
  disconnected() {
    cancelAnimationFrame(this.frame);
    if (this.linger) clearTimeout(this.linger);
    if (this.settle) clearTimeout(this.settle);
    if (this.media && this.hadControls) this.media.controls = true;
  }
  /**
   * Metadata has arrived. Idempotent, because five different events mean it.
   */
  loaded() {
    if (this.isReady || !this.media) return;
    const duration = this.media.duration;
    if (!duration || Number.isNaN(duration)) return;
    this.isLive = duration >= LIVE_DURATION;
    this.duration = this.isLive ? 0 : duration;
    this.remaining = this.duration;
    this.isReady = true;
    this.isBuffering = false;
    this.syncVolume();
    this.onProgress();
    for (const control of this.querySelectorAll("[disabled]")) control.removeAttribute("disabled");
    this.dispatchEvent(new CustomEvent("media-player-ready", { bubbles: true }));
  }
  // PLAYBACK
  play() {
    this.media?.play();
  }
  pause() {
    this.media?.pause();
  }
  togglePlay() {
    if (!this.media) return;
    if (this.media.paused) this.play();
    else this.pause();
  }
  /** Pause and go home. `seekTo` refuses both halves for a live stream, so there it only pauses. */
  stop() {
    if (!this.media) return;
    this.pause();
    this.seekTo(0);
    this.interaction("stop");
  }
  skipForward() {
    if (!this.media || this.isLive) return;
    this.seekBy(this.skipStep);
    this.interaction("skip-forward", this.skipStep);
  }
  skipBackward() {
    if (!this.media || this.isLive) return;
    this.seekBy(-this.skipStep);
    this.interaction("skip-backward", this.skipStep);
  }
  /** Seconds a skip button moves — the `skip` attribute, or ten. */
  get skipStep() {
    const step = Number(this.skip);
    return Number.isFinite(step) && step > 0 ? step : 10;
  }
  seekBy(seconds) {
    if (!this.media || this.isLive) return;
    this.seekTo(this.media.currentTime + seconds);
    this.posterHidden = true;
  }
  seekTo(seconds) {
    if (!this.media || this.isLive) return;
    const bounded = Math.min(Math.max(seconds, 0), this.media.duration || 0);
    this.media.currentTime = bounded;
    this.paint(bounded);
  }
  /**
   * Write the clock, the countdown and the scrubber position for one moment.
   *
   * One method rather than a setter each, because the three have to agree: a scrubber at
   * 1:03 beside a label reading 1:04 is the kind of wrong that looks like a rounding bug
   * and is actually two code paths.
   */
  paint(seconds) {
    this.currentTime = seconds;
    this.remaining = Math.max((this.media?.duration || 0) - seconds, 0);
  }
  /**
   * The playing clock.
   *
   * `timeupdate` fires about four times a second, which is visibly steppy under a moving
   * thumb, so the position comes off an animation frame while playing and the listener is
   * not used at all. Cancelled on pause, and never scheduled for a live stream — there is
   * no clock to paint, and a loop that painted nothing would still run at sixty a second.
   */
  tick() {
    if (!this.media || this.media.paused || this.isLive) return;
    this.paint(this.media.currentTime);
    this.frame = requestAnimationFrame(() => this.tick());
  }
  // HANDLERS THE MARKUP NAMES
  onLoaded() {
    this.loaded();
  }
  onPlay() {
    this.isPlaying = true;
    this.isBuffering = false;
    this.posterHidden = true;
    this.playLabel = "Pause";
    this.resume();
    this.interaction("play");
    if (this.isVideo) this.showControls();
  }
  onPause() {
    this.isPlaying = false;
    this.isBuffering = false;
    this.playLabel = "Play";
    cancelAnimationFrame(this.frame);
    this.interaction("pause");
    if (this.isVideo) {
      if (this.linger) clearTimeout(this.linger);
      this.controlsShown = true;
    }
  }
  /**
   * Playback reached the end.
   *
   * The clock is painted here rather than left where the last animation frame put it. That
   * frame ran some fraction of a second before the end and the scrubber floors to whole
   * seconds, so a track that finished would leave the thumb a step short of the end it just
   * reached — the one position a listener is certain about, and the one it got wrong.
   */
  onEnded() {
    if (!this.isLive && this.media) this.paint(this.media.duration);
    this.pause();
  }
  onWaiting() {
    this.isBuffering = true;
  }
  onPlaying() {
    this.isBuffering = false;
  }
  /**
   * How far ahead the browser has loaded, in seconds.
   *
   * Seconds rather than a percentage so it shares a scale with `duration`, which is what the
   * `<progress>` behind the scrubber is set to — two values on one `max`, which is the whole
   * reason the buffered bar can sit behind the played one without any arithmetic in the
   * markup.
   *
   * The range the playhead sits in, not the first or the furthest: after a seek the browser
   * holds disjoint ranges, and either end would lie — the first stops behind the playhead,
   * the last draws a bar over a gap playback has not crossed. When the playhead is between
   * ranges the bar keeps its last value rather than guessing.
   */
  onProgress() {
    if (!this.media || !this.media.duration) return;
    const ranges = this.media.buffered;
    const at = this.media.currentTime;
    for (let i = 0; i < ranges.length; i++) {
      if (ranges.start(i) <= at && at <= ranges.end(i)) {
        this.buffered = ranges.end(i);
        return;
      }
    }
  }
  /**
   * Start or restart the clock, exactly once.
   *
   * Cancel before scheduling, always: `tick` schedules the next frame from inside itself, so
   * a second entry point that only called `tick` would leave two loops running and the
   * handle to just one of them.
   */
  resume() {
    cancelAnimationFrame(this.frame);
    this.tick();
  }
  /**
   * Dragging the scrubber: paint the labels, do not seek until the drag ends.
   *
   * The value is kept here rather than read back off the input when the drag commits. Two
   * events end a drag and their order is not guaranteed — Chrome sends `pointerup` before
   * `change` — and the clock restarting on the first of them writes `currentTime` straight
   * back into `input.value`. Whichever event then read the DOM would read the clock's
   * number instead of the one under the thumb, and the seek would go to where playback
   * already was.
   */
  scrub(event) {
    if (!this.media || this.isLive) return;
    cancelAnimationFrame(this.frame);
    this.pendingSeek = Number(event.target.value);
    this.paint(this.pendingSeek);
  }
  seek() {
    this.endDrag();
  }
  /**
   * A drag ended, whatever it did to the value.
   *
   * `change` cannot be the only way back: a thumb picked up and put down where it started
   * fires `input` — which stopped the clock — and then no `change` at all, because the value
   * the field ends on is the value it began on. The clock would stay stopped over playing
   * audio until the next play or pause. Bound to `pointerup` on the document rather than the
   * input, since a drag very often ends with the pointer somewhere else entirely.
   */
  endScrub() {
    this.endDrag();
  }
  /**
   * Land the drag: seek where the thumb was let go, forget it, start the clock.
   *
   * Both enders route here and the pending value is cleared first, so whichever of `change`
   * and `pointerup` arrives second finds nothing to land and only restarts the clock. Two
   * seeks from one release would be two `media-player-interaction` events for one gesture,
   * and the second would seek to wherever the restarted clock had already written.
   */
  endDrag() {
    const seconds = this.pendingSeek;
    if (seconds === null || seconds === void 0) {
      this.resume();
      return;
    }
    this.pendingSeek = null;
    this.seekTo(seconds);
    this.posterHidden = true;
    this.interaction("seek", this.currentTime);
    this.resume();
  }
  // VOLUME
  /**
   * The volume slider, per `input` event.
   *
   * The level is applied immediately — the sound has to follow the thumb — but persisting
   * and announcing wait for the drag to settle: `input` fires for every pixel, and a
   * localStorage write per pixel is a synchronous disk touch dozens of times a second.
   */
  setVolume(event) {
    this.applyVolume(Number(event.target.value) / VOLUME_SCALE, false);
    clearTimeout(this.settle);
    this.settle = setTimeout(() => {
      if (!this.media) return;
      this.rememberVolume(this.media.volume);
      this.interaction("volume", this.media.volume);
    }, VOLUME_SETTLE);
  }
  volumeUp() {
    this.stepVolume(1);
  }
  volumeDown() {
    this.stepVolume(-1);
  }
  /**
   * One press of a dedicated volume button — for a UI without a slider.
   *
   * From muted it climbs from zero in steps rather than jumping back to the remembered
   * level: a button press promises a small change. The step equals the mute threshold, so
   * the first press up is audible and the last press down is silence, with no dead press
   * at either end.
   */
  stepVolume(direction) {
    if (!this.media) return;
    const current = this.media.muted ? 0 : this.media.volume;
    this.applyVolume(current + direction * VOLUME_STEP);
    this.interaction(direction > 0 ? "volume-up" : "volume-down", this.media.volume);
  }
  applyVolume(value, remember = true) {
    if (!this.media) return;
    const volume = clampVolume(value);
    this.media.muted = volume === 0;
    this.media.volume = volume;
    if (volume > 0) this.lastVolume = volume;
    if (remember) this.rememberVolume(volume);
  }
  /**
   * Persist the level and the flag as two entries, and never store a zero level: muting
   * writes `muted` and leaves `volume` at what it was, so a reload restores the mute and
   * unmuting after it returns to the old level rather than jumping to full.
   */
  rememberVolume(volume) {
    if (volume > 0) this.store("volume", volume);
    this.store("muted", volume === 0);
  }
  toggleMute() {
    if (!this.media) return;
    const muting = !this.media.muted && this.media.volume > 0;
    this.applyVolume(muting ? 0 : this.lastVolume || 1);
    this.interaction(muting ? "mute" : "unmute");
  }
  /**
   * The DOM's volume back into the controls.
   *
   * Bound to `volumechange` as well as called directly, because the media element is not the
   * only thing that can move it — an OS media key and a devtools poke both land here, and a
   * slider that disagrees with the sound coming out is worse than no slider.
   */
  syncVolume() {
    if (!this.media) return;
    const volume = this.media.muted ? 0 : this.media.volume;
    this.volumePercent = Math.round(volume * VOLUME_SCALE);
    this.volumeState = volumeState(volume);
    this.muteLabel = volume === 0 ? "Unmute" : "Mute";
  }
  onVolumeChange() {
    this.syncVolume();
  }
  // CAPTIONS
  onCue(event) {
    const track = event.target.track;
    const cues = track?.activeCues;
    if (!cues || !cues.length) {
      this.captionText = null;
      return;
    }
    track.mode = "hidden";
    this.captionText = cues[0].text;
  }
  toggleCaptions() {
    this.setCaptions(!this.captionsVisible);
    this.interaction(this.captionsVisible ? "captions-on" : "captions-off");
  }
  setCaptions(visible, remember = true) {
    if (!this.track) return;
    this.captionsVisible = visible;
    this.captionsLabel = visible ? "Disable captions" : "Enable captions";
    this.track.track.mode = visible ? "hidden" : "disabled";
    if (!visible) this.captionText = null;
    if (remember) this.store("captions", visible);
  }
  // FULLSCREEN
  /**
   * Fullscreen, by feature test rather than by browser.
   *
   * iPhone Safari has never allowed an arbitrary element to go fullscreen; what it has is
   * `webkitEnterFullscreen` on the video element itself, which takes the video over natively
   * and leaves these controls behind. Asking the element what it can do — rather than asking
   * the user agent string who it is — is the version that keeps working when the answer
   * changes.
   */
  toggleFullscreen() {
    if (!this.isVideo) return;
    if (document.fullscreenElement === this) {
      document.exitFullscreen();
      this.interaction("fullscreen", false);
      return;
    }
    if (this.requestFullscreen) this.requestFullscreen();
    else if (this.media.webkitEnterFullscreen) this.media.webkitEnterFullscreen();
    else return;
    this.interaction("fullscreen", true);
  }
  onFullscreenChange() {
    this.isFullscreen = document.fullscreenElement === this;
  }
  // VIDEO CONTROLS THAT HIDE THEMSELVES
  /**
   * Show the controls, and start the clock that takes them away again.
   *
   * A paused video keeps them: the timer is only started while something is playing, so a
   * player sitting paused never hides the button that would start it.
   */
  showControls() {
    if (!this.isVideo) return;
    this.controlsShown = true;
    if (this.linger) clearTimeout(this.linger);
    if (!this.media || this.media.paused) return;
    this.linger = setTimeout(() => {
      this.controlsShown = false;
    }, CONTROLS_LINGER);
  }
  // PERSISTENCE
  /** The prefix for remembered values — `storage-key`, or one shared by every player. */
  get storageKey() {
    return this.getAttribute("storage-key") || "media-player";
  }
  /**
   * Remember a value, if the browser will have it.
   *
   * `localStorage` throws rather than returning anything in a Safari private window and
   * under a cookie policy that blocks storage. Remembering the volume is a nicety; taking
   * the page down over it is not, so the failure is swallowed here and nowhere else.
   */
  store(key, value) {
    try {
      localStorage.setItem(`${this.storageKey}-${key}`, JSON.stringify(value));
    } catch {
    }
  }
  read(key) {
    try {
      const raw = localStorage.getItem(`${this.storageKey}-${key}`);
      return raw === null ? null : JSON.parse(raw);
    } catch {
      return null;
    }
  }
  /**
   * Volume, mute and captions from last time.
   *
   * Nothing is written back while restoring: `applyVolume` would otherwise store the value
   * it just read, and a player that never got a real volume set on it would keep rewriting
   * the same entry on every page load.
   */
  restore() {
    const volume = this.read("volume");
    const muted = this.read("muted");
    if (typeof volume === "number") this.applyVolume(muted ? 0 : volume, false);
    if (typeof volume === "number" && volume > 0) this.lastVolume = volume;
    this.syncVolume();
    const captions = this.read("captions");
    if (this.track) this.setCaptions(captions === true, false);
  }
  /** Something was pressed, dragged or toggled. One event, so a page can log all of it. */
  interaction(type, value = null) {
    this.dispatchEvent(new CustomEvent("media-player-interaction", {
      bubbles: true,
      detail: { type, value }
    }));
  }
};
__publicField(MediaPlayer, "attributes", [
  "is-ready",
  "is-playing",
  "is-buffering",
  "is-live",
  "is-video",
  "is-fullscreen",
  "no-fullscreen",
  "controls-shown",
  "poster-hidden",
  "has-captions",
  "captions-visible",
  "volume-state",
  "skip"
]);
/**
 * State that never reaches the DOM.
 *
 * `currentTime` moves sixty times a second while playing. Reflected to an attribute that
 * would be sixty `setAttribute` calls a second, every one of them waking anything watching
 * the subtree — so the values that move fast live here, and only the flags CSS needs are
 * attributes.
 */
__publicField(MediaPlayer, "properties", [
  "currentTime",
  "remaining",
  "duration",
  "buffered",
  "volumePercent",
  "playLabel",
  "muteLabel",
  "captionsLabel",
  "captionText",
  "timeFormatter"
]);
__publicField(MediaPlayer, "formatters", {
  time: (value) => formatTime(value),
  /**
   * Whole seconds, for the two nodes that draw the scrubber.
   *
   * The thumb and the played bar have to be given the *same* number or they disagree on
   * screen. A range input with `step="1"` snaps what it is assigned to the **nearest**
   * step while a bar drawn from the raw value keeps every decimal, so 3.6 is a thumb at 4
   * beside a fill at 3.6 — a whole step apart at the worst moment, twice a second. Floor
   * both and there is one number and nothing to disagree about.
   */
  floor: (value) => Number.isFinite(value) ? Math.floor(value) : value
});
if (typeof customElements !== "undefined" && !customElements.get("media-player")) {
  customElements.define("media-player", MediaPlayer);
}
var media_player_default = MediaPlayer;
export {
  CONTROLS_LINGER,
  LIVE_DURATION,
  MediaPlayer,
  VOLUME_SCALE,
  VOLUME_SETTLE,
  VOLUME_STEP,
  clampVolume,
  media_player_default as default,
  formatTime,
  volumeState
};
//# sourceMappingURL=media-player.mjs.map
