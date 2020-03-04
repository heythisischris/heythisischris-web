(function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function claim_element(nodes, name, attributes, svg) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeName === name) {
                let j = 0;
                while (j < node.attributes.length) {
                    const attribute = node.attributes[j];
                    if (attributes[attribute.name]) {
                        j++;
                    }
                    else {
                        node.removeAttribute(attribute.name);
                    }
                }
                return nodes.splice(i, 1)[0];
            }
        }
        return svg ? svg_element(name) : element(name);
    }
    function claim_text(nodes, data) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeType === 3) {
                node.data = '' + data;
                return nodes.splice(i, 1)[0];
            }
        }
        return text(data);
    }
    function claim_space(nodes) {
        return claim_text(nodes, ' ');
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    const seen_callbacks = new Set();
    function flush() {
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function claim_component(block, parent_nodes) {
        block && block.l(parent_nodes);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const LOCATION = {};
    const ROUTER = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    function getLocation(source) {
      return {
        ...source.location,
        state: source.history.state,
        key: (source.history.state && source.history.state.key) || "initial"
      };
    }

    function createHistory(source, options) {
      const listeners = [];
      let location = getLocation(source);

      return {
        get location() {
          return location;
        },

        listen(listener) {
          listeners.push(listener);

          const popstateListener = () => {
            location = getLocation(source);
            listener({ location, action: "POP" });
          };

          source.addEventListener("popstate", popstateListener);

          return () => {
            source.removeEventListener("popstate", popstateListener);

            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
          };
        },

        navigate(to, { state, replace = false } = {}) {
          state = { ...state, key: Date.now() + "" };
          // try...catch iOS Safari limits to 100 pushState calls
          try {
            if (replace) {
              source.history.replaceState(state, null, to);
            } else {
              source.history.pushState(state, null, to);
            }
          } catch (e) {
            source.location[replace ? "replace" : "assign"](to);
          }

          location = getLocation(source);
          listeners.forEach(listener => listener({ location, action: "PUSH" }));
        }
      };
    }

    // Stores history entries in memory for testing or other platforms like Native
    function createMemorySource(initialPathname = "/") {
      let index = 0;
      const stack = [{ pathname: initialPathname, search: "" }];
      const states = [];

      return {
        get location() {
          return stack[index];
        },
        addEventListener(name, fn) {},
        removeEventListener(name, fn) {},
        history: {
          get entries() {
            return stack;
          },
          get index() {
            return index;
          },
          get state() {
            return states[index];
          },
          pushState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            index++;
            stack.push({ pathname, search });
            states.push(state);
          },
          replaceState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            stack[index] = { pathname, search };
            states[index] = state;
          }
        }
      };
    }

    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const canUseDOM = Boolean(
      typeof window !== "undefined" &&
        window.document &&
        window.document.createElement
    );
    const globalHistory = createHistory(canUseDOM ? window : createMemorySource());
    const { navigate } = globalHistory;

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    const paramRe = /^:(.+)/;

    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Check if `string` starts with `search`
     * @param {string} string
     * @param {string} search
     * @return {boolean}
     */
    function startsWith(string, search) {
      return string.substr(0, search.length) === search;
    }

    /**
     * Check if `segment` is a root segment
     * @param {string} segment
     * @return {boolean}
     */
    function isRootSegment(segment) {
      return segment === "";
    }

    /**
     * Check if `segment` is a dynamic segment
     * @param {string} segment
     * @return {boolean}
     */
    function isDynamic(segment) {
      return paramRe.test(segment);
    }

    /**
     * Check if `segment` is a splat
     * @param {string} segment
     * @return {boolean}
     */
    function isSplat(segment) {
      return segment[0] === "*";
    }

    /**
     * Split up the URI into segments delimited by `/`
     * @param {string} uri
     * @return {string[]}
     */
    function segmentize(uri) {
      return (
        uri
          // Strip starting/ending `/`
          .replace(/(^\/+|\/+$)/g, "")
          .split("/")
      );
    }

    /**
     * Strip `str` of potential start and end `/`
     * @param {string} str
     * @return {string}
     */
    function stripSlashes(str) {
      return str.replace(/(^\/+|\/+$)/g, "");
    }

    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    function rankRoute(route, index) {
      const score = route.default
        ? 0
        : segmentize(route.path).reduce((score, segment) => {
            score += SEGMENT_POINTS;

            if (isRootSegment(segment)) {
              score += ROOT_POINTS;
            } else if (isDynamic(segment)) {
              score += DYNAMIC_POINTS;
            } else if (isSplat(segment)) {
              score -= SEGMENT_POINTS + SPLAT_PENALTY;
            } else {
              score += STATIC_POINTS;
            }

            return score;
          }, 0);

      return { route, score, index };
    }

    /**
     * Give a score to all routes and sort them on that
     * @param {object[]} routes
     * @return {object[]}
     */
    function rankRoutes(routes) {
      return (
        routes
          .map(rankRoute)
          // If two routes have the exact same score, we go by index instead
          .sort((a, b) =>
            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
          )
      );
    }

    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    function pick(routes, uri) {
      let match;
      let default_;

      const [uriPathname] = uri.split("?");
      const uriSegments = segmentize(uriPathname);
      const isRootUri = uriSegments[0] === "";
      const ranked = rankRoutes(routes);

      for (let i = 0, l = ranked.length; i < l; i++) {
        const route = ranked[i].route;
        let missed = false;

        if (route.default) {
          default_ = {
            route,
            params: {},
            uri
          };
          continue;
        }

        const routeSegments = segmentize(route.path);
        const params = {};
        const max = Math.max(uriSegments.length, routeSegments.length);
        let index = 0;

        for (; index < max; index++) {
          const routeSegment = routeSegments[index];
          const uriSegment = uriSegments[index];

          if (routeSegment !== undefined && isSplat(routeSegment)) {
            // Hit a splat, just grab the rest, and return a match
            // uri:   /files/documents/work
            // route: /files/* or /files/*splatname
            const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

            params[splatName] = uriSegments
              .slice(index)
              .map(decodeURIComponent)
              .join("/");
            break;
          }

          if (uriSegment === undefined) {
            // URI is shorter than the route, no match
            // uri:   /users
            // route: /users/:userId
            missed = true;
            break;
          }

          let dynamicMatch = paramRe.exec(routeSegment);

          if (dynamicMatch && !isRootUri) {
            const value = decodeURIComponent(uriSegment);
            params[dynamicMatch[1]] = value;
          } else if (routeSegment !== uriSegment) {
            // Current segments don't match, not dynamic, not splat, so no match
            // uri:   /users/123/settings
            // route: /users/:id/profile
            missed = true;
            break;
          }
        }

        if (!missed) {
          match = {
            route,
            params,
            uri: "/" + uriSegments.slice(0, index).join("/")
          };
          break;
        }
      }

      return match || default_ || null;
    }

    /**
     * Check if the `path` matches the `uri`.
     * @param {string} path
     * @param {string} uri
     * @return {?object}
     */
    function match(route, uri) {
      return pick([route], uri);
    }

    /**
     * Add the query to the pathname if a query is given
     * @param {string} pathname
     * @param {string} [query]
     * @return {string}
     */
    function addQuery(pathname, query) {
      return pathname + (query ? `?${query}` : "");
    }

    /**
     * Resolve URIs as though every path is a directory, no files. Relative URIs
     * in the browser can feel awkward because not only can you be "in a directory",
     * you can be "at a file", too. For example:
     *
     *  browserSpecResolve('foo', '/bar/') => /bar/foo
     *  browserSpecResolve('foo', '/bar') => /foo
     *
     * But on the command line of a file system, it's not as complicated. You can't
     * `cd` from a file, only directories. This way, links have to know less about
     * their current path. To go deeper you can do this:
     *
     *  <Link to="deeper"/>
     *  // instead of
     *  <Link to=`{${props.uri}/deeper}`/>
     *
     * Just like `cd`, if you want to go deeper from the command line, you do this:
     *
     *  cd deeper
     *  # not
     *  cd $(pwd)/deeper
     *
     * By treating every path as a directory, linking to relative paths should
     * require less contextual information and (fingers crossed) be more intuitive.
     * @param {string} to
     * @param {string} base
     * @return {string}
     */
    function resolve(to, base) {
      // /foo/bar, /baz/qux => /foo/bar
      if (startsWith(to, "/")) {
        return to;
      }

      const [toPathname, toQuery] = to.split("?");
      const [basePathname] = base.split("?");
      const toSegments = segmentize(toPathname);
      const baseSegments = segmentize(basePathname);

      // ?a=b, /users?b=c => /users?a=b
      if (toSegments[0] === "") {
        return addQuery(basePathname, toQuery);
      }

      // profile, /users/789 => /users/789/profile
      if (!startsWith(toSegments[0], ".")) {
        const pathname = baseSegments.concat(toSegments).join("/");

        return addQuery((basePathname === "/" ? "" : "/") + pathname, toQuery);
      }

      // ./       , /users/123 => /users/123
      // ../      , /users/123 => /users
      // ../..    , /users/123 => /
      // ../../one, /a/b/c/d   => /a/b/one
      // .././one , /a/b/c/d   => /a/b/c/one
      const allSegments = baseSegments.concat(toSegments);
      const segments = [];

      allSegments.forEach(segment => {
        if (segment === "..") {
          segments.pop();
        } else if (segment !== ".") {
          segments.push(segment);
        }
      });

      return addQuery("/" + segments.join("/"), toQuery);
    }

    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    function combinePaths(basepath, path) {
      return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
    }

    /**
     * Decides whether a given `event` should result in a navigation or not.
     * @param {object} event
     */
    function shouldNavigate(event) {
      return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
      );
    }

    /* node_modules\svelte-routing\src\Router.svelte generated by Svelte v3.18.1 */

    function create_fragment(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		l(nodes) {
    			if (default_slot) default_slot.l(nodes);
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32768) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[15], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null));
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let $routes;
    	let { basepath = "/" } = $$props;
    	let { url = null } = $$props;
    	const locationContext = getContext(LOCATION);
    	const routerContext = getContext(ROUTER);
    	const routes = writable([]);
    	component_subscribe($$self, routes, value => $$invalidate(8, $routes = value));
    	const activeRoute = writable(null);
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

    	component_subscribe($$self, location, value => $$invalidate(7, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	component_subscribe($$self, base, value => $$invalidate(6, $base = value));

    	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    		// If there is no activeRoute, the routerBase will be identical to the base.
    		if (activeRoute === null) {
    			return base;
    		}

    		const { path: basepath } = base;
    		const { route, uri } = activeRoute;

    		// Remove the potential /* or /*splatname from
    		// the end of the child Routes relative paths.
    		const path = route.default
    		? basepath
    		: route.path.replace(/\*.*$/, "");

    		return { path, uri };
    	});

    	function registerRoute(route) {
    		const { path: basepath } = $base;
    		let { path } = route;

    		// We store the original path in the _path property so we can reuse
    		// it when the basepath changes. The only thing that matters is that
    		// the route reference is intact, so mutation is fine.
    		route._path = path;

    		route.path = combinePaths(basepath, path);

    		if (typeof window === "undefined") {
    			// In SSR we should set the activeRoute immediately if it is a match.
    			// If there are more Routes being registered after a match is found,
    			// we just skip them.
    			if (hasActiveRoute) {
    				return;
    			}

    			const matchingRoute = match(route, $location.pathname);

    			if (matchingRoute) {
    				activeRoute.set(matchingRoute);
    				hasActiveRoute = true;
    			}
    		} else {
    			routes.update(rs => {
    				rs.push(route);
    				return rs;
    			});
    		}
    	}

    	function unregisterRoute(route) {
    		routes.update(rs => {
    			const index = rs.indexOf(route);
    			rs.splice(index, 1);
    			return rs;
    		});
    	}

    	if (!locationContext) {
    		// The topmost Router in the tree is responsible for updating
    		// the location store and supplying it through context.
    		onMount(() => {
    			const unlisten = globalHistory.listen(history => {
    				location.set(history.location);
    			});

    			return unlisten;
    		});

    		setContext(LOCATION, location);
    	}

    	setContext(ROUTER, {
    		activeRoute,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("$$scope" in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 64) {
    			// This reactive statement will update all the Routes' path when
    			// the basepath changes.
    			 {
    				const { path: basepath } = $base;

    				routes.update(rs => {
    					rs.forEach(r => r.path = combinePaths(basepath, r._path));
    					return rs;
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*$routes, $location*/ 384) {
    			// This reactive statement will be run when the Router is created
    			// when there are no Routes and then again the following tick, so it
    			// will not find an active Route in SSR and in the browser it will only
    			// pick an active Route after all Routes have been registered.
    			 {
    				const bestMatch = pick($routes, $location.pathname);
    				activeRoute.set(bestMatch);
    			}
    		}
    	};

    	return [
    		routes,
    		location,
    		base,
    		basepath,
    		url,
    		hasActiveRoute,
    		$base,
    		$location,
    		$routes,
    		locationContext,
    		routerContext,
    		activeRoute,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$$scope,
    		$$slots
    	];
    }

    class Router extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, { basepath: 3, url: 4 });
    	}
    }

    /* node_modules\svelte-routing\src\Route.svelte generated by Svelte v3.18.1 */

    const get_default_slot_changes = dirty => ({
    	params: dirty & /*routeParams*/ 2,
    	location: dirty & /*$location*/ 16
    });

    const get_default_slot_context = ctx => ({
    	params: /*routeParams*/ ctx[1],
    	location: /*$location*/ ctx[4]
    });

    // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0] !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l(nodes) {
    			if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (43:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], get_default_slot_context);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		l(nodes) {
    			if (default_slot) default_slot.l(nodes);
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope, routeParams, $location*/ 4114) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], get_default_slot_context), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, get_default_slot_changes));
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    // (41:2) {#if component !== null}
    function create_if_block_1(ctx) {
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ location: /*$location*/ ctx[4] },
    		/*routeParams*/ ctx[1],
    		/*routeProps*/ ctx[2]
    	];

    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return { props: switch_instance_props };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	return {
    		c() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l(nodes) {
    			if (switch_instance) claim_component(switch_instance.$$.fragment, nodes);
    			switch_instance_anchor = empty();
    		},
    		m(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*$location, routeParams, routeProps*/ 22)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*$location*/ 16 && { location: /*$location*/ ctx[4] },
    					dirty & /*routeParams*/ 2 && get_spread_object(/*routeParams*/ ctx[1]),
    					dirty & /*routeProps*/ 4 && get_spread_object(/*routeProps*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7] && create_if_block(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l(nodes) {
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	let $location;
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	component_subscribe($$self, activeRoute, value => $$invalidate(3, $activeRoute = value));
    	const location = getContext(LOCATION);
    	component_subscribe($$self, location, value => $$invalidate(4, $location = value));

    	const route = {
    		path,
    		// If no path prop is given, this Route will act as the default Route
    		// that is rendered if no other Route in the Router is a match.
    		default: path === ""
    	};

    	let routeParams = {};
    	let routeProps = {};
    	registerRoute(route);

    	// There is no need to unregister Routes in SSR since it will all be
    	// thrown away anyway.
    	if (typeof window !== "undefined") {
    		onDestroy(() => {
    			unregisterRoute(route);
    		});
    	}

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("path" in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(12, $$scope = $$new_props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeRoute*/ 8) {
    			 if ($activeRoute && $activeRoute.route === route) {
    				$$invalidate(1, routeParams = $activeRoute.params);
    			}
    		}

    		 {
    			const { path, component, ...rest } = $$props;
    			$$invalidate(2, routeProps = rest);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location,
    		activeRoute,
    		location,
    		route,
    		path,
    		registerRoute,
    		unregisterRoute,
    		$$props,
    		$$scope,
    		$$slots
    	];
    }

    class Route extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { path: 8, component: 0 });
    	}
    }

    /* node_modules\svelte-routing\src\Link.svelte generated by Svelte v3.18.1 */

    function create_fragment$2(ctx) {
    	let a;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	let a_levels = [
    		{ href: /*href*/ ctx[0] },
    		{ "aria-current": /*ariaCurrent*/ ctx[2] },
    		/*props*/ ctx[1]
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	return {
    		c() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			this.h();
    		},
    		l(nodes) {
    			a = claim_element(nodes, "A", { href: true, "aria-current": true });
    			var a_nodes = children(a);
    			if (default_slot) default_slot.l(a_nodes);
    			a_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			set_attributes(a, a_data);
    		},
    		m(target, anchor) {
    			insert(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    			dispose = listen(a, "click", /*onClick*/ ctx[5]);
    		},
    		p(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32768) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[15], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null));
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				dirty & /*href*/ 1 && { href: /*href*/ ctx[0] },
    				dirty & /*ariaCurrent*/ 4 && { "aria-current": /*ariaCurrent*/ ctx[2] },
    				dirty & /*props*/ 2 && /*props*/ ctx[1]
    			]));
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(a);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let { to = "#" } = $$props;
    	let { replace = false } = $$props;
    	let { state = {} } = $$props;
    	let { getProps = () => ({}) } = $$props;
    	const { base } = getContext(ROUTER);
    	component_subscribe($$self, base, value => $$invalidate(12, $base = value));
    	const location = getContext(LOCATION);
    	component_subscribe($$self, location, value => $$invalidate(13, $location = value));
    	const dispatch = createEventDispatcher();
    	let href, isPartiallyCurrent, isCurrent, props;

    	function onClick(event) {
    		dispatch("click", event);

    		if (shouldNavigate(event)) {
    			event.preventDefault();

    			// Don't push another entry to the history stack when the user
    			// clicks on a Link to the page they are currently on.
    			const shouldReplace = $location.pathname === href || replace;

    			navigate(href, { state, replace: shouldReplace });
    		}
    	}

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("to" in $$props) $$invalidate(6, to = $$props.to);
    		if ("replace" in $$props) $$invalidate(7, replace = $$props.replace);
    		if ("state" in $$props) $$invalidate(8, state = $$props.state);
    		if ("getProps" in $$props) $$invalidate(9, getProps = $$props.getProps);
    		if ("$$scope" in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	let ariaCurrent;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*to, $base*/ 4160) {
    			 $$invalidate(0, href = to === "/" ? $base.uri : resolve(to, $base.uri));
    		}

    		if ($$self.$$.dirty & /*$location, href*/ 8193) {
    			 $$invalidate(10, isPartiallyCurrent = startsWith($location.pathname, href));
    		}

    		if ($$self.$$.dirty & /*href, $location*/ 8193) {
    			 $$invalidate(11, isCurrent = href === $location.pathname);
    		}

    		if ($$self.$$.dirty & /*isCurrent*/ 2048) {
    			 $$invalidate(2, ariaCurrent = isCurrent ? "page" : undefined);
    		}

    		if ($$self.$$.dirty & /*getProps, $location, href, isPartiallyCurrent, isCurrent*/ 11777) {
    			 $$invalidate(1, props = getProps({
    				location: $location,
    				href,
    				isPartiallyCurrent,
    				isCurrent
    			}));
    		}
    	};

    	return [
    		href,
    		props,
    		ariaCurrent,
    		base,
    		location,
    		onClick,
    		to,
    		replace,
    		state,
    		getProps,
    		isPartiallyCurrent,
    		isCurrent,
    		$base,
    		$location,
    		dispatch,
    		$$scope,
    		$$slots
    	];
    }

    class Link extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { to: 6, replace: 7, state: 8, getProps: 9 });
    	}
    }

    /* src\components\NavLink.svelte generated by Svelte v3.18.1 */

    function create_default_slot(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		l(nodes) {
    			if (default_slot) default_slot.l(nodes);
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[2], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null));
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	let current;

    	const link = new Link({
    			props: {
    				to: /*to*/ ctx[0],
    				getProps,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(link.$$.fragment);
    		},
    		l(nodes) {
    			claim_component(link.$$.fragment, nodes);
    		},
    		m(target, anchor) {
    			mount_component(link, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const link_changes = {};
    			if (dirty & /*to*/ 1) link_changes.to = /*to*/ ctx[0];

    			if (dirty & /*$$scope*/ 4) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(link, detaching);
    		}
    	};
    }

    function getProps({ location, href, isPartiallyCurrent, isCurrent }) {
    	const isActive = href === "/"
    	? isCurrent
    	: isPartiallyCurrent || isCurrent;

    	// The object returned here is spread on the anchor element's attributes
    	if (isActive) {
    		return { class: "active" };
    	}

    	return {};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { to = "" } = $$props;
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("to" in $$props) $$invalidate(0, to = $$props.to);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	return [to, $$slots, $$scope];
    }

    class NavLink extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { to: 0 });
    	}
    }

    /* src\routes\Home.svelte generated by Svelte v3.18.1 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (26:4) {#each githubFeed as item}
    function create_each_block(ctx) {
    	let div;
    	let p0;
    	let a;

    	let t0_value = new Date(/*item*/ ctx[1].pubDate.replace(/ /g, "T")).toLocaleString("en-US", {
    		day: "numeric",
    		month: "numeric",
    		year: "numeric",
    		hour: "numeric",
    		minute: "numeric",
    		hour12: true
    	}) + "";

    	let t0;
    	let a_href_value;
    	let t1;
    	let p1;
    	let t2_value = /*item*/ ctx[1].title + "";
    	let t2;
    	let t3;

    	return {
    		c() {
    			div = element("div");
    			p0 = element("p");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			this.h();
    		},
    		l(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			p0 = claim_element(div_nodes, "P", {});
    			var p0_nodes = children(p0);
    			a = claim_element(p0_nodes, "A", { target: true, href: true });
    			var a_nodes = children(a);
    			t0 = claim_text(a_nodes, t0_value);
    			a_nodes.forEach(detach);
    			p0_nodes.forEach(detach);
    			t1 = claim_space(div_nodes);
    			p1 = claim_element(div_nodes, "P", { style: true });
    			var p1_nodes = children(p1);
    			t2 = claim_text(p1_nodes, t2_value);
    			p1_nodes.forEach(detach);
    			t3 = claim_space(div_nodes);
    			div_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(a, "target", "_blank");
    			attr(a, "href", a_href_value = /*item*/ ctx[1].link);
    			set_style(p1, "margin-top", "-15px");
    			attr(div, "class", "commitBlock");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, p0);
    			append(p0, a);
    			append(a, t0);
    			append(div, t1);
    			append(div, p1);
    			append(p1, t2);
    			append(div, t3);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*githubFeed*/ 1 && t0_value !== (t0_value = new Date(/*item*/ ctx[1].pubDate.replace(/ /g, "T")).toLocaleString("en-US", {
    				day: "numeric",
    				month: "numeric",
    				year: "numeric",
    				hour: "numeric",
    				minute: "numeric",
    				hour12: true
    			}) + "")) set_data(t0, t0_value);

    			if (dirty & /*githubFeed*/ 1 && a_href_value !== (a_href_value = /*item*/ ctx[1].link)) {
    				attr(a, "href", a_href_value);
    			}

    			if (dirty & /*githubFeed*/ 1 && t2_value !== (t2_value = /*item*/ ctx[1].title + "")) set_data(t2, t2_value);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let div4;
    	let div2;
    	let h10;
    	let t0;
    	let t1;
    	let div0;
    	let p0;
    	let t2;
    	let t3;
    	let h11;
    	let t4;
    	let t5;
    	let div1;
    	let p1;
    	let t6;
    	let t7;
    	let div3;
    	let h12;
    	let t8;
    	let t9;
    	let each_value = /*githubFeed*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div4 = element("div");
    			div2 = element("div");
    			h10 = element("h1");
    			t0 = text("Who is Chris?");
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t2 = text("I'm an application developer based in Miami, FL.");
    			t3 = space();
    			h11 = element("h1");
    			t4 = text("What does Chris do now?");
    			t5 = space();
    			div1 = element("div");
    			p1 = element("p");
    			t6 = text("He works at TECKpert. In his spare-time, he's building place4pals.");
    			t7 = space();
    			div3 = element("div");
    			h12 = element("h1");
    			t8 = text("GitHub Feed");
    			t9 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.h();
    		},
    		l(nodes) {
    			div4 = claim_element(nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			div2 = claim_element(div4_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			h10 = claim_element(div2_nodes, "H1", {});
    			var h10_nodes = children(h10);
    			t0 = claim_text(h10_nodes, "Who is Chris?");
    			h10_nodes.forEach(detach);
    			t1 = claim_space(div2_nodes);
    			div0 = claim_element(div2_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			p0 = claim_element(div0_nodes, "P", {});
    			var p0_nodes = children(p0);
    			t2 = claim_text(p0_nodes, "I'm an application developer based in Miami, FL.");
    			p0_nodes.forEach(detach);
    			div0_nodes.forEach(detach);
    			t3 = claim_space(div2_nodes);
    			h11 = claim_element(div2_nodes, "H1", {});
    			var h11_nodes = children(h11);
    			t4 = claim_text(h11_nodes, "What does Chris do now?");
    			h11_nodes.forEach(detach);
    			t5 = claim_space(div2_nodes);
    			div1 = claim_element(div2_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			p1 = claim_element(div1_nodes, "P", {});
    			var p1_nodes = children(p1);
    			t6 = claim_text(p1_nodes, "He works at TECKpert. In his spare-time, he's building place4pals.");
    			p1_nodes.forEach(detach);
    			div1_nodes.forEach(detach);
    			div2_nodes.forEach(detach);
    			t7 = claim_space(div4_nodes);
    			div3 = claim_element(div4_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			h12 = claim_element(div3_nodes, "H1", {});
    			var h12_nodes = children(h12);
    			t8 = claim_text(h12_nodes, "GitHub Feed");
    			h12_nodes.forEach(detach);
    			t9 = claim_space(div3_nodes);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(div3_nodes);
    			}

    			div3_nodes.forEach(detach);
    			div4_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(div0, "class", "textBlock");
    			attr(div1, "class", "textBlock");
    			attr(div2, "class", "mainbar");
    			attr(div3, "class", "sidebar");
    			attr(div4, "class", "mainbarAndSidebarContainer");
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div2);
    			append(div2, h10);
    			append(h10, t0);
    			append(div2, t1);
    			append(div2, div0);
    			append(div0, p0);
    			append(p0, t2);
    			append(div2, t3);
    			append(div2, h11);
    			append(h11, t4);
    			append(div2, t5);
    			append(div2, div1);
    			append(div1, p1);
    			append(p1, t6);
    			append(div4, t7);
    			append(div4, div3);
    			append(div3, h12);
    			append(h12, t8);
    			append(div3, t9);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*githubFeed, Date*/ 1) {
    				each_value = /*githubFeed*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div4);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let githubFeed = [];

    	onMount(async function () {
    		const response = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fgithub.com%2Fheythisischris.atom");
    		let data = await response.json();
    		$$invalidate(0, githubFeed = data.items);
    	});

    	return [githubFeed];
    }

    class Home extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});
    	}
    }

    /* src\routes\Portfolio.svelte generated by Svelte v3.18.1 */

    function create_fragment$5(ctx) {
    	let h1;
    	let t0;
    	let t1;
    	let div;
    	let p;
    	let t2;

    	return {
    		c() {
    			h1 = element("h1");
    			t0 = text("Apps");
    			t1 = space();
    			div = element("div");
    			p = element("p");
    			t2 = text("These are some of the apps that I've worked on.");
    			this.h();
    		},
    		l(nodes) {
    			h1 = claim_element(nodes, "H1", {});
    			var h1_nodes = children(h1);
    			t0 = claim_text(h1_nodes, "Apps");
    			h1_nodes.forEach(detach);
    			t1 = claim_space(nodes);
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			p = claim_element(div_nodes, "P", {});
    			var p_nodes = children(p);
    			t2 = claim_text(p_nodes, "These are some of the apps that I've worked on.");
    			p_nodes.forEach(detach);
    			div_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(div, "class", "textBlock");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);
    			append(div, p);
    			append(p, t2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    		}
    	};
    }

    class Portfolio extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$5, safe_not_equal, {});
    	}
    }

    /* src\routes\Resume.svelte generated by Svelte v3.18.1 */

    function create_fragment$6(ctx) {
    	let h10;
    	let t0;
    	let t1;
    	let div0;
    	let p0;
    	let t2;
    	let t3;
    	let h11;
    	let t4;
    	let t5;
    	let div1;
    	let p1;
    	let strong0;
    	let t6;
    	let t7;
    	let br0;
    	let t8;
    	let br1;
    	let t9;
    	let t10;
    	let h12;
    	let t11;
    	let t12;
    	let div2;
    	let p2;
    	let strong1;
    	let t13;
    	let t14;
    	let br2;
    	let t15;
    	let a0;
    	let t16;
    	let t17;
    	let t18;
    	let ul2;
    	let li0;
    	let t19;
    	let t20;
    	let li6;
    	let t21;
    	let ul0;
    	let li1;
    	let a1;
    	let t22;
    	let t23;
    	let t24;
    	let li2;
    	let a2;
    	let t25;
    	let t26;
    	let t27;
    	let li3;
    	let a3;
    	let t28;
    	let t29;
    	let t30;
    	let li4;
    	let a4;
    	let t31;
    	let t32;
    	let t33;
    	let li5;
    	let a5;
    	let t34;
    	let t35;
    	let t36;
    	let li7;
    	let t37;
    	let t38;
    	let li8;
    	let t39;
    	let t40;
    	let li11;
    	let t41;
    	let a6;
    	let t42;
    	let t43;
    	let ul1;
    	let li9;
    	let t44;
    	let t45;
    	let li10;
    	let t46;
    	let br3;
    	let t47;
    	let p3;
    	let strong2;
    	let t48;
    	let t49;
    	let br4;
    	let t50;
    	let t51;
    	let ul3;
    	let li12;
    	let t52;
    	let a7;
    	let t53;
    	let t54;
    	let t55;
    	let li13;
    	let t56;
    	let sup;
    	let t57;
    	let t58;
    	let t59;
    	let p4;
    	let strong3;
    	let t60;
    	let t61;
    	let br5;
    	let t62;
    	let t63;
    	let ul4;
    	let li14;
    	let t64;
    	let t65;
    	let li15;
    	let t66;
    	let a8;
    	let t67;
    	let t68;
    	let t69;
    	let h13;
    	let t70;
    	let t71;
    	let div3;
    	let p5;
    	let strong4;
    	let t72;
    	let t73;
    	let br6;
    	let t74;
    	let t75;
    	let ul5;
    	let li16;
    	let t76;
    	let t77;
    	let h14;
    	let t78;
    	let t79;
    	let div4;
    	let p6;
    	let strong5;
    	let t80;
    	let t81;
    	let br7;
    	let t82;
    	let strong6;
    	let t83;
    	let t84;
    	let br8;
    	let t85;
    	let strong7;
    	let t86;
    	let t87;
    	let br9;
    	let t88;
    	let strong8;
    	let t89;
    	let t90;

    	return {
    		c() {
    			h10 = element("h1");
    			t0 = text("Objective");
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t2 = text("To develop robust software in an agile environment");
    			t3 = space();
    			h11 = element("h1");
    			t4 = text("Education");
    			t5 = space();
    			div1 = element("div");
    			p1 = element("p");
    			strong0 = element("strong");
    			t6 = text("Bachelor of Science in Business Administration");
    			t7 = text(", May 2019\n    ");
    			br0 = element("br");
    			t8 = text("\n    University of Florida, Gainesville, FL\n    ");
    			br1 = element("br");
    			t9 = text("\n    Specialization in Computer Science");
    			t10 = space();
    			h12 = element("h1");
    			t11 = text("Experience");
    			t12 = space();
    			div2 = element("div");
    			p2 = element("p");
    			strong1 = element("strong");
    			t13 = text("Application Developer,");
    			t14 = text("\n    June 2016 – Present\n    ");
    			br2 = element("br");
    			t15 = space();
    			a0 = element("a");
    			t16 = text("TECKpert");
    			t17 = text(", Miami, Florida – Web/Mobile Software Development Agency");
    			t18 = space();
    			ul2 = element("ul");
    			li0 = element("li");
    			t19 = text("Began as an intern during Summer 2016 finding and fixing bugs in iOS and\n      Android apps");
    			t20 = space();
    			li6 = element("li");
    			t21 = text("Accepted a paid position as a programmer afterwards and worked on these\n      apps and web services:\n      ");
    			ul0 = element("ul");
    			li1 = element("li");
    			a1 = element("a");
    			t22 = text("CorkageFee");
    			t23 = text(" – View wine bottle fees at nearby restaurants");
    			t24 = space();
    			li2 = element("li");
    			a2 = element("a");
    			t25 = text("RealDash");
    			t26 = text(" – Platform for real estate professionals");
    			t27 = space();
    			li3 = element("li");
    			a3 = element("a");
    			t28 = text("ROAM Ropes");
    			t29 = text(" – Audio equalization for Bluetooth earphones");
    			t30 = space();
    			li4 = element("li");
    			a4 = element("a");
    			t31 = text("CastCloud");
    			t32 = text(" – Casting attendance system for film productions");
    			t33 = space();
    			li5 = element("li");
    			a5 = element("a");
    			t34 = text("CSK Legal");
    			t35 = text(" – Shows directory of attorneys with the CSK firm");
    			t36 = space();
    			li7 = element("li");
    			t37 = text("Developed frontend for these apps using Objective C & Swift 3 (iOS),\n      Java (Android), & C# .NET (Windows)");
    			t38 = space();
    			li8 = element("li");
    			t39 = text("Created/maintained WordPress plugins for various client websites in PHP");
    			t40 = space();
    			li11 = element("li");
    			t41 = text("Experience with Serverless Applications on AWS for ");
    			a6 = element("a");
    			t42 = text("Hospitalist Assist");
    			t43 = text(", a patient\n      admitting portal\n      ");
    			ul1 = element("ul");
    			li9 = element("li");
    			t44 = text("Developed multiple client backends using Node.js + Lambda, frontend\n          using React Native");
    			t45 = space();
    			li10 = element("li");
    			t46 = text("Utilize Amazon Cognito for user authentication, Amazon Lambda for\n          serverless API calls, API Gateway to route calls to Lambda, and Amazon\n          RDS to host a MySQL instance or DynamoDB to host a NoSQL instance\n          ");
    			br3 = element("br");
    			t47 = space();
    			p3 = element("p");
    			strong2 = element("strong");
    			t48 = text("Website Developer");
    			t49 = text(", 2013\n  ");
    			br4 = element("br");
    			t50 = text("Lexus Eco Challenge, Miami, Florida");
    			t51 = space();
    			ul3 = element("ul");
    			li12 = element("li");
    			t52 = text("Developed ");
    			a7 = element("a");
    			t53 = text("dontbeadrain.com");
    			t54 = text(" which highlighted water conservation tips using HTML5\n      and CSS3.");
    			t55 = space();
    			li13 = element("li");
    			t56 = text("Won 1\n      ");
    			sup = element("sup");
    			t57 = text("st");
    			t58 = text("\n      Place in National Competition, received over $20,000 in funding for our\n      school");
    			t59 = space();
    			p4 = element("p");
    			strong3 = element("strong");
    			t60 = text("Game Developer,");
    			t61 = text("\n    2008\n  ");
    			br5 = element("br");
    			t62 = text("Self-employed, Miami, Florida");
    			t63 = space();
    			ul4 = element("ul");
    			li14 = element("li");
    			t64 = text("Programmed several Flash games");
    			t65 = space();
    			li15 = element("li");
    			t66 = text("Sold ");
    			a8 = element("a");
    			t67 = text("Dodge");
    			t68 = text(" to Fettspielen.de, a German game portal.");
    			t69 = space();
    			h13 = element("h1");
    			t70 = text("Involvement");
    			t71 = space();
    			div3 = element("div");
    			p5 = element("p");
    			strong4 = element("strong");
    			t72 = text("Programming Mentor");
    			t73 = text(", August 2017 – December 2017\n  ");
    			br6 = element("br");
    			t74 = text("First Time Programmers Club, University of Florida");
    			t75 = space();
    			ul5 = element("ul");
    			li16 = element("li");
    			t76 = text("Assisted undergraduate programming majors in learning coding concepts and\n      completing their coursework");
    			t77 = space();
    			h14 = element("h1");
    			t78 = text("Skills");
    			t79 = space();
    			div4 = element("div");
    			p6 = element("p");
    			strong5 = element("strong");
    			t80 = text("Languages:");
    			t81 = text("\n    JavaScript, React, React Native, Angular, PHP, ASP, C# (.NET), Java, Swift,\n    Obj-C, C++");
    			br7 = element("br");
    			t82 = space();
    			strong6 = element("strong");
    			t83 = text("Databases:");
    			t84 = text("\n    MySQL, PostgreSQL, MongoDB, DynamoDB");
    			br8 = element("br");
    			t85 = space();
    			strong7 = element("strong");
    			t86 = text("IDEs and Software:");
    			t87 = text("\n    VS Code, Git Bash, Xcode, Notepad++, Android Studio");
    			br9 = element("br");
    			t88 = space();
    			strong8 = element("strong");
    			t89 = text("Languages:");
    			t90 = text("\n    Spanish (fluent)");
    			this.h();
    		},
    		l(nodes) {
    			h10 = claim_element(nodes, "H1", {});
    			var h10_nodes = children(h10);
    			t0 = claim_text(h10_nodes, "Objective");
    			h10_nodes.forEach(detach);
    			t1 = claim_space(nodes);
    			div0 = claim_element(nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			p0 = claim_element(div0_nodes, "P", {});
    			var p0_nodes = children(p0);
    			t2 = claim_text(p0_nodes, "To develop robust software in an agile environment");
    			p0_nodes.forEach(detach);
    			div0_nodes.forEach(detach);
    			t3 = claim_space(nodes);
    			h11 = claim_element(nodes, "H1", {});
    			var h11_nodes = children(h11);
    			t4 = claim_text(h11_nodes, "Education");
    			h11_nodes.forEach(detach);
    			t5 = claim_space(nodes);
    			div1 = claim_element(nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			p1 = claim_element(div1_nodes, "P", {});
    			var p1_nodes = children(p1);
    			strong0 = claim_element(p1_nodes, "STRONG", {});
    			var strong0_nodes = children(strong0);
    			t6 = claim_text(strong0_nodes, "Bachelor of Science in Business Administration");
    			strong0_nodes.forEach(detach);
    			t7 = claim_text(p1_nodes, ", May 2019\n    ");
    			br0 = claim_element(p1_nodes, "BR", {});
    			t8 = claim_text(p1_nodes, "\n    University of Florida, Gainesville, FL\n    ");
    			br1 = claim_element(p1_nodes, "BR", {});
    			t9 = claim_text(p1_nodes, "\n    Specialization in Computer Science");
    			p1_nodes.forEach(detach);
    			div1_nodes.forEach(detach);
    			t10 = claim_space(nodes);
    			h12 = claim_element(nodes, "H1", {});
    			var h12_nodes = children(h12);
    			t11 = claim_text(h12_nodes, "Experience");
    			h12_nodes.forEach(detach);
    			t12 = claim_space(nodes);
    			div2 = claim_element(nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			p2 = claim_element(div2_nodes, "P", {});
    			var p2_nodes = children(p2);
    			strong1 = claim_element(p2_nodes, "STRONG", {});
    			var strong1_nodes = children(strong1);
    			t13 = claim_text(strong1_nodes, "Application Developer,");
    			strong1_nodes.forEach(detach);
    			t14 = claim_text(p2_nodes, "\n    June 2016 – Present\n    ");
    			br2 = claim_element(p2_nodes, "BR", {});
    			t15 = claim_space(p2_nodes);
    			a0 = claim_element(p2_nodes, "A", { href: true });
    			var a0_nodes = children(a0);
    			t16 = claim_text(a0_nodes, "TECKpert");
    			a0_nodes.forEach(detach);
    			t17 = claim_text(p2_nodes, ", Miami, Florida – Web/Mobile Software Development Agency");
    			p2_nodes.forEach(detach);
    			t18 = claim_space(div2_nodes);
    			ul2 = claim_element(div2_nodes, "UL", { style: true });
    			var ul2_nodes = children(ul2);
    			li0 = claim_element(ul2_nodes, "LI", {});
    			var li0_nodes = children(li0);
    			t19 = claim_text(li0_nodes, "Began as an intern during Summer 2016 finding and fixing bugs in iOS and\n      Android apps");
    			li0_nodes.forEach(detach);
    			t20 = claim_space(ul2_nodes);
    			li6 = claim_element(ul2_nodes, "LI", {});
    			var li6_nodes = children(li6);
    			t21 = claim_text(li6_nodes, "Accepted a paid position as a programmer afterwards and worked on these\n      apps and web services:\n      ");
    			ul0 = claim_element(li6_nodes, "UL", {});
    			var ul0_nodes = children(ul0);
    			li1 = claim_element(ul0_nodes, "LI", {});
    			var li1_nodes = children(li1);
    			a1 = claim_element(li1_nodes, "A", { href: true });
    			var a1_nodes = children(a1);
    			t22 = claim_text(a1_nodes, "CorkageFee");
    			a1_nodes.forEach(detach);
    			t23 = claim_text(li1_nodes, " – View wine bottle fees at nearby restaurants");
    			li1_nodes.forEach(detach);
    			t24 = claim_space(ul0_nodes);
    			li2 = claim_element(ul0_nodes, "LI", {});
    			var li2_nodes = children(li2);
    			a2 = claim_element(li2_nodes, "A", { href: true });
    			var a2_nodes = children(a2);
    			t25 = claim_text(a2_nodes, "RealDash");
    			a2_nodes.forEach(detach);
    			t26 = claim_text(li2_nodes, " – Platform for real estate professionals");
    			li2_nodes.forEach(detach);
    			t27 = claim_space(ul0_nodes);
    			li3 = claim_element(ul0_nodes, "LI", {});
    			var li3_nodes = children(li3);
    			a3 = claim_element(li3_nodes, "A", { href: true });
    			var a3_nodes = children(a3);
    			t28 = claim_text(a3_nodes, "ROAM Ropes");
    			a3_nodes.forEach(detach);
    			t29 = claim_text(li3_nodes, " – Audio equalization for Bluetooth earphones");
    			li3_nodes.forEach(detach);
    			t30 = claim_space(ul0_nodes);
    			li4 = claim_element(ul0_nodes, "LI", {});
    			var li4_nodes = children(li4);
    			a4 = claim_element(li4_nodes, "A", { href: true });
    			var a4_nodes = children(a4);
    			t31 = claim_text(a4_nodes, "CastCloud");
    			a4_nodes.forEach(detach);
    			t32 = claim_text(li4_nodes, " – Casting attendance system for film productions");
    			li4_nodes.forEach(detach);
    			t33 = claim_space(ul0_nodes);
    			li5 = claim_element(ul0_nodes, "LI", {});
    			var li5_nodes = children(li5);
    			a5 = claim_element(li5_nodes, "A", { href: true });
    			var a5_nodes = children(a5);
    			t34 = claim_text(a5_nodes, "CSK Legal");
    			a5_nodes.forEach(detach);
    			t35 = claim_text(li5_nodes, " – Shows directory of attorneys with the CSK firm");
    			li5_nodes.forEach(detach);
    			ul0_nodes.forEach(detach);
    			li6_nodes.forEach(detach);
    			t36 = claim_space(ul2_nodes);
    			li7 = claim_element(ul2_nodes, "LI", {});
    			var li7_nodes = children(li7);
    			t37 = claim_text(li7_nodes, "Developed frontend for these apps using Objective C & Swift 3 (iOS),\n      Java (Android), & C# .NET (Windows)");
    			li7_nodes.forEach(detach);
    			t38 = claim_space(ul2_nodes);
    			li8 = claim_element(ul2_nodes, "LI", {});
    			var li8_nodes = children(li8);
    			t39 = claim_text(li8_nodes, "Created/maintained WordPress plugins for various client websites in PHP");
    			li8_nodes.forEach(detach);
    			t40 = claim_space(ul2_nodes);
    			li11 = claim_element(ul2_nodes, "LI", {});
    			var li11_nodes = children(li11);
    			t41 = claim_text(li11_nodes, "Experience with Serverless Applications on AWS for ");
    			a6 = claim_element(li11_nodes, "A", { href: true });
    			var a6_nodes = children(a6);
    			t42 = claim_text(a6_nodes, "Hospitalist Assist");
    			a6_nodes.forEach(detach);
    			t43 = claim_text(li11_nodes, ", a patient\n      admitting portal\n      ");
    			ul1 = claim_element(li11_nodes, "UL", {});
    			var ul1_nodes = children(ul1);
    			li9 = claim_element(ul1_nodes, "LI", {});
    			var li9_nodes = children(li9);
    			t44 = claim_text(li9_nodes, "Developed multiple client backends using Node.js + Lambda, frontend\n          using React Native");
    			li9_nodes.forEach(detach);
    			t45 = claim_space(ul1_nodes);
    			li10 = claim_element(ul1_nodes, "LI", {});
    			var li10_nodes = children(li10);
    			t46 = claim_text(li10_nodes, "Utilize Amazon Cognito for user authentication, Amazon Lambda for\n          serverless API calls, API Gateway to route calls to Lambda, and Amazon\n          RDS to host a MySQL instance or DynamoDB to host a NoSQL instance\n          ");
    			br3 = claim_element(li10_nodes, "BR", {});
    			li10_nodes.forEach(detach);
    			ul1_nodes.forEach(detach);
    			li11_nodes.forEach(detach);
    			ul2_nodes.forEach(detach);
    			t47 = claim_space(div2_nodes);
    			p3 = claim_element(div2_nodes, "P", {});
    			var p3_nodes = children(p3);
    			strong2 = claim_element(p3_nodes, "STRONG", {});
    			var strong2_nodes = children(strong2);
    			t48 = claim_text(strong2_nodes, "Website Developer");
    			strong2_nodes.forEach(detach);
    			t49 = claim_text(p3_nodes, ", 2013\n  ");
    			br4 = claim_element(p3_nodes, "BR", {});
    			t50 = claim_text(p3_nodes, "Lexus Eco Challenge, Miami, Florida");
    			p3_nodes.forEach(detach);
    			t51 = claim_space(div2_nodes);
    			ul3 = claim_element(div2_nodes, "UL", { style: true });
    			var ul3_nodes = children(ul3);
    			li12 = claim_element(ul3_nodes, "LI", {});
    			var li12_nodes = children(li12);
    			t52 = claim_text(li12_nodes, "Developed ");
    			a7 = claim_element(li12_nodes, "A", { href: true });
    			var a7_nodes = children(a7);
    			t53 = claim_text(a7_nodes, "dontbeadrain.com");
    			a7_nodes.forEach(detach);
    			t54 = claim_text(li12_nodes, " which highlighted water conservation tips using HTML5\n      and CSS3.");
    			li12_nodes.forEach(detach);
    			t55 = claim_space(ul3_nodes);
    			li13 = claim_element(ul3_nodes, "LI", {});
    			var li13_nodes = children(li13);
    			t56 = claim_text(li13_nodes, "Won 1\n      ");
    			sup = claim_element(li13_nodes, "SUP", {});
    			var sup_nodes = children(sup);
    			t57 = claim_text(sup_nodes, "st");
    			sup_nodes.forEach(detach);
    			t58 = claim_text(li13_nodes, "\n      Place in National Competition, received over $20,000 in funding for our\n      school");
    			li13_nodes.forEach(detach);
    			ul3_nodes.forEach(detach);
    			t59 = claim_space(div2_nodes);
    			p4 = claim_element(div2_nodes, "P", {});
    			var p4_nodes = children(p4);
    			strong3 = claim_element(p4_nodes, "STRONG", {});
    			var strong3_nodes = children(strong3);
    			t60 = claim_text(strong3_nodes, "Game Developer,");
    			strong3_nodes.forEach(detach);
    			t61 = claim_text(p4_nodes, "\n    2008\n  ");
    			br5 = claim_element(p4_nodes, "BR", {});
    			t62 = claim_text(p4_nodes, "Self-employed, Miami, Florida");
    			p4_nodes.forEach(detach);
    			t63 = claim_space(div2_nodes);
    			ul4 = claim_element(div2_nodes, "UL", { style: true });
    			var ul4_nodes = children(ul4);
    			li14 = claim_element(ul4_nodes, "LI", {});
    			var li14_nodes = children(li14);
    			t64 = claim_text(li14_nodes, "Programmed several Flash games");
    			li14_nodes.forEach(detach);
    			t65 = claim_space(ul4_nodes);
    			li15 = claim_element(ul4_nodes, "LI", {});
    			var li15_nodes = children(li15);
    			t66 = claim_text(li15_nodes, "Sold ");
    			a8 = claim_element(li15_nodes, "A", { href: true });
    			var a8_nodes = children(a8);
    			t67 = claim_text(a8_nodes, "Dodge");
    			a8_nodes.forEach(detach);
    			t68 = claim_text(li15_nodes, " to Fettspielen.de, a German game portal.");
    			li15_nodes.forEach(detach);
    			ul4_nodes.forEach(detach);
    			div2_nodes.forEach(detach);
    			t69 = claim_space(nodes);
    			h13 = claim_element(nodes, "H1", {});
    			var h13_nodes = children(h13);
    			t70 = claim_text(h13_nodes, "Involvement");
    			h13_nodes.forEach(detach);
    			t71 = claim_space(nodes);
    			div3 = claim_element(nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			p5 = claim_element(div3_nodes, "P", {});
    			var p5_nodes = children(p5);
    			strong4 = claim_element(p5_nodes, "STRONG", {});
    			var strong4_nodes = children(strong4);
    			t72 = claim_text(strong4_nodes, "Programming Mentor");
    			strong4_nodes.forEach(detach);
    			t73 = claim_text(p5_nodes, ", August 2017 – December 2017\n  ");
    			br6 = claim_element(p5_nodes, "BR", {});
    			t74 = claim_text(p5_nodes, "First Time Programmers Club, University of Florida");
    			p5_nodes.forEach(detach);
    			t75 = claim_space(div3_nodes);
    			ul5 = claim_element(div3_nodes, "UL", { style: true });
    			var ul5_nodes = children(ul5);
    			li16 = claim_element(ul5_nodes, "LI", {});
    			var li16_nodes = children(li16);
    			t76 = claim_text(li16_nodes, "Assisted undergraduate programming majors in learning coding concepts and\n      completing their coursework");
    			li16_nodes.forEach(detach);
    			ul5_nodes.forEach(detach);
    			div3_nodes.forEach(detach);
    			t77 = claim_space(nodes);
    			h14 = claim_element(nodes, "H1", {});
    			var h14_nodes = children(h14);
    			t78 = claim_text(h14_nodes, "Skills");
    			h14_nodes.forEach(detach);
    			t79 = claim_space(nodes);
    			div4 = claim_element(nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			p6 = claim_element(div4_nodes, "P", {});
    			var p6_nodes = children(p6);
    			strong5 = claim_element(p6_nodes, "STRONG", {});
    			var strong5_nodes = children(strong5);
    			t80 = claim_text(strong5_nodes, "Languages:");
    			strong5_nodes.forEach(detach);
    			t81 = claim_text(p6_nodes, "\n    JavaScript, React, React Native, Angular, PHP, ASP, C# (.NET), Java, Swift,\n    Obj-C, C++");
    			br7 = claim_element(p6_nodes, "BR", {});
    			t82 = claim_space(p6_nodes);
    			strong6 = claim_element(p6_nodes, "STRONG", {});
    			var strong6_nodes = children(strong6);
    			t83 = claim_text(strong6_nodes, "Databases:");
    			strong6_nodes.forEach(detach);
    			t84 = claim_text(p6_nodes, "\n    MySQL, PostgreSQL, MongoDB, DynamoDB");
    			br8 = claim_element(p6_nodes, "BR", {});
    			t85 = claim_space(p6_nodes);
    			strong7 = claim_element(p6_nodes, "STRONG", {});
    			var strong7_nodes = children(strong7);
    			t86 = claim_text(strong7_nodes, "IDEs and Software:");
    			strong7_nodes.forEach(detach);
    			t87 = claim_text(p6_nodes, "\n    VS Code, Git Bash, Xcode, Notepad++, Android Studio");
    			br9 = claim_element(p6_nodes, "BR", {});
    			t88 = claim_space(p6_nodes);
    			strong8 = claim_element(p6_nodes, "STRONG", {});
    			var strong8_nodes = children(strong8);
    			t89 = claim_text(strong8_nodes, "Languages:");
    			strong8_nodes.forEach(detach);
    			t90 = claim_text(p6_nodes, "\n    Spanish (fluent)");
    			p6_nodes.forEach(detach);
    			div4_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(div0, "class", "textBlock");
    			attr(div1, "class", "textBlock");
    			attr(a0, "href", "http://teckpert.com");
    			attr(a1, "href", "http://corkagefee.com");
    			attr(a2, "href", "http://realdash.com");
    			attr(a3, "href", "http://roamwith.com");
    			attr(a4, "href", "http://castcloud.me");
    			attr(a5, "href", "http://csklegal.com");
    			attr(a6, "href", "http://hospitalistapp.com");
    			set_style(ul2, "margin-top", "-15px");
    			attr(a7, "href", "http://dontbeadrain.com");
    			set_style(ul3, "margin-top", "-15px");
    			attr(a8, "href", "https://www.kongregate.com/games/fettspielen/dodge");
    			set_style(ul4, "margin-top", "-15px");
    			attr(div2, "class", "textBlock");
    			set_style(ul5, "margin-top", "-15px");
    			attr(div3, "class", "textBlock");
    			attr(div4, "class", "textBlock");
    		},
    		m(target, anchor) {
    			insert(target, h10, anchor);
    			append(h10, t0);
    			insert(target, t1, anchor);
    			insert(target, div0, anchor);
    			append(div0, p0);
    			append(p0, t2);
    			insert(target, t3, anchor);
    			insert(target, h11, anchor);
    			append(h11, t4);
    			insert(target, t5, anchor);
    			insert(target, div1, anchor);
    			append(div1, p1);
    			append(p1, strong0);
    			append(strong0, t6);
    			append(p1, t7);
    			append(p1, br0);
    			append(p1, t8);
    			append(p1, br1);
    			append(p1, t9);
    			insert(target, t10, anchor);
    			insert(target, h12, anchor);
    			append(h12, t11);
    			insert(target, t12, anchor);
    			insert(target, div2, anchor);
    			append(div2, p2);
    			append(p2, strong1);
    			append(strong1, t13);
    			append(p2, t14);
    			append(p2, br2);
    			append(p2, t15);
    			append(p2, a0);
    			append(a0, t16);
    			append(p2, t17);
    			append(div2, t18);
    			append(div2, ul2);
    			append(ul2, li0);
    			append(li0, t19);
    			append(ul2, t20);
    			append(ul2, li6);
    			append(li6, t21);
    			append(li6, ul0);
    			append(ul0, li1);
    			append(li1, a1);
    			append(a1, t22);
    			append(li1, t23);
    			append(ul0, t24);
    			append(ul0, li2);
    			append(li2, a2);
    			append(a2, t25);
    			append(li2, t26);
    			append(ul0, t27);
    			append(ul0, li3);
    			append(li3, a3);
    			append(a3, t28);
    			append(li3, t29);
    			append(ul0, t30);
    			append(ul0, li4);
    			append(li4, a4);
    			append(a4, t31);
    			append(li4, t32);
    			append(ul0, t33);
    			append(ul0, li5);
    			append(li5, a5);
    			append(a5, t34);
    			append(li5, t35);
    			append(ul2, t36);
    			append(ul2, li7);
    			append(li7, t37);
    			append(ul2, t38);
    			append(ul2, li8);
    			append(li8, t39);
    			append(ul2, t40);
    			append(ul2, li11);
    			append(li11, t41);
    			append(li11, a6);
    			append(a6, t42);
    			append(li11, t43);
    			append(li11, ul1);
    			append(ul1, li9);
    			append(li9, t44);
    			append(ul1, t45);
    			append(ul1, li10);
    			append(li10, t46);
    			append(li10, br3);
    			append(div2, t47);
    			append(div2, p3);
    			append(p3, strong2);
    			append(strong2, t48);
    			append(p3, t49);
    			append(p3, br4);
    			append(p3, t50);
    			append(div2, t51);
    			append(div2, ul3);
    			append(ul3, li12);
    			append(li12, t52);
    			append(li12, a7);
    			append(a7, t53);
    			append(li12, t54);
    			append(ul3, t55);
    			append(ul3, li13);
    			append(li13, t56);
    			append(li13, sup);
    			append(sup, t57);
    			append(li13, t58);
    			append(div2, t59);
    			append(div2, p4);
    			append(p4, strong3);
    			append(strong3, t60);
    			append(p4, t61);
    			append(p4, br5);
    			append(p4, t62);
    			append(div2, t63);
    			append(div2, ul4);
    			append(ul4, li14);
    			append(li14, t64);
    			append(ul4, t65);
    			append(ul4, li15);
    			append(li15, t66);
    			append(li15, a8);
    			append(a8, t67);
    			append(li15, t68);
    			insert(target, t69, anchor);
    			insert(target, h13, anchor);
    			append(h13, t70);
    			insert(target, t71, anchor);
    			insert(target, div3, anchor);
    			append(div3, p5);
    			append(p5, strong4);
    			append(strong4, t72);
    			append(p5, t73);
    			append(p5, br6);
    			append(p5, t74);
    			append(div3, t75);
    			append(div3, ul5);
    			append(ul5, li16);
    			append(li16, t76);
    			insert(target, t77, anchor);
    			insert(target, h14, anchor);
    			append(h14, t78);
    			insert(target, t79, anchor);
    			insert(target, div4, anchor);
    			append(div4, p6);
    			append(p6, strong5);
    			append(strong5, t80);
    			append(p6, t81);
    			append(p6, br7);
    			append(p6, t82);
    			append(p6, strong6);
    			append(strong6, t83);
    			append(p6, t84);
    			append(p6, br8);
    			append(p6, t85);
    			append(p6, strong7);
    			append(strong7, t86);
    			append(p6, t87);
    			append(p6, br9);
    			append(p6, t88);
    			append(p6, strong8);
    			append(strong8, t89);
    			append(p6, t90);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(h10);
    			if (detaching) detach(t1);
    			if (detaching) detach(div0);
    			if (detaching) detach(t3);
    			if (detaching) detach(h11);
    			if (detaching) detach(t5);
    			if (detaching) detach(div1);
    			if (detaching) detach(t10);
    			if (detaching) detach(h12);
    			if (detaching) detach(t12);
    			if (detaching) detach(div2);
    			if (detaching) detach(t69);
    			if (detaching) detach(h13);
    			if (detaching) detach(t71);
    			if (detaching) detach(div3);
    			if (detaching) detach(t77);
    			if (detaching) detach(h14);
    			if (detaching) detach(t79);
    			if (detaching) detach(div4);
    		}
    	};
    }

    class Resume extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$6, safe_not_equal, {});
    	}
    }

    /* src\routes\Contact.svelte generated by Svelte v3.18.1 */

    function create_fragment$7(ctx) {
    	let div6;
    	let div3;
    	let h10;
    	let t0;
    	let t1;
    	let div0;
    	let p0;
    	let t2;
    	let t3;
    	let h11;
    	let t4;
    	let t5;
    	let div1;
    	let p1;
    	let a;
    	let t6;
    	let t7;
    	let h12;
    	let t8;
    	let t9;
    	let div2;
    	let p2;
    	let input0;
    	let t10;
    	let p3;
    	let input1;
    	let t11;
    	let p4;
    	let textarea;
    	let t12;
    	let p5;
    	let button;
    	let t13;
    	let t14;
    	let div5;
    	let h13;
    	let t15;
    	let t16;
    	let div4;
    	let p6;
    	let t17;

    	return {
    		c() {
    			div6 = element("div");
    			div3 = element("div");
    			h10 = element("h1");
    			t0 = text("Name");
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t2 = text("Christopher James Aitken (25 y/o)");
    			t3 = space();
    			h11 = element("h1");
    			t4 = text("Email");
    			t5 = space();
    			div1 = element("div");
    			p1 = element("p");
    			a = element("a");
    			t6 = text("chris@heythisischris.com");
    			t7 = space();
    			h12 = element("h1");
    			t8 = text("Leave me a message");
    			t9 = space();
    			div2 = element("div");
    			p2 = element("p");
    			input0 = element("input");
    			t10 = space();
    			p3 = element("p");
    			input1 = element("input");
    			t11 = space();
    			p4 = element("p");
    			textarea = element("textarea");
    			t12 = space();
    			p5 = element("p");
    			button = element("button");
    			t13 = text("Send");
    			t14 = space();
    			div5 = element("div");
    			h13 = element("h1");
    			t15 = text("Response ETA?");
    			t16 = space();
    			div4 = element("div");
    			p6 = element("p");
    			t17 = text("Usually within a few hours, I check my email pretty frequently.");
    			this.h();
    		},
    		l(nodes) {
    			div6 = claim_element(nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			div3 = claim_element(div6_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			h10 = claim_element(div3_nodes, "H1", {});
    			var h10_nodes = children(h10);
    			t0 = claim_text(h10_nodes, "Name");
    			h10_nodes.forEach(detach);
    			t1 = claim_space(div3_nodes);
    			div0 = claim_element(div3_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			p0 = claim_element(div0_nodes, "P", {});
    			var p0_nodes = children(p0);
    			t2 = claim_text(p0_nodes, "Christopher James Aitken (25 y/o)");
    			p0_nodes.forEach(detach);
    			div0_nodes.forEach(detach);
    			t3 = claim_space(div3_nodes);
    			h11 = claim_element(div3_nodes, "H1", {});
    			var h11_nodes = children(h11);
    			t4 = claim_text(h11_nodes, "Email");
    			h11_nodes.forEach(detach);
    			t5 = claim_space(div3_nodes);
    			div1 = claim_element(div3_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			p1 = claim_element(div1_nodes, "P", {});
    			var p1_nodes = children(p1);
    			a = claim_element(p1_nodes, "A", { href: true });
    			var a_nodes = children(a);
    			t6 = claim_text(a_nodes, "chris@heythisischris.com");
    			a_nodes.forEach(detach);
    			p1_nodes.forEach(detach);
    			div1_nodes.forEach(detach);
    			t7 = claim_space(div3_nodes);
    			h12 = claim_element(div3_nodes, "H1", {});
    			var h12_nodes = children(h12);
    			t8 = claim_text(h12_nodes, "Leave me a message");
    			h12_nodes.forEach(detach);
    			t9 = claim_space(div3_nodes);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			p2 = claim_element(div2_nodes, "P", {});
    			var p2_nodes = children(p2);
    			input0 = claim_element(p2_nodes, "INPUT", { class: true, placeholder: true });
    			p2_nodes.forEach(detach);
    			t10 = claim_space(div2_nodes);
    			p3 = claim_element(div2_nodes, "P", {});
    			var p3_nodes = children(p3);
    			input1 = claim_element(p3_nodes, "INPUT", { class: true, placeholder: true });
    			p3_nodes.forEach(detach);
    			t11 = claim_space(div2_nodes);
    			p4 = claim_element(div2_nodes, "P", {});
    			var p4_nodes = children(p4);
    			textarea = claim_element(p4_nodes, "TEXTAREA", { class: true, placeholder: true });
    			children(textarea).forEach(detach);
    			p4_nodes.forEach(detach);
    			t12 = claim_space(div2_nodes);
    			p5 = claim_element(div2_nodes, "P", { class: true });
    			var p5_nodes = children(p5);
    			button = claim_element(p5_nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t13 = claim_text(button_nodes, "Send");
    			button_nodes.forEach(detach);
    			p5_nodes.forEach(detach);
    			div2_nodes.forEach(detach);
    			div3_nodes.forEach(detach);
    			t14 = claim_space(div6_nodes);
    			div5 = claim_element(div6_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			h13 = claim_element(div5_nodes, "H1", {});
    			var h13_nodes = children(h13);
    			t15 = claim_text(h13_nodes, "Response ETA?");
    			h13_nodes.forEach(detach);
    			t16 = claim_space(div5_nodes);
    			div4 = claim_element(div5_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			p6 = claim_element(div4_nodes, "P", {});
    			var p6_nodes = children(p6);
    			t17 = claim_text(p6_nodes, "Usually within a few hours, I check my email pretty frequently.");
    			p6_nodes.forEach(detach);
    			div4_nodes.forEach(detach);
    			div5_nodes.forEach(detach);
    			div6_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(div0, "class", "textBlock");
    			attr(a, "href", "mailto:chris@heythisischris.com");
    			attr(div1, "class", "textBlock");
    			attr(input0, "class", "input svelte-110ujhe");
    			attr(input0, "placeholder", "Name");
    			attr(input1, "class", "input svelte-110ujhe");
    			attr(input1, "placeholder", "Email");
    			attr(textarea, "class", "textarea svelte-110ujhe");
    			attr(textarea, "placeholder", "Message");
    			attr(button, "class", "sendButton svelte-110ujhe");
    			attr(p5, "class", "send svelte-110ujhe");
    			attr(div2, "class", "textBlock");
    			attr(div3, "class", "mainbar");
    			attr(div4, "class", "textBlock");
    			attr(div5, "class", "sidebar");
    			attr(div6, "class", "mainbarAndSidebarContainer");
    		},
    		m(target, anchor) {
    			insert(target, div6, anchor);
    			append(div6, div3);
    			append(div3, h10);
    			append(h10, t0);
    			append(div3, t1);
    			append(div3, div0);
    			append(div0, p0);
    			append(p0, t2);
    			append(div3, t3);
    			append(div3, h11);
    			append(h11, t4);
    			append(div3, t5);
    			append(div3, div1);
    			append(div1, p1);
    			append(p1, a);
    			append(a, t6);
    			append(div3, t7);
    			append(div3, h12);
    			append(h12, t8);
    			append(div3, t9);
    			append(div3, div2);
    			append(div2, p2);
    			append(p2, input0);
    			append(div2, t10);
    			append(div2, p3);
    			append(p3, input1);
    			append(div2, t11);
    			append(div2, p4);
    			append(p4, textarea);
    			append(div2, t12);
    			append(div2, p5);
    			append(p5, button);
    			append(button, t13);
    			append(div6, t14);
    			append(div6, div5);
    			append(div5, h13);
    			append(h13, t15);
    			append(div5, t16);
    			append(div5, div4);
    			append(div4, p6);
    			append(p6, t17);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div6);
    		}
    	};
    }

    class Contact extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$7, safe_not_equal, {});
    	}
    }

    /* src\App.svelte generated by Svelte v3.18.1 */

    function create_default_slot_6(ctx) {
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			img = element("img");
    			this.h();
    		},
    		l(nodes) {
    			img = claim_element(nodes, "IMG", { class: true, alt: true, src: true });
    			this.h();
    		},
    		h() {
    			attr(img, "class", "logo");
    			attr(img, "alt", "");
    			if (img.src !== (img_src_value = "/images/logo.png")) attr(img, "src", img_src_value);
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    // (68:10) <NavLink to="/">
    function create_default_slot_5(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("heythisischris");
    		},
    		l(nodes) {
    			t = claim_text(nodes, "heythisischris");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (71:10) <NavLink to="/">
    function create_default_slot_4(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Home");
    		},
    		l(nodes) {
    			t = claim_text(nodes, "Home");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (72:10) <NavLink to="portfolio">
    function create_default_slot_3(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Portfolio");
    		},
    		l(nodes) {
    			t = claim_text(nodes, "Portfolio");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (73:10) <NavLink to="resume">
    function create_default_slot_2(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Resume");
    		},
    		l(nodes) {
    			t = claim_text(nodes, "Resume");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (74:10) <NavLink to="contact">
    function create_default_slot_1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Contact");
    		},
    		l(nodes) {
    			t = claim_text(nodes, "Contact");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (60:0) <Router {url}>
    function create_default_slot$1(ctx) {
    	let div5;
    	let nav;
    	let div3;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let div2;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t6;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let t7;
    	let a2;
    	let img2;
    	let img2_src_value;
    	let t8;
    	let a3;
    	let img3;
    	let img3_src_value;
    	let t9;
    	let a4;
    	let img4;
    	let img4_src_value;
    	let t10;
    	let div4;
    	let t11;
    	let t12;
    	let t13;
    	let t14;
    	let div6;
    	let t15;
    	let current;

    	const navlink0 = new NavLink({
    			props: {
    				to: "/",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			}
    		});

    	const navlink1 = new NavLink({
    			props: {
    				to: "/",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			}
    		});

    	const navlink2 = new NavLink({
    			props: {
    				to: "/",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			}
    		});

    	const navlink3 = new NavLink({
    			props: {
    				to: "portfolio",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			}
    		});

    	const navlink4 = new NavLink({
    			props: {
    				to: "resume",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			}
    		});

    	const navlink5 = new NavLink({
    			props: {
    				to: "contact",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			}
    		});

    	const route0 = new Route({ props: { path: "/", component: Home } });

    	const route1 = new Route({
    			props: { path: "portfolio", component: Portfolio }
    		});

    	const route2 = new Route({
    			props: { path: "resume", component: Resume }
    		});

    	const route3 = new Route({
    			props: { path: "contact", component: Contact }
    		});

    	return {
    		c() {
    			div5 = element("div");
    			nav = element("nav");
    			div3 = element("div");
    			div0 = element("div");
    			create_component(navlink0.$$.fragment);
    			t0 = space();
    			create_component(navlink1.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(navlink2.$$.fragment);
    			t2 = space();
    			create_component(navlink3.$$.fragment);
    			t3 = space();
    			create_component(navlink4.$$.fragment);
    			t4 = space();
    			create_component(navlink5.$$.fragment);
    			t5 = space();
    			div2 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t6 = space();
    			a1 = element("a");
    			img1 = element("img");
    			t7 = space();
    			a2 = element("a");
    			img2 = element("img");
    			t8 = space();
    			a3 = element("a");
    			img3 = element("img");
    			t9 = space();
    			a4 = element("a");
    			img4 = element("img");
    			t10 = space();
    			div4 = element("div");
    			create_component(route0.$$.fragment);
    			t11 = space();
    			create_component(route1.$$.fragment);
    			t12 = space();
    			create_component(route2.$$.fragment);
    			t13 = space();
    			create_component(route3.$$.fragment);
    			t14 = space();
    			div6 = element("div");
    			t15 = text("Copyright © 2020 Chris Aitken");
    			this.h();
    		},
    		l(nodes) {
    			div5 = claim_element(nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			nav = claim_element(div5_nodes, "NAV", {});
    			var nav_nodes = children(nav);
    			div3 = claim_element(nav_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			div0 = claim_element(div3_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			claim_component(navlink0.$$.fragment, div0_nodes);
    			t0 = claim_space(div0_nodes);
    			claim_component(navlink1.$$.fragment, div0_nodes);
    			div0_nodes.forEach(detach);
    			t1 = claim_space(div3_nodes);
    			div1 = claim_element(div3_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			claim_component(navlink2.$$.fragment, div1_nodes);
    			t2 = claim_space(div1_nodes);
    			claim_component(navlink3.$$.fragment, div1_nodes);
    			t3 = claim_space(div1_nodes);
    			claim_component(navlink4.$$.fragment, div1_nodes);
    			t4 = claim_space(div1_nodes);
    			claim_component(navlink5.$$.fragment, div1_nodes);
    			div1_nodes.forEach(detach);
    			t5 = claim_space(div3_nodes);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			a0 = claim_element(div2_nodes, "A", { target: true, href: true });
    			var a0_nodes = children(a0);
    			img0 = claim_element(a0_nodes, "IMG", { class: true, alt: true, src: true });
    			a0_nodes.forEach(detach);
    			t6 = claim_space(div2_nodes);
    			a1 = claim_element(div2_nodes, "A", { target: true, href: true });
    			var a1_nodes = children(a1);
    			img1 = claim_element(a1_nodes, "IMG", { class: true, alt: true, src: true });
    			a1_nodes.forEach(detach);
    			t7 = claim_space(div2_nodes);
    			a2 = claim_element(div2_nodes, "A", { target: true, href: true });
    			var a2_nodes = children(a2);
    			img2 = claim_element(a2_nodes, "IMG", { class: true, alt: true, src: true });
    			a2_nodes.forEach(detach);
    			t8 = claim_space(div2_nodes);
    			a3 = claim_element(div2_nodes, "A", { target: true, href: true });
    			var a3_nodes = children(a3);
    			img3 = claim_element(a3_nodes, "IMG", { class: true, alt: true, src: true });
    			a3_nodes.forEach(detach);
    			t9 = claim_space(div2_nodes);
    			a4 = claim_element(div2_nodes, "A", { target: true, href: true });
    			var a4_nodes = children(a4);
    			img4 = claim_element(a4_nodes, "IMG", { class: true, alt: true, src: true });
    			a4_nodes.forEach(detach);
    			div2_nodes.forEach(detach);
    			div3_nodes.forEach(detach);
    			nav_nodes.forEach(detach);
    			t10 = claim_space(div5_nodes);
    			div4 = claim_element(div5_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			claim_component(route0.$$.fragment, div4_nodes);
    			t11 = claim_space(div4_nodes);
    			claim_component(route1.$$.fragment, div4_nodes);
    			t12 = claim_space(div4_nodes);
    			claim_component(route2.$$.fragment, div4_nodes);
    			t13 = claim_space(div4_nodes);
    			claim_component(route3.$$.fragment, div4_nodes);
    			div4_nodes.forEach(detach);
    			div5_nodes.forEach(detach);
    			t14 = claim_space(nodes);
    			div6 = claim_element(nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			t15 = claim_text(div6_nodes, "Copyright © 2020 Chris Aitken");
    			div6_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(div0, "class", "navTitle");
    			attr(div1, "class", "navLinks");
    			attr(img0, "class", "socialIcon");
    			attr(img0, "alt", "github");
    			if (img0.src !== (img0_src_value = "images/github.svg")) attr(img0, "src", img0_src_value);
    			attr(a0, "target", "_blank");
    			attr(a0, "href", "https://github.com/heythisischris");
    			attr(img1, "class", "socialIcon");
    			attr(img1, "alt", "linkedin");
    			if (img1.src !== (img1_src_value = "images/linkedin.svg")) attr(img1, "src", img1_src_value);
    			attr(a1, "target", "_blank");
    			attr(a1, "href", "https://www.linkedin.com/in/chris-aitken-293045183/");
    			attr(img2, "class", "socialIcon");
    			attr(img2, "alt", "instagram");
    			if (img2.src !== (img2_src_value = "images/instagram.svg")) attr(img2, "src", img2_src_value);
    			attr(a2, "target", "_blank");
    			attr(a2, "href", "https://www.instagram.com/heythisischris/");
    			attr(img3, "class", "socialIcon");
    			attr(img3, "alt", "bandcamp");
    			if (img3.src !== (img3_src_value = "images/facebook.svg")) attr(img3, "src", img3_src_value);
    			attr(a3, "target", "_blank");
    			attr(a3, "href", "https://www.facebook.com/chrisaitken");
    			attr(img4, "class", "socialIcon");
    			attr(img4, "alt", "bandcamp");
    			if (img4.src !== (img4_src_value = "images/bandcamp.svg")) attr(img4, "src", img4_src_value);
    			attr(a4, "target", "_blank");
    			attr(a4, "href", "https://heythisischris.bandcamp.com/");
    			attr(div2, "class", "navSocial");
    			attr(div3, "class", "navContainer");
    			attr(div4, "class", "pageContainer");
    			attr(div5, "class", "container");
    			attr(div6, "class", "footer");
    		},
    		m(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, nav);
    			append(nav, div3);
    			append(div3, div0);
    			mount_component(navlink0, div0, null);
    			append(div0, t0);
    			mount_component(navlink1, div0, null);
    			append(div3, t1);
    			append(div3, div1);
    			mount_component(navlink2, div1, null);
    			append(div1, t2);
    			mount_component(navlink3, div1, null);
    			append(div1, t3);
    			mount_component(navlink4, div1, null);
    			append(div1, t4);
    			mount_component(navlink5, div1, null);
    			append(div3, t5);
    			append(div3, div2);
    			append(div2, a0);
    			append(a0, img0);
    			append(div2, t6);
    			append(div2, a1);
    			append(a1, img1);
    			append(div2, t7);
    			append(div2, a2);
    			append(a2, img2);
    			append(div2, t8);
    			append(div2, a3);
    			append(a3, img3);
    			append(div2, t9);
    			append(div2, a4);
    			append(a4, img4);
    			append(div5, t10);
    			append(div5, div4);
    			mount_component(route0, div4, null);
    			append(div4, t11);
    			mount_component(route1, div4, null);
    			append(div4, t12);
    			mount_component(route2, div4, null);
    			append(div4, t13);
    			mount_component(route3, div4, null);
    			insert(target, t14, anchor);
    			insert(target, div6, anchor);
    			append(div6, t15);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const navlink0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				navlink0_changes.$$scope = { dirty, ctx };
    			}

    			navlink0.$set(navlink0_changes);
    			const navlink1_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				navlink1_changes.$$scope = { dirty, ctx };
    			}

    			navlink1.$set(navlink1_changes);
    			const navlink2_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				navlink2_changes.$$scope = { dirty, ctx };
    			}

    			navlink2.$set(navlink2_changes);
    			const navlink3_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				navlink3_changes.$$scope = { dirty, ctx };
    			}

    			navlink3.$set(navlink3_changes);
    			const navlink4_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				navlink4_changes.$$scope = { dirty, ctx };
    			}

    			navlink4.$set(navlink4_changes);
    			const navlink5_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				navlink5_changes.$$scope = { dirty, ctx };
    			}

    			navlink5.$set(navlink5_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(navlink0.$$.fragment, local);
    			transition_in(navlink1.$$.fragment, local);
    			transition_in(navlink2.$$.fragment, local);
    			transition_in(navlink3.$$.fragment, local);
    			transition_in(navlink4.$$.fragment, local);
    			transition_in(navlink5.$$.fragment, local);
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			transition_in(route3.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(navlink0.$$.fragment, local);
    			transition_out(navlink1.$$.fragment, local);
    			transition_out(navlink2.$$.fragment, local);
    			transition_out(navlink3.$$.fragment, local);
    			transition_out(navlink4.$$.fragment, local);
    			transition_out(navlink5.$$.fragment, local);
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			transition_out(route3.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div5);
    			destroy_component(navlink0);
    			destroy_component(navlink1);
    			destroy_component(navlink2);
    			destroy_component(navlink3);
    			destroy_component(navlink4);
    			destroy_component(navlink5);
    			destroy_component(route0);
    			destroy_component(route1);
    			destroy_component(route2);
    			destroy_component(route3);
    			if (detaching) detach(t14);
    			if (detaching) detach(div6);
    		}
    	};
    }

    function create_fragment$8(ctx) {
    	let head;
    	let meta0;
    	let t0;
    	let title;
    	let t1;
    	let t2;
    	let meta1;
    	let t3;
    	let meta2;
    	let t4;
    	let meta3;
    	let t5;
    	let meta4;
    	let t6;
    	let meta5;
    	let t7;
    	let meta6;
    	let t8;
    	let meta7;
    	let t9;
    	let link0;
    	let t10;
    	let link1;
    	let t11;
    	let link2;
    	let t12;
    	let link3;
    	let t13;
    	let link4;
    	let t14;
    	let link5;
    	let t15;
    	let link6;
    	let t16;
    	let meta8;
    	let t17;
    	let meta9;
    	let t18;
    	let meta10;
    	let t19;
    	let meta11;
    	let t20;
    	let meta12;
    	let t21;
    	let current;

    	const router = new Router({
    			props: {
    				url: /*url*/ ctx[0],
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			head = element("head");
    			meta0 = element("meta");
    			t0 = space();
    			title = element("title");
    			t1 = text("heythisischris");
    			t2 = space();
    			meta1 = element("meta");
    			t3 = space();
    			meta2 = element("meta");
    			t4 = space();
    			meta3 = element("meta");
    			t5 = space();
    			meta4 = element("meta");
    			t6 = space();
    			meta5 = element("meta");
    			t7 = space();
    			meta6 = element("meta");
    			t8 = space();
    			meta7 = element("meta");
    			t9 = space();
    			link0 = element("link");
    			t10 = space();
    			link1 = element("link");
    			t11 = space();
    			link2 = element("link");
    			t12 = space();
    			link3 = element("link");
    			t13 = space();
    			link4 = element("link");
    			t14 = space();
    			link5 = element("link");
    			t15 = space();
    			link6 = element("link");
    			t16 = space();
    			meta8 = element("meta");
    			t17 = space();
    			meta9 = element("meta");
    			t18 = space();
    			meta10 = element("meta");
    			t19 = space();
    			meta11 = element("meta");
    			t20 = space();
    			meta12 = element("meta");
    			t21 = space();
    			create_component(router.$$.fragment);
    			this.h();
    		},
    		l(nodes) {
    			head = claim_element(nodes, "HEAD", {});
    			var head_nodes = children(head);
    			meta0 = claim_element(head_nodes, "META", { name: true, content: true });
    			t0 = claim_space(head_nodes);
    			title = claim_element(head_nodes, "TITLE", {});
    			var title_nodes = children(title);
    			t1 = claim_text(title_nodes, "heythisischris");
    			title_nodes.forEach(detach);
    			t2 = claim_space(head_nodes);
    			meta1 = claim_element(head_nodes, "META", { charset: true });
    			t3 = claim_space(head_nodes);
    			meta2 = claim_element(head_nodes, "META", { name: true, content: true });
    			t4 = claim_space(head_nodes);
    			meta3 = claim_element(head_nodes, "META", { name: true, content: true });
    			t5 = claim_space(head_nodes);
    			meta4 = claim_element(head_nodes, "META", { property: true, content: true });
    			t6 = claim_space(head_nodes);
    			meta5 = claim_element(head_nodes, "META", { property: true, content: true });
    			t7 = claim_space(head_nodes);
    			meta6 = claim_element(head_nodes, "META", { property: true, content: true });
    			t8 = claim_space(head_nodes);
    			meta7 = claim_element(head_nodes, "META", { property: true, content: true });
    			t9 = claim_space(head_nodes);
    			link0 = claim_element(head_nodes, "LINK", { rel: true, sizes: true, href: true });
    			t10 = claim_space(head_nodes);

    			link1 = claim_element(head_nodes, "LINK", {
    				rel: true,
    				type: true,
    				href: true,
    				sizes: true
    			});

    			t11 = claim_space(head_nodes);

    			link2 = claim_element(head_nodes, "LINK", {
    				rel: true,
    				type: true,
    				href: true,
    				sizes: true
    			});

    			t12 = claim_space(head_nodes);

    			link3 = claim_element(head_nodes, "LINK", {
    				rel: true,
    				type: true,
    				href: true,
    				sizes: true
    			});

    			t13 = claim_space(head_nodes);

    			link4 = claim_element(head_nodes, "LINK", {
    				rel: true,
    				type: true,
    				href: true,
    				sizes: true
    			});

    			t14 = claim_space(head_nodes);
    			link5 = claim_element(head_nodes, "LINK", { rel: true, href: true });
    			t15 = claim_space(head_nodes);
    			link6 = claim_element(head_nodes, "LINK", { rel: true, href: true, color: true });
    			t16 = claim_space(head_nodes);
    			meta8 = claim_element(head_nodes, "META", { name: true, content: true });
    			t17 = claim_space(head_nodes);
    			meta9 = claim_element(head_nodes, "META", { name: true, content: true });
    			t18 = claim_space(head_nodes);
    			meta10 = claim_element(head_nodes, "META", { name: true, content: true });
    			t19 = claim_space(head_nodes);
    			meta11 = claim_element(head_nodes, "META", { name: true, content: true });
    			t20 = claim_space(head_nodes);
    			meta12 = claim_element(head_nodes, "META", { name: true, content: true });
    			head_nodes.forEach(detach);
    			t21 = claim_space(nodes);
    			claim_component(router.$$.fragment, nodes);
    			this.h();
    		},
    		h() {
    			attr(meta0, "name", "viewport");
    			attr(meta0, "content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0");
    			attr(meta1, "charset", "utf-8");
    			attr(meta2, "name", "description");
    			attr(meta2, "content", "Chris Aitken's personal website");
    			attr(meta3, "name", "author");
    			attr(meta3, "content", "Chris Aitken");
    			attr(meta4, "property", "og:url");
    			attr(meta4, "content", "heythisischris.com");
    			attr(meta5, "property", "og:type");
    			attr(meta5, "content", "website");
    			attr(meta6, "property", "og:title");
    			attr(meta6, "content", "heythisischris");
    			attr(meta7, "property", "og:description");
    			attr(meta7, "content", "Chris Aitken's personal website");
    			attr(link0, "rel", "apple-touch-icon");
    			attr(link0, "sizes", "180x180");
    			attr(link0, "href", "/images/favicons/apple-touch-icon-180x180.png");
    			attr(link1, "rel", "icon");
    			attr(link1, "type", "image/png");
    			attr(link1, "href", "/images/favicons/favicon-32x32.png");
    			attr(link1, "sizes", "32x32");
    			attr(link2, "rel", "icon");
    			attr(link2, "type", "image/png");
    			attr(link2, "href", "/images/favicons/android-chrome-192x192.png");
    			attr(link2, "sizes", "192x192");
    			attr(link3, "rel", "icon");
    			attr(link3, "type", "image/png");
    			attr(link3, "href", "/images/favicons/favicon-96x96.png");
    			attr(link3, "sizes", "96x96");
    			attr(link4, "rel", "icon");
    			attr(link4, "type", "image/png");
    			attr(link4, "href", "/images/favicons/favicon-16x16.png");
    			attr(link4, "sizes", "16x16");
    			attr(link5, "rel", "manifest");
    			attr(link5, "href", "/images/favicons/manifest.json");
    			attr(link6, "rel", "mask-icon");
    			attr(link6, "href", "/images/favicons/safari-pinned-tab.svg");
    			attr(link6, "color", "#5bbad5");
    			attr(meta8, "name", "apple-mobile-web-app-title");
    			attr(meta8, "content", "hey, this is chris");
    			attr(meta9, "name", "application-name");
    			attr(meta9, "content", "hey, this is chris");
    			attr(meta10, "name", "msapplication-TileColor");
    			attr(meta10, "content", "#da532c");
    			attr(meta11, "name", "msapplication-TileImage");
    			attr(meta11, "content", "/images/favicons/mstile-144x144.png");
    			attr(meta12, "name", "theme-color");
    			attr(meta12, "content", "#ffffff");
    		},
    		m(target, anchor) {
    			insert(target, head, anchor);
    			append(head, meta0);
    			append(head, t0);
    			append(head, title);
    			append(title, t1);
    			append(head, t2);
    			append(head, meta1);
    			append(head, t3);
    			append(head, meta2);
    			append(head, t4);
    			append(head, meta3);
    			append(head, t5);
    			append(head, meta4);
    			append(head, t6);
    			append(head, meta5);
    			append(head, t7);
    			append(head, meta6);
    			append(head, t8);
    			append(head, meta7);
    			append(head, t9);
    			append(head, link0);
    			append(head, t10);
    			append(head, link1);
    			append(head, t11);
    			append(head, link2);
    			append(head, t12);
    			append(head, link3);
    			append(head, t13);
    			append(head, link4);
    			append(head, t14);
    			append(head, link5);
    			append(head, t15);
    			append(head, link6);
    			append(head, t16);
    			append(head, meta8);
    			append(head, t17);
    			append(head, meta9);
    			append(head, t18);
    			append(head, meta10);
    			append(head, t19);
    			append(head, meta11);
    			append(head, t20);
    			append(head, meta12);
    			insert(target, t21, anchor);
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const router_changes = {};
    			if (dirty & /*url*/ 1) router_changes.url = /*url*/ ctx[0];

    			if (dirty & /*$$scope*/ 2) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(head);
    			if (detaching) detach(t21);
    			destroy_component(router, detaching);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { url = "" } = $$props;

    	$$self.$set = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    	};

    	return [url];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$8, safe_not_equal, { url: 0 });
    	}
    }

    new App({
      target: document.getElementById("app"),
      hydrate: true
    });

}());
//# sourceMappingURL=bundle.js.map
