'use strict';

const Client = require('azure-iothub').Client;

var connectionString = 'HostName=Study-Capstone.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=Rtm3S640ptD51yF+zgHuENlEpyLzICZMZoKuQhXLYls=';
var serviceClient = Client.fromConnectionString(connectionString);

function C2D_MESSAGE(DeviceID, Message) {
    var deviceId = DeviceID;
    var message = Message;
    serviceClient.send(deviceId, message);
}
module.exports = { C2D_MESSAGE }
