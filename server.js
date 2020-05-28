const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const EventHubReader = require('./scripts/event-hub-reader.js');
const bodyParser = require('body-parser');
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

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.post('/send', function(req,res){
    console.log("catch POST from client!");
    var target_command = req.body.command;
    var target_device = req.body.device;
    console.log(command);
    SendMessage.C2D_MESSAGE(target_device,target_command);
    res.json({ok:true});
});

app.post('/ledon', function(req,res){
    console.log("catch POST from Client -> LED ON");
    SendMessage.C2D_MESSAGE("Arduino", "LED_ON");
    res.json({ok:true});
});

app.post('/ledoff', function(req,res){
    console.log("catch POST from Client -> LED OFF");
    SendMessage.C2D_MESSAGE("Arduino","LED_OFF");
    res.json({ok:true});
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