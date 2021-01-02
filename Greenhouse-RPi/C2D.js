const Client = require("azure-iot-device").Client;
const Message = require("azure-iot-device").Message;
const Protocol = require("azure-iot-device-mqtt").Mqtt;
const { PythonShell } = require("python-shell");

const connectionString = "--secret--";

var sendingMessage = false;
var messageId = 0;
var client;
var option = {
    mode: "text",
    pythonPath: "/usr/bin/python3",
};

function getMessage(cb) {
    messageId++;
}

function sendMessage() {
    if (!sendingMessage) {
        return;
    }
}

function receiveMessageCallback(msg) {
    var message = msg.getData().toString("utf-8");
    client.complete(msg, function () {
        console.log("Receive message: " + message);
        if (message == "Photo") {
            PythonShell.run(
                "/home/pi/Desktop/Remote/C2D.py",
                option,
                function (err, results) {
                    if (err) throw err;
                    console.log("results: %j", results);
                }
            );
        }
    });
}

client = Client.fromConnectionString(connectionString, Protocol);

client.open(function (err) {
    if (err) {
        console.error("[IoT hub Client] Connect error: " + err.message);
        return;
    }

    client.on("message", receiveMessageCallback);
});
