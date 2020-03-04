'use strict';

function noop() { }
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
function get_store_value(store) {
    let value;
    subscribe(store, _ => value = _)();
    return value;
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

// source: https://html.spec.whatwg.org/multipage/indices.html
const boolean_attributes = new Set([
    'allowfullscreen',
    'allowpaymentrequest',
    'async',
    'autofocus',
    'autoplay',
    'checked',
    'controls',
    'default',
    'defer',
    'disabled',
    'formnovalidate',
    'hidden',
    'ismap',
    'loop',
    'multiple',
    'muted',
    'nomodule',
    'novalidate',
    'open',
    'playsinline',
    'readonly',
    'required',
    'reversed',
    'selected'
]);

const invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
// https://infra.spec.whatwg.org/#noncharacter
function spread(args, classes_to_add) {
    const attributes = Object.assign({}, ...args);
    if (classes_to_add) {
        if (attributes.class == null) {
            attributes.class = classes_to_add;
        }
        else {
            attributes.class += ' ' + classes_to_add;
        }
    }
    let str = '';
    Object.keys(attributes).forEach(name => {
        if (invalid_attribute_name_character.test(name))
            return;
        const value = attributes[name];
        if (value === true)
            str += " " + name;
        else if (boolean_attributes.has(name.toLowerCase())) {
            if (value)
                str += " " + name;
        }
        else if (value != null) {
            str += ` ${name}="${String(value).replace(/"/g, '&#34;').replace(/'/g, '&#39;')}"`;
        }
    });
    return str;
}
const escaped = {
    '"': '&quot;',
    "'": '&#39;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};
function escape(html) {
    return String(html).replace(/["'&<>]/g, match => escaped[match]);
}
function each(items, fn) {
    let str = '';
    for (let i = 0; i < items.length; i += 1) {
        str += fn(items[i], i);
    }
    return str;
}
const missing_component = {
    $$render: () => ''
};
function validate_component(component, name) {
    if (!component || !component.$$render) {
        if (name === 'svelte:component')
            name += ' this={...}';
        throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
    }
    return component;
}
let on_destroy;
function create_ssr_component(fn) {
    function $$render(result, props, bindings, slots) {
        const parent_component = current_component;
        const $$ = {
            on_destroy,
            context: new Map(parent_component ? parent_component.$$.context : []),
            // these will be immediately discarded
            on_mount: [],
            before_update: [],
            after_update: [],
            callbacks: blank_object()
        };
        set_current_component({ $$ });
        const html = fn(result, props, bindings, slots);
        set_current_component(parent_component);
        return html;
    }
    return {
        render: (props = {}, options = {}) => {
            on_destroy = [];
            const result = { title: '', head: '', css: new Set() };
            const html = $$render(result, props, {}, options);
            run_all(on_destroy);
            return {
                html,
                css: {
                    code: Array.from(result.css).map(css => css.code).join('\n'),
                    map: null // TODO
                },
                head: result.title + result.head
            };
        },
        $$render
    };
}
function add_attribute(name, value, boolean) {
    if (value == null || (boolean && !value))
        return '';
    return ` ${name}${value === true ? '' : `=${typeof value === 'string' ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
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

/* node_modules\svelte-routing\src\Router.svelte generated by Svelte v3.18.1 */

const Router = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $base;
	let $location;
	let $routes;
	let { basepath = "/" } = $$props;
	let { url = null } = $$props;
	const locationContext = getContext(LOCATION);
	const routerContext = getContext(ROUTER);
	const routes = writable([]);
	$routes = get_store_value(routes);
	const activeRoute = writable(null);
	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

	// If locationContext is not set, this is the topmost Router in the tree.
	// If the `url` prop is given we force the location to it.
	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

	$location = get_store_value(location);

	// If routerContext is set, the routerBase of the parent Router
	// will be the base for this Router's descendants.
	// If routerContext is not set, the path and resolved uri will both
	// have the value of the basepath prop.
	const base = routerContext
	? routerContext.routerBase
	: writable({ path: basepath, uri: basepath });

	$base = get_store_value(base);

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

	if ($$props.basepath === void 0 && $$bindings.basepath && basepath !== void 0) $$bindings.basepath(basepath);
	if ($$props.url === void 0 && $$bindings.url && url !== void 0) $$bindings.url(url);
	$base = get_store_value(base);
	$location = get_store_value(location);
	$routes = get_store_value(routes);

	 {
		{
			const { path: basepath } = $base;

			routes.update(rs => {
				rs.forEach(r => r.path = combinePaths(basepath, r._path));
				return rs;
			});
		}
	}

	 {
		{
			const bestMatch = pick($routes, $location.pathname);
			activeRoute.set(bestMatch);
		}
	}

	return `${$$slots.default ? $$slots.default({}) : ``}`;
});

/* node_modules\svelte-routing\src\Route.svelte generated by Svelte v3.18.1 */

const Route = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $activeRoute;
	let $location;
	let { path = "" } = $$props;
	let { component = null } = $$props;
	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
	$activeRoute = get_store_value(activeRoute);
	const location = getContext(LOCATION);
	$location = get_store_value(location);

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

	if ($$props.path === void 0 && $$bindings.path && path !== void 0) $$bindings.path(path);
	if ($$props.component === void 0 && $$bindings.component && component !== void 0) $$bindings.component(component);
	$activeRoute = get_store_value(activeRoute);
	$location = get_store_value(location);

	 {
		if ($activeRoute && $activeRoute.route === route) {
			routeParams = $activeRoute.params;
		}
	}

	 {
		{
			const { path, component, ...rest } = $$props;
			routeProps = rest;
		}
	}

	return `${$activeRoute !== null && $activeRoute.route === route
	? `${component !== null
		? `${validate_component(component || missing_component, "svelte:component").$$render($$result, Object.assign({ location: $location }, routeParams, routeProps), {}, {})}`
		: `${$$slots.default
			? $$slots.default({ params: routeParams, location: $location })
			: ``}`}`
	: ``}`;
});

/* node_modules\svelte-routing\src\Link.svelte generated by Svelte v3.18.1 */

const Link = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $base;
	let $location;
	let { to = "#" } = $$props;
	let { replace = false } = $$props;
	let { state = {} } = $$props;
	let { getProps = () => ({}) } = $$props;
	const { base } = getContext(ROUTER);
	$base = get_store_value(base);
	const location = getContext(LOCATION);
	$location = get_store_value(location);
	const dispatch = createEventDispatcher();
	let href, isPartiallyCurrent, isCurrent, props;

	if ($$props.to === void 0 && $$bindings.to && to !== void 0) $$bindings.to(to);
	if ($$props.replace === void 0 && $$bindings.replace && replace !== void 0) $$bindings.replace(replace);
	if ($$props.state === void 0 && $$bindings.state && state !== void 0) $$bindings.state(state);
	if ($$props.getProps === void 0 && $$bindings.getProps && getProps !== void 0) $$bindings.getProps(getProps);
	$base = get_store_value(base);
	$location = get_store_value(location);
	href = to === "/" ? $base.uri : resolve(to, $base.uri);
	isPartiallyCurrent = startsWith($location.pathname, href);
	isCurrent = href === $location.pathname;
	let ariaCurrent = isCurrent ? "page" : undefined;

	props = getProps({
		location: $location,
		href,
		isPartiallyCurrent,
		isCurrent
	});

	return `<a${spread([{ href: escape(href) }, { "aria-current": escape(ariaCurrent) }, props])}>
  ${$$slots.default ? $$slots.default({}) : ``}
</a>`;
});

/* src\components\NavLink.svelte generated by Svelte v3.18.1 */

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

const NavLink = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { to = "" } = $$props;
	if ($$props.to === void 0 && $$bindings.to && to !== void 0) $$bindings.to(to);

	return `${validate_component(Link, "Link").$$render($$result, { to, getProps }, {}, {
		default: () => `
  ${$$slots.default ? $$slots.default({}) : ``}
`
	})}`;
});

/* src\routes\Home.svelte generated by Svelte v3.18.1 */

const Home = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let githubFeed = [];

	onMount(async function () {
		const response = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fgithub.com%2Fheythisischris.atom");
		let data = await response.json();
		githubFeed = data.items;
	});

	return `<div class="${"mainbarAndSidebarContainer"}">
  <div class="${"mainbar"}">
    <h1>Who is Chris?</h1>
    <div class="${"textBlock"}">
      <p>I&#39;m an application developer based in Miami, FL.</p>
    </div>
    <h1>What does Chris do now?</h1>
    <div class="${"textBlock"}">
      <p>He works at TECKpert. In his spare-time, he&#39;s building place4pals.</p>
    </div>
  </div>
  <div class="${"sidebar"}">
    <h1>GitHub Feed</h1>
    ${each(githubFeed, item => `<div class="${"commitBlock"}">
      <p><a target="${"_blank"}"${add_attribute("href", item.link, 0)}>${escape(new Date(item.pubDate.replace(/ /g, "T")).toLocaleString("en-US", {
		day: "numeric",
		month: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "numeric",
		hour12: true
	}))}</a></p>
      <p style="${"margin-top:-15px;"}">${escape(item.title)}</p>
    </div>`)}
  </div>
</div>`;
});

/* src\routes\Portfolio.svelte generated by Svelte v3.18.1 */

const Portfolio = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<h1>Apps</h1>
<div class="${"textBlock"}"><p>These are some of the apps that I&#39;ve worked on.</p></div>`;
});

/* src\routes\Resume.svelte generated by Svelte v3.18.1 */

const Resume = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `<h1>Objective</h1>
<div class="${"textBlock"}">
  <p>To develop robust software in an agile environment</p>
</div>
<h1>Education</h1>
<div class="${"textBlock"}">
  <p>
    <strong>Bachelor of Science in Business Administration</strong>, May 2019
    <br>
    University of Florida, Gainesville, FL
    <br>
    Specialization in Computer Science
  </p>
</div>
<h1>Experience</h1>
<div class="${"textBlock"}">
  <p>
    <strong>Application Developer,</strong>
    June 2016 – Present
    <br>
    <a href="${"http://teckpert.com"}">TECKpert</a>, Miami, Florida – Web/Mobile Software Development Agency
  </p>
  <ul style="${"margin-top:-15px;"}">
    <li>
      Began as an intern during Summer 2016 finding and fixing bugs in iOS and
      Android apps
    </li>
    <li>
      Accepted a paid position as a programmer afterwards and worked on these
      apps and web services:
      <ul>
        <li>
          <a href="${"http://corkagefee.com"}">CorkageFee</a> – View wine bottle fees at nearby restaurants
        </li>
        <li>
           <a href="${"http://realdash.com"}">RealDash</a> – Platform for real estate professionals
        </li>
        <li>
           <a href="${"http://roamwith.com"}">ROAM Ropes</a> – Audio equalization for Bluetooth earphones
        </li>
        <li>
           <a href="${"http://castcloud.me"}">CastCloud</a> – Casting attendance system for film productions
        </li>
        <li>
           <a href="${"http://csklegal.com"}">CSK Legal</a> – Shows directory of attorneys with the CSK firm
        </li>
      </ul>
    </li>
    <li>
      Developed frontend for these apps using Objective C &amp; Swift 3 (iOS),
      Java (Android), &amp; C# .NET (Windows)
    </li>
    <li>
      Created/maintained WordPress plugins for various client websites in PHP
    </li>
    <li>
      Experience with Serverless Applications on AWS for <a href="${"http://hospitalistapp.com"}">Hospitalist Assist</a>, a patient
      admitting portal
      <ul>
        <li>
          Developed multiple client backends using Node.js + Lambda, frontend
          using React Native
        </li>
        <li>
          Utilize Amazon Cognito for user authentication, Amazon Lambda for
          serverless API calls, API Gateway to route calls to Lambda, and Amazon
          RDS to host a MySQL instance or DynamoDB to host a NoSQL instance
          <br>
        </li>
      </ul>
    </li>
  </ul>
  <p>
    <strong>Website Developer</strong>, 2013
  <br>Lexus Eco Challenge, Miami, Florida</p>
  <ul style="${"margin-top:-15px"}">
    <li>
      Developed <a href="${"http://dontbeadrain.com"}">dontbeadrain.com</a> which highlighted water conservation tips using HTML5
      and CSS3.
    </li>
    <li>
      Won 1
      <sup>st</sup>
      Place in National Competition, received over $20,000 in funding for our
      school
    </li>
  </ul>
  <p>
    <strong>Game Developer,</strong>
    2008
  <br>Self-employed, Miami, Florida</p>
  <ul style="${"margin-top:-15px"}">
    <li>
      Programmed several Flash games
    </li>
    <li>
      Sold <a href="${"https://www.kongregate.com/games/fettspielen/dodge"}">Dodge</a> to Fettspielen.de, a German game portal.
      
    </li>
  </ul>
</div>
<h1>Involvement</h1>
<div class="${"textBlock"}">
  <p>
    <strong>Programming Mentor</strong>, August 2017 – December 2017
  <br>First Time Programmers Club, University of Florida</p>
  <ul style="${"margin-top:-15px"}">
    <li>
      Assisted undergraduate programming majors in learning coding concepts and
      completing their coursework
    </li>
  </ul>
</div>

<h1>Skills</h1>
<div class="${"textBlock"}">
  <p>
    <strong>Languages:</strong>
    JavaScript, React, React Native, Angular, PHP, ASP, C# (.NET), Java, Swift,
    Obj-C, C++<br>
    <strong>Databases:</strong>
    MySQL, PostgreSQL, MongoDB, DynamoDB<br>
    <strong>IDEs and Software:</strong>
    VS Code, Git Bash, Xcode, Notepad++, Android Studio<br>
    <strong>Languages:</strong>
    Spanish (fluent)
  </p>
</div>`;
});

/* src\routes\Contact.svelte generated by Svelte v3.18.1 */

const css = {
	code: ".textarea.svelte-110ujhe{width:90%;height:125px;font-family:Arial;padding:5px}.input.svelte-110ujhe{width:90%;padding:5px}.send.svelte-110ujhe{width:90%;text-align:right}.sendButton.svelte-110ujhe{padding:10px 20px}@media only screen and (max-width: 850px){.textarea.svelte-110ujhe{width:90%}.input.svelte-110ujhe{width:90%}.send.svelte-110ujhe{width:90%}}",
	map: "{\"version\":3,\"file\":\"Contact.svelte\",\"sources\":[\"Contact.svelte\"],\"sourcesContent\":[\"<style>\\n  .textarea {\\n    width: 90%;\\n    height: 125px;\\n    font-family: Arial;\\n    padding: 5px;\\n  }\\n  .input {\\n    width: 90%;\\n    padding: 5px;\\n  }\\n  .send {\\n    width: 90%;\\n    text-align: right;\\n  }\\n  .sendButton {\\n    padding: 10px 20px;\\n  }\\n  @media only screen and (max-width: 850px) {\\n    .textarea {\\n      width: 90%;\\n    }\\n    .input {\\n      width: 90%;\\n    }\\n    .send {\\n      width: 90%;\\n    }\\n  }\\n</style>\\n\\n<div class=\\\"mainbarAndSidebarContainer\\\">\\n  <div class=\\\"mainbar\\\">\\n    <h1>Name</h1>\\n    <div class=\\\"textBlock\\\">\\n      <p>Christopher James Aitken (25 y/o)</p>\\n    </div>\\n\\n    <h1>Email</h1>\\n    <div class=\\\"textBlock\\\">\\n      <p>\\n        <a href=\\\"mailto:chris@heythisischris.com\\\">chris@heythisischris.com</a>\\n      </p>\\n    </div>\\n\\n    <h1>Leave me a message</h1>\\n    <div class=\\\"textBlock\\\">\\n      <p>\\n        <input class=\\\"input\\\" placeholder=\\\"Name\\\" />\\n      </p>\\n      <p>\\n        <input class=\\\"input\\\" placeholder=\\\"Email\\\" />\\n      </p>\\n      <p>\\n        <textarea class=\\\"textarea\\\" placeholder=\\\"Message\\\" />\\n      </p>\\n      <p class=\\\"send\\\">\\n        <button class=\\\"sendButton\\\">Send</button>\\n      </p>\\n    </div>\\n  </div>\\n\\n  <div class=\\\"sidebar\\\">\\n    <h1>Response ETA?</h1>\\n    <div class=\\\"textBlock\\\">\\n      <p>Usually within a few hours, I check my email pretty frequently.</p>\\n    </div>\\n  </div>\\n</div>\\n\"],\"names\":[],\"mappings\":\"AACE,SAAS,eAAC,CAAC,AACT,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,KAAK,CACb,WAAW,CAAE,KAAK,CAClB,OAAO,CAAE,GAAG,AACd,CAAC,AACD,MAAM,eAAC,CAAC,AACN,KAAK,CAAE,GAAG,CACV,OAAO,CAAE,GAAG,AACd,CAAC,AACD,KAAK,eAAC,CAAC,AACL,KAAK,CAAE,GAAG,CACV,UAAU,CAAE,KAAK,AACnB,CAAC,AACD,WAAW,eAAC,CAAC,AACX,OAAO,CAAE,IAAI,CAAC,IAAI,AACpB,CAAC,AACD,OAAO,IAAI,CAAC,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACzC,SAAS,eAAC,CAAC,AACT,KAAK,CAAE,GAAG,AACZ,CAAC,AACD,MAAM,eAAC,CAAC,AACN,KAAK,CAAE,GAAG,AACZ,CAAC,AACD,KAAK,eAAC,CAAC,AACL,KAAK,CAAE,GAAG,AACZ,CAAC,AACH,CAAC\"}"
};

const Contact = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css);

	return `<div class="${"mainbarAndSidebarContainer"}">
  <div class="${"mainbar"}">
    <h1>Name</h1>
    <div class="${"textBlock"}">
      <p>Christopher James Aitken (25 y/o)</p>
    </div>

    <h1>Email</h1>
    <div class="${"textBlock"}">
      <p>
        <a href="${"mailto:chris@heythisischris.com"}">chris@heythisischris.com</a>
      </p>
    </div>

    <h1>Leave me a message</h1>
    <div class="${"textBlock"}">
      <p>
        <input class="${"input svelte-110ujhe"}" placeholder="${"Name"}">
      </p>
      <p>
        <input class="${"input svelte-110ujhe"}" placeholder="${"Email"}">
      </p>
      <p>
        <textarea class="${"textarea svelte-110ujhe"}" placeholder="${"Message"}"></textarea>
      </p>
      <p class="${"send svelte-110ujhe"}">
        <button class="${"sendButton svelte-110ujhe"}">Send</button>
      </p>
    </div>
  </div>

  <div class="${"sidebar"}">
    <h1>Response ETA?</h1>
    <div class="${"textBlock"}">
      <p>Usually within a few hours, I check my email pretty frequently.</p>
    </div>
  </div>
</div>`;
});

/* src\App.svelte generated by Svelte v3.18.1 */

const App = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { url = "" } = $$props;
	if ($$props.url === void 0 && $$bindings.url && url !== void 0) $$bindings.url(url);

	return `<head>
  <meta name="${"viewport"}" content="${"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"}">
  <title>heythisischris</title>
  <meta charset="${"utf-8"}">
  <meta name="${"description"}" content="${"Chris Aitken's personal website"}">
  <meta name="${"author"}" content="${"Chris Aitken"}">
  <meta property="${"og:url"}" content="${"heythisischris.com"}">
  <meta property="${"og:type"}" content="${"website"}">
  <meta property="${"og:title"}" content="${"heythisischris"}">
  <meta property="${"og:description"}" content="${"Chris Aitken's personal website"}">
  <link rel="${"apple-touch-icon"}" sizes="${"180x180"}" href="${"/images/favicons/apple-touch-icon-180x180.png"}">
  <link rel="${"icon"}" type="${"image/png"}" href="${"/images/favicons/favicon-32x32.png"}" sizes="${"32x32"}">
  <link rel="${"icon"}" type="${"image/png"}" href="${"/images/favicons/android-chrome-192x192.png"}" sizes="${"192x192"}">
  <link rel="${"icon"}" type="${"image/png"}" href="${"/images/favicons/favicon-96x96.png"}" sizes="${"96x96"}">
  <link rel="${"icon"}" type="${"image/png"}" href="${"/images/favicons/favicon-16x16.png"}" sizes="${"16x16"}">
  <link rel="${"manifest"}" href="${"/images/favicons/manifest.json"}">
  <link rel="${"mask-icon"}" href="${"/images/favicons/safari-pinned-tab.svg"}" color="${"#5bbad5"}">
  <meta name="${"apple-mobile-web-app-title"}" content="${"hey, this is chris"}">
  <meta name="${"application-name"}" content="${"hey, this is chris"}">
  <meta name="${"msapplication-TileColor"}" content="${"#da532c"}">
  <meta name="${"msapplication-TileImage"}" content="${"/images/favicons/mstile-144x144.png"}">
  <meta name="${"theme-color"}" content="${"#ffffff"}">
</head>
${validate_component(Router, "Router").$$render($$result, { url }, {}, {
		default: () => `
  <div class="${"container"}">
    <nav>
      <div class="${"navContainer"}">
        <div class="${"navTitle"}">
          ${validate_component(NavLink, "NavLink").$$render($$result, { to: "/" }, {}, {
			default: () => `
            <img class="${"logo"}" alt="${""}" src="${"/images/logo.png"}">
          `
		})}
          ${validate_component(NavLink, "NavLink").$$render($$result, { to: "/" }, {}, { default: () => `heythisischris` })}
        </div>
        <div class="${"navLinks"}">
          ${validate_component(NavLink, "NavLink").$$render($$result, { to: "/" }, {}, { default: () => `Home` })}
          ${validate_component(NavLink, "NavLink").$$render($$result, { to: "portfolio" }, {}, { default: () => `Portfolio` })}
          ${validate_component(NavLink, "NavLink").$$render($$result, { to: "resume" }, {}, { default: () => `Resume` })}
          ${validate_component(NavLink, "NavLink").$$render($$result, { to: "contact" }, {}, { default: () => `Contact` })}
        </div>
        <div class="${"navSocial"}">
          <a target="${"_blank"}" href="${"https://github.com/heythisischris"}"><img class="${"socialIcon"}" alt="${"github"}" src="${"images/github.svg"}"></a>
          <a target="${"_blank"}" href="${"https://www.linkedin.com/in/chris-aitken-293045183/"}"><img class="${"socialIcon"}" alt="${"linkedin"}" src="${"images/linkedin.svg"}"></a>
          <a target="${"_blank"}" href="${"https://www.instagram.com/heythisischris/"}"><img class="${"socialIcon"}" alt="${"instagram"}" src="${"images/instagram.svg"}"></a>
          
          <a target="${"_blank"}" href="${"https://www.facebook.com/chrisaitken"}"><img class="${"socialIcon"}" alt="${"bandcamp"}" src="${"images/facebook.svg"}"></a>
          <a target="${"_blank"}" href="${"https://heythisischris.bandcamp.com/"}"><img class="${"socialIcon"}" alt="${"bandcamp"}" src="${"images/bandcamp.svg"}"></a>
          
        </div>
      </div>
    </nav>
    <div class="${"pageContainer"}">
      ${validate_component(Route, "Route").$$render($$result, { path: "/", component: Home }, {}, {})}
      ${validate_component(Route, "Route").$$render($$result, { path: "portfolio", component: Portfolio }, {}, {})}
      ${validate_component(Route, "Route").$$render($$result, { path: "resume", component: Resume }, {}, {})}
      ${validate_component(Route, "Route").$$render($$result, { path: "contact", component: Contact }, {}, {})}
    </div>
  </div>
  <div class="${"footer"}">Copyright © 2020 Chris Aitken</div>
`
	})}`;
});

module.exports = App;
