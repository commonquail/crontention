Feature("Home page");

Before(({I, home}) => {
    I.amOnPage(home.url);
})

Scenario("loads default page", ({I, home}) => {
    I.seeInTitle(home.title);
    I.seeInField(home.fields.expressions, "");
    I.seeAttributesOnElements(home.fields.date, { placeholder: "today" });
    I.see("Heat map");
    I.see("Most contention");
    I.see("Hover cell for details");
    I.see("Displaying axes in time zone UTC");
    I.dontSeeElement(home.cell);
    I.dontSeeElement(home.renderedListing);
});

Scenario("links to about page", ({I, about, home}) => {
    home.navigateToAbout();
    I.seeCurrentUrlEquals(about.url);
});
