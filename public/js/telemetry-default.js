/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */



$(document).ready(() => {
    // if deployed to a site supporting SSL, use wss://
    const protocol = document.location.protocol.startsWith('https') ? 'wss://' : 'ws://';
    const webSocket = new WebSocket(protocol + location.host);


    // A class for holding the last N points of telemetry for a device
    class DeviceData {
        constructor(deviceId) {
            this.deviceId = deviceId;
            this.maxLen = 10;
            this.timeData = new Array(this.maxLen);
            this.temperatureData = new Array(this.maxLen);
            this.humidityData = new Array(this.maxLen);
            this.recenttemperature;
            this.recenthumidity;
            this.illuminance;
            this.illuminance_digital;

        }

        addData(time, temperature, humidity, illumi, illumi_digital) {
            this.timeData.push(time);
            this.temperatureData.push(temperature);
            this.humidityData.push(humidity || null);
            this.recenthumidity = humidity;
            this.recenttemperature = temperature;
            this.illuminance = illumi;
            this.illuminance_digital = illumi_digital;


            if (this.timeData.length > this.maxLen) {
                this.timeData.shift();
                this.temperatureData.shift();
                this.humidityData.shift();
                this.recenthumidity = humidity;
                this.recenttemperature = temperature;
                this.illuminance = illumi;
                this.illuminance_digital = illumi_digital;
            }
        }
    }

    // All the devices in the list (those that have been sending telemetry)
    class TrackedDevices {
        constructor() {
            this.devices = [];
        }

        // Find a device based on its Id
        findDevice(deviceId) {
            for (let i = 0; i < this.devices.length; ++i) {
                if (this.devices[i].deviceId === deviceId) {
                    return this.devices[i];
                }
            }

            return undefined;
        }

        getDevicesCount() {
            return this.devices.length;
        }

    }

    const trackedDevices = new TrackedDevices();
    // update realtime data
    function rtData() {
        const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);
        const rtTemp = device.recenttemperature;
        const rtHumi = device.recenthumidity;

        temperature.innerText = `${rtTemp} 도`;
        humidity.innerText = `${rtHumi} %`;

    }
    function avrData() {
        const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);
        var TempData = 0;
        var HumiData = 0;
        for (var i = 0; i < device.timeData.length; i++) {
            TempData += device.temperatureData[i];
            HumiData += device.humidityData[i];
        }
        const avrtemperature = TempData / device.temperatureData.length;
        const avrhumidity = HumiData / device.humidityData.length;
        const avrtemp = avrtemperature.toFixed(2);
        const avrhumi = avrhumidity.toFixed(2);

        avrTemp.innerText = avrtemp === 'NaN' ? `Wait...` : `${avrtemp} 도`;
        avrHumi.innerText = avrhumi === 'NaN' ? `Wait...` : `${avrhumi} %`;

    }
    function illumifunc() {
        const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);
        const illumi_data = device.illuminance;
        const illumi_digital_data = device.illuminance_digital;
        console.log(illumi_digital_data);
        illumi_box.innerText = `${illumi_data}`;
        illumi_digital_box.innerText = illumi_digital_data === 1 ? `밝음` : `어두움`;
    }

    // Manage a list of devices in the UI, and update which device data the chart is showing
    // based on selection
    //let needsAutoSelect = false;
    let needsAutoSelect = false;
    const deviceCount = document.getElementById('deviceCount');
    const listOfDevices = document.getElementById('listOfDevices');
    const temperature = document.getElementById('temperature');
    const humidity = document.getElementById('humidity');
    const avrTemp = document.getElementById('avrTemp');
    const avrHumi = document.getElementById('avrHumi');
    const illumi_box = document.getElementById('illumi');
    const illumi_digital_box = document.getElementById('illumi_digital');
    const button_1 = document.getElementById("button1");
    function OnSelectionChange() {
        const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);
        console.log(device);


    }
    listOfDevices.addEventListener('change', OnSelectionChange, false);
    button_1.addEventListener('click', Button , false);

    // function SendExample() {
    //    const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);
    //    Message = "hello";
    //    send(device, Message);
    // }

    function Button() {
        $.ajax({
            url: "/send",
            type : 'GET',
            success : function() { console.log("GET SUCCESS")}
        });
        console.log("hi");
    }


    // When a web socket message arrives:
    // 1. Unpack it
    // 2. Validate it has date/time and temperature
    // 3. Find or create a cached device to hold the telemetry data
    // 4. Append the telemetry data
    // 5. Update the chart UI
    webSocket.onmessage = function onMessage(message) {
        try {
            const messageData = JSON.parse(message.data);
            console.log(messageData);

            tmp = String.fromCharCode.apply(null, messageData.IotData.data);
            messageData.IotData.detail = tmp.split('&');
            messageData.IotData.temperature = messageData.IotData.detail[0];
            messageData.IotData.humidity = messageData.IotData.detail[1];
            messageData.IotData.illumi = messageData.IotData.detail[2];
            messageData.IotData.illumi_digital = messageData.IotData.detail[3];
            messageData.IotData.temperature *= 1;
            messageData.IotData.humidity *= 1;
            messageData.IotData.illumi *= 1;
            messageData.IotData.illumi_digital *= 1;


            // time and either temperature or humidity are required
            if (!messageData.MessageDate || (!messageData.IotData.temperature && !messageData.IotData.humidity)) {
                return;
            }

            // find or add device to list of tracked devices
            const existingDeviceData = trackedDevices.findDevice(messageData.DeviceId);

            if (existingDeviceData) {
                existingDeviceData.addData(messageData.MessageDate, messageData.IotData.temperature, messageData.IotData.humidity, messageData.IotData.illumi, messageData.IotData.illumi_digital);

            } else {
                const newDeviceData = new DeviceData(messageData.DeviceId);
                trackedDevices.devices.push(newDeviceData);
                const numDevices = trackedDevices.getDevicesCount();
                deviceCount.innerText = numDevices === 1 ? `${numDevices} device` : `${numDevices} devices`;
                newDeviceData.addData(messageData.MessageDate, messageData.IotData.temperature, messageData.IotData.humidity, messageData.IotData.illumi, messageData.IotData.illumi_digital);

                // add device to the UI list
                const node = document.createElement('option');
                const nodeText = document.createTextNode(messageData.DeviceId);
                node.appendChild(nodeText);
                //node.setAttribute("id", temp);
                listOfDevices.appendChild(node);

                // if this is the first device being discovered, auto-select it
                if (needsAutoSelect) {
                    needsAutoSelect = false;
                    listOfDevices.selectedIndex = 1;
                    OnSelectionChange();
                }
            }
            rtData();
            avrData();
            illumifunc();

        } catch (err) {
            console.error(err);
        }
    };
});