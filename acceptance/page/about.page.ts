const { I } = inject();

export = {
    url: "/about.html",
    navigateToHome: () => {
        I.clickLink("Crontention");
    },
};
