const Client = require('azure-iothub').Client;
const Message = require('azure-iot-common').Message;
var connectionString = 'HostName=Study-Capstone.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=Rtm3S640ptD51yF+zgHuENlEpyLzICZMZoKuQhXLYls=';
var serviceClient = Client.fromConnectionString(connectionString);

function C2D_MESSAGE(DeviceID,Message){
    var message = Message;
    var deviceId = DeviceID;

    serviceClient.send(deviceId,message);
}

function C2D_MESSAGE_TEST(){
    var a = 'Test';
    var b = 'Hello';
    serviceClient.send(a,b)
}

//const button1 = document.getElementById('btn1');
//button1.addEventListener('click',C2D_MESSAGE_TEST,false);
C2D_MESSAGE_TEST();

