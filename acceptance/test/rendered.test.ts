import * as assert from "assert";

Feature("Rendered listing");

Before(({I, home}) => {
    I.amOnPage(home.url);
})

Scenario("click evaluate to replace form", async ({I, home}) => {
    I.seeElement(home.form);

    const oneCell = "0 0 0 * * ?";
    home.evaluateExpressions([oneCell]);

    // After input evaluation, the form disappears.
    I.dontSeeElement(home.form);

    // Instead, the rendered listing appears, with no highlights activated.
    I.seeElement(home.renderedListing);
    I.seeNumberOfVisibleElements(home.renderedEntry, 1);
    I.seeElement(home.editButton);
    I.dontSeeElement(home.highlight);
});

Scenario("click edit to restore form", async ({I, home}) => {
    const oneCell = "0 0 0 * * ?";
    home.evaluateExpressions([oneCell]);

    I.dontSeeElement(home.form);

    home.clickEdit();

    I.seeElement(home.form);

    I.dontSeeElement(home.renderedListing);
    // Puppeteer broke recursive visibility in codeceptjs/CodeceptJS#2971.
    // Asset on the invisible ancestor instead.
    //I.dontSeeElement(home.editButton);
    I.dontSeeElement("#rendered-listing");
});

Scenario("click entry to enable entry and cell highlighting", async ({I, home}) => {
    const oneCell = "0 0 0 * * ?";
    home.evaluateExpressions([oneCell]);

    I.dontSeeElement(home.highlight);

    home.clickRenderedListing();

    I.seeElement(`${home.highlight}${home.renderedEntry}`);
    I.seeElement(`${home.highlight}${home.cell}`);
});

Scenario("click enabled entry to disable highlighting", async ({I, home}) => {
    const oneCell = "0 0 0 * * ?";
    home.evaluateExpressions([oneCell]);

    I.dontSeeElement(home.highlight);

    home.clickRenderedListing();
    home.clickRenderedListing();

    I.dontSeeElement(home.highlight);
});

Scenario("only enabled entry cells are highlighted", async ({I, home}) => {
    // Two patterns with different cell counts, so we can identify them.
    const oneCell = "0 0 0 * * ?";
    const twoCells = "0 0 1,2 * * ?";

    home.evaluateExpressions([oneCell, twoCells]);

    home.clickRenderedListing(1);

    const classValues = await home.getCellClasses();
    assert.equal(classValues.length, 3);

    const oneHighlighted = classValues.filter((s) => /.highlight/.test(s));
    assert.equal(oneHighlighted.length, 1);

    const twoNotHighlighted = classValues.filter((s) => !/.highlight/.test(s));
    assert.equal(twoNotHighlighted.length, 2);
});

Scenario("switches active highlight from enabled entry to newly clicked entry", async ({I, home}) => {
    home.evaluateExpressions([
        "0 0 0 * * ?",
        "0 0 1 * * ?",
    ]);

    // Although we don't control the order of cells in the DOM, selectors
    // preserve the current order by specification. Since highlighting
    // manipulates CSS classes we can compare the classes of all cells, in
    // order, from before a switch to after a switch -- they should differ.

    // Highlight and record state.
    home.clickRenderedListing(1);
    const classValuesBefore = await home.getCellClasses();

    // Switch highlight and record state again.
    home.clickRenderedListing(2);
    const classValuesAfter = await home.getCellClasses();

    // State has changed.
    assert.notEqual(classValuesBefore, classValuesAfter);

    // Switching doesn't just disable all highlighting.
    I.seeElement(`${home.highlight}${home.cell}`);
});

Scenario("click edit after highlight resets highlight", async ({I, home}) => {
    const oneCell = "0 0 0 * * ?";
    home.evaluateExpressions([oneCell]);

    home.clickRenderedListing(1);

    I.seeElement(home.highlight);

    home.clickEdit();

    I.dontSeeElement(home.highlight);
});

Scenario("render entries even when no cells", async ({I, home}) => {
    const zeroCells = "1 * * ? * * 2000";
    home.evaluateExpressions([zeroCells]);

    I.seeElement(home.renderedEntry);
});
