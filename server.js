const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const EventHubReader = require('./scripts/event-hub-reader.js');
const SendMessage = require('./public/js/C2D.js');

const iotHubConnectionString = process.env.IotHubConnectionString;
if (!iotHubConnectionString) {
    console.error(`Environment variable IotHubConnectionString must be specified.`);
    return;
}
console.log(`Using IoT Hub connection string [${iotHubConnectionString}]`);

const eventHubConsumerGroup = process.env.EventHubConsumerGroup;
console.log(eventHubConsumerGroup);
if (!eventHubConsumerGroup) {
    console.error(`Environment variable EventHubConsumerGroup must be specified.`);
    return;
}
console.log(`Using event hub consumer group [${eventHubConsumerGroup}]`);

// Redirect requests to the public subdirectory to the root
const app = express();

app.get('/send', function(){
    console.log("HELLOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO");
    SendMessage.C2D_MESSAGE_TEST();
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

wss.broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                console.log(`Broadcasting data ${data}`);
                client.send(data);
            } catch (e) {
                console.error(e);
            }
        }
    });
};
server.listen(process.env.PORT || '3000', () => {
    console.log('Listening on %d.', server.address().port);
});

    const eventHubReader = new EventHubReader(iotHubConnectionString, eventHubConsumerGroup);
(async () => {
    app.get('./send/', function(req,res) {
        SendMessage.C2D_MESSAGE_TEST();
        console.log("HELLOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO");
    });
    await eventHubReader.startReadMessage((message, date, deviceId) => {
        try {
            const payload = {
                IotData: message,
                MessageDate: date || Date.now().toISOString(),
                DeviceId: deviceId,
            };

            wss.broadcast(JSON.stringify(payload));
        } catch (err) {
            console.error('Error broadcasting: [%s] from [%s].', err, message);
        }
    });
})().catch();