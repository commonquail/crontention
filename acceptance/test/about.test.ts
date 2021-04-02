Feature("About page");

Before(({I, about}) => {
    I.amOnPage(about.url);
})

Scenario("has basic user information", ({I, about}) => {
    I.seeInTitle(about.title)
    I.see("Usage");
    I.see("license");
    I.see("syntax");
});

Scenario("has usage example", ({I, about}) => {
    about.navigateToUsageExample();
    I.waitForText("Heat map");
    I.see(" events at ");
});

Scenario("links to home", ({I, about, home}) => {
    about.navigateToHome();
    I.seeCurrentUrlEquals(home.url);
});
