import { NICEBusMap, addRoute } from './modules/leaflet.js';
import { RouteDropdown } from './modules/widgets.js'

const default_route = "n25";

document.addEventListener("DOMContentLoaded", async (event) => {
    const map = new NICEBusMap('myMap', 40.740562, -73.620111, 11, route_lines);
    let layer = await addRoute(map, default_route);
    layer.startPeriodicUpdates();
    const dropdown = new RouteDropdown();

    dropdown.select.addEventListener('change', async (event) => {
        layer.clearLayers();
        layer.stopPeriodicUpdates();
        layer = await addRoute(map, event.target.value);
        layer.startPeriodicUpdates();
    });
})

