Feature("About page");

Before((I, about: about) => {
    I.amOnPage(about.url);
})

Scenario("links to home", (I, about: about, home: home) => {
    about.navigateToHome();
    I.seeCurrentUrlEquals(home.url);
});
