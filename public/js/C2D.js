const Client = require('azure-iothub');
const Message = require('azure-iot-common');
var connectionString = 'HostName=Study-Capstone.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=Rtm3S640ptD51yF+zgHuENlEpyLzICZMZoKuQhXLYls=';
var serviceClient = Client.fromConnectionString(connectionString);

function C2D_MESSAGE(DeviceID,Message){
    var message = Message;
    var deviceId = DeviceID;

    serviceClient.send(deviceId,message);
}

function C2D_MESSAGE_TEST(){
    var a = 'Arduino';
    var b = 'Hello';
    serviceClient.send(a,b)
}

C2D_MESSAGE_TEST();


