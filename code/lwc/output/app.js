(function (lwc) {
    'use strict';

    /**
     * Copyright (C) 2018 salesforce.com, inc.
     */

    /**
     * Copyright (C) 2018 salesforce.com, inc.
     */

    /*
     * Copyright (c) 2018, salesforce.com, inc.
     * All rights reserved.
     * SPDX-License-Identifier: MIT
     * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
     */
    function invariant(value, msg) {
      if (!value) {
        throw new Error(`Invariant Violation: ${msg}`);
      }
    }

    function isTrue(value, msg) {
      if (!value) {
        throw new Error(`Assert Violation: ${msg}`);
      }
    }

    function isFalse(value, msg) {
      if (value) {
        throw new Error(`Assert Violation: ${msg}`);
      }
    }

    function fail(msg) {
      throw new Error(msg);
    }

    var assert = /*#__PURE__*/Object.freeze({
      __proto__: null,
      invariant: invariant,
      isTrue: isTrue,
      isFalse: isFalse,
      fail: fail
    });

    function isUndefined(obj) {
      return obj === undefined;
    }
    /*
     * Copyright (c) 2018, salesforce.com, inc.
     * All rights reserved.
     * SPDX-License-Identifier: MIT
     * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
     */

    /*
     * In IE11, symbols are expensive.
     * Due to the nature of the symbol polyfill. This method abstract the
     * creation of symbols, so we can fallback to string when native symbols
     * are not supported. Note that we can't use typeof since it will fail when transpiling.
     */


    const hasNativeSymbolsSupport = Symbol('x').toString() === 'Symbol(x)';
    /** version: 1.3.7-226.4 */

    /*
     * Copyright (c) 2018, salesforce.com, inc.
     * All rights reserved.
     * SPDX-License-Identifier: MIT
     * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
     */
    // key in engine service context for wire service context

    const CONTEXT_ID = '@wire'; // key in wire service context for updated listener metadata

    const CONTEXT_UPDATED = 'updated'; // key in wire service context for connected listener metadata

    const CONTEXT_CONNECTED = 'connected'; // key in wire service context for disconnected listener metadata

    const CONTEXT_DISCONNECTED = 'disconnected'; // wire event target life cycle connectedCallback hook event type

    const CONNECT = 'connect'; // wire event target life cycle disconnectedCallback hook event type

    const DISCONNECT = 'disconnect'; // wire event target life cycle config changed hook event type

    const CONFIG = 'config';
    /*
     * Copyright (c) 2018, salesforce.com, inc.
     * All rights reserved.
     * SPDX-License-Identifier: MIT
     * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
     */

    /*
     * Detects property changes by installing setter/getter overrides on the component
     * instance.
     */

    /**
     * Invokes the provided change listeners with the resolved component properties.
     * @param configListenerMetadatas List of config listener metadata (config listeners and their context)
     * @param paramValues Values for all wire adapter config params
     */

    function invokeConfigListeners(configListenerMetadatas, paramValues) {
      configListenerMetadatas.forEach(metadata => {
        const {
          listener,
          statics,
          reactives
        } = metadata;
        const reactiveValues = Object.create(null);

        if (reactives) {
          const keys = Object.keys(reactives);

          for (let j = 0, jlen = keys.length; j < jlen; j++) {
            const key = keys[j];
            const value = paramValues[reactives[key]];
            reactiveValues[key] = value;
          }
        } // TODO [#1634]: consider read-only membrane to enforce invariant of immutable config


        const config = Object.assign({}, statics, reactiveValues);
        listener.call(undefined, config);
      });
    }
    /**
     * Marks a reactive parameter as having changed.
     * @param cmp The component
     * @param reactiveParameters Reactive parameters that has changed
     * @param configContext The service context
     */


    function updated(cmp, reactiveParameters, configContext) {
      if (!configContext.mutated) {
        configContext.mutated = new Set(reactiveParameters); // collect all prop changes via a microtask

        Promise.resolve().then(updatedFuture.bind(undefined, cmp, configContext));
      } else {
        for (let i = 0, n = reactiveParameters.length; i < n; i++) {
          configContext.mutated.add(reactiveParameters[i]);
        }
      }
    }

    function updatedFuture(cmp, configContext) {
      const uniqueListeners = new Set(); // configContext.mutated must be set prior to invoking this function

      const mutated = configContext.mutated;
      delete configContext.mutated;
      mutated.forEach(reactiveParameter => {
        const value = getReactiveParameterValue(cmp, reactiveParameter);

        if (configContext.values[reactiveParameter.reference] === value) {
          return;
        }

        configContext.values[reactiveParameter.reference] = value;
        const listeners = configContext.listeners[reactiveParameter.head];

        for (let i = 0, len = listeners.length; i < len; i++) {
          uniqueListeners.add(listeners[i]);
        }
      });
      invokeConfigListeners(uniqueListeners, configContext.values);
    }
    /**
     * Gets the value of an @wire reactive parameter.
     * @param cmp The component
     * @param reactiveParameter The parameter to get
     */


    function getReactiveParameterValue(cmp, reactiveParameter) {
      let value = cmp[reactiveParameter.head];

      if (!reactiveParameter.tail) {
        return value;
      }

      const segments = reactiveParameter.tail;

      for (let i = 0, len = segments.length; i < len && value != null; i++) {
        const segment = segments[i];

        if (typeof value !== 'object' || !(segment in value)) {
          return undefined;
        }

        value = value[segment];
      }

      return value;
    }
    /**
     * Installs setter override to trap changes to a property, triggering the config listeners.
     * @param cmp The component
     * @param reactiveParametersHead The common head of the reactiveParameters
     * @param reactiveParameters Reactive parameters with the same head, that defines the property to monitor
     * @param configContext The service context
     */


    function installTrap(cmp, reactiveParametersHead, reactiveParameters, configContext) {
      const callback = updated.bind(undefined, cmp, reactiveParameters, configContext);
      const newDescriptor = getOverrideDescriptor(cmp, reactiveParametersHead, callback);
      Object.defineProperty(cmp, reactiveParametersHead, newDescriptor);
    }
    /**
     * Finds the descriptor of the named property on the prototype chain
     * @param target The target instance/constructor function
     * @param propName Name of property to find
     * @param protoSet Prototypes searched (to avoid circular prototype chains)
     */


    function findDescriptor(target, propName, protoSet) {
      protoSet = protoSet || [];

      if (!target || protoSet.indexOf(target) > -1) {
        return null; // null, undefined, or circular prototype definition
      }

      const descriptor = Object.getOwnPropertyDescriptor(target, propName);

      if (descriptor) {
        return descriptor;
      }

      const proto = Object.getPrototypeOf(target);

      if (!proto) {
        return null;
      }

      protoSet.push(target);
      return findDescriptor(proto, propName, protoSet);
    }
    /**
     * Gets a property descriptor that monitors the provided property for changes
     * @param cmp The component
     * @param prop The name of the property to be monitored
     * @param callback A function to invoke when the prop's value changes
     * @return A property descriptor
     */


    function getOverrideDescriptor(cmp, prop, callback) {
      const descriptor = findDescriptor(cmp, prop);
      let enumerable;
      let get;
      let set; // This does not cover the override of existing descriptors at the instance level
      // and that's ok because eventually we will not need to do any of these :)

      if (descriptor === null || descriptor.get === undefined && descriptor.set === undefined) {
        let value = cmp[prop];
        enumerable = true;

        get = function () {
          return value;
        };

        set = function (newValue) {
          value = newValue;
          callback();
        };
      } else {
        const {
          set: originalSet,
          get: originalGet
        } = descriptor;
        enumerable = descriptor.enumerable;

        set = function (newValue) {
          if (originalSet) {
            originalSet.call(cmp, newValue);
          }

          callback();
        };

        get = function () {
          return originalGet ? originalGet.call(cmp) : undefined;
        };
      }

      return {
        set,
        get,
        enumerable,
        configurable: true
      };
    }
    /*
     * Copyright (c) 2018, salesforce.com, inc.
     * All rights reserved.
     * SPDX-License-Identifier: MIT
     * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
     */


    const ValueChangedEventType = 'ValueChangedEvent';
    /**
     * Event fired by wire adapters to emit a new value.
     */

    class ValueChangedEvent {
      constructor(value) {
        this.type = ValueChangedEventType;
        this.value = value;
      }

    }
    /*
     * Copyright (c) 2018, salesforce.com, inc.
     * All rights reserved.
     * SPDX-License-Identifier: MIT
     * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
     */


    const LinkContextEventType = 'LinkContextEvent';
    /**
     * Event fired by wire adapters to link to a context provider
     */

    class LinkContextEvent {
      constructor(uid, callback) {
        this.type = LinkContextEventType;
        this.uid = uid;
        this.callback = callback;
      }

    }
    /*
     * Copyright (c) 2018, salesforce.com, inc.
     * All rights reserved.
     * SPDX-License-Identifier: MIT
     * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
     */


    function removeListener(listeners, toRemove) {
      const idx = listeners.indexOf(toRemove);

      if (idx > -1) {
        listeners.splice(idx, 1);
      }
    }

    function removeConfigListener(configListenerMetadatas, toRemove) {
      for (let i = 0, len = configListenerMetadatas.length; i < len; i++) {
        if (configListenerMetadatas[i].listener === toRemove) {
          configListenerMetadatas.splice(i, 1);
          return;
        }
      }
    }

    function buildReactiveParameter(reference) {
      if (!reference.includes('.')) {
        return {
          reference,
          head: reference
        };
      }

      const segments = reference.split('.');
      return {
        reference,
        head: segments.shift(),
        tail: segments
      };
    }

    class WireEventTarget {
      constructor(cmp, def, context, wireDef, wireTarget) {
        this._cmp = cmp;
        this._def = def;
        this._context = context;
        this._wireDef = wireDef;
        this._wireTarget = wireTarget;
      }

      addEventListener(type, listener) {
        switch (type) {
          case CONNECT:
            {
              const connectedListeners = this._context[CONTEXT_ID][CONTEXT_CONNECTED];

              if (process.env.NODE_ENV !== 'production') {
                assert.isFalse(connectedListeners.includes(listener), 'must not call addEventListener("connect") with the same listener');
              }

              connectedListeners.push(listener);
              break;
            }

          case DISCONNECT:
            {
              const disconnectedListeners = this._context[CONTEXT_ID][CONTEXT_DISCONNECTED];

              if (process.env.NODE_ENV !== 'production') {
                assert.isFalse(disconnectedListeners.includes(listener), 'must not call addEventListener("disconnect") with the same listener');
              }

              disconnectedListeners.push(listener);
              break;
            }

          case CONFIG:
            {
              const reactives = this._wireDef.params;
              const statics = this._wireDef.static;
              let reactiveKeys; // no reactive parameters. fire config once with static parameters (if present).

              if (!reactives || (reactiveKeys = Object.keys(reactives)).length === 0) {
                const config = statics || Object.create(null);
                listener.call(undefined, config);
                return;
              }

              const configListenerMetadata = {
                listener,
                statics,
                reactives
              }; // setup listeners for all reactive parameters

              const configContext = this._context[CONTEXT_ID][CONTEXT_UPDATED];
              const reactiveParametersGroupByHead = {};
              reactiveKeys.forEach(key => {
                const reactiveParameter = buildReactiveParameter(reactives[key]);
                const reactiveParameterHead = reactiveParameter.head;
                let configListenerMetadatas = configContext.listeners[reactiveParameterHead];
                let reactiveParametersWithSameHead = reactiveParametersGroupByHead[reactiveParameterHead];

                if (isUndefined(reactiveParametersWithSameHead)) {
                  reactiveParametersWithSameHead = [];
                  reactiveParametersGroupByHead[reactiveParameterHead] = reactiveParametersWithSameHead;
                }

                reactiveParametersWithSameHead.push(reactiveParameter);

                if (!configListenerMetadatas) {
                  configListenerMetadatas = [configListenerMetadata];
                  configContext.listeners[reactiveParameterHead] = configListenerMetadatas;
                  installTrap(this._cmp, reactiveParameterHead, reactiveParametersWithSameHead, configContext);
                } else {
                  configListenerMetadatas.push(configListenerMetadata);
                }
              }); // enqueue to pickup default values

              Object.keys(reactiveParametersGroupByHead).forEach(head => {
                updated(this._cmp, reactiveParametersGroupByHead[head], configContext);
              });
              break;
            }

          default:
            throw new Error(`unsupported event type ${type}`);
        }
      }

      removeEventListener(type, listener) {
        switch (type) {
          case CONNECT:
            {
              const connectedListeners = this._context[CONTEXT_ID][CONTEXT_CONNECTED];
              removeListener(connectedListeners, listener);
              break;
            }

          case DISCONNECT:
            {
              const disconnectedListeners = this._context[CONTEXT_ID][CONTEXT_DISCONNECTED];
              removeListener(disconnectedListeners, listener);
              break;
            }

          case CONFIG:
            {
              const paramToConfigListenerMetadata = this._context[CONTEXT_ID][CONTEXT_UPDATED].listeners;
              const reactives = this._wireDef.params;

              if (reactives) {
                Object.keys(reactives).forEach(key => {
                  const reactiveParameter = buildReactiveParameter(reactives[key]);
                  const configListenerMetadatas = paramToConfigListenerMetadata[reactiveParameter.head];

                  if (configListenerMetadatas) {
                    removeConfigListener(configListenerMetadatas, listener);
                  }
                });
              }

              break;
            }

          default:
            throw new Error(`unsupported event type ${type}`);
        }
      }

      dispatchEvent(evt) {
        if (evt instanceof ValueChangedEvent) {
          const value = evt.value;

          if (this._wireDef.method) {
            this._cmp[this._wireTarget](value);
          } else {
            this._cmp[this._wireTarget] = value;
          }

          return false; // canceling signal since we don't want this to propagate
        } else if (evt instanceof LinkContextEvent) {
          const {
            uid,
            callback
          } = evt; // This event is responsible for connecting the host element with another
          // element in the composed path that is providing contextual data. The provider
          // must be listening for a special dom event with the name corresponding to `uid`,
          // which must remain secret, to guarantee that the linkage is only possible via
          // the corresponding wire adapter.

          const internalDomEvent = new CustomEvent(uid, {
            bubbles: true,
            composed: true,

            // avoid leaking the callback function directly to prevent a side channel
            // during the linking phase to the context provider.
            detail(...args) {
              callback(...args);
            }

          });

          this._cmp.dispatchEvent(internalDomEvent);

          return false; // canceling signal since we don't want this to propagate
        } else if (evt.type === 'wirecontextevent') {
          // TODO [#1357]: remove this branch
          return this._cmp.dispatchEvent(evt);
        } else {
          throw new Error(`Invalid event ${evt}.`);
        }
      }

    }
    /*
     * Copyright (c) 2018, salesforce.com, inc.
     * All rights reserved.
     * SPDX-License-Identifier: MIT
     * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
     */
    // wire adapters: wire adapter id => adapter ctor


    const adapterFactories = new Map();
    /**
     * Invokes the specified callbacks.
     * @param listeners functions to call
     */

    function invokeListener(listeners) {
      for (let i = 0, len = listeners.length; i < len; ++i) {
        listeners[i].call(undefined);
      }
    }
    /**
     * The wire service.
     *
     * This service is registered with the engine's service API. It connects service
     * callbacks to wire adapter lifecycle events.
     */


    const wireService = {
      wiring: (cmp, data, def, context) => {
        const wireContext = context[CONTEXT_ID] = Object.create(null);
        wireContext[CONTEXT_CONNECTED] = [];
        wireContext[CONTEXT_DISCONNECTED] = [];
        wireContext[CONTEXT_UPDATED] = {
          listeners: {},
          values: {}
        }; // engine guarantees invocation only if def.wire is defined

        const wireStaticDef = def.wire;
        const wireTargets = Object.keys(wireStaticDef);

        for (let i = 0, len = wireTargets.length; i < len; i++) {
          const wireTarget = wireTargets[i];
          const wireDef = wireStaticDef[wireTarget];
          const adapterFactory = adapterFactories.get(wireDef.adapter);

          if (process.env.NODE_ENV !== 'production') {
            assert.isTrue(wireDef.adapter, `@wire on "${wireTarget}": adapter id must be truthy`);
            assert.isTrue(adapterFactory, `@wire on "${wireTarget}": unknown adapter id: ${String(wireDef.adapter)}`); // enforce restrictions of reactive parameters

            if (wireDef.params) {
              Object.keys(wireDef.params).forEach(param => {
                const prop = wireDef.params[param];
                const segments = prop.split('.');
                segments.forEach(segment => {
                  assert.isTrue(segment.length > 0, `@wire on "${wireTarget}": reactive parameters must not be empty`);
                });
                assert.isTrue(segments[0] !== wireTarget, `@wire on "${wireTarget}": reactive parameter "${segments[0]}" must not refer to self`); // restriction for dot-notation reactive parameters

                if (segments.length > 1) {
                  // @wire emits a stream of immutable values. an emit sets the target property; it does not mutate a previously emitted value.
                  // restricting dot-notation reactive parameters to reference other @wire targets makes trapping the 'head' of the parameter
                  // sufficient to observe the value change.
                  assert.isTrue(wireTargets.includes(segments[0]) && wireStaticDef[segments[0]].method !== 1, `@wire on "${wireTarget}": dot-notation reactive parameter "${prop}" must refer to a @wire property`);
                }
              });
            }
          }

          if (adapterFactory) {
            const wireEventTarget = new WireEventTarget(cmp, def, context, wireDef, wireTarget);
            adapterFactory({
              dispatchEvent: wireEventTarget.dispatchEvent.bind(wireEventTarget),
              addEventListener: wireEventTarget.addEventListener.bind(wireEventTarget),
              removeEventListener: wireEventTarget.removeEventListener.bind(wireEventTarget)
            });
          }
        }
      },
      connected: (cmp, data, def, context) => {
        let listeners;

        if (process.env.NODE_ENV !== 'production') {
          assert.isTrue(!def.wire || context[CONTEXT_ID], 'wire service was not initialized prior to component creation:  "connected" service hook invoked without necessary context');
        }

        if (!def.wire || !(listeners = context[CONTEXT_ID][CONTEXT_CONNECTED])) {
          return;
        }

        invokeListener(listeners);
      },
      disconnected: (cmp, data, def, context) => {
        let listeners;

        if (process.env.NODE_ENV !== 'production') {
          assert.isTrue(!def.wire || context[CONTEXT_ID], 'wire service was not initialized prior to component creation:  "disconnected" service hook invoked without necessary context');
        }

        if (!def.wire || !(listeners = context[CONTEXT_ID][CONTEXT_DISCONNECTED])) {
          return;
        }

        invokeListener(listeners);
      }
    };
    /**
     * Registers the wire service.
     */

    function registerWireService(registerService) {
      registerService(wireService);
    }
    /** version: 1.3.7-226.4 */

    function stylesheet(hostSelector, shadowSelector, nativeShadow) {
      return ["h1", shadowSelector, " {color: rgb(0, 112, 210);}\np", shadowSelector, " {font-family: 'Salesforce Sans', Arial, sans-serif;color: rgb(62, 62, 60);}\n.app", shadowSelector, " {background-color: #fafaf9;height: 100vh;overflow: scroll;}\n"].join('');
    }
    var _implicitStylesheets = [stylesheet];

    function tmpl($api, $cmp, $slotset, $ctx) {
      const {
        s: api_slot,
        d: api_dynamic,
        h: api_element
      } = $api;
      return [api_element("div", {
        classMap: {
          "slds-m-horizontal_xx-small": true,
          "slds-m-bottom_x-small": true
        },
        key: 2
      }, [api_slot("icon", {
        attrs: {
          "name": "icon"
        },
        key: 0
      }, [], $slotset), api_element("span", {
        classMap: {
          "slds-p-left_small": true
        },
        key: 1
      }, [api_dynamic($cmp.label)])])];
    }

    var _tmpl = lwc.registerTemplate(tmpl);
    tmpl.slots = ["icon"];
    tmpl.stylesheets = [];
    tmpl.stylesheetTokens = {
      hostAttribute: "c-child_child-host",
      shadowAttribute: "c-child_child"
    };

    /**
     * Show an item
     */

    class Child extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.label = '';
      }

    }

    lwc.registerDecorators(Child, {
      publicProps: {
        label: {
          config: 0
        }
      }
    });

    var _cChild = lwc.registerComponent(Child, {
      tmpl: _tmpl
    });

    function tmpl$1($api, $cmp, $slotset, $ctx) {
      const {
        fid: api_scoped_frag_id,
        h: api_element
      } = $api;
      return [api_element("svg", {
        className: $cmp.computedClass,
        attrs: {
          "focusable": "false",
          "data-key": $cmp.name,
          "aria-hidden": "true"
        },
        key: 1
      }, [api_element("use", {
        attrs: {
          "xlink:href": lwc.sanitizeAttribute("use", "http://www.w3.org/2000/svg", "xlink:href", api_scoped_frag_id($cmp.href))
        },
        key: 0
      }, [])])];
    }

    var _tmpl$1 = lwc.registerTemplate(tmpl$1);
    tmpl$1.stylesheets = [];
    tmpl$1.stylesheetTokens = {
      hostAttribute: "lightning-primitiveIcon_primitiveIcon-host",
      shadowAttribute: "lightning-primitiveIcon_primitiveIcon"
    };

    var dir = 'ltr';

    const proto = {
      add(className) {
        if (typeof className === 'string') {
          this[className] = true;
        } else {
          Object.assign(this, className);
        }

        return this;
      },

      invert() {
        Object.keys(this).forEach(key => {
          this[key] = !this[key];
        });
        return this;
      },

      toString() {
        return Object.keys(this).filter(key => this[key]).join(' ');
      }

    };
    function classSet(config) {
      if (typeof config === 'string') {
        const key = config;
        config = {};
        config[key] = true;
      }

      return Object.assign(Object.create(proto), config);
    }

    /**
     * Takes label strings with placeholder params (`{0}`) and updates the label with given `args`
     * @param {string} str - any label string requiring injections of other strings/params (e.g., 'foo {0}')
     * @param  {string|array} arguments - string(s) to be injected into the `string` param
     * @returns {string} fully replaced string, e.g., '{0} is a {1}' -> 'Hal Jordan is a Green Lantern'
     */
    function formatLabel(str) {
      const args = Array.prototype.slice.call(arguments, 1);
      let replacements = args;

      if (Array.isArray(args[0])) {
        [replacements] = args;
      }

      return str.replace(/{(\d+)}/g, (match, i) => {
        return replacements[i];
      });
    }

    function classListMutation(classList, config) {
      Object.keys(config).forEach(key => {
        if (typeof key === 'string' && key.length) {
          if (config[key]) {
            classList.add(key);
          } else {
            classList.remove(key);
          }
        }
      });
    }

    /**
    A string normalization utility for attributes.
    @param {String} value - The value to normalize.
    @param {Object} config - The optional configuration object.
    @param {String} [config.fallbackValue] - The optional fallback value to use if the given value is not provided or invalid. Defaults to an empty string.
    @param {Array} [config.validValues] - An optional array of valid values. Assumes all input is valid if not provided.
    @return {String} - The normalized value.
    **/
    function normalizeString(value, config = {}) {
      const {
        fallbackValue = '',
        validValues,
        toLowerCase = true
      } = config;
      let normalized = typeof value === 'string' && value.trim() || '';
      normalized = toLowerCase ? normalized.toLowerCase() : normalized;

      if (validValues && validValues.indexOf(normalized) === -1) {
        normalized = fallbackValue;
      }

      return normalized;
    }

    const isIE11 = isIE11Test(navigator);
    const isChrome = isChromeTest(navigator);
    const isSafari = isSafariTest(navigator); // The following functions are for tests only

    function isIE11Test(navigator) {
      // https://stackoverflow.com/questions/17447373/how-can-i-target-only-internet-explorer-11-with-javascript
      return /Trident.*rv[ :]*11\./.test(navigator.userAgent);
    }
    function isChromeTest(navigator) {
      // https://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome
      return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    }
    function isSafariTest(navigator) {
      // via https://stackoverflow.com/questions/49872111/detect-safari-and-stop-script
      return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    /*
     * Regex to test a string for an ISO8601 Date. The following formats are matched.
     * Note that if a time element is present (e.g. 'T'), the string should have a time zone designator (Z or +hh:mm or -hh:mm).
     *
     *  YYYY
     *  YYYY-MM
     *  YYYY-MM-DD
     *  YYYY-MM-DDThh:mmTZD
     *  YYYY-MM-DDThh:mm:ssTZD
     *  YYYY-MM-DDThh:mm:ss.STZD
     *
     *
     * @see: https://www.w3.org/TR/NOTE-datetime
     */
    const ISO8601_STRICT_PATTERN = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z){1})?)?)?$/i;
    /* Regex to test a string for an ISO8601 partial time or full time:
     * hh:mm
     * hh:mm:ss
     * hh:mm:ss.S
     * full time = partial time + TZD
     */

    const ISO8601_TIME_PATTERN = /^\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
    const STANDARD_TIME_FORMAT = 'HH:mm:ss.SSS';
    const STANDARD_DATE_FORMAT = 'YYYY-MM-DD';
    const TIME_SEPARATOR = 'T';
    const TIMEZONE_INDICATOR = /(Z|([+-])(\d{2}):(\d{2}))$/;
    function isValidISODateTimeString(dateTimeString) {
      return isValidISO8601String(dateTimeString) && isValidDate(dateTimeString);
    }
    function isValidISOTimeString(timeString) {
      if (!isValidISO8601TimeString(timeString)) {
        return false;
      }

      const timeOnly = removeTimeZoneSuffix(timeString);
      return isValidDate(`2018-09-09T${timeOnly}Z`);
    }
    function removeTimeZoneSuffix(dateTimeString) {
      if (typeof dateTimeString === 'string') {
        return dateTimeString.split(TIMEZONE_INDICATOR)[0];
      }

      return dateTimeString;
    }

    function isValidISO8601String(dateTimeString) {
      if (typeof dateTimeString !== 'string') {
        return false;
      }

      return ISO8601_STRICT_PATTERN.test(dateTimeString);
    }

    function isValidISO8601TimeString(timeString) {
      if (typeof timeString !== 'string') {
        return false;
      }

      return ISO8601_TIME_PATTERN.test(timeString);
    }

    function isValidDate(value) {
      // Date.parse returns NaN if the argument doesn't represent a valid date
      const timeStamp = Date.parse(value);
      return isFinite(timeStamp);
    }

    var _tmpl$2 = void 0;

    var labelSecondsLater = 'in a few seconds';

    var labelSecondsAgo = 'a few seconds ago';

    const fallbackFutureLabel = 'in {0} {1}'; // e.g. in 1 minute

    const fallbackPastLabel = '{0} {1} ago'; // e.g. 1 minute ago

    const fallbackPluralSuffix = 's'; // plural suffix for the units, e.g. in 10 minutes
    // The threshold values come from moment.js

    const units = {
      SECONDS: {
        name: 'second',
        threshold: 45
      },
      // a few seconds to minute
      MINUTES: {
        name: 'minute',
        threshold: 45
      },
      // minutes to hour
      HOURS: {
        name: 'hour',
        threshold: 22
      },
      // hours to day
      DAYS: {
        name: 'day',
        threshold: 26
      },
      // days to month
      MONTHS: {
        name: 'month',
        threshold: 11
      },
      // months to year
      YEARS: {
        name: 'year'
      }
    };
    const SECOND_TO_MILLISECONDS = 1000;
    const MINUTE_TO_MILLISECONDS = 6e4; // 60 * SECOND_TO_MILLISECONDS;

    const HOUR_TO_MILLISECONDS = 36e5; // 60 * MINUTE_TO_MILLISECONDS

    const DAY_TO_MILLISECONDS = 864e5; // 24 * HOUR_TO_MILLISECONDS;

    class Duration {
      constructor(milliseconds) {
        this.milliseconds = 0;

        if (typeof milliseconds !== 'number') {
          this.isValid = false; // eslint-disable-next-line no-console

          console.warn(`The value of milliseconds passed into Duration must be of type number,
                but we are getting the ${typeof milliseconds} value "${milliseconds}" instead.
                `);
          return;
        }

        this.isValid = true;
        this.milliseconds = milliseconds;
      }

      humanize(locale) {
        if (!this.isValid) {
          return '';
        }

        const unit = findBestUnitMatch(this);

        if (unit === units.SECONDS) {
          const isLater = this.milliseconds > 0;
          return isLater ? labelSecondsLater : labelSecondsAgo;
        }

        return format(locale, this.asIn(unit), unit.name);
      }

      asIn(unit) {
        switch (unit) {
          case units.SECONDS:
            return Math.round(this.milliseconds / SECOND_TO_MILLISECONDS);

          case units.MINUTES:
            return Math.round(this.milliseconds / MINUTE_TO_MILLISECONDS);

          case units.HOURS:
            return Math.round(this.milliseconds / HOUR_TO_MILLISECONDS);

          case units.DAYS:
            return Math.round(this.milliseconds / DAY_TO_MILLISECONDS);

          case units.MONTHS:
            return Math.round(daysToMonth(this.milliseconds / DAY_TO_MILLISECONDS));

          case units.YEARS:
          default:
            return Math.round(daysToMonth(this.milliseconds / DAY_TO_MILLISECONDS) / 12);
        }
      }

    }

    lwc.registerDecorators(Duration, {
      fields: ["milliseconds"]
    });

    var Duration$1 = lwc.registerComponent(Duration, {
      tmpl: _tmpl$2
    });

    function daysToMonth(days) {
      // 400 years have 146097 days (taking into account leap year rules)
      // 400 years have 12 months === 4800
      const daysToMonthRatio = 4800 / 146097;
      return days * daysToMonthRatio;
    }

    function findBestUnitMatch(duration) {
      // Traversing the object keys in order from Seconds to Years
      // http://exploringjs.com/es6/ch_oop-besides-classes.html#_traversal-order-of-properties
      const match = Object.keys(units).find(key => {
        const unit = units[key]; // Year is the max and doesn't have a threshold

        return unit === units.YEARS || Math.abs(duration.asIn(unit)) < unit.threshold;
      });
      return units[match];
    }

    function format(locale, value, unit) {
      if ('Intl' in window && Intl.RelativeTimeFormat) {
        const formatter = new Intl.RelativeTimeFormat(locale, {
          style: 'long',
          numeric: 'always'
        });
        return formatter.format(value, unit);
      }

      return fallbackFormatter(value, unit);
    }

    function fallbackFormatter(value, unit) {
      // eslint-disable-next-line no-console
      console.warn(`The current environment does not support formatters for relative time.`);
      const absoluteValue = Math.abs(value);
      const unitString = absoluteValue !== 1 ? unit + fallbackPluralSuffix : unit;
      const label = value > 0 ? fallbackFutureLabel : fallbackPastLabel;
      return formatLabel(label, absoluteValue, unitString);
    }

    // default implementation of localization service for en-US locale. This covers the current usage of the localizationService in the code base.
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const DATE_FORMAT = {
      short: 'M/d/yyyy',
      medium: 'MMM d, yyyy',
      long: 'MMMM d, yyyy'
    };
    const TIME_FORMAT = {
      short: 'h:mm a',
      medium: 'h:mm:ss a',
      long: 'h:mm:ss a'
    }; // The parseTime method normalizes the time format so that minor deviations are accepted

    const TIME_FORMAT_SIMPLE = {
      short: 'h:m a',
      medium: 'h:m:s a',
      long: 'h:m:s a'
    }; // Only works with dates and iso strings
    // formats the date object by ignoring the timezone offset
    // e.g. assume date is Mar 11 2019 00:00:00 GMT+1100:
    // formatDate(date, 'YYYY-MM-DD') -> 2019-03-11

    function formatDate(value, format) {
      let isUTC = false;
      let dateString = value;

      if (typeof value === 'string') {
        dateString = value.split(TIME_SEPARATOR)[0];
        isUTC = true;
      }

      return formatDateInternal(dateString, format, isUTC);
    } // Only works with date objects.
    // formats the date object according to UTC.
    // e.g. assume date is Mar 11 2019 00:00:00 GMT+1100:
    // formatDateUTC(date, 'YYYY-MM-DD') -> 2019-03-10


    function formatDateUTC(value, format) {
      return formatDateInternal(value, format, true);
    } // Only works with a date object


    function formatTime(date, format) {
      if (!isDate(date)) {
        return new Date('');
      }

      const hours = (date.getHours() + 11) % 12 + 1;
      const suffix = date.getHours() >= 12 ? 'PM' : 'AM';

      switch (format) {
        case STANDARD_TIME_FORMAT:
          // 16:12:32.000
          return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${doublePad(date.getMilliseconds())}`;

        case TIME_FORMAT.short:
          // 4:12 PM;
          return `${hours}:${pad(date.getMinutes())} ${suffix}`;

        case TIME_FORMAT.medium:
        case TIME_FORMAT.long:
        default:
          // 4:12:32 PM;
          return `${hours}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${suffix}`;
      }
    } // Only works with a date object
    // formats the date object according to UTC.
    // e.g. assume date is Mar 11 2019 00:00:00 GMT+1100:
    // formatDateTimeUTC(date) -> 2019-03-10  1:00:00 PM


    function formatDateTimeUTC(value) {
      if (!isDate(value)) {
        return new Date('');
      }

      const date = new Date(value.getTime());
      return `${formatDateUTC(date)}, ${formatTime(addTimezoneOffset(date))}`;
    } // parses ISO8601 date/time strings. Currently only used to parse ISO time strings without a TZD. Some examples:
    // 20:00:00.000             -> Feb 26 2019 20:00:00 GMT-0500
    // 2019-03-11               -> Mar 11 2019 00:00:00 GMT-0400
    // 2019-03-11T00:00:00.000Z -> Mar 10 2019 20:00:00 GMT-0400


    function parseDateTimeISO8601(value) {
      let isoString = null;
      let shouldAddOffset = true;

      if (isValidISOTimeString(value)) {
        isoString = `${getTodayInISO()}T${addTimezoneSuffix(value)}`;
      } else if (isValidISODateTimeString(value)) {
        if (value.indexOf(TIME_SEPARATOR) > 0) {
          isoString = addTimezoneSuffix(value);
          shouldAddOffset = false;
        } else {
          isoString = `${value}T00:00:00.000Z`;
        }
      }

      if (isoString) {
        // Browsers differ on how they treat iso strings without a timezone offset (local vs utc time)
        const parsedDate = new Date(isoString);

        if (shouldAddOffset) {
          addTimezoneOffset(parsedDate);
        }

        return parsedDate;
      }

      return null;
    } // called by the datepicker and calendar for parsing iso and formatted date strings
    // called by the timepicker to parse the formatted time string


    function parseDateTime(value, format) {
      if (format === STANDARD_DATE_FORMAT && isValidISODateTimeString(value)) {
        return parseDateTimeISO8601(value);
      }

      if (Object.values(DATE_FORMAT).includes(format)) {
        return parseFormattedDate(value, format);
      }

      if (Object.values(TIME_FORMAT_SIMPLE).includes(format)) {
        return parseFormattedTime(value);
      }

      return null;
    } // The input to this method is always an ISO string with timezone offset.


    function parseDateTimeUTC(value) {
      return parseDateTimeISO8601(addTimezoneSuffix(value));
    }

    function isBefore(date1, date2, unit) {
      const normalizedDate1 = getDate(date1);
      const normalizedDate2 = getDate(date2);

      if (!normalizedDate1 || !normalizedDate2) {
        return false;
      }

      return startOf(normalizedDate1, unit).getTime() < startOf(normalizedDate2, unit).getTime();
    } // unit can be millisecond, minute, day


    function isAfter(date1, date2, unit) {
      const normalizedDate1 = getDate(date1);
      const normalizedDate2 = getDate(date2);

      if (!normalizedDate1 || !normalizedDate2) {
        return false;
      }

      return startOf(normalizedDate1, unit).getTime() > startOf(normalizedDate2, unit).getTime();
    } // We're not doing timezone conversion in the default config. Only converting from UTC to system timezone


    function UTCToWallTime(date, timezone, callback) {
      const utcDate = new Date(date.getTime());
      callback(subtractTimezoneOffset(utcDate));
    } // We're not doing timezone conversion in the default config. Only converting from system timezone to UTC


    function WallTimeToUTC(date, timezone, callback) {
      const localDate = new Date(date.getTime());
      callback(addTimezoneOffset(localDate));
    } // We're assuming en-US locale so we don't need translation between calendar systems


    function translateToOtherCalendar(date) {
      return date;
    } // We're assuming en-US locale so we don't need translation between calendar systems


    function translateFromOtherCalendar(date) {
      return date;
    } // We're assuming en-US locale so we don't need translation of digits


    function translateToLocalizedDigits(input) {
      return input;
    } // We're assuming en-US locale so we don't need translation of digits


    function translateFromLocalizedDigits(input) {
      return input;
    } // This is called from the numberFormat library when the value exceeds the safe length.
    // We currently rely on aura to format large numbers


    function getNumberFormat() {
      return {
        format: value => {
          // eslint-disable-next-line no-console
          console.warn(`The current environment does not support large numbers and the original value of ${value} will be returned.`);
          return value;
        }
      };
    } // relativeDateTime (currently the only user of duration) uses unit="minutes"
    // The default implementation here assumes the unit is always minutes.


    function duration(minutes) {
      return new Duration$1(minutes * 60 * 1000);
    }

    function displayDuration(value) {
      return value.humanize('en');
    } // parses a time string formatted in en-US locale i.e. h:mm:ss a


    function parseFormattedTime(value) {
      // for time strings it's easier to just split on :.\s
      const values = value.trim().split(/[:.\s*]/); // at least two parts i.e. 12 PM, and at most 5 parts i.e. 12:34:21.432 PM

      const length = values.length;

      if (!values || length < 2 || length > 5) {
        return null;
      }

      const ampm = values[length - 1];
      const isBeforeNoon = ampm.toLowerCase() === 'am';
      const isAfternoon = ampm.toLowerCase() === 'pm'; // remove ampm

      values.splice(-1, 1);
      const allNumbers = values.every(item => !isNaN(item));

      if (!isAfternoon && !isBeforeNoon || !allNumbers) {
        return null;
      }

      const hours = values[0];
      const hour24 = pad(isAfternoon ? hours % 12 + 12 : hours % 12);
      const minutes = length >= 3 && values[1] || '0';
      const seconds = length >= 4 && values[2] || '0';
      const milliseconds = length === 5 && values[3] || '0';
      const newDate = new Date(getTodayInISO());
      newDate.setHours(hour24, minutes, seconds, milliseconds);
      return isDate(newDate) ? newDate : null;
    } // parses a date string formatted in en-US locale, i.e. MMM d, yyyy


    function parseFormattedDate(value, format) {
      // default to medium style pattern
      let pattern = /^([a-zA-Z]{3})\s*(\d{1,2}),\s*(\d{4})$/;

      switch (format) {
        case DATE_FORMAT.short:
          pattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
          break;

        case DATE_FORMAT.long:
          pattern = /^([a-zA-Z]+)\s*(\d{1,2}),\s*(\d{4})$/;
          break;
      } // matches[1]: month, matches[2]: day, matches[3]: year


      const match = pattern.exec(value.trim());

      if (!match) {
        return null;
      }

      let month = match[1];
      const day = match[2];
      const year = match[3]; // for long and medium style formats, we need to find the month index

      if (format !== DATE_FORMAT.short) {
        month = MONTH_NAMES.findIndex(item => item.toLowerCase().includes(month.toLowerCase())); // the actual month for the ISO string is 1 more than the index

        month += 1;
      }

      const isoValue = `${year}-${pad(month)}-${pad(day)}`;
      const newDate = new Date(`${isoValue}T00:00:00.000Z`);
      return isDate(newDate) ? addTimezoneOffset(newDate) : null;
    }

    function formatDateInternal(value, format, isUTC) {
      const date = getDate(value);

      if (!date) {
        // return Invalid Date
        return new Date('');
      }

      if (isUTC && isDate(value)) {
        // if value is an ISO string, we already add the timezone offset when parsing the date string.
        addTimezoneOffset(date);
      }

      switch (format) {
        case STANDARD_DATE_FORMAT:
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

        case DATE_FORMAT.short:
          return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

        case DATE_FORMAT.long:
          return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

        case DATE_FORMAT.medium:
        default:
          {
            const shortMonthName = MONTH_NAMES[date.getMonth()].substring(0, 3);
            return `${shortMonthName} ${date.getDate()}, ${date.getFullYear()}`;
          }
      }
    } // unit can be 'day' or 'minute', otherwise will default to milliseconds. These are the only units that are currently used in the codebase.


    function startOf(date, unit) {
      switch (unit) {
        case 'day':
          date.setHours(0);
          date.setMinutes(0);
        // falls through

        case 'minute':
          date.setSeconds(0);
          date.setMilliseconds(0);
          break;
      }

      return date;
    }

    function isDate(value) {
      return Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime());
    }

    function addTimezoneSuffix(value) {
      // first remove TZD if the string has one, and then add Z
      return removeTimeZoneSuffix(value) + 'Z';
    }

    function addTimezoneOffset(date) {
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      return date;
    }

    function subtractTimezoneOffset(date) {
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      return date;
    }

    function getDate(value) {
      if (!value) {
        return null;
      }

      if (isDate(value)) {
        return new Date(value.getTime());
      }

      if (isFinite(value) && (typeof value === 'number' || typeof value === 'string')) {
        return new Date(parseInt(value, 10));
      }

      if (typeof value === 'string') {
        return parseDateTimeISO8601(value);
      }

      return null;
    }

    function getTodayInISO() {
      return new Date().toISOString().split('T')[0];
    }

    function pad(n) {
      return Number(n) < 10 ? '0' + n : n;
    }

    function doublePad(n) {
      return Number(n) < 10 ? '00' + n : Number(n) < 100 ? '0' + n : n;
    }

    var localizationService = {
      formatDate,
      formatDateUTC,
      formatTime,
      formatDateTimeUTC,
      parseDateTimeISO8601,
      parseDateTime,
      parseDateTimeUTC,
      isBefore,
      isAfter,
      UTCToWallTime,
      WallTimeToUTC,
      translateToOtherCalendar,
      translateFromOtherCalendar,
      translateToLocalizedDigits,
      translateFromLocalizedDigits,
      getNumberFormat,
      duration,
      displayDuration
    };

    function getConfigFromAura($A) {
      return {
        getLocalizationService() {
          return $A.localizationService;
        },

        getPathPrefix() {
          return $A.getContext().getPathPrefix();
        },

        getToken(name) {
          return $A.getToken(name);
        }

      };
    }

    function createStandAloneConfig() {
      return {
        getLocalizationService() {
          return localizationService;
        },

        getPathPrefix() {
          return '/slds/2.12.1/';
        },

        getToken(name) {
          return void 0;
        },

        getOneConfig() {
          return {
            densitySetting: ''
          };
        }

      };
    }

    function getDefaultConfig() {
      return window.$A !== undefined && window.$A.localizationService ? getConfigFromAura(window.$A) : createStandAloneConfig();
    }

    let PROVIDED_IMPL = getDefaultConfig();
    function getPathPrefix() {
      return PROVIDED_IMPL && PROVIDED_IMPL.getPathPrefix && PROVIDED_IMPL.getPathPrefix() || '';
    }
    function getToken(name) {
      return PROVIDED_IMPL && PROVIDED_IMPL.getToken && PROVIDED_IMPL.getToken(name);
    }
    function getIconSvgTemplates() {
      return PROVIDED_IMPL && PROVIDED_IMPL.iconSvgTemplates;
    }

    // Taken from https://github.com/jonathantneal/svg4everybody/pull/139
    // Remove this iframe-in-edge check once the following is resolved https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8323875/
    const isEdgeUA = /\bEdge\/.(\d+)\b/.test(navigator.userAgent);
    const inIframe = window.top !== window.self;
    const isIframeInEdge = isEdgeUA && inIframe;
    var isIframeInEdge$1 = lwc.registerComponent(isIframeInEdge, {
      tmpl: _tmpl$2
    });

    // Taken from https://git.soma.salesforce.com/aura/lightning-global/blob/999dc35f948246181510df6e56f45ad4955032c2/src/main/components/lightning/SVGLibrary/stamper.js#L38-L60
    function fetchSvg(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.send();

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              resolve(xhr.responseText);
            } else {
              reject(xhr);
            }
          }
        };
      });
    }

    // Which looks like it was inspired by https://github.com/jonathantneal/svg4everybody/blob/377d27208fcad3671ed466e9511556cb9c8b5bd8/lib/svg4everybody.js#L92-L107
    // Modify at your own risk!

    const newerIEUA = /\bTrident\/[567]\b|\bMSIE (?:9|10)\.0\b/;
    const webkitUA = /\bAppleWebKit\/(\d+)\b/;
    const olderEdgeUA = /\bEdge\/12\.(\d+)\b/;
    const isIE = newerIEUA.test(navigator.userAgent) || (navigator.userAgent.match(olderEdgeUA) || [])[1] < 10547 || (navigator.userAgent.match(webkitUA) || [])[1] < 537;
    const supportsSvg = !isIE && !isIframeInEdge$1;
    var supportsSvg$1 = lwc.registerComponent(supportsSvg, {
      tmpl: _tmpl$2
    });

    /**
    This polyfill injects SVG sprites into the document for clients that don't
    fully support SVG. We do this globally at the document level for performance
    reasons. This causes us to lose namespacing of IDs across sprites. For example,
    if both #image from utility sprite and #image from doctype sprite need to be
    rendered on the page, both end up as #image from the doctype sprite (last one
    wins). SLDS cannot change their image IDs due to backwards-compatibility
    reasons so we take care of this issue at runtime by adding namespacing as we
    polyfill SVG elements.

    For example, given "/assets/icons/action-sprite/svg/symbols.svg#approval", we
    replace the "#approval" id with "#${namespace}-approval" and a similar
    operation is done on the corresponding symbol element.
    **/
    const svgTagName = /svg/i;

    const isSvgElement = el => el && svgTagName.test(el.nodeName);

    const requestCache = {};
    const symbolEls = {};
    const svgFragments = {};
    const spritesContainerId = 'slds-svg-sprites';
    let spritesEl;
    function polyfill(el) {
      if (!supportsSvg$1 && isSvgElement(el)) {
        if (!spritesEl) {
          spritesEl = document.createElement('svg');
          spritesEl.xmlns = 'http://www.w3.org/2000/svg';
          spritesEl['xmlns:xlink'] = 'http://www.w3.org/1999/xlink';
          spritesEl.style.display = 'none';
          spritesEl.id = spritesContainerId;
          document.body.insertBefore(spritesEl, document.body.childNodes[0]);
        }

        Array.from(el.getElementsByTagName('use')).forEach(use => {
          // We access the href differently in raptor and in aura, probably
          // due to difference in the way the svg is constructed.
          const src = use.getAttribute('xlink:href') || use.getAttribute('href');

          if (src) {
            // "/assets/icons/action-sprite/svg/symbols.svg#approval" =>
            // ["/assets/icons/action-sprite/svg/symbols.svg", "approval"]
            const parts = src.split('#');
            const url = parts[0];
            const id = parts[1];
            const namespace = url.replace(/[^\w]/g, '-');
            const href = `#${namespace}-${id}`;

            if (url.length) {
              // set the HREF value to no longer be an external reference
              if (use.getAttribute('xlink:href')) {
                use.setAttribute('xlink:href', href);
              } else {
                use.setAttribute('href', href);
              } // only insert SVG content if it hasn't already been retrieved


              if (!requestCache[url]) {
                requestCache[url] = fetchSvg(url);
              }

              requestCache[url].then(svgContent => {
                // create a document fragment from the svgContent returned (is parsed by HTML parser)
                if (!svgFragments[url]) {
                  const svgFragment = document.createRange().createContextualFragment(svgContent);
                  svgFragments[url] = svgFragment;
                }

                if (!symbolEls[href]) {
                  const svgFragment = svgFragments[url];
                  const symbolEl = svgFragment.querySelector(`#${id}`);
                  symbolEls[href] = true;
                  symbolEl.id = `${namespace}-${id}`;
                  spritesEl.appendChild(symbolEl);
                }
              });
            }
          }
        });
      }
    }

    const validNameRe = /^([a-zA-Z]+):([a-zA-Z]\w*)$/;
    const underscoreRe = /_/g;
    let pathPrefix;
    const tokenNameMap = Object.assign(Object.create(null), {
      action: 'lightning.actionSprite',
      custom: 'lightning.customSprite',
      doctype: 'lightning.doctypeSprite',
      standard: 'lightning.standardSprite',
      utility: 'lightning.utilitySprite'
    });
    const tokenNameMapRtl = Object.assign(Object.create(null), {
      action: 'lightning.actionSpriteRtl',
      custom: 'lightning.customSpriteRtl',
      doctype: 'lightning.doctypeSpriteRtl',
      standard: 'lightning.standardSpriteRtl',
      utility: 'lightning.utilitySpriteRtl'
    });
    const defaultTokenValueMap = Object.assign(Object.create(null), {
      'lightning.actionSprite': '/assets/icons/action-sprite/svg/symbols.svg',
      'lightning.actionSpriteRtl': '/assets/icons/action-sprite/svg/symbols.svg',
      'lightning.customSprite': '/assets/icons/custom-sprite/svg/symbols.svg',
      'lightning.customSpriteRtl': '/assets/icons/custom-sprite/svg/symbols.svg',
      'lightning.doctypeSprite': '/assets/icons/doctype-sprite/svg/symbols.svg',
      'lightning.doctypeSpriteRtl': '/assets/icons/doctype-sprite/svg/symbols.svg',
      'lightning.standardSprite': '/assets/icons/standard-sprite/svg/symbols.svg',
      'lightning.standardSpriteRtl': '/assets/icons/standard-sprite/svg/symbols.svg',
      'lightning.utilitySprite': '/assets/icons/utility-sprite/svg/symbols.svg',
      'lightning.utilitySpriteRtl': '/assets/icons/utility-sprite/svg/symbols.svg'
    });

    const getDefaultBaseIconPath = (category, nameMap) => defaultTokenValueMap[nameMap[category]];

    const getBaseIconPath = (category, direction) => {
      const nameMap = direction === 'rtl' ? tokenNameMapRtl : tokenNameMap;
      return getToken(nameMap[category]) || getDefaultBaseIconPath(category, nameMap);
    };

    const getMatchAtIndex = index => iconName => {
      const result = validNameRe.exec(iconName);
      return result ? result[index] : '';
    };

    const getCategory = getMatchAtIndex(1);
    const getName = getMatchAtIndex(2);
    const isValidName = iconName => validNameRe.test(iconName);
    const getIconPath = (iconName, direction = 'ltr') => {
      pathPrefix = pathPrefix !== undefined ? pathPrefix : getPathPrefix();

      if (isValidName(iconName)) {
        const baseIconPath = getBaseIconPath(getCategory(iconName), direction);

        if (baseIconPath) {
          // This check was introduced the following MS-Edge issue:
          // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/9655192/
          // If and when this get fixed, we can safely remove this block of code.
          if (isIframeInEdge$1) {
            // protocol => 'https:' or 'http:'
            // host => hostname + port
            const origin = `${window.location.protocol}//${window.location.host}`;
            return `${origin}${pathPrefix}${baseIconPath}#${getName(iconName)}`;
          }

          return `${pathPrefix}${baseIconPath}#${getName(iconName)}`;
        }
      }

      return '';
    };
    const computeSldsClass = iconName => {
      if (isValidName(iconName)) {
        const category = getCategory(iconName);
        const name = getName(iconName).replace(underscoreRe, '-');
        return `slds-icon-${category}-${name}`;
      }

      return '';
    };

    class LightningPrimitiveIcon extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.iconName = void 0;
        this.src = void 0;
        this.svgClass = void 0;
        this.size = 'medium';
        this.variant = void 0;
        this.privateIconSvgTemplates = getIconSvgTemplates();
      }

      get inlineSvgProvided() {
        return !!this.privateIconSvgTemplates;
      }

      renderedCallback() {
        if (this.iconName !== this.prevIconName && !this.inlineSvgProvided) {
          this.prevIconName = this.iconName;
          const svgElement = this.template.querySelector('svg');
          polyfill(svgElement);
        }
      }

      get href() {
        return this.src || getIconPath(this.iconName, dir);
      }

      get name() {
        return getName(this.iconName);
      }

      get normalizedSize() {
        return normalizeString(this.size, {
          fallbackValue: 'medium',
          validValues: ['xx-small', 'x-small', 'small', 'medium', 'large']
        });
      }

      get normalizedVariant() {
        // NOTE: Leaving a note here because I just wasted a bunch of time
        // investigating why both 'bare' and 'inverse' are supported in
        // lightning-primitive-icon. lightning-icon also has a deprecated
        // 'bare', but that one is synonymous to 'inverse'. This 'bare' means
        // that no classes should be applied. So this component needs to
        // support both 'bare' and 'inverse' while lightning-icon only needs to
        // support 'inverse'.
        return normalizeString(this.variant, {
          fallbackValue: '',
          validValues: ['bare', 'error', 'inverse', 'warning', 'success']
        });
      }

      get computedClass() {
        const {
          normalizedSize,
          normalizedVariant
        } = this;
        const classes = classSet(this.svgClass);

        if (normalizedVariant !== 'bare') {
          classes.add('slds-icon');
        }

        switch (normalizedVariant) {
          case 'error':
            classes.add('slds-icon-text-error');
            break;

          case 'warning':
            classes.add('slds-icon-text-warning');
            break;

          case 'success':
            classes.add('slds-icon-text-success');
            break;

          case 'inverse':
          case 'bare':
            break;

          default:
            // if custom icon is set, we don't want to set
            // the text-default class
            if (!this.src) {
              classes.add('slds-icon-text-default');
            }

        }

        if (normalizedSize !== 'medium') {
          classes.add(`slds-icon_${normalizedSize}`);
        }

        return classes.toString();
      }

      resolveTemplate() {
        const name = this.iconName;

        if (isValidName(name)) {
          const [spriteName, iconName] = name.split(':');
          const template = this.privateIconSvgTemplates[`${spriteName}_${iconName}`];

          if (template) {
            return template;
          }
        }

        return _tmpl$1;
      }

      render() {
        if (this.inlineSvgProvided) {
          return this.resolveTemplate();
        }

        return _tmpl$1;
      }

    }

    lwc.registerDecorators(LightningPrimitiveIcon, {
      publicProps: {
        iconName: {
          config: 0
        },
        src: {
          config: 0
        },
        svgClass: {
          config: 0
        },
        size: {
          config: 0
        },
        variant: {
          config: 0
        }
      },
      fields: ["privateIconSvgTemplates"]
    });

    var _lightningPrimitiveIcon = lwc.registerComponent(LightningPrimitiveIcon, {
      tmpl: _tmpl$1
    });

    function tmpl$2($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        d: api_dynamic,
        h: api_element
      } = $api;
      return [api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": $cmp.state.iconName,
          "size": $cmp.size,
          "variant": $cmp.variant,
          "src": $cmp.state.src
        },
        key: 0
      }, []), $cmp.alternativeText ? api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 1
      }, [api_dynamic($cmp.alternativeText)]) : null];
    }

    var _tmpl$3 = lwc.registerTemplate(tmpl$2);
    tmpl$2.stylesheets = [];
    tmpl$2.stylesheetTokens = {
      hostAttribute: "lightning-icon_icon-host",
      shadowAttribute: "lightning-icon_icon"
    };

    /**
     * Represents a visual element that provides context and enhances usability.
     */

    class LightningIcon extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.state = {};
        this.alternativeText = void 0;
      }

      /**
       * A uri path to a custom svg sprite, including the name of the resouce,
       * for example: /assets/icons/standard-sprite/svg/test.svg#icon-heart
       * @type {string}
       */
      get src() {
        return this.privateSrc;
      }

      set src(value) {
        this.privateSrc = value; // if value is not present, then we set the state back
        // to the original iconName that was passed
        // this might happen if the user sets a custom icon, then
        // decides to revert back to SLDS by removing the src attribute

        if (!value) {
          this.state.iconName = this.iconName;
          this.classList.remove('slds-icon-standard-default');
        } // if isIE11 and the src is set
        // we'd like to show the 'standard:default' icon instead
        // for performance reasons.


        if (value && isIE11) {
          this.setDefault();
          return;
        }

        this.state.src = value;
      }
      /**
       * The Lightning Design System name of the icon.
       * Names are written in the format 'utility:down' where 'utility' is the category,
       * and 'down' is the specific icon to be displayed.
       * @type {string}
       * @required
       */


      get iconName() {
        return this.privateIconName;
      }

      set iconName(value) {
        this.privateIconName = value; // if src is set, we don't need to validate
        // iconName

        if (this.src) {
          return;
        }

        if (isValidName(value)) {
          const isAction = getCategory(value) === 'action'; // update classlist only if new iconName is different than state.iconName
          // otherwise classListMutation receives class:true and class: false and removes slds class

          if (value !== this.state.iconName) {
            classListMutation(this.classList, {
              'slds-icon_container_circle': isAction,
              [computeSldsClass(value)]: true,
              [computeSldsClass(this.state.iconName)]: false
            });
          }

          this.state.iconName = value;
        } else {
          console.warn(`<lightning-icon> Invalid icon name ${value}`); // eslint-disable-line no-console
          // Invalid icon names should render a blank icon. Remove any
          // classes that might have been previously added.

          classListMutation(this.classList, {
            'slds-icon_container_circle': false,
            [computeSldsClass(this.state.iconName)]: false
          });
          this.state.iconName = undefined;
        }
      }
      /**
       * The size of the icon. Options include xx-small, x-small, small, medium, or large.
       * The default is medium.
       * @type {string}
       * @default medium
       */


      get size() {
        return normalizeString(this.state.size, {
          fallbackValue: 'medium',
          validValues: ['xx-small', 'x-small', 'small', 'medium', 'large']
        });
      }

      set size(value) {
        this.state.size = value;
      }
      /**
       * The variant changes the appearance of a utility icon.
       * Accepted variants include inverse, success, warning, and error.
       * Use the inverse variant to implement a white fill in utility icons on dark backgrounds.
       * @type {string}
       */


      get variant() {
        return normalizeVariant(this.state.variant, this.state.iconName);
      }

      set variant(value) {
        this.state.variant = value;
      }

      connectedCallback() {
        this.classList.add('slds-icon_container');
      }

      setDefault() {
        this.state.src = undefined;
        this.state.iconName = 'standard:default';
        this.classList.add('slds-icon-standard-default');
      }

    }

    lwc.registerDecorators(LightningIcon, {
      publicProps: {
        alternativeText: {
          config: 0
        },
        src: {
          config: 3
        },
        iconName: {
          config: 3
        },
        size: {
          config: 3
        },
        variant: {
          config: 3
        }
      },
      track: {
        state: 1
      }
    });

    var _lightningIcon = lwc.registerComponent(LightningIcon, {
      tmpl: _tmpl$3
    });

    function normalizeVariant(variant, iconName) {
      // Unfortunately, the `bare` variant was implemented to do what the
      // `inverse` variant should have done. Keep this logic for as long as
      // we support the `bare` variant.
      if (variant === 'bare') {
        // TODO: Deprecation warning using strippable assertion
        variant = 'inverse';
      }

      if (getCategory(iconName) === 'utility') {
        return normalizeString(variant, {
          fallbackValue: '',
          validValues: ['error', 'inverse', 'warning', 'success']
        });
      }

      return 'inverse';
    }

    function tmpl$3($api, $cmp, $slotset, $ctx) {
      const {
        d: api_dynamic,
        h: api_element,
        t: api_text,
        c: api_custom_element,
        k: api_key,
        i: api_iterator,
        f: api_flatten
      } = $api;
      return [api_element("div", {
        classMap: {
          "app": true,
          "slds-p-around_x-large": true
        },
        key: 14
      }, [api_element("h1", {
        classMap: {
          "slds-text-heading_large": true
        },
        key: 0
      }, [api_dynamic($cmp.title)]), api_element("h3", {
        key: 1
      }, [api_text(" Write JavaScript, HTML, and CSS code, and preview the output in the interactive code editor.")]), $cmp.showFeatures ? api_element("div", {
        classMap: {
          "slds-p-top_large": true
        },
        key: 5
      }, api_flatten([api_element("h2", {
        classMap: {
          "slds-text-heading_medium": true
        },
        key: 2
      }, [api_text("Features")]), api_iterator($cmp.features, function (feature) {
        return api_custom_element("c-child", _cChild, {
          props: {
            "label": feature.label
          },
          key: api_key(4, feature.label)
        }, [api_custom_element("lightning-icon", _lightningIcon, {
          attrs: {
            "slot": "icon"
          },
          props: {
            "iconName": feature.icon,
            "size": "x-small"
          },
          key: 3
        }, [])]);
      })])) : null, api_element("h2", {
        classMap: {
          "slds-text-heading_medium": true,
          "slds-p-top_large": true
        },
        key: 6
      }, [api_text("Considerations")]), api_element("ul", {
        classMap: {
          "slds-list_dotted": true
        },
        key: 10
      }, [api_element("li", {
        classMap: {
          "slds-m-horizontal_xx-small": true,
          "slds-m-bottom_x-small": true
        },
        key: 7
      }, [api_text("All playgrounds have a publicly accessible URL.")]), api_element("li", {
        classMap: {
          "slds-m-horizontal_xx-small": true,
          "slds-m-bottom_x-small": true
        },
        key: 8
      }, [api_text("When you save a new playground, bookmark the URL or save it elsewhere so you can access it later.")]), api_element("li", {
        classMap: {
          "slds-m-horizontal_xx-small": true,
          "slds-m-bottom_x-small": true
        },
        key: 9
      }, [api_text("You can't delete a playground.")])]), api_element("h2", {
        classMap: {
          "slds-text-heading_medium": true,
          "slds-p-top_large": true
        },
        key: 11
      }, [api_text("Resources")]), api_element("a", {
        attrs: {
          "href": "https://developer.salesforce.com/docs/component-library/documentation/lwc/lwc.install_playground"
        },
        key: 12
      }, [api_text("Playground in the Lightning Web Components Developer Guide")]), api_element("br", {
        key: 13
      }, [])])];
    }

    var _tmpl$4 = lwc.registerTemplate(tmpl$3);
    tmpl$3.stylesheets = [];

    if (_implicitStylesheets) {
      tmpl$3.stylesheets.push.apply(tmpl$3.stylesheets, _implicitStylesheets);
    }
    tmpl$3.stylesheetTokens = {
      hostAttribute: "c-app_app-host",
      shadowAttribute: "c-app_app"
    };

    class App extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.title = 'Welcome to Lightning Web Components Playground!';
        this.showFeatures = true;
      }

      /**
       * Getter for the features property
       */
      get features() {
        return [{
          label: 'Edit the name and description of your component.',
          icon: 'utility:edit'
        }, {
          label: 'Create permanent, shareable URLs that anyone can view within your org.',
          icon: 'utility:save'
        }, {
          label: 'View changes to code instantly with Live Compilation.',
          icon: 'utility:refresh'
        }, {
          label: 'Style your components with SLDS.',
          icon: 'utility:brush'
        }, {
          label: 'Download and upload components as zip files.',
          icon: 'utility:download'
        }];
      }

    }

    lwc.registerDecorators(App, {
      track: {
        title: 1,
        showFeatures: 1
      }
    });

    var main = lwc.registerComponent(App, {
      tmpl: _tmpl$4
    });

    registerWireService(lwc.register);

        const element = lwc.createElement('c-app', { is: main, fallback: true });
        document.querySelector('main').appendChild(element);

}(Engine));
