const { I } = inject();

export = {
    title: "Crontention | About",
    url: "/about.html",
    navigateToHome: () => {
        I.clickLink("Crontention");
    },
    navigateToUsageExample: () => {
        I.clickLink("See an example");
    },
};
