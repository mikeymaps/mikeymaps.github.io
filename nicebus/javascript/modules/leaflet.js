import { Client } from './requests.js'

// Export Classes
export class NICEBusMap extends L.map {

    constructor(id, lat, lon, zoom, geojson) {
        let default_params = {
            center: [lat, lon],
            zoom: zoom,
            zoomControl: true,
            preferCanvas: false,
            crs: L.CRS.EPSG3857
        }

        super(id, default_params);
        this.basemap_layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
        this.basemap_layer.addTo(this);
        this.init_lat = lat;
        this.init_lon = lon;
        this.init_zoom = zoom;
        this.home = this.getBounds();

        const route_lines = new BusLineLayer(geojson);
        route_lines.addTo(this);

        // const nassau_layer = new NassauCounty(nassau);
        // nassau_layer.addTo(this);

        const home = new L.Control.Home();
        this.addControl(home);

    }
}

export async function addRoute(map, route_id) {
    const route_response = await Client.getRoute(route_id.toLowerCase());
    const stops_response = await Client.getStops(route_id.toLowerCase());

    if (!route_response.hasData) {
        console.log(`${route_id} has no buses in route.`)
        return;
    }

    const layer = new RouteLayer(route_id, route_response, stops_response)
    layer.addTo(map);
    // map.flyToBounds(layer.getBounds(), {
    //     duration: 1.5
    // });
    return layer; 
}


// Helper Classes

class RouteLayer extends L.FeatureGroup {
    constructor(route_id, buses_response, stops_response) {
        const vehicles = [];
        const stops = [];

        for (const bus of buses_response.ResultData) {
            bus.route = route_id;
            const bus_marker = new VehicleMarker(bus);
            vehicles.push(bus_marker);
        }

        for (const stop of stops_response.ResultData) {
            try {
                const busStop = new BusStopMarker(stop);
                stops.push(busStop);
            } catch (e) {
                console.log(stop);
                continue;
            }
        }
        super([...vehicles, ...stops]);
        this.route_id = route_id
        this.vehicles = vehicles;

    }

    startPeriodicUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateCoordinates();
        }, 10000);
    }

    stopPeriodicUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    async updateCoordinates() {
        const new_buses_response = await Client.getRoute(this.route_id.toLowerCase());
        const updatedVehicles = new_buses_response.ResultData;
        
        // Update existing vehicle markers
        for (const updatedBus of updatedVehicles) {
            const marker = this.vehicles.find(m => m.id === parseFloat(updatedBus.vid));
            if (marker) {
                marker.setLatLng([updatedBus.lat, updatedBus.lon]);
                // marker.updateData(updatedBus);
            } else {
                console.log(`Adding ${updatedBus.vid}`)
                // Create a new marker if it does not exist
                const newMarker = new VehicleMarker(updatedBus);
                this.vehicles.push(newMarker);
                this.addLayer(newMarker);
            }
        }

        // Remove old vehicle markers
        this.vehicles = this.vehicles.filter(m => updatedVehicles.some(b => parseFloat(b.vid) === m.id));
        this.eachLayer(layer => {
            if (layer instanceof VehicleMarker && !updatedVehicles.some(b => parseFloat(b.vid) === layer.id)) {
                this.removeLayer(layer);
                console.log(`Removing ${layer}`)
            }
        });
    }
}

class BusLineLayer extends L.geoJSON {
    constructor(geojson) {
        super(geojson, {
            style: {
                color: "gray",
                width: 1
            }
        })
        this.bindPopup((layer) => {
            return layer.feature.properties.label;
        })
    }
}

class NassauCounty extends L.geoJSON {
    constructor(geojson) {
        super(geojson, {
            style: {
                color: "blue"
            }
        })
    }
}
class BusStopMarker extends L.marker {
    constructor(data) {
        const lat = parseFloat(data.lat);
        const lon = parseFloat(data.lng);
        const name = data.Display
        const id = parseFloat(data.Value)

        super([lat, lon], {
            icon: new BusStopIcon(),
            zIndexOffset: 500
        });

        this.bindPopup(`${name}<br>${id}`);
    }
}

class BusStopIcon extends L.divIcon {
    constructor(color) {
        super({
            className: "none",
            html: `<div id="bus-stop" style="background-color: brown;"</div>`
        })
    }
}

class VehicleMarker extends L.marker {
    constructor(data, icon_url) {
        const lat = parseFloat(data.lat);
        const lon = parseFloat(data.lon);
        const icon = new VehicleMarkerIcon();

        super([lat, lon], {
            icon: icon,
            zIndexOffset: 1000
        });
        this.route = data.route;
        this.lat = lat;
        this.lon = lon;
        this.destination = data.des;
        this.pdist = parseFloat(data.pdist);
        this.hdg = parseFloat(data.hdg);
        this.id = parseFloat(data.vid);

        const popup = `Route: ${this.route}<br>Destination: ${this.destination}<br>Bus ID: ${this.id}<br>Distance: ${this.pdist}`;

        this.bindPopup(popup);
    }
}

class VehicleMarkerIcon extends L.icon {
    constructor(icon_url) {
        super({
            iconUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Bus_icon_brown.jpg",
            iconSize: [20, 20],
        });
    }
}

L.Control.Home = L.Control.extend({
    options: {
        position: 'topleft',
    },
    onAdd: function (map) {
        this._initialBounds = map.getBounds();

        var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
        var controlUI = L.DomUtil.create('a', 'leaflet-draw-edit-remove', controlDiv);
        var icon = L.DomUtil.create('button', 'fa fa-home fa-lg', controlUI);

        controlUI.title = 'Home';
        controlUI.href = '#';

        L.DomEvent.on(controlUI, 'click', function (e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            // map.flyToBounds(this._initialBounds, {
            //     duration: 1.5
            // });
        }, this);

        return controlDiv;
    }
});


