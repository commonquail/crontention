Feature("Home page");

Before((I, home: home) => {
    I.amOnPage(home.url);
})

Scenario("loads default page", (I, home: home) => {
    I.seeInTitle(home.title);
    I.seeInField(home.fields.expressions, "");
    I.seeAttributesOnElements(home.fields.date, { placeholder: "today" });
    I.see("Heat map");
    I.see("Most contention");
    I.see("Hover cell for details");
    I.dontSeeElement(home.cell);
    I.dontSeeElement(home.renderedListing);
});

Scenario("links to about page", (I, about: about, home: home) => {
    home.navigateToAbout();
    I.seeCurrentUrlEquals(about.url);
});
