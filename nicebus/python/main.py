import requests
import os
import ipyleaflet
import folium
import time
from selenium import webdriver

# Nice Bus Classes
class NICEBusSession(requests.Session):
    base_url = "https://www.nicebus.com/NICECustomPages/getjsondata.aspx?getData=getrealtime&route_id="
    headers = {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        'referer': 'https://www.nicebus.com/Tools/Maps-and-Schedules/Line?route=n25',
        'user-agent': 'Mozilla/5.0 (Windows NT 6.1; rv:40.0) Gecko/20100101 Firefox/40.0',

    }
    def __init__(self):
        super().__init__()
        
    def __repr__(self):
        return f"<NICEBus>"
        
    def get_active_route(self, route):
        return Route(self, route)
        
class Route:
    def __init__(self, client, route):
        self.route = route
        self._client = client
        print(f"{self._client.base_url}{self.route}")
        self._request = self._client.get(f"{self._client.base_url}{self.route}", headers=self._client.headers, verify=False)
        all_buses = self._request.json()["ResultData"]
        self.buses = [Bus(self._client, data) for data in all_buses]
        
    def __repr__(self):
        return f"<Route [{self.route}]>"
        
class Bus:
    def __init__(self, client, data):
        self.destination = data.get("des")
        self.delay = eval(data.get("dly").title())
        self.hdg = int(data.get("hdg"))
        self.latitude = float(data.get("lat"))
        self.longitude = float(data.get("lon"))
        self.pdist = int(data.get("pdist"))
        self.id = int(data.get("vid"))
        
    def __repr__(self):
        return f"<Bus [{self.destination}]>"
    
    @property
    def as_marker(self):
        return BusMarker(self)
        

# Folium Classes
class BusMarker(folium.Marker):
    def __init__(self, bus):
        self.bus = bus
        super().__init__([bus.latitude, bus.longitude], popup=self.popup)
        
    @property
    def popup(self):
        string =  f"{self.bus.id}\n"
        string += f"{self.bus.destination}\n"
        string += f"{self.bus.hdg}\n"
        string += f"{self.bus.pdist}\n"
        return string
                         
class NICEBusMap(folium.Map):
    def __init__(self):
        self.initial_lat = 40.740562
        self.initial_lon = -73.620111
        self.initial_zoom = 11
        super().__init__(location=[self.initial_lat, self.initial_lon], zoom_start=self.initial_zoom)
        
    def add(self, marker):
        marker.add_to(self)
        
    def clear(self):
        super().__init__(location=[self.initial_lat, self.initial_lon], zoom_start=self.initial_zoom)


# Web Classes
class NICEBusView(webdriver.Firefox):
    def __init__(self):
        super().__init__()


client = NICEBusSession()
nice_map = NICEBusMap()
nice_view = NICEBusView()
output_file = os.path.realpath("output.html")

try:
    while True:
        route = client.get_active_route("n25")
        for bus in route.buses:
            nice_map.add(bus.as_marker)
        
        nice_map.save(output_file)
        nice_view.get(f"file://{output_file}")
        time.sleep(30)
        nice_map.clear()
except Exception as e:
    print(e)
    nice_view.quit()

    

        
    