import * as d3 from "d3";
import { DSVRowString } from "d3-dsv";

const cellSize = 18;
const margin = {top: 30, right: 25, bottom: 30, left: 40};
const width = (cellSize * 60);
const height = (cellSize * 24);

const errors = document.getElementById("errors") as HTMLElement;
const form = document.getElementById("theform") as HTMLFormElement;
const submit = document.getElementById("submit") as HTMLButtonElement;
const dateField = document.getElementById("date") as HTMLInputElement;
const expressionsField = document.getElementById("expressions") as HTMLInputElement;
const summary = document.getElementById("summary") as HTMLElement;
const detail = document.getElementById("detail") as HTMLElement;

const svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleBand<number>()
    .range([0, width])
    .domain([... Array(60).keys()])
    .padding(0.05);

const yScale = d3.scaleBand<number>()
    .range([height, 0])
    .domain([... Array(24).keys()].reverse())
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
    constructor(...params: any) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, JsonError);
        }

        this.name = 'JsonError';
    }
}

interface Cell {
    readonly key: string;
    readonly h: number;
    readonly m: number;
    readonly value: number;
    readonly meta: string;
}

const mouseover = function (this: SVGGElement, d: Cell) {
    d3.select(this).style("stroke", "black");

    const exprs = document.createElement("ul");
    for (const expr of d.meta.split(/\n/)) {
        const code = document.createElement("code");
        code.textContent = expr;
        const li = document.createElement("li");
        li.appendChild(code);
        exprs.appendChild(li);
    }
    const container = document.createElement("div");
    const header = document.createElement("h3");
    header.textContent = `${d.value} event${d.value === 1 ? "" : "s"} at ${d.key}:`;
    container.appendChild(header);
    container.appendChild(exprs);
    detail.replaceChild(container, detail.lastElementChild!);
}

const mouseleave = function (this: SVGGElement, _: Cell) {
    d3.select(this).style("stroke", "none");
}

interface SeqDomainFactory {
    (sortedData: readonly (Cell | undefined)[]): [number, number];
}

const seqDomainOf: SeqDomainFactory = (sortedData) => {
    const hi = sortedData[0];
    const lo = sortedData[sortedData.length - 1];

    const min = lo?.value || 1;
    const max = hi?.value || 1 + (lo?.value || 1);

    return [min, max];
}

interface ScaleFillFactory {
    (data: readonly Cell[]):
        d3.ScaleOrdinal<number, string> |
        d3.ScaleSequential<string>;
}

const scaleFillFactory: ScaleFillFactory = (data) => {
    // ColorBrewer's palettes are unbeatable but don't scale to arbitrary data
    // classes. If the domain is smaller than the minimum we can still use an
    // ordinal scale. If it is larger than the max we fall back to a sequential
    // scale with interpolation, made specifically for this short-coming.
    const ordinalDomain = [... new Set(data.map(d => d.value))];
    const domainSize = Math.max(ordinalDomain.length, 3);
    if (domainSize >= 10) {
        // Interpolated red scales better than interpolated orange. Ordinal
        // orange is more distinct than ordinal red.
        return d3.scaleSequential(d3.interpolateReds).domain(seqDomainOf(data))
    }
    ordinalDomain.sort(d3.ascending);
    return d3
        .scaleOrdinal<number, string>(d3.schemeOranges[domainSize])
        .domain(ordinalDomain);
}

const compareCellDesc = (a: Cell, b: Cell) => b.value - a.value;

interface RepositionScale {
    (c: Cell): number | null;
}

const repositionX: RepositionScale = (d) => xScale(d.m) || null;
const repositionY: RepositionScale = (d) => yScale(d.h) || null;

const draw = (data: Cell[]) => {
    data.sort(compareCellDesc);

    const scaleFill = scaleFillFactory(data);
    const fillCell = (c: Cell) => scaleFill(c.value);

    const cells = svg
        .selectAll<SVGGElement, Cell>(".cell")
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
        .on("mouseover", mouseover)
        .on("mouseleave", mouseleave);

    cells.exit().remove();

    summarize(data);
}

const summarize = (data: readonly Cell[]) => {
    interface GroupByValue {
        [index: number]: Cell[]
    }

    // GROUP BY VALUE
    // ORDER BY VALUE DESC
    // LIMIT 5
    const take = 5;
    const byValue: GroupByValue = {};
    const mostContention: Cell[][] = [];
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
        const first = contention[0];
        if (!first) {
            throw new RangeError("contention");
        }
        const keys: string[] = [];
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
    summary.replaceChild(container, summary.lastElementChild!);
}

type ParsedRow = Cell;
type Columns = "key" | "h" | "m" | "count" | "expressions";
type ConvertRow = (rawRow: DSVRowString<Columns>, index: number, columns: Columns[]) => ParsedRow | null;

const convertRow: ConvertRow = (rawRow, _index, _columns) => {
    if (!rawRow.key) return null;
    if (!rawRow.h) return null;
    if (!rawRow.m) return null;
    if (!rawRow.count) return null;
    if (!rawRow.expressions) return null;
    return {
        key: rawRow.key,
        h: +rawRow.h,
        m: +rawRow.m,
        value: +rawRow.count,
        meta: rawRow.expressions,
    };
}

interface CommonErrorDetail {
    readonly msg: string;
}

interface ExprErrorDetail extends CommonErrorDetail {
    readonly expr: string;
}

interface DateErrorDetail extends CommonErrorDetail {
    readonly value: string;
}

interface CustomError {
    readonly expressions?: ExprErrorDetail[];
    readonly date?: DateErrorDetail;
}

type ErrorFeedback = [string, string][];

const reportErrors = (errs: ErrorFeedback) => {
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
    errors.replaceChild(dl, errors.lastElementChild!);
    errors.hidden = false;
}

const handleError = (e: Error) => {
    if (e instanceof JsonError) {
        const errs: ErrorFeedback = [];
        const message = JSON.parse(e.message) as CustomError;
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
    } else {
        console.log(e);
        alert(e.message);
    }
}

const disableInteractivity = () => {
    submit.disabled = true;
    const pleasewait = submit.nextElementSibling as HTMLElement;
    pleasewait.hidden = false;
};

const restoreInteractivity = () => {
    submit.disabled = false;
    const pleasewait = submit.nextElementSibling as HTMLElement;
    pleasewait.hidden = true;
};

const load = () => {
    disableInteractivity();

    // Microsoft/TypeScript#30584
    const body = new URLSearchParams(new FormData(form) as any);
    fetch("/evaluate", {
        method: "POST",
        body: body,
    })
        .then(async (response) => {
            const text = await response.text();
            if (response.ok) {
                return d3.csvParse<ParsedRow, Columns>(text, convertRow);
            }
            if (text.startsWith("{")) {
                throw new JsonError(text);
            }
            throw new Error(text);
        })
        .then(draw)
        .catch(handleError)
        .finally(restoreInteractivity);
}

type HistoryState = Map<string, string>;
const repopulateFormWith = (params: HistoryState) => {
    form.expressions.value = params.get("expressions") || null;
    isInputValid();
}

const onpopstate = (e: PopStateEvent): void => {
    const state: null | HistoryState = e.state;
    if (!state) {
        return;
    }

    repopulateFormWith(state);
    load();

    e.stopPropagation();
}

window.addEventListener("popstate", onpopstate);

const isInputValid: () => boolean = () => {
    errors.hidden = true;
    dateField.classList.remove("has-error");
    expressionsField.classList.remove("has-error");

    const evalDate = dateField.value.toLowerCase() || "today";
    const evalDatePattern = /^(?:today|\d{4}-\d\d-\d\d)$/;
    if (!evalDatePattern.test(evalDate)) {
        dateField.classList.add("has-error");
        reportErrors([[dateField.value, `Expected "today" or ISO 8601 date: YYYY-MM-DD.`]])
        return false;
    }
    if (evalDate !== "today") {
        const evalYear = parseInt(evalDate.substr(0, 4));
        if (evalYear < 1970) {
            dateField.classList.add("has-error");
            reportErrors([[dateField.value, `Must be 1970 or later, was ${evalYear}.`]])
            return false;
        }
        const thisYear = new Date().getUTCFullYear();
        const diff = evalYear - thisYear;
        if (diff > 100) {
            dateField.classList.add("has-error");
            reportErrors([[dateField.value, `Must not be later than 100 years of this year, was ${diff}.`]])
            return false;
        }
    }
    // Empty input is no-op.
    if (!expressionsField.value) {
        return false;
    }
    return true;
}

const submitForm = (e: Event) => {
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
            const emptyState: HistoryState = new Map();
            history.pushState(emptyState, "", "/");
        }
        setTimeout(restoreInteractivity, 20);
        return;
    }

    const params = new URLSearchParams(new FormData(form) as any);
    const newSearch = "?" + params;
    history.pushState(new Map(params), newSearch, newSearch);
    load();
}

submit.addEventListener("click", submitForm);

const initState: HistoryState = new Map(new URLSearchParams(location.search));
history.replaceState(initState, "initial");
repopulateFormWith(initState);

submit.click()
