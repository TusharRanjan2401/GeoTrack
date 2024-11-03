## GeoTrack - Real-Time Device Tracking App

A highly scalable real-time device tracking application built with `Node.js`, `Express`, `Socket.io`, `kafka` and `MongoDB`. This application allows users to track the location of devices as well as find the shortest path between the user and the user's desired destination in real-time using WebSocket communication and `Dijkstra's Algorithm`, Kafka for efficient data handling, making it suitable for applications with high user loads.

## Features

- **Real-Time Location Updates**: Users can view the live location of devices on an interactive map.
- **Shortest Path Calculation**: Users can find the shortest path from their current location to a specified destination. This path is computed using Dijkstra's algorithm and displayed on the map.
- **Highly Scalable Architecture**: Utilizes Kafka to manage high throughput of location updates, ensuring seamless performance even with thousands of concurrent users.
- **Persistent Data Storage**: Location data is stored in MongoDB, providing durability and easy retrieval for analysis.
- **Socket.io Integration**: Enables instant communication between the client and server, ensuring low-latency updates.

## Technologies Used

- **Frontend**: `JavaScript` and `Leaflet.js (for maps)`
- **Backend**: `Node.js`, `Express`, `Socket.io`
- **Database**: `MongoDB`
- **Message Broker**: `Kafka (with zookeeper)`
- **Algorithm**: `Dijkstra's Algorithm` for shortest path calculation

## Prerequisites

Make sure you have the following installed:

- **Docker Desktop** - Installed on your machine

## Docker Image

### Pulling the zookeeper image

```bash
docker run -p 2181:2181 zookeepr
```

### Pulling the kafka image

```bash
docker run -p 9092:9092 -e KAFKA_ZOOKEEPER_CONNECT=<IP_Address>:9092 -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://<IP_Address>:9092 -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 confluentinc/cp-kafka
```

### Running the Application

1. Clone the repo

````bash
git clone https://github.com/TusharRanjan2401/geotrack.git

2. Create a ```.env``` file in the root

Add environment variables-

```bash
MONGO_URL=mongodb://localhost:27017/device_tracker
KAFKA_BROKER=localhost:9092
````

## Installation

Install Dependencies

```bash
npm install
```

### Start the Application

```bash
npm start
```

## Notes

- Ensure that `kafka` and `zookeepr` containers are running in `Docker` on your machine before starting the application.
- Adjust the environment variables in the `.env` file as necessary

## Author

[@Tushar Ranjan](https://github.com/TusharRanjan2401)
