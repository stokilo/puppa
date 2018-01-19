testWikiSearchUnknown = async function (config) {
    // assert that historical event does not exists and link to create event is displayed
    await elem("#searchInput", elem => elem.val('KOSLAOSFKFOASKFFS'));
    await elem("input[name=go]", elem => elem.click());
    await elem("p.mw-search-createlink", () => true);
};

testWikiSearchBattle = async function (config) {
    // assert historical event
    await elem("#searchInput", elem => elem.val('Battle of Passchendaele'));
    await elem("input[name=go]", elem => elem.click());
    await felem(() => elementByContent('h1.firstHeading', 'Battle of Passchendaele'), heading => heading.click());
};

