const { I } = inject();

export = {
    title: "Crontention",
    url: "/",
    detailSection: "#detail",
    detailSectionTitle: "Hover cell for details",
    cell: ".cell",
    lock: ".lock",
    fields: {
        expressions: "#expressions",
        date: "#date",
    },
    submitButton: {
        id: "submit"
    },
    navigateToAbout: () => {
        I.clickLink("What is this?");
    },
    evaluateExpressions: function(expr: string[], date?: string) {
        I.fillField(this.fields.expressions, expr.join("\n"));
        I.fillField(this.fields.date, date || "today");
        I.click(this.submitButton);
    },
};
