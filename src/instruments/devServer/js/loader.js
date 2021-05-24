'use strict';

const sidebar = document.getElementById('Sidebar');

const request = fetch('instruments.json');

request.then(async (response) => {
    const instruments = await response.json();

    instruments.forEach((instrument) => {
        loadInstrument(instrument);
    });
});

function loadInstrument(name) {
    const sidebarEntry = document.createElement('span');
    sidebarEntry.classList.add('SidebarItem');

    const sidebarText = document.createTextNode(name);

    sidebarEntry.append(sidebarText);

    sidebar.append(sidebarEntry);
}
