$(document).ready(() => {
    // if deployed to a site supporting SSL, use wss://
    const protocol = document.location.protocol.startsWith('https') ? 'wss://' : 'ws://';
    const webSocket = new WebSocket(protocol + location.host);

    // A class for holding the last N points of telemetry for a device
    class DeviceData {
        constructor(deviceId) {
            this.deviceId = deviceId;
            this.fan_status;
            this.led_status;
            this.command_temp;
        }

        addData(fan_stat,
                led_stat,
                command_temp_stat)
        {
            this.fan_status = fan_stat;
            this.led_status = led_stat;
            this.command_temp = command_temp_stat;


            if (this.timeData.length > this.maxLen) {
                this.fan_status = fan_stat;
                this.led_status = led_stat;
                this.command_temp = command_temp_stat;
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
    function device_status(){
        const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);
        const led = device.led_status;
        const fan = device.fan_status;
        const temp = device.command_temp;
        fan_box.innerText = fan === 1 ? `ON` : `OFF`;
        led_box.innerText = led === 1 ? `ON` : `OFF`;
        temp_box.innerText = temp;
    }



    //DOM 획득
    let needsAutoSelect = false;
    const listOfDevices = document.getElementById('listOfDevices');
    const button_temp = document.getElementById("button1");
    const control_temp = document.getElementById("tempbox");
    const led_box = document.getElementById("led_box");
    const fan_box = document.getElementById("fan_box");
    const temp_box = document.getElementById("temp_box");

    // LED 컨트롤 - 버튼
    const control_led_on = document.getElementById("led-on");
    const control_led_off = document.getElementById("led-off");
    const control_led_auto = document.getElementById("led-auto");

    // FAN 컨트롤 - 버튼
    const control_fan_on = document.getElementById("fan-on");
    const control_fan_off = document.getElementById("fan-off");
    const control_fan_auto = document.getElementById("fan-auto");

    function OnSelectionChange() {
        const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);
        console.log(device);
    }

    //listview의 항목이 변경되면 함수 실행 > OnSelectionChange
    listOfDevices.addEventListener('change', OnSelectionChange, false);

    // 온도 조절 textinput 에 입력된 값을 DOM value값에 업데이트
    control_temp.addEventListener('keyup',function(){
        var tmp = $(this).val();
        console.log(tmp);
        this.value = tmp;
    })

    // 온도 조절 ajax POST 송신부 CLIENT > SERVER
    button_temp.addEventListener('click', Buttontemp , false);
    function Buttontemp() {
        $.ajax({
            url: "/temp_set",
            type : 'POST',
            //list에서 선택한 device의 text를 포함, textinput의 온도값을 포함해 전송하도록 함.
            data : { "device": listOfDevices[listOfDevices.selectedIndex].text , "command" : "T&"+ control_temp.value},
            success : function(req,res) {  //SERVER REQ OK > 콘솔에서 확인이 가능하도록 조치
                console.log("Success POST to Server >>temp : %s <<",control_temp.value);
            }
        });
        //클릭 확인용 콘솔 로그 >> 온도값 표기해 오류 캐치
        console.log("send POST via ajax");
        console.log(control_temp.value); // value 가져오기
    }


    // LED ajax 부분 ajax의 간결화가 필요해보임
    control_led_on.addEventListener('click',LED_ON_REMOTE, false);
    function LED_ON_REMOTE() {
        $.ajax({
            url : "/led_on",
            type : 'POST',
            data : { "device": listOfDevices[listOfDevices.selectedIndex].text  },
            success : function(req,res) {
                console.log("Success Post to server >>LED ON<<");
            }
        });
    }

    control_led_off.addEventListener('click',LED_OFF_REMOTE, false);
    function LED_OFF_REMOTE() {
        $.ajax({
            url: "/led_off",
            type : 'POST',
            data : { "device": listOfDevices[listOfDevices.selectedIndex].text  },
            success : function(req,res) {
                console.log("Success Post to server >>LED OFF<<");
            }
        });
    }

    control_led_auto.addEventListener('click',LED_AUTO_REMOTE, false);
    function LED_AUTO_REMOTE() {
        $.ajax({
            url: "/led_auto",
            type : 'POST',
            data : { "device": listOfDevices[listOfDevices.selectedIndex].text  },
            success : function(req,res) {
                console.log("Success Post to server >>LED AUTO<<");
            }
        });
    }
    //fan control
    control_fan_on.addEventListener('click',FAN_ON_REMOTE, false);
    function FAN_ON_REMOTE() {
        $.ajax({
            url : "/fan_on",
            type : 'POST',
            data : { "device": listOfDevices[listOfDevices.selectedIndex].text  },
            success : function(req,res) {
                console.log("Success Post to server >>FAN ON<<");
            }
        });
    }

    control_fan_off.addEventListener('click',FAN_OFF_REMOTE, false);
    function FAN_OFF_REMOTE() {
        $.ajax({
            url: "/fan_off",
            type : 'POST',
            data : { "device": listOfDevices[listOfDevices.selectedIndex].text  },
            success : function(req,res) {
                console.log("Success Post to server >>FAN OFF<<");
            }
        });
    }

    control_fan_auto.addEventListener('click',FAN_AUTO_REMOTE, false);
    function FAN_AUTO_REMOTE() {
        $.ajax({
            url: "/fan_auto",
            type : 'POST',
            data : { "device": listOfDevices[listOfDevices.selectedIndex].text  },
            success : function(req,res) {
                console.log("Success Post to server >>FAN AUTO<<");
            }
        });
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
            messageData.IotData.fan_stat = messageData.IotData.detail[7];
            messageData.IotData.led_stat = messageData.IotData.detail[8];
            messageData.IotData.command_temp_stat = messageData.IotData.detail[9];

            messageData.IotData.fan_stat *= 1;
            messageData.IotData.led_stat *= 1;
            messageData.IotData.command_temp_stat *= 1;

                // find or add device to list of tracked devices
            const existingDeviceData = trackedDevices.findDevice(messageData.DeviceId);

            if (existingDeviceData) {
                existingDeviceData.addData(
                    messageData.IotData.fan_stat,
                    messageData.IotData.led_stat,
                    messageData.IotData.command_temp_stat
                );

            } else {
                const newDeviceData = new DeviceData(messageData.DeviceId);
                trackedDevices.devices.push(newDeviceData);
                const numDevices = trackedDevices.getDevicesCount();
                newDeviceData.addData(
                    messageData.IotData.fan_stat,
                    messageData.IotData.led_stat,
                    messageData.IotData.command_temp_stat
                );

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
            device_status();

        } catch (err) {
            console.error(err);
        }
    };
});