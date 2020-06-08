
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
            this.tds_Data;
            this.co2;
            this.co2_status;

        }

        addData(time,
                temperature,
                humidity,
                illumi,
                illumi_digital,
                tdsData,
                co2_data,
                co2_status_data)
        {
            this.timeData.push(time);
            this.temperatureData.push(temperature);
            this.humidityData.push(humidity || null);
            this.recenthumidity = humidity;
            this.recenttemperature = temperature;
            this.illuminance = illumi;
            this.illuminance_digital = illumi_digital;
            this.tds_Data = tdsData;
            this.co2_value = co2_data;
            this.co2_status = co2_status_data;


            if (this.timeData.length > this.maxLen) {
                this.timeData.shift();
                this.temperatureData.shift();
                this.humidityData.shift();
                this.recenthumidity = humidity;
                this.recenttemperature = temperature;
                this.illuminance = illumi;
                this.illuminance_digital = illumi_digital;
                this.tds_Data = tdsData;
                this.co2_value = co2_data;
                this.co2_status = co2_status_data;
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
    function CO2(){
        const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);
        const rtCO2 = device.co2_value;
        const rtCO2_status = device.co2_status;
        co2.innerText = `${rtCO2} ppm`;

        if(rtCO2_status == 0)
            co2_status.innerText=`Normal Operation`;
        else if(rtCO2_status == 1)
            co2_status.innerText=`Preheating`;
        else if(rtCO2_status == 2)
            co2_status.innerText=`Operating Trouble`;
        else if(rtCO2_status == 3)
            co2_status.innerText=`Out of FS`;
        else if(rtCO2_status == 4)
            co2_status.innerText=`Non Calibrated`;

    }
    function tdsData() {
        const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);
        const rtTds = device.tds_Data;
        tds.innerText = `${rtTds} ppm`;
    }
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

    //DOM 획득
    let needsAutoSelect = false;
    const deviceCount = document.getElementById('deviceCount');
    const listOfDevices = document.getElementById('listOfDevices');
    const temperature = document.getElementById('temperature');
    const humidity = document.getElementById('humidity');
    const avrTemp = document.getElementById('avrTemp');
    const avrHumi = document.getElementById('avrHumi');
    const illumi_box = document.getElementById('illumi');
    const illumi_digital_box = document.getElementById('illumi_digital');
    const button_temp = document.getElementById("button1");
    const control_temp = document.getElementById("tempbox");
    const tds = document.getElementById("tds");

    const co2 = document.getElementById("co2");
    const co2_status = document.getElementById("co2_status");

    // LED 컨트롤 - 버튼
    const control_led_on = document.getElementById("led-on");
    const control_led_off = document.getElementById("led-off");
    const control_led_auto = document.getElementById("led-auto");

    // FAN 컨트롤 - 버튼
    const control_fan_on = document.getElementById("fan-on");
    const control_fan_off = document.getElementById("fan-off");
    const control_fan_auto = document.getElementById("fan-auto");

    // LED 컨트롤 - 라디오 버튼
    const control_led_auto_radio = document.getElementById("led-auto-radio-btn");
    const control_led_on_radio = document.getElementById("led-on-radio-btn");
    const control_led_off_radio = document.getElementById("led-off-radio-btn");

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
            data : { "device": listOfDevices[listOfDevices.selectedIndex].text , "command" :  control_temp.value + "^" },
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
    //AJAX 테스트용 코드 _ radio버튼으로 led 제어 관련 url 통일

    control_led_auto_radio.click(LED_RADIO(control_led_auto_radio));

    function LED_RADIO (DOM) {
        //    $.ajax({
        //        url : "/led_control"
        //        type : 'POST',
        //        data : { "device" : listOfDevices[listOfDevices.selectedIndex].text , "command" : $(this).value },
        console.log($(DOM).value);
        console.log("clicked");
    }
    //    })


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
            messageData.IotData.tdsData = messageData.IotData.detail[4];
            messageData.IotData.co2_data = messageData.IotData.detail[5];
            messageData.IotData.co2_status_data = messageData.IotData.detail[6];

            messageData.IotData.temperature *= 1;
            messageData.IotData.humidity *= 1;
            messageData.IotData.illumi *= 1;
            messageData.IotData.illumi_digital *= 1;
            messageData.IotData.tdsData *= 1;
            messageData.IotData.co2_data *= 1;
            messageData.IotData.co2_status_data *= 1;


            // time and either temperature or humidity are required
            if (!messageData.MessageDate || (!messageData.IotData.temperature && !messageData.IotData.humidity)) {
                return;
            }

            // find or add device to list of tracked devices
            const existingDeviceData = trackedDevices.findDevice(messageData.DeviceId);

            if (existingDeviceData) {
                existingDeviceData.addData(
                    messageData.MessageDate,
                    messageData.IotData.temperature,
                    messageData.IotData.humidity,
                    messageData.IotData.illumi,
                    messageData.IotData.illumi_digital,
                    messageData.IotData.tdsData,
                    messageData.IotData.co2_data,
                    messageData.IotData.co2_status_data
                );

            } else {
                const newDeviceData = new DeviceData(messageData.DeviceId);
                trackedDevices.devices.push(newDeviceData);
                const numDevices = trackedDevices.getDevicesCount();
                deviceCount.innerText = numDevices === 1 ? `${numDevices} device` : `${numDevices} devices`;
                newDeviceData.addData(
                    messageData.MessageDate,
                    messageData.IotData.temperature,
                    messageData.IotData.humidity,
                    messageData.IotData.illumi,
                    messageData.IotData.illumi_digital,
                    messageData.IotData.tdsData,
                    messageData.IotData.co2_data,
                    messageData.IotData.co2_status_data
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
            rtData();
            avrData();
            illumifunc();
            tdsData();
            CO2();

        } catch (err) {
            console.error(err);
        }
    };
});