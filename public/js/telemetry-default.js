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

        }

        addData(time, temperature, humidity) {
            this.timeData.push(time);
            this.temperatureData.push(temperature);
            this.humidityData.push(humidity || null);
            this.recenthumidity = humidity;
            this.recenttemperature = temperature;


            if (this.timeData.length > this.maxLen) {
                this.timeData.shift();
                this.temperatureData.shift();
                this.humidityData.shift();
                this.recenthumidity = humidity;
                this.recenttemperature = temperature;
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
        const rtTemp = device.recenttemperature.toFixed(2);
        const rtHumi = device.recenthumidity.toFixed(2);
        console.log(rtTemp);
        console.log(rtHumi);
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
        console.log(device.temperatureData);
        console.log(device.temperatureData.length);
        console.log(TempData);
        console.log(HumiData);
        console.log(avrtemp);
        console.log(avrhumi);
        avrTemp.innerText = avrtemp === 'NaN' ? `Wait...` : `${avrtemp} 도`;
        avrHumi.innerText = avrhumi === 'NaN' ? `Wait...` : `${avrhumi} %`;

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
    function OnSelectionChange() {
        const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);
        console.log(device);


    }
    listOfDevices.addEventListener('change', OnSelectionChange, false);

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

            // time and either temperature or humidity are required
            if (!messageData.MessageDate || (!messageData.IotData.temperature && !messageData.IotData.humidity)) {
                return;
            }

            // find or add device to list of tracked devices
            const existingDeviceData = trackedDevices.findDevice(messageData.DeviceId);

            if (existingDeviceData) {
                existingDeviceData.addData(messageData.MessageDate, messageData.IotData.temperature, messageData.IotData.humidity);

            } else {
                const newDeviceData = new DeviceData(messageData.DeviceId);
                trackedDevices.devices.push(newDeviceData);
                const numDevices = trackedDevices.getDevicesCount();
                deviceCount.innerText = numDevices === 1 ? `${numDevices} device` : `${numDevices} devices`;
                newDeviceData.addData(messageData.MessageDate, messageData.IotData.temperature, messageData.IotData.humidity);

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
        } catch (err) {
            console.error(err);
        }
    };
});