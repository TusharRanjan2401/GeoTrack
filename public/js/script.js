const socket = io();
const map = L.map("map").setView([0, 0], 16);
const markers = {};
const blueline = L.polyline([], { color: "blue" }).addTo(map);

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("send-location", { latitude, longitude });
      map.setView([latitude, longitude]);
      if (!markers["current"]) {
        markers["current"] = L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("Your Location")
          .openPopup();
      } else {
        markers["current"].setLatLng([latitude, longitude]);
      }
    },
    (error) => {
      console.error(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
}

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "@Tushar Ranjan",
}).addTo(map);

function haveDistance(coord1, coord2) {
  const radius = 6371e3;
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const diffLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const diffLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(diffLng / 2) *
      Math.sin(diffLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radius * c;
}

function createGraph(deviceLocation, destinations) {
  const graph = {};
  graph[deviceLocation.id] = {
    location: deviceLocation,
    neighbors: [],
  };

  destinations.forEach((destination) => {
    const distance = haveDistance(deviceLocation, destination);
    graph[destination.id] = {
      location: destination,
      neighbors: [],
    };
    graph[deviceLocation.id].neighbors.push({
      id: destination.id,
      distance,
    });
  });
  return graph;
}

class PriorityQueue {
  constructor() {
    this.elements = [];
  }

  isEmpty() {
    return this.elements.length === 0;
  }

  enqueue(element, priority) {
    this.elements.push({ element, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.elements.shift();
  }
}

function calculateShortestPath(graph, startId, endId) {
  const distances = {};
  const previous = {};
  const queue = new PriorityQueue();

  for (let node in graph) {
    distances[node] = Infinity;
    previous[node] = null;
    queue.enqueue(node, distances[node]);
  }
  distances[startId] = 0;

  while (!queue.isEmpty()) {
    const currentNode = queue.dequeue().element;

    if (currentNode === endId) {
      break;
    }

    graph[currentNode].neighbors.forEach((neighbor) => {
      const alt = distances[currentNode] + neighbor.distance;
      if (alt < distances[neighbor.id]) {
        distances[neighbor.id] = alt;
        previous[neighbor.id] = currentNode;
        queue.enqueue(neighbor.id, distances[neighbor.id]);
      }
    });
  }
  return reconstructPath(previous, startId, endId, graph);
}
function reconstructPath(previous, startId, endId, graph) {
  const path = [];
  let currentNode = endId;
  while (currentNode !== startId) {
    path.push(graph[currentNode].location);
    currentNode = previous[currentNode];
  }
  path.push(graph[startId].location);
  return path.reverse();
}

let currentPolyline;

function displayPathOnMap(path) {
  if (currentPolyline) {
    map.removeLayer(currentPolyline);
  }

  const latlng = path.map((loc) => [loc.latitude, loc.longitude]);
  currentPolyline = L.polyline(latlng, { color: "blue" }).addTo(map);
  map.fitBounds(currentPolyline.getBounds());
}

socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;
  map.setView([latitude, longitude]);
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }

  currentLat = latitude;
  currentLng = longitude;
});

async function getCoordinates(placeName) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      placeName
    )}`
  );
  if (!response.ok) {
    return null;
  }
  const data = await response.json();

  if (data && Array.isArray(data) && data.length > 0) {
    return {
      id: "destination",
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  }
  return null;
}

document.getElementById("find-path").addEventListener("click", async () => {
  const destination = document.getElementById("destination").value;
  console.log("Destination entered:", destination);

  if (!destination) {
    alert("Please enter a destination");
    return;
  }

  const userLocation = markers["current"]
    ? markers["current"].getLatLng()
    : null;

  if (!userLocation) {
    alert("Current location not available");
    return;
  }

  const destinationCoords = await getCoordinates(destination);
  console.log("Destination coordinates:", destinationCoords);

  if (!destinationCoords) {
    alert("Could not find the destination");
    return;
  }

  const graph = createGraph(
    {
      id: "current",
      latitude: userLocation.lat,
      longitude: userLocation.lng,
    },
    [destinationCoords]
  );

  const path = calculateShortestPath(graph, "current", destinationCoords.id);
  displayPathOnMap(path);
});

socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});
