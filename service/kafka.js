const { Kafka } = require("kafkajs")
const location = require("../model/location")
const kafka = new Kafka({
    clientId: "device-tracker",
    brokers: [process.env.KAFKA_BROKER || "localhost:9092"]
});

const producer = kafka.producer();
const consumer = kafka.consumer({
    groupId: "location-group"
})

const startKafkaProducer = async (userId, data) => {
    await producer.connect();
    console.log("Kafka Producer connected");
    await producer.send({
        topic: "location_updates",
        messages: [{
            key: userId,
            value: JSON.stringify(data)
        }]
    })
}

const startKafkaConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({
        topic: "location_updates",
        fromBeginning: true
    })

    console.log("Kafka consumer connected");

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const data = JSON.parse(message.value.toString());
            console.log(`Received location updated for user ${message.key}: `, data)
            
            const newLocation = new location({
                userId: message.key,
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: new Date()
            })
            await newLocation.save();
        }
    })
}

module.exports = {startKafkaProducer, startKafkaConsumer}