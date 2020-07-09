const { I } = inject();

export = {
    url: "/",
    navigateToAbout: () => {
        I.clickLink("What is this?");
    },
};
