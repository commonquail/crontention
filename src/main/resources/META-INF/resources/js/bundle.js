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
        const renderedExpressions = document.getElementById("rendered-listing");
        const form = document.getElementById("theform");
        const submit = document.getElementById("submit");
        const edit = document.getElementById("edit");
        const dateField = document.getElementById("date");
        const expressionsField = document.getElementById("expressions");
        const summary = document.getElementById("summary");
        const detail = document.getElementById("detail");
        const tzActive = document.getElementById("tz-active");
        const switchTz = document.getElementById("switch-tz");
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
        const dateFormatTickFormat = (dtf, f) => {
            return (n) => {
                const dv = dateField.value || "today";
                let d;
                if (dv === "today") {
                    d = new Date();
                }
                else {
                    // User input. Value may be nonsense -- if we can't parse it,
                    // default to "now".
                    const tryParseUserDate = Date.parse(`${dv}T00:00:00Z`);
                    d = new Date(tryParseUserDate || Date.now());
                }
                f(d, n);
                const res = dtf.format(d);
                // "2-digit" format doesn't always work. Use "numeric" and re-format as
                // number with leading zero. Ugh.
                // https://stackoverflow.com/a/33402359/482758
                return scaleFormat(parseInt(res));
            };
        };
        const tickFormatX = (tz) => {
            // Microsoft/TypeScript#37326: Intl missing hourCycle
            const intlOpts = { timeZone: tz, minute: "numeric", hourCycle: "h23" };
            const dtf = new Intl.DateTimeFormat("default", intlOpts);
            const f = (d, n) => d.setUTCMinutes(n);
            return dateFormatTickFormat(dtf, f);
        };
        const tickFormatY = (tz) => {
            // Microsoft/TypeScript#37326: Intl missing hourCycle
            const intlOpts = { timeZone: tz, hour: "numeric", hourCycle: "h23" };
            const dtf = new Intl.DateTimeFormat("default", intlOpts);
            const f = (d, n) => d.setUTCHours(n);
            return dateFormatTickFormat(dtf, f);
        };
        const xAxisGenerator = d3.axisTop(xScale);
        xAxisGenerator.tickValues(xScale.domain().filter((_, i) => !(i % 5)));
        xAxisGenerator.tickFormat(tickFormatX("UTC"));
        const yAxisGenerator = d3.axisLeft(yScale);
        yAxisGenerator.tickFormat(tickFormatY("UTC"));
        const xAxis = svg.append("g")
            .call(xAxisGenerator)
            .call(g => g
            .append("text")
            .attr("x", 10 + (width / 2))
            .attr("y", 10 - margin.top)
            .attr("fill", "currentColor")
            .attr("text-anchor", "middle")
            .text("Minute"));
        const yAxis = svg.append("g")
            .call(yAxisGenerator)
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
            if (detailLock.frozen)
                return;
            setDetail(d);
        };
        const onClickCell = function (d) {
            detailLock.freezeOrUnfreeze(this);
            setDetail(d);
        };
        const newExpressionTextElement = (html) => {
            const code = document.createElement("code");
            code.innerHTML = html.replace(/</g, "&lt;").replace(/  /g, "&nbsp; ");
            return code;
        };
        const setDetail = (d) => {
            const exprs = document.createElement("ul");
            const container = document.createElement("div");
            const header = document.createElement("h3");
            if (d) {
                for (const expr of d.exprs) {
                    const code = newExpressionTextElement(expr);
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
        const compareCellDatumDesc = (a, b) => b.value - a.value;
        const repositionX = (d) => xScale(d.m) || null;
        const repositionY = (d) => yScale(d.h) || null;
        const expressionsIn = (exprs) => exprs.split(/[\n\r]/g).filter((e) => !!e);
        const renderExpressions = () => {
            const container = document.createElement("ul");
            container.classList.add("rendered-list");
            for (const expr of expressionsIn(expressionsField.value)) {
                const code = newExpressionTextElement(expr);
                code.dataset.expr = expr;
                code.classList.add("rendered-entry");
                const block = document.createElement("li");
                block.appendChild(code);
                container.appendChild(block);
            }
            const placeholder = renderedExpressions.firstElementChild;
            renderedExpressions.replaceChild(container, placeholder);
        };
        const cacheCellByExpression = (d, index, cells) => {
            const cell = cells[index];
            for (const expr of d.exprs) {
                let cells = cellsForExpression[expr];
                if (!cells) {
                    cells = cellsForExpression[expr] = [];
                }
                cells.push(cell);
            }
        };
        const draw = (data) => {
            renderExpressions();
            hide(form);
            show(renderedExpressions);
            xAxis.call(xAxisGenerator);
            yAxis.call(yAxisGenerator);
            data.sort(compareCellDatumDesc);
            const scaleFill = scaleFillFactory(data);
            const fillCell = (d) => scaleFill(d.value);
            detailLock.unfreeze();
            const cells = svg
                .selectAll(".cell")
                .data(data, (d) => d.key)
                .attr("class", "cell")
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
                .on("click", onClickCell)
                .on("mouseover", mouseover);
            cells.exit().remove();
            cellsForExpression = {};
            svg.selectAll(".cell").each(cacheCellByExpression);
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
                exprs: expressionsIn(rawRow.expressions),
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
            hide(renderedExpressions);
            show(form);
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
            form.date.value = params.get("date") || null;
            setAxesTimeZoneTo("UTC");
            isInputValid();
        };
        const setAxesTimeZoneTo = (newTimeZone) => {
            const localeTz = new Intl.DateTimeFormat().resolvedOptions().timeZone;
            const alternativeTimeZone = newTimeZone === "UTC" ? localeTz : "UTC";
            // "data-tz" holds the time zone to activate when we click the "switch"
            // button. The click handler passes in the value of "data-tz" when the
            // clicked element has one such.
            switchTz.dataset.tz = alternativeTimeZone;
            switchTz.textContent = `Switch to ${alternativeTimeZone}`;
            tzActive.textContent = newTimeZone;
            yAxisGenerator.tickFormat(tickFormatY(newTimeZone));
            yAxis.call(yAxisGenerator);
            xAxisGenerator.tickFormat(tickFormatX(newTimeZone));
            xAxis.call(xAxisGenerator);
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
        const editForm = (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetActiveHighlight();
            show(form);
            hide(renderedExpressions);
        };
        const resetActiveHighlight = () => {
            const turnOff = (el) => el.classList.remove("highlight");
            document.querySelectorAll(".highlight").forEach(turnOff);
        };
        const docClick = (e) => {
            const clicked = e.target;
            if (!clicked) {
                return;
            }
            if (clicked instanceof HTMLElement) {
                if (clicked.dataset.expr) {
                    const shouldTurnOn = !clicked.classList.contains("highlight");
                    const turnOn = (el) => el.classList.add("highlight");
                    // Reset, in case we have an active selection...
                    resetActiveHighlight();
                    // ... then apply a different selection, unless the user tried to
                    // turn off the active selection.
                    if (shouldTurnOn) {
                        cellsForExpression[clicked.dataset.expr].forEach(turnOn);
                        turnOn(clicked);
                    }
                }
                else if (clicked.dataset.tz) {
                    setAxesTimeZoneTo(clicked.dataset.tz);
                }
            }
        };
        class DetailLock {
            get frozen() {
                return this.frozenCell !== undefined;
            }
            unfreeze() {
                var _a;
                (_a = this.frozenCell) === null || _a === void 0 ? void 0 : _a.classList.remove(DetailLock.s);
                this.frozenCell = undefined;
            }
            freezeOrUnfreeze(cell) {
                const freezeOther = cell !== this.frozenCell;
                // Whether requested to unfreeze self or freeze other, we always have
                // to unfreeze self.
                this.unfreeze();
                if (freezeOther) {
                    cell.classList.add(DetailLock.s);
                    this.frozenCell = cell;
                }
            }
        }
        DetailLock.s = "lock";
        submit.addEventListener("click", submitForm);
        edit.addEventListener("click", editForm);
        document.addEventListener("click", docClick);
        let cellsForExpression = {};
        const detailLock = new DetailLock();
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