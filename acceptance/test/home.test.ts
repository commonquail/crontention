Feature("Home page");

Before((I, home: home) => {
    I.amOnPage(home.url);
})

Scenario("links to about page", (I, about: about, home: home) => {
    home.navigateToAbout();
    I.seeCurrentUrlEquals(about.url);
});
