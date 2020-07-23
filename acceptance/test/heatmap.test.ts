Feature("Heat map");

Before((I, home: home) => {
    I.amOnPage(home.url);
})

Scenario("draws cell for each active minute of day", (I, home: home) => {
    const everyMinute = ["0 * * * * ?"];
    home.evaluateExpressions(everyMinute);
    I.seeNumberOfVisibleElements(home.cell, 60 * 24);

    const singleMinute = ["0 0 0 * * ?"];
    home.evaluateExpressions(singleMinute);
    I.seeNumberOfVisibleElements(home.cell, 1);
});

Scenario("reports expression input errors", (I, home: home) => {
    home.evaluateExpressions([
            "0 * * ? * SUN",
            "boo",
        ],
        "2020-07-12");
    I.dontSeeElement(home.cell);
    I.see("Input errors");
    I.see("boo");
    I.dontSee("SUN");
});

Scenario("reports date input errors", (I, home: home) => {
    const somePattern = "0 * * * * ?";
    const invalidDate =  "bah";
    home.evaluateExpressions([somePattern], invalidDate);
    I.dontSeeElement(home.cell);
    I.see("Input errors");
    I.see(invalidDate);
    I.dontSee(somePattern);
});

Scenario("draws schedule for specific date", (I, home: home) => {
    // Pick 2 patterns that produce different ticks on 2 specific dates, then
    // eval the patterns for those dates and check the number of ticks.

    const patterns = [
        "0 0 0 ? * SUN",
        "0 1,2 0 ? * MON",
    ];

    home.evaluateExpressions(patterns, "2020-07-12");
    I.seeNumberOfVisibleElements(home.cell, 1);

    home.evaluateExpressions(patterns, "2020-07-13");
    I.seeNumberOfVisibleElements(home.cell, 2);
});

Scenario("updates summary on render", (I, home: home) => {
    home.evaluateExpressions([
            "0 * * * * ?",
            "0 1 * * * ?",
        ]);
    I.waitForText("2 events at 00:01, 01:01, 02:01, 03:01, \u{2026}");
    I.waitForText("1 event at 00:00, 00:02, 00:03, 00:04, \u{2026}");
});

Scenario("updates detail section when hovering over cell", (I, home: home) => {
    home.evaluateExpressions(["0 * * * * ?"]);
    I.see(home.detailSectionTitle, home.detailSection);
    I.moveCursorTo("rect:first-of-type");
    I.dontSee(home.detailSectionTitle, home.detailSection);
    // "n events at x:y", but order of <rect>s is unpredictable so we don't
    // know what the time is.
    I.see("1 event at ", home.detailSection);
});
