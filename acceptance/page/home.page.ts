const { I } = inject();

export = {
    title: "Crontention",
    url: "/",
    detailSection: "#detail",
    detailSectionTitle: "Hover cell for details",
    cell: ".cell",
    lock: ".lock",
    highlight: ".highlight",
    form: {
        id: "theform"
    },
    renderedListing: "#rendered-listing",
    renderedEntry: ".rendered-entry",
    fields: {
        expressions: "#expressions",
        date: "#date",
    },
    submitButton: {
        id: "submit"
    },
    editButton: {
        id: "edit"
    },
    switchTimeZoneButton: {
        id: "switch-tz"
    },
    navigateToAbout: () => {
        I.clickLink("What is this?");
    },
    evaluateExpressions: function(expr: string[], date?: string) {
        I.fillField(this.fields.expressions, expr.join("\n"));
        I.fillField(this.fields.date, date || "today");
        I.click(this.submitButton);
    },
    clickRenderedListing: function(n?: number) {
        const num: number = n || 1;
        const sel = `${this.renderedListing} li:nth-child(${num}) ${this.renderedEntry}`;
        I.click(sel);
    },
    clickEdit: function() {
        I.click(this.editButton);
    },
    clickSwitchTimeZone: function() {
        I.click(this.switchTimeZoneButton);
    },
    getCellClasses: async function(): Promise<string[]> {
        return I.grabAttributeFrom(this.cell, "class") as any as string[];
    },
    getAxesTicks: async function(): Promise<string[]> {
        // grabTextFrom doesn't work because it relies on "innerText", which does
        // not exist on SVG elements. Fortunately this selector yields a
        // perfect result.
        return I.grabHTMLFrom(".tick text") as any as string[];
    },
    nthCell: function(n: number): string {
        return `${this.cell}:nth-of-type(${n})`;
    }
};
