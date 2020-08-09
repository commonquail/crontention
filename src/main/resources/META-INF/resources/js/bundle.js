(() => {
    const defines = {};
    const entry = [null];
    function define(name, dependencies, factory) {
        defines[name] = { dependencies, factory };
        entry[0] = name;
    }
    define("require", ["exports"], (exports) => {
        Object.defineProperty(exports, "__cjsModule", { value: true });
        Object.defineProperty(exports, "default", { value: (name) => resolve(name) });
    });
    define("d3", ["exports"], function(exports) {
        Object.defineProperty(exports, "__cjsModule", { value: true });
        Object.defineProperty(exports, "default", { value: window['d3'] });
    });
    var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    define("App", ["require", "exports", "d3"], function (require, exports, d3) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const cellSize = 18;
        const margin = { top: 30, right: 25, bottom: 30, left: 40 };
        const width = (cellSize * 60);
        const height = (cellSize * 24);
        const errors = document.getElementById("errors");
        const form = document.getElementById("theform");
        const submit = document.getElementById("submit");
        const dateField = document.getElementById("date");
        const expressionsField = document.getElementById("expressions");
        const summary = document.getElementById("summary");
        const detail = document.getElementById("detail");
        const hide = (e) => e.classList.add("hidden");
        const show = (e) => e.classList.remove("hidden");
        const svg = d3.select("#heatmap")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        const xScale = d3.scaleBand()
            .range([0, width])
            .domain([...Array(60).keys()])
            .padding(0.05);
        const yScale = d3.scaleBand()
            .range([height, 0])
            .domain([...Array(24).keys()].reverse())
            .padding(0.05);
        const scaleFormat = d3.format("02.0d");
        svg.append("g")
            .call(d3
            .axisTop(xScale)
            .tickValues(xScale.domain().filter((_, i) => !(i % 5)))
            .tickFormat(scaleFormat))
            .call(g => g
            .append("text")
            .attr("x", 10 + (width / 2))
            .attr("y", 10 - margin.top)
            .attr("fill", "currentColor")
            .attr("text-anchor", "middle")
            .text("Minute"));
        svg.append("g")
            .call(d3.axisLeft(yScale).tickFormat(scaleFormat))
            .call(g => g
            .append("text")
            .attr("x", -(height / 2))
            .attr("y", 10 - margin.left)
            .attr("transform", "rotate(-90)")
            .attr("fill", "currentColor")
            .attr("text-anchor", "middle")
            .text("Hour"));
        class JsonError extends Error {
            constructor(...params) {
                super(...params);
                if (Error.captureStackTrace) {
                    Error.captureStackTrace(this, JsonError);
                }
                this.name = 'JsonError';
            }
        }
        const mouseover = function (d) {
            setDetail(d);
        };
        const setDetail = (d) => {
            const exprs = document.createElement("ul");
            const container = document.createElement("div");
            const header = document.createElement("h3");
            if (d) {
                for (const expr of d.meta.split(/\n/)) {
                    const code = document.createElement("code");
                    code.innerHTML = expr
                        .replace(/</g, "&lt;")
                        .replace(/  /g, "&nbsp; ");
                    const li = document.createElement("li");
                    li.appendChild(code);
                    exprs.appendChild(li);
                }
                header.textContent = `${d.value} event${d.value === 1 ? "" : "s"} at ${d.key}:`;
            }
            else {
                header.textContent = "Hover cell for details";
            }
            container.appendChild(header);
            container.appendChild(exprs);
            detail.replaceChild(container, detail.lastElementChild);
        };
        const seqDomainOf = (sortedData) => {
            const hi = sortedData[0];
            const lo = sortedData[sortedData.length - 1];
            const min = (lo === null || lo === void 0 ? void 0 : lo.value) || 1;
            const max = (hi === null || hi === void 0 ? void 0 : hi.value) || 1 + ((lo === null || lo === void 0 ? void 0 : lo.value) || 1);
            return [min, max];
        };
        const scaleFillFactory = (data) => {
            // ColorBrewer's palettes are unbeatable but don't scale to arbitrary data
            // classes. If the domain is smaller than the minimum we can still use an
            // ordinal scale. If it is larger than the max we fall back to a sequential
            // scale with interpolation, made specifically for this short-coming.
            const ordinalDomain = [...new Set(data.map(d => d.value))];
            const domainSize = Math.max(ordinalDomain.length, 3);
            if (domainSize >= 10) {
                // Interpolated red scales better than interpolated orange. Ordinal
                // orange is more distinct than ordinal red.
                return d3.scaleSequential(d3.interpolateReds).domain(seqDomainOf(data));
            }
            ordinalDomain.sort(d3.ascending);
            return d3
                .scaleOrdinal(d3.schemeOranges[domainSize])
                .domain(ordinalDomain);
        };
        const compareCellDesc = (a, b) => b.value - a.value;
        const repositionX = (d) => xScale(d.m) || null;
        const repositionY = (d) => yScale(d.h) || null;
        const draw = (data) => {
            data.sort(compareCellDesc);
            const scaleFill = scaleFillFactory(data);
            const fillCell = (c) => scaleFill(c.value);
            const cells = svg
                .selectAll(".cell")
                .data(data, (d) => d.key)
                .style("fill", fillCell);
            cells
                .enter()
                .append("rect")
                .attr("class", "cell")
                .attr("x", repositionX)
                .attr("y", repositionY)
                .attr("width", xScale.bandwidth())
                .attr("height", yScale.bandwidth())
                .style("fill", fillCell)
                .on("mouseover", mouseover);
            cells.exit().remove();
            summarize(data);
        };
        const compareContentionHotSpotAsc = (a, b) => {
            if (a.key < b.key) {
                return -1;
            }
            if (a.key > b.key) {
                return 1;
            }
            return 0;
        };
        const summarize = (data) => {
            // GROUP BY VALUE
            // ORDER BY VALUE DESC
            // LIMIT 5
            const take = 5;
            const byValue = {};
            const mostContention = [];
            for (const d of data) {
                if (mostContention.length >= take) {
                    break;
                }
                const idx = d.value;
                let arr = byValue[idx];
                if (!arr) {
                    arr = byValue[idx] = [];
                    mostContention.push(arr);
                }
                arr.push(d);
            }
            const container = document.createElement("ul");
            for (const contention of mostContention) {
                contention.sort(compareContentionHotSpotAsc);
                const first = contention[0];
                if (!first) {
                    throw new RangeError("contention");
                }
                const keys = [];
                const onlySomeKeys = contention.slice(0, 4);
                for (const d of onlySomeKeys) {
                    keys.push(d.key);
                }
                if (onlySomeKeys.length < contention.length) {
                    keys.push("&hellip;");
                }
                const li = document.createElement("li");
                li.innerHTML = `${first.value} event${first.value === 1 ? "" : "s"} at ${keys.join(", ")}\n`;
                container.appendChild(li);
            }
            summary.replaceChild(container, summary.lastElementChild);
        };
        const convertRow = (rawRow, _index, _columns) => {
            if (!rawRow.key)
                return null;
            if (!rawRow.h)
                return null;
            if (!rawRow.m)
                return null;
            if (!rawRow.count)
                return null;
            if (!rawRow.expressions)
                return null;
            return {
                key: rawRow.key,
                h: +rawRow.h,
                m: +rawRow.m,
                value: +rawRow.count,
                meta: rawRow.expressions,
            };
        };
        const reportErrors = (errs) => {
            const dl = document.createElement("dl");
            for (const [value, message] of errs) {
                const cd = document.createElement("code");
                cd.textContent = value;
                const dt = document.createElement("dt");
                dt.appendChild(cd);
                const dd = document.createElement("dd");
                dd.innerText = message;
                dl.appendChild(dt);
                dl.appendChild(dd);
            }
            errors.replaceChild(dl, errors.lastElementChild);
            show(errors);
            draw([]);
        };
        const handleError = (e) => {
            if (e instanceof JsonError) {
                const errs = [];
                const message = JSON.parse(e.message);
                if (message.date) {
                    dateField.classList.add("has-error");
                    errs.push([message.date.value, message.date.msg]);
                }
                if (message.expressions) {
                    expressionsField.classList.add("has-error");
                    for (const err of message.expressions) {
                        errs.push([err.expr, err.msg]);
                    }
                }
                reportErrors(errs);
            }
            else {
                console.log(e);
                alert(e.message);
            }
        };
        const disableInteractivity = () => {
            submit.disabled = true;
            const pleasewait = submit.nextElementSibling;
            show(pleasewait);
        };
        const restoreInteractivity = () => {
            submit.disabled = false;
            const pleasewait = submit.nextElementSibling;
            hide(pleasewait);
        };
        const load = () => {
            disableInteractivity();
            setDetail(null);
            // Microsoft/TypeScript#30584
            const body = new URLSearchParams(new FormData(form));
            fetch("/evaluate", {
                method: "POST",
                body: body,
            })
                .then((response) => __awaiter(void 0, void 0, void 0, function* () {
                const text = yield response.text();
                if (response.ok) {
                    return d3.csvParse(text, convertRow);
                }
                if (text.startsWith("{")) {
                    throw new JsonError(text);
                }
                throw new Error(text);
            }))
                .then(draw)
                .catch(handleError)
                .finally(restoreInteractivity);
        };
        const repopulateFormWith = (params) => {
            form.expressions.value = params.get("expressions") || null;
            isInputValid();
        };
        const onpopstate = (e) => {
            const state = e.state;
            if (!state) {
                return;
            }
            repopulateFormWith(state);
            load();
            e.stopPropagation();
        };
        window.addEventListener("popstate", onpopstate);
        const isInputValid = () => {
            hide(errors);
            dateField.classList.remove("has-error");
            expressionsField.classList.remove("has-error");
            const evalDate = dateField.value.toLowerCase() || "today";
            const evalDatePattern = /^(?:today|\d{4}-\d\d-\d\d)$/;
            if (!evalDatePattern.test(evalDate)) {
                dateField.classList.add("has-error");
                reportErrors([[dateField.value, `Expected "today" or ISO 8601 date: YYYY-MM-DD.`]]);
                return false;
            }
            if (evalDate !== "today") {
                const evalYear = parseInt(evalDate.substr(0, 4));
                if (evalYear < 1970) {
                    dateField.classList.add("has-error");
                    reportErrors([[dateField.value, `Must be 1970 or later, was ${evalYear}.`]]);
                    return false;
                }
                const thisYear = new Date().getUTCFullYear();
                const diff = evalYear - thisYear;
                if (diff > 100) {
                    dateField.classList.add("has-error");
                    reportErrors([[dateField.value, `Must not be later than 100 years of this year, was ${diff}.`]]);
                    return false;
                }
            }
            // Empty input is no-op.
            if (!expressionsField.value) {
                return false;
            }
            return true;
        };
        const submitForm = (e) => {
            e.preventDefault();
            e.stopPropagation();
            disableInteractivity();
            if (!isInputValid()) {
                // If input switched from non-empty to empty, make sure to update the
                // URL; but leave out the query parameters because empty parameters
                // looks clumsy. History API can't navigate to an empty URL (then it
                // helpfully defaults to the current URL, which is the one we're trying
                // to change) but it can navigate to "?" and "/". If empty -> empty,
                // do nothing.
                if (location.search) {
                    const emptyState = new Map();
                    history.pushState(emptyState, "", "/");
                }
                setTimeout(restoreInteractivity, 20);
                return;
            }
            // We don't need endless identical history states.
            const params = new URLSearchParams(new FormData(form));
            const newSearch = "?" + params;
            if (location.search !== newSearch) {
                history.pushState(new Map(params), newSearch, newSearch);
            }
            load();
        };
        submit.addEventListener("click", submitForm);
        const initState = new Map(new URLSearchParams(location.search));
        history.replaceState(initState, "initial");
        repopulateFormWith(initState);
        submit.click();
    });
    //# sourceMappingURL=bundle.js.map
    'marker:resolver';

    function get_define(name) {
        if (defines[name]) {
            return defines[name];
        }
        else if (defines[name + '/index']) {
            return defines[name + '/index'];
        }
        else {
            const dependencies = ['exports'];
            const factory = (exports) => {
                try {
                    Object.defineProperty(exports, "__cjsModule", { value: true });
                    Object.defineProperty(exports, "default", { value: require(name) });
                }
                catch (_a) {
                    throw Error(['module "', name, '" not found.'].join(''));
                }
            };
            return { dependencies, factory };
        }
    }
    const instances = {};
    function resolve(name) {
        if (instances[name]) {
            return instances[name];
        }
        if (name === 'exports') {
            return {};
        }
        const define = get_define(name);
        instances[name] = {};
        const dependencies = define.dependencies.map(name => resolve(name));
        define.factory(...dependencies);
        const exports = dependencies[define.dependencies.indexOf('exports')];
        instances[name] = (exports['__cjsModule']) ? exports.default : exports;
        return instances[name];
    }
    if (entry[0] !== null) {
        return resolve(entry[0]);
    }
})();