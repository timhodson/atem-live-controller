
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
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
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
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
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
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
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/App.svelte generated by Svelte v3.5.1 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.channel = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.channel = list[i];
    	return child_ctx;
    }

    // (598:4) {#each switchers[0].visibleChannels as channel}
    function create_each_block_1(ctx) {
    	var div, t_value = ctx.channel.label, t, dispose;

    	function click_handler(...args) {
    		return ctx.click_handler(ctx, ...args);
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			div.className = "button";
    			toggle_class(div, "red", ctx.isProgramChannel(ctx.channel));
    			add_location(div, file, 598, 6, 15201);
    			dispose = listen(div, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.switchers) && t_value !== (t_value = ctx.channel.label)) {
    				set_data(t, t_value);
    			}

    			if ((changed.isProgramChannel || changed.switchers)) {
    				toggle_class(div, "red", ctx.isProgramChannel(ctx.channel));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    // (607:4) {#each switchers[0].visibleChannels as channel}
    function create_each_block(ctx) {
    	var div, t_value = ctx.channel.label, t, dispose;

    	function click_handler_1(...args) {
    		return ctx.click_handler_1(ctx, ...args);
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			div.className = "button";
    			toggle_class(div, "green", ctx.isPreviewChannel(ctx.channel));
    			add_location(div, file, 607, 6, 15502);
    			dispose = listen(div, "click", click_handler_1);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.switchers) && t_value !== (t_value = ctx.channel.label)) {
    				set_data(t, t_value);
    			}

    			if ((changed.isPreviewChannel || changed.switchers)) {
    				toggle_class(div, "green", ctx.isPreviewChannel(ctx.channel));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment(ctx) {
    	var header, h1, t0_value = ctx.switchers[0]._pin, t0, t1, div30, div2, section0, h20, t3, div0, t4, section1, h21, t6, div1, t7, div17, section2, h22, t9, div7, div3, t10, div4, t12, br0, t13, div5, t15, div6, t17, section3, h23, t19, div16, div8, t21, div9, t23, div10, t25, div11, t27, div12, t29, br1, t30, div13, t32, div14, t34, div15, t36, div29, section4, h24, t38, div26, div21, div18, t40, div19, t42, div20, t44, div25, div22, t46, div23, t48, div24, t50, section5, h25, t52, div28, div27, dispose;

    	var each_value_1 = ctx.switchers[0].visibleChannels;

    	var each_blocks_1 = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	var each_value = ctx.switchers[0].visibleChannels;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			div30 = element("div");
    			div2 = element("div");
    			section0 = element("section");
    			h20 = element("h2");
    			h20.textContent = "Program";
    			t3 = space();
    			div0 = element("div");

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t4 = space();
    			section1 = element("section");
    			h21 = element("h2");
    			h21.textContent = "Preview";
    			t6 = space();
    			div1 = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			div17 = element("div");
    			section2 = element("section");
    			h22 = element("h2");
    			h22.textContent = "Next Transition";
    			t9 = space();
    			div7 = element("div");
    			div3 = element("div");
    			t10 = space();
    			div4 = element("div");
    			div4.textContent = "ON AIR";
    			t12 = space();
    			br0 = element("br");
    			t13 = space();
    			div5 = element("div");
    			div5.textContent = "BKGD";
    			t15 = space();
    			div6 = element("div");
    			div6.textContent = "Key 1";
    			t17 = space();
    			section3 = element("section");
    			h23 = element("h2");
    			h23.textContent = "Transition style";
    			t19 = space();
    			div16 = element("div");
    			div8 = element("div");
    			div8.textContent = "MIX";
    			t21 = space();
    			div9 = element("div");
    			div9.textContent = "DIP";
    			t23 = space();
    			div10 = element("div");
    			div10.textContent = "WIPE";
    			t25 = space();
    			div11 = element("div");
    			div11.textContent = "STING";
    			t27 = space();
    			div12 = element("div");
    			div12.textContent = "DVE";
    			t29 = space();
    			br1 = element("br");
    			t30 = space();
    			div13 = element("div");
    			div13.textContent = "PREV";
    			t32 = space();
    			div14 = element("div");
    			div14.textContent = "CUT";
    			t34 = space();
    			div15 = element("div");
    			div15.textContent = "AUTO";
    			t36 = space();
    			div29 = element("div");
    			section4 = element("section");
    			h24 = element("h2");
    			h24.textContent = "Downstream Key";
    			t38 = space();
    			div26 = element("div");
    			div21 = element("div");
    			div18 = element("div");
    			div18.textContent = "TIE";
    			t40 = space();
    			div19 = element("div");
    			div19.textContent = "ON AIR";
    			t42 = space();
    			div20 = element("div");
    			div20.textContent = "AUTO";
    			t44 = space();
    			div25 = element("div");
    			div22 = element("div");
    			div22.textContent = "TIE";
    			t46 = space();
    			div23 = element("div");
    			div23.textContent = "ON AIR";
    			t48 = space();
    			div24 = element("div");
    			div24.textContent = "AUTO";
    			t50 = space();
    			section5 = element("section");
    			h25 = element("h2");
    			h25.textContent = "Fade to Black";
    			t52 = space();
    			div28 = element("div");
    			div27 = element("div");
    			div27.textContent = "FTB";
    			add_location(h1, file, 588, 2, 14972);
    			header.className = "row";
    			add_location(header, file, 587, 0, 14949);
    			h20.className = "section";
    			add_location(h20, file, 595, 4, 15087);
    			div0.className = "well";
    			add_location(div0, file, 596, 4, 15124);
    			section0.className = "channels";
    			add_location(section0, file, 594, 2, 15056);
    			h21.className = "section";
    			add_location(h21, file, 604, 4, 15388);
    			div1.className = "well";
    			add_location(div1, file, 605, 4, 15425);
    			section1.className = "channels";
    			add_location(section1, file, 603, 2, 15357);
    			div2.className = "col-lg-7";
    			add_location(div2, file, 593, 0, 15031);
    			h22.className = "section";
    			add_location(h22, file, 615, 4, 15728);
    			div3.className = "button-spacer";
    			add_location(div3, file, 617, 6, 15798);
    			div4.className = "button";
    			toggle_class(div4, "red", ctx.switchers[0].video.ME[0].upstreamKeyState[0]);
    			add_location(div4, file, 618, 6, 15838);
    			add_location(br0, file, 619, 6, 15974);
    			div5.className = "button";
    			toggle_class(div5, "yellow", ctx.switchers[0].video.ME[0].upstreamKeyNextBackgroundState);
    			add_location(div5, file, 620, 6, 15985);
    			div6.className = "button";
    			toggle_class(div6, "yellow", ctx.switchers[0].video.ME[0].upstreamKeyNextState[0]);
    			add_location(div6, file, 621, 6, 16141);
    			div7.className = "well";
    			add_location(div7, file, 616, 4, 15773);
    			section2.className = "next-transition";
    			add_location(section2, file, 614, 2, 15690);
    			h23.className = "section";
    			add_location(h23, file, 626, 4, 16341);
    			div8.className = "button";
    			toggle_class(div8, "yellow", ctx.switchers[0].video.ME[0].transitionStyle==0);
    			add_location(div8, file, 628, 6, 16412);
    			div9.className = "button";
    			toggle_class(div9, "yellow", ctx.switchers[0].video.ME[0].transitionStyle==1);
    			add_location(div9, file, 631, 6, 16565);
    			div10.className = "button";
    			toggle_class(div10, "yellow", ctx.switchers[0].video.ME[0].transitionStyle==2);
    			add_location(div10, file, 634, 6, 16714);
    			div11.className = "button";
    			toggle_class(div11, "yellow", ctx.switchers[0].video.ME[0].transitionStyle==3);
    			toggle_class(div11, "disabled", ctx.switchers[0].topology.numberOfStingers==0);
    			add_location(div11, file, 637, 6, 16870);
    			div12.className = "button";
    			toggle_class(div12, "yellow", ctx.switchers[0].video.ME[0].transitionStyle==4);
    			toggle_class(div12, "disabled", ctx.switchers[0].topology.numberOfDVEs==0);
    			add_location(div12, file, 641, 6, 17097);
    			add_location(br1, file, 645, 6, 17318);
    			div13.className = "button";
    			add_location(div13, file, 646, 6, 17329);
    			div14.className = "button";
    			add_location(div14, file, 648, 6, 17412);
    			div15.className = "button";
    			toggle_class(div15, "red", ctx.switchers[0].video.ME[0].transitionPosition != 0);
    			add_location(div15, file, 650, 6, 17484);
    			div16.className = "well";
    			add_location(div16, file, 627, 4, 16387);
    			section3.className = "transition";
    			add_location(section3, file, 625, 2, 16308);
    			div17.className = "col-lg-3";
    			add_location(div17, file, 613, 0, 15665);
    			h24.className = "section";
    			add_location(h24, file, 659, 4, 17718);
    			div18.className = "button";
    			toggle_class(div18, "yellow", ctx.switchers[0].video.downstreamKeyTie[0]);
    			add_location(div18, file, 662, 8, 17823);
    			div19.className = "button";
    			toggle_class(div19, "red", ctx.switchers[0].video.downstreamKeyOn[0]);
    			add_location(div19, file, 663, 8, 17955);
    			div20.className = "button";
    			toggle_class(div20, "red", false);
    			add_location(div20, file, 664, 8, 18085);
    			div21.className = "button-column";
    			add_location(div21, file, 661, 6, 17787);
    			div22.className = "button";
    			toggle_class(div22, "yellow", ctx.switchers[0].video.downstreamKeyTie[1]);
    			add_location(div22, file, 667, 8, 18224);
    			div23.className = "button";
    			toggle_class(div23, "red", ctx.switchers[0].video.downstreamKeyOn[1]);
    			add_location(div23, file, 668, 8, 18356);
    			div24.className = "button";
    			toggle_class(div24, "red", false);
    			add_location(div24, file, 669, 8, 18486);
    			div25.className = "button-column";
    			add_location(div25, file, 666, 6, 18188);
    			div26.className = "well";
    			add_location(div26, file, 660, 4, 17762);
    			section4.className = "downstream-key";
    			add_location(section4, file, 658, 2, 17681);
    			h25.className = "section";
    			add_location(h25, file, 675, 4, 18646);
    			div27.className = "button";
    			toggle_class(div27, "red", ctx.switchers[0].video.ME[0].fadeToBlack);
    			add_location(div27, file, 677, 6, 18714);
    			div28.className = "well";
    			add_location(div28, file, 676, 4, 18689);
    			section5.className = "fade-to-black";
    			add_location(section5, file, 674, 2, 18610);
    			div29.className = "col-lg-2";
    			add_location(div29, file, 657, 0, 17656);
    			div30.className = "row";
    			add_location(div30, file, 591, 0, 15012);

    			dispose = [
    				listen(div4, "click", ctx.click_handler_2),
    				listen(div5, "click", ctx.click_handler_3),
    				listen(div6, "click", ctx.click_handler_4),
    				listen(div8, "click", ctx.click_handler_5),
    				listen(div9, "click", ctx.click_handler_6),
    				listen(div10, "click", ctx.click_handler_7),
    				listen(div11, "click", ctx.click_handler_8),
    				listen(div12, "click", ctx.click_handler_9),
    				listen(div13, "click", ctx.changeTransitionPreview),
    				listen(div14, "click", ctx.cutTransition),
    				listen(div15, "click", ctx.autoTransition),
    				listen(div18, "click", ctx.click_handler_10),
    				listen(div19, "click", ctx.click_handler_11),
    				listen(div20, "click", ctx.click_handler_12),
    				listen(div22, "click", ctx.click_handler_13),
    				listen(div23, "click", ctx.click_handler_14),
    				listen(div24, "click", ctx.click_handler_15),
    				listen(div27, "click", ctx.fadeToBlack)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, header, anchor);
    			append(header, h1);
    			append(h1, t0);
    			insert(target, t1, anchor);
    			insert(target, div30, anchor);
    			append(div30, div2);
    			append(div2, section0);
    			append(section0, h20);
    			append(section0, t3);
    			append(section0, div0);

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append(div2, t4);
    			append(div2, section1);
    			append(section1, h21);
    			append(section1, t6);
    			append(section1, div1);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append(div30, t7);
    			append(div30, div17);
    			append(div17, section2);
    			append(section2, h22);
    			append(section2, t9);
    			append(section2, div7);
    			append(div7, div3);
    			append(div7, t10);
    			append(div7, div4);
    			append(div7, t12);
    			append(div7, br0);
    			append(div7, t13);
    			append(div7, div5);
    			append(div7, t15);
    			append(div7, div6);
    			append(div17, t17);
    			append(div17, section3);
    			append(section3, h23);
    			append(section3, t19);
    			append(section3, div16);
    			append(div16, div8);
    			append(div16, t21);
    			append(div16, div9);
    			append(div16, t23);
    			append(div16, div10);
    			append(div16, t25);
    			append(div16, div11);
    			append(div16, t27);
    			append(div16, div12);
    			append(div16, t29);
    			append(div16, br1);
    			append(div16, t30);
    			append(div16, div13);
    			append(div16, t32);
    			append(div16, div14);
    			append(div16, t34);
    			append(div16, div15);
    			append(div30, t36);
    			append(div30, div29);
    			append(div29, section4);
    			append(section4, h24);
    			append(section4, t38);
    			append(section4, div26);
    			append(div26, div21);
    			append(div21, div18);
    			append(div21, t40);
    			append(div21, div19);
    			append(div21, t42);
    			append(div21, div20);
    			append(div26, t44);
    			append(div26, div25);
    			append(div25, div22);
    			append(div25, t46);
    			append(div25, div23);
    			append(div25, t48);
    			append(div25, div24);
    			append(div29, t50);
    			append(div29, section5);
    			append(section5, h25);
    			append(section5, t52);
    			append(section5, div28);
    			append(div28, div27);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.switchers) && t0_value !== (t0_value = ctx.switchers[0]._pin)) {
    				set_data(t0, t0_value);
    			}

    			if (changed.isProgramChannel || changed.switchers) {
    				each_value_1 = ctx.switchers[0].visibleChannels;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}
    				each_blocks_1.length = each_value_1.length;
    			}

    			if (changed.isPreviewChannel || changed.switchers) {
    				each_value = ctx.switchers[0].visibleChannels;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.switchers) {
    				toggle_class(div4, "red", ctx.switchers[0].video.ME[0].upstreamKeyState[0]);
    				toggle_class(div5, "yellow", ctx.switchers[0].video.ME[0].upstreamKeyNextBackgroundState);
    				toggle_class(div6, "yellow", ctx.switchers[0].video.ME[0].upstreamKeyNextState[0]);
    				toggle_class(div8, "yellow", ctx.switchers[0].video.ME[0].transitionStyle==0);
    				toggle_class(div9, "yellow", ctx.switchers[0].video.ME[0].transitionStyle==1);
    				toggle_class(div10, "yellow", ctx.switchers[0].video.ME[0].transitionStyle==2);
    				toggle_class(div11, "yellow", ctx.switchers[0].video.ME[0].transitionStyle==3);
    				toggle_class(div11, "disabled", ctx.switchers[0].topology.numberOfStingers==0);
    				toggle_class(div12, "yellow", ctx.switchers[0].video.ME[0].transitionStyle==4);
    				toggle_class(div12, "disabled", ctx.switchers[0].topology.numberOfDVEs==0);
    				toggle_class(div15, "red", ctx.switchers[0].video.ME[0].transitionPosition != 0);
    				toggle_class(div18, "yellow", ctx.switchers[0].video.downstreamKeyTie[0]);
    				toggle_class(div19, "red", ctx.switchers[0].video.downstreamKeyOn[0]);
    				toggle_class(div22, "yellow", ctx.switchers[0].video.downstreamKeyTie[1]);
    				toggle_class(div23, "red", ctx.switchers[0].video.downstreamKeyOn[1]);
    				toggle_class(div27, "red", ctx.switchers[0].video.ME[0].fadeToBlack);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(header);
    				detach(t1);
    				detach(div30);
    			}

    			destroy_each(each_blocks_1, detaching);

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    function updateVisibleChannels(atem) {
    	atem.visibleChannels = [];
    	for (var id in atem.channels) {
    		const channel = atem.channels[id];
    		channel.id = id;
    		channel.device = atem.device;
    		channel.input = id;
    	}
    	// standard inputs
    	for (var id=1; id<10; id++) {
    		if (atem.channels[id]) {
    			atem.visibleChannels.push(atem.channels[id]);
    		} else {
    			break;
    		}
    	}
    	// Black
    	if (atem.channels[0]) {
    		atem.visibleChannels.push(atem.channels[0]);
    	}
    	// Colors
    	for (var id=2001; id<3000; id++) {
    		if (atem.channels[id]) {
    			atem.visibleChannels.push(atem.channels[id]);
    		} else {
    			break;
    		}
    	}
    	// Color Bars
    	if (atem.channels[1000]) {
    		atem.visibleChannels.push(atem.channels[1000]);
    	}
    	// Media Players
    	for (var id=3010; id<4000; id+=10) {
    		if (atem.channels[id]) {
    			atem.visibleChannels.push(atem.channels[id]);
    		} else {
    			break;
    		}
    	}
    }

    function instance($$self, $$props, $$invalidate) {
    	let switchers = [
        {
          "topology": {
            "numberOfMEs": 1,
            "numberOfSources": 18,
            "numberOfColorGenerators": 2,
            "numberOfAUXs": 0,
            "numberOfDownstreamKeys": 0,
            "numberOfStingers": 2,
            "numberOfDVEs": 0,
            "numberOfSuperSources": 4
          },
          "tallys": [2, 0, 0, 0, 0, 0],
          "channels": {
            "0": {
              "name": "Black",
              "label": "Blk",
              "id": "0",
              "device": 0,
              "input": "0"
            },
            "1": {
              "name": "Cam 1",
              "label": "CAM1",
              "id": "1",
              "device": 0,
              "input": "1"
            },
            "2": {
              "name": "Cam 2",
              "label": "CAM2",
              "id": "2",
              "device": 0,
              "input": "2"
            },
            "3": {
              "name": "Cam 3",
              "label": "CAM3",
              "id": "3",
              "device": 0,
              "input": "3"
            },
            "4": {
              "name": "Cam 4",
              "label": "CAM4",
              "id": "4",
              "device": 0,
              "input": "4"
            },
            "5": {
              "name": "Cam 5",
              "label": "CAM5",
              "id": "5",
              "device": 0,
              "input": "5"
            },
            "6": {
              "name": "Cam 6",
              "label": "CAM6",
              "id": "6",
              "device": 0,
              "input": "6"
            },
            "1000": {
              "name": "Color Bars",
              "label": "Bars",
              "id": "1000",
              "device": 0,
              "input": "1000"
            },
            "2001": {
              "name": "Color 1",
              "label": "Col1",
              "id": "2001",
              "device": 0,
              "input": "2001"
            },
            "2002": {
              "name": "Color 2",
              "label": "Col2",
              "id": "2002",
              "device": 0,
              "input": "2002"
            },
            "3010": {
              "name": "Media Player 1",
              "label": "MP1",
              "id": "3010",
              "device": 0,
              "input": "3010"
            },
            "3011": {
              "name": "Media 1 Key",
              "label": "MP1K",
              "id": "3011",
              "device": 0,
              "input": "3011"
            },
            "3020": {
              "name": "Media Player 2",
              "label": "MP2",
              "id": "3020",
              "device": 0,
              "input": "3020"
            },
            "3021": {
              "name": "Media Player 2 Key",
              "label": "MP2K",
              "id": "3021",
              "device": 0,
              "input": "3021"
            },
            "7001": {
              "name": "Clean Feed 1",
              "label": "Cfd1",
              "id": "7001",
              "device": 0,
              "input": "7001"
            },
            "7002": {
              "name": "Clean Feed 2",
              "label": "Cfd2",
              "id": "7002",
              "device": 0,
              "input": "7002"
            },
            "10010": {
              "name": "Program",
              "label": "Pgm",
              "id": "10010",
              "device": 0,
              "input": "10010"
            },
            "10011": {
              "name": "Preview",
              "label": "Pvw",
              "id": "10011",
              "device": 0,
              "input": "10011"
            }
          },
          "video": {
            "ME": [
              {
                "upstreamKeyState": [false],
                "upstreamKeyNextState": [false],
                "numberOfKeyers": 1,
                "programInput": 3010,
                "previewInput": 1,
                "transitionStyle": 0,
                "upstreamKeyNextBackground": true,
                "transitionPreview": false,
                "transitionPosition": 0,
                "transitionFrameCount": 25,
                "fadeToBlack": false
              }
            ],
            "downstreamKeyOn": [false, false],
            "downstreamKeyTie": [false, false],
            "auxs": {}
          },
          "audio": {
            "hasMonitor": false,
            "numberOfChannels": 0,
            "channels": {
              "1": {
                "on": false,
                "afv": false,
                "gain": 0.5011853596610636,
                "rawGain": 32768,
                "rawPan": 0
              },
              "2": {
                "on": false,
                "afv": false,
                "gain": 0.5011853596610636,
                "rawGain": 32768,
                "rawPan": 0
              },
              "3": {
                "on": false,
                "afv": false,
                "gain": 0.5011853596610636,
                "rawGain": 32768,
                "rawPan": 0
              },
              "4": {
                "on": false,
                "afv": false,
                "gain": 0.5011853596610636,
                "rawGain": 32768,
                "rawPan": 0
              },
              "5": {
                "on": false,
                "afv": false,
                "gain": 0.5011853596610636,
                "rawGain": 32768,
                "rawPan": 0
              },
              "6": {
                "on": false,
                "afv": false,
                "gain": 0.5011853596610636,
                "rawGain": 32768,
                "rawPan": 0
              },
              "1101": {
                "on": true,
                "afv": false,
                "gain": 0.5011853596610636,
                "rawGain": 32768,
                "rawPan": 0
              }
            },
            "master": {
              "afv": false,
              "gain": 0.5011853596610636,
              "rawGain": 32768
            }
          },
          "device": 0,
          "_ver0": 2,
          "_ver1": 27,
          "_pin": "ATEM Television Studio",
          "model": 1,
          "visibleChannels": [
            {
              "name": "Titulky",
              "label": "TIT",
              "id": "1",
              "device": 0,
              "input": "1"
            },
            {
              "name": "Video PC",
              "label": "VID",
              "id": "2",
              "device": 0,
              "input": "2"
            },
            {
              "name": "Cam 3",
              "label": "CAM3",
              "id": "3",
              "device": 0,
              "input": "3"
            },
            {
              "name": "Cam 4",
              "label": "CAM4",
              "id": "4",
              "device": 0,
              "input": "4"
            },
            {
              "name": "Cam 5",
              "label": "CAM5",
              "id": "5",
              "device": 0,
              "input": "5"
            },
            {
              "name": "Cam 6",
              "label": "CAM6",
              "id": "6",
              "device": 0,
              "input": "6"
            },
            {
              "name": "Black",
              "label": "Blk",
              "id": "0",
              "device": 0,
              "input": "0"
            },
            {
              "name": "Color 1",
              "label": "Col1",
              "id": "2001",
              "device": 0,
              "input": "2001"
            },
            {
              "name": "Color 2",
              "label": "Col2",
              "id": "2002",
              "device": 0,
              "input": "2002"
            },
            {
              "name": "Color Bars",
              "label": "Bars",
              "id": "1000",
              "device": 0,
              "input": "1000"
            },
            {
              "name": "Media 1 Logo",
              "label": "LOGO",
              "id": "3010",
              "device": 0,
              "input": "3010"
            },
            {
              "name": "Media Player 2",
              "label": "MP2",
              "id": "3020",
              "device": 0,
              "input": "3020"
            }
          ]
        }
      ];

    let channels = [
        { "device": 0, "input": 1 },
        { "device": 0, "input": 2 },
        { "device": 0, "input": 3 },
        { "device": 0, "input": 4 },
        { "device": 0, "input": 5 },
        { "device": 0, "input": 6 },
        { "device": 0, "input": 7 },
        { "device": 0, "input": 8 },
        { "device": 0, "input": 9 },
        { "device": 0, "input": 10 },
        { "device": 0, "input": 3010 },
        { "device": 0, "input": 3020 }
      ];

    let ws;
    let intervalID = 0;
    let socketIsOpen = false;

    function doConnect() {
    	ws = new WebSocket("ws://localhost:8080/ws");
    	ws.addEventListener('open', function(event) {
    		console.log('websocket opened');
    		socketIsOpen = true;
    		clearInterval(intervalID);
    		intervalID = 0;
    	});
    	ws.addEventListener('message', function(event) {
    		let data = JSON.parse(event.data);
    		console.log(data);
    		if (data.switchers) {
    			for (var atem of data.switchers) {
    				updateVisibleChannels(atem);
    			}
    			$$invalidate('switchers', switchers = data.switchers);
    		}
    		if (data.channels) {
    			channels = data.channels;
    		}
    		return data;
    	});
    	ws.addEventListener('error', function(evt) {
    		socketIsOpen = false;
    		if (!intervalID) {
    			intervalID = setTimeout(doConnect, 5000);
    		}
    	});
    	ws.addEventListener('close', function(event) {
    		console.log('websocket closed');
    		socketIsOpen = false;
    		if (!intervalID) {
    			intervalID = setTimeout(doConnect, 5000);
    		}
    	});
    }

    function onKeyUp(event) {
    	var key = event.key || event.keyCode;
    	if (key === ' ' || key === 32) {
            event.preventDefault();
            cutTransition();
      } else if (key === 'Enter' || key === 13) {
    		autoTransition();
    	} else if (key >= '0' && key <= '9') {
    		if (event.getModifierState('Control')) {
    			changeProgramInput(0, key);
    		} else {
    			changePreviewInput(0, key);
    		}
      }
    }

    onMount(() => {
    	doConnect();
    	document.addEventListener('keyup', onKeyUp);
    });

    function sendMessage(data) {
    	if (socketIsOpen) {
    		ws.send(JSON.stringify(data));
    	} else {
    		console.log('sendMessage failed: Websocket not connected');
    	}
    }

    function findChannel(device, input) {
    	return switchers[device].channels[input];
    }

    function findChainChannel(device, targetDevice) {
    	for (let channel of channels) {
    		if ((channel.device === device) && (channel.chainDevice === targetDevice)) { return channel; }
    	}
    }

    function getParentProgramChannel() {
    	return findChannel(0, switchers[0].video.ME[0].programInput);
    }

    function getVirtualProgramChannel() {
    	const parentProgramChannel = findChannel(0, switchers[0].video.ME[0].programInput);
    	if (parentProgramChannel.chainDevice != null) {
    		return findChannel(parentProgramChannel.chainDevice, switchers[parentProgramChannel.chainDevice].video.ME[0].programInput);
    	} else {
    		return findChannel(0, switchers[0].video.ME[0].programInput);
    	}
    }
    function getVirtualPreviewChannel() {
    	const parentProgramChannel = findChannel(0, switchers[0].video.ME[0].programInput);
    	const parentPreviewChannel = findChannel(0, switchers[0].video.ME[0].previewInput);
    	if ((parentPreviewChannel.chainDevice != null) && (parentProgramChannel.chainDevice === parentPreviewChannel.chainDevice)) {
    		return findChannel(parentPreviewChannel.chainDevice, switchers[parentPreviewChannel.chainDevice].video.ME[0].previewInput);
    	} else if (parentPreviewChannel.chainDevice != null) {
    		return findChannel(parentPreviewChannel.chainDevice, switchers[parentPreviewChannel.chainDevice].video.ME[0].programInput);
    	} else {
    		return findChannel(0, switchers[0].video.ME[0].previewInput);
    	}
    }
    function isProgramChannel(channel) {
    	const programChannel = getVirtualProgramChannel();
    	return (programChannel.device === channel.device) && (programChannel.input === channel.input);
    }
    function isPreviewChannel(channel) {
    	const previewChannel = getVirtualPreviewChannel();
    	return (previewChannel.device === channel.device) && (previewChannel.input === channel.input);
    }
    function changeProgramInput(device, input) {
    	sendMessage({changeProgramInput: {device, input}});
    }

    function changePreviewInput(device, input) {
    	sendMessage({changePreviewInput: {device, input}});
    }

    function changeProgram(channel) {
    	changeProgramInput(channel.device, channel.input);
    }

    function changePreview(channel) {
    	const isParentDevice = channel.device === 0;
    	if (isParentDevice) {
    		return changePreviewInput(0, channel.input);
    	} else {
    		const chainChannel = findChainChannel(0, channel.device);
    		changePreviewInput(chainChannel.device, chainChannel.input);
    		if (getParentProgramChannel().chainDevice === channel.device) {
    			return changePreviewInput(channel.device, channel.input);
    		} else {
    			return changeProgramInput(channel.device, channel.input);
    		}
    	}
    }
    function autoTransition(device) {
    	sendMessage({autoTransition: {device: 0}});
    }

    function cutTransition(device) {
    	sendMessage({cutTransition: {device: 0}});
    }

    function changeTransitionPreview(device) {
      device = device || 0;
    	const status = !switchers[0].video.ME[0].transitionPreview;
    	sendMessage({changeTransitionPreview: {device, status}});
    }

    function changeTransitionType(type) {
    	sendMessage({changeTransitionType: {type}});
    }

    function toggleUpstreamKeyNextBackground() {
    	const status = !switchers[0].video.ME[0].upstreamKeyNextBackground;
    	sendMessage({changeUpstreamKeyNextBackground: {device: 0, status}});
    }
    function toggleUpstreamKeyNextState(number) {
    	const status = !switchers[0].video.ME[0].upstreamKeyNextState[number];
    	sendMessage({changeUpstreamKeyNextBackground: {device: 0, number, status}});
    }
    function toggleUpstreamKeyState(number) {
    	const status = !switchers[0].video.ME[0].upstreamKeyState[number];
    	sendMessage({changeUpstreamKeyState: {device: 0, number, status}});
    }
    function toggleDownstreamKeyTie(number) {
    	const status = !switchers[0].video.downstreamKeyTie[number];
    	sendMessage({changeDownstreamKeyTie: {device: 0, number, status}});
    }
    function toggleDownstreamKeyOn(number) {
    	const status = !switchers[0].video.downstreamKeyOn[number];
    	sendMessage({changeDownstreamKeyOn: {device: 0, number, status}});
    }
    function autoDownstreamKey(number) {
    	sendMessage({autoDownstreamKey: {device: 0, number}});
    }
    function fadeToBlack() {
    	sendMessage({fadeToBlack: {device: 0}});
    }

    	function click_handler({ channel }, e) {
    		return changeProgram(channel);
    	}

    	function click_handler_1({ channel }, e) {
    		return changePreview(channel);
    	}

    	function click_handler_2(e) {
    		return toggleUpstreamKeyState(0);
    	}

    	function click_handler_3(e) {
    		return toggleUpstreamKeyNextBackground();
    	}

    	function click_handler_4(e) {
    		return toggleUpstreamKeyNextState(0);
    	}

    	function click_handler_5(e) {
    		return changeTransitionType(0);
    	}

    	function click_handler_6(e) {
    		return changeTransitionType(1);
    	}

    	function click_handler_7(e) {
    		return changeTransitionType(2);
    	}

    	function click_handler_8(e) {
    		return changeTransitionType(3);
    	}

    	function click_handler_9(e) {
    		return changeTransitionType(4);
    	}

    	function click_handler_10(e) {
    		return toggleDownstreamKeyTie(1);
    	}

    	function click_handler_11(e) {
    		return toggleDownstreamKeyOn(1);
    	}

    	function click_handler_12(e) {
    		return autoDownstreamKey(1);
    	}

    	function click_handler_13(e) {
    		return toggleDownstreamKeyTie(2);
    	}

    	function click_handler_14(e) {
    		return toggleDownstreamKeyOn(2);
    	}

    	function click_handler_15(e) {
    		return autoDownstreamKey(2);
    	}

    	return {
    		switchers,
    		isProgramChannel,
    		isPreviewChannel,
    		changeProgram,
    		changePreview,
    		autoTransition,
    		cutTransition,
    		changeTransitionPreview,
    		changeTransitionType,
    		toggleUpstreamKeyNextBackground,
    		toggleUpstreamKeyNextState,
    		toggleUpstreamKeyState,
    		toggleDownstreamKeyTie,
    		toggleDownstreamKeyOn,
    		autoDownstreamKey,
    		fadeToBlack,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		click_handler_12,
    		click_handler_13,
    		click_handler_14,
    		click_handler_15
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map