import * as assert from "assert";

Feature("Heat map");

Before((I, home: home) => {
    I.amOnPage(home.url);
})

Scenario("init heat map from query", async (I, home: home) => {
    I.amOnPage(home.url + "?expressions=0+2-4+1%2C3+*+*+%3F+*&date=2020-08-14")
    I.seeElement(home.renderedListing);
    I.seeNumberOfElements(home.cell, 6);
    I.see("1 event at 01:02, 01:03, 01:04, 03:02, …");

    const expressions = await I.grabValueFrom(home.fields.expressions);
    assert.equal(expressions, "0 2-4 1,3 * * ? *");
    const date = await I.grabValueFrom(home.fields.date);
    assert.equal(date, "2020-08-14");
});

Scenario("draws cell for each active minute of day", (I, home: home) => {
    const everyMinute = ["0 * * * * ?"];
    home.evaluateExpressions(everyMinute);
    I.seeNumberOfVisibleElements(home.cell, 60 * 24);

    home.clickEdit();

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

    home.clickEdit();

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
    I.moveCursorTo(home.nthCell(1));
    I.dontSee(home.detailSectionTitle, home.detailSection);
    // "n events at x:y", but order of <rect>s is unpredictable so we don't
    // know what the time is.
    I.see("1 event at ", home.detailSection);
});

Scenario("freeze unfrozen cell", async (I, home: home) => {
    // Make sure that we can trigger hover and freeze state...
    const twoCells = "0 0 0,1 * * ?";
    home.evaluateExpressions([twoCells]);

    // ... and that nothing is frozen.
    I.dontSeeElement(home.lock);

    // Doesn't matter what's in the detail section now but we need to show that
    // it changes.
    const detailInitial = await I.grabTextFrom(home.detailSection);

    // Freeze a cell; don't know which one or which one gets frozen but at least
    // the detail section changes.
    const cellToFreeze = home.nthCell(1);
    const someOtherCell = home.nthCell(2);
    I.click(cellToFreeze);
    I.seeElement(home.lock);
    const detailAfterFreeze = await I.grabTextFrom(home.detailSection);
    assert.notEqual(detailInitial, detailAfterFreeze);

    // Hover some other cell and prove the detail section really is frozen.
    I.moveCursorTo(someOtherCell);
    const detailAfterFreezeAndHover = await I.grabTextFrom(home.detailSection);
    assert.equal(detailAfterFreeze, detailAfterFreezeAndHover);
});

Scenario("unfreeze frozen cell", async (I, home: home) => {
    // Make sure that we can trigger hover and freeze state.
    const twoCells = "0 0 0,1 * * ?";
    home.evaluateExpressions([twoCells]);

    // Freeze a cell and grab a state sentinel.
    const cellToFreeze = home.nthCell(1);
    const someOtherCell = home.nthCell(2);
    I.click(cellToFreeze);
    const detailAfterFreeze = await I.grabTextFrom(home.detailSection);

    // Then unfreeze the frozen cell...
    I.click(cellToFreeze);
    // ... and prove that functionality is restored.
    I.dontSeeElement(home.lock);
    I.moveCursorTo(someOtherCell);
    const detailAfterUnfreezeAndHover = await I.grabTextFrom(home.detailSection);
    assert.notEqual(detailAfterFreeze, detailAfterUnfreezeAndHover);
});

Scenario("freeze unfrozen cell when other cell frozen", async (I, home: home) => {
    const twoCells = "0 0 0,1 * * ?";
    home.evaluateExpressions([twoCells]);

    // Freeze a cell...
    const someCell = home.nthCell(1);
    I.click(someCell);
    const detailAfterFirstFreeze = await I.grabTextFrom(home.detailSection);

    // ... then freeze another.
    const someOtherCell = home.nthCell(2);
    I.click(someOtherCell);
    const detailAfterSecondFreeze = await I.grabTextFrom(home.detailSection);

    // Still locked...
    I.seeElement(home.lock);
    // ... but now with different state.
    assert.notEqual(detailAfterFirstFreeze, detailAfterSecondFreeze);
});

Scenario("shows time axes in time zone UTC by default", async (I, home: home) => {
    const somePattern = "0 * * * * ?";
    home.evaluateExpressions([somePattern]);

    const ticks = await home.getAxesTicks();

    // Conveniently the Cartesian coordinate system origin is at index [first; last].
    // I don't know if this is by specification but it behaves consistently.
    const originX = ticks[0];
    const originY = ticks[ticks.length - 1];

    // Hours along Y, minutes along X, start-of-day in the corner, and
    // everything defaults to UTC. That means the "first" cell is midnight UTC.
    assert.equal(`${originY}:${originX}`, "00:00");
});

Scenario("switch time zone to local", async (I, home: home) => {
    const somePattern = "0 * * * * ?";
    home.evaluateExpressions([somePattern]);

    // I don't know of a way to instruct the driver to change its locale.
    // We can trigger the functionality and compare the tick orders to prove
    // they switched. That won't prove the switching itself is correct, and it
    // will fail in any UTC+0 time zone, but whatever.
    const defaultTicks = await home.getAxesTicks();
    home.clickSwitchTimeZone();
    const switchedTicks = await home.getAxesTicks();

    assert.notDeepEqual(defaultTicks, switchedTicks);
});

Scenario("switch time zone back", async (I, home: home) => {
    const somePattern = "0 * * * * ?";
    home.evaluateExpressions([somePattern]);

    const defaultTicks = await home.getAxesTicks();
    home.clickSwitchTimeZone();
    home.clickSwitchTimeZone();
    const restoredTicks = await home.getAxesTicks();

    assert.deepEqual(defaultTicks, restoredTicks);
});
