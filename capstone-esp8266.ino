#include <AzureIoTHub.h>
#include <SoftwareSerial.h>
#include <stdio.h>
#include <stdlib.h>
#include "iot_config.h"
#include "sample_init.h"
#include "Esp.h"

//arduino serial 연결구간







static char ssid[] = IOT_CONFIG_WIFI_SSID;
static char pass[] = IOT_CONFIG_WIFI_PASSWORD;

#include "AzureIoTProtocol_MQTT.h"
#include"iothubtransportmqtt.h"

static const char* connectionString = DEVICE_CONNECTION_STRING;
#define MessageCount 500
static bool g_continueRunning = true;
static size_t g_message_count_send_confirmations = 0;

IOTHUB_MESSAGE_HANDLE message_handle;
size_t message_sent = 0;
const char* telemetry_msg = "test_message";
String humidity_str;
char humidity_char [256];


IOTHUB_CLIENT_TRANSPORT_PROVIDER protocol = MQTT_Protocol;

IOTHUB_DEVICE_CLIENT_LL_HANDLE device_ll_handle;

static int callbackCounter;
int receiveContext = 0;

static IOTHUBMESSAGE_DISPOSITION_RESULT receive_message_callback(IOTHUB_MESSAGE_HANDLE message, void* userContextCallback)
{
    int* counter = (int*)userContextCallback;
    const char* buffer;
    size_t size;
    MAP_HANDLE mapProperties;
    const char* messageId;

    if ((messageId = IoTHubMessage_GetMessageId(message)) == NULL)
    { 
        messageId = "<null>";
    }

    if (IoTHubMessage_GetByteArray (message, (const unsigned char**) &buffer, &size) != IOTHUB_MESSAGE_OK)
    {
        //LogInfo("unable to retrieve the message data\r\n");
    }
    else
    {
        //  LogInfo("Received Message [%d]\r\n Message ID: %s\r\n Data: <<<%s>>>  & Size=%d\r\n", *counter, messageId,  buffer, (int)size);
        // If we receive the work 'quit' then we stop running
        if (size == (strlen("LED_ON") * sizeof(char)) && memcmp(buffer, "LED_ON", size) == 0){
            LogInfo("LED_ON\n");
        }
        else if (size == (strlen("LED_OFF") * sizeof(char)) && memcmp(buffer, "LED_OFF", size) == 0){
            LogInfo("LED_OFF\n");
        }
        else if (size == (strlen("LED_AUTO") * sizeof(char)) && memcmp(buffer, "LED_AUTO", size) == 0){
            LogInfo("LED_AUTO\n");
        }
    }
    (*counter)++;
    return IOTHUBMESSAGE_ACCEPTED;
}

static void send_confirm_callback(IOTHUB_CLIENT_CONFIRMATION_RESULT result, void* userContextCallback)
{
    (void)userContextCallback;
    g_message_count_send_confirmations++;
    //LogInfo("Confirm Callback");
    //LogInfo("Confirmation callback received for message %lu with result %s\r\n", (unsigned long)g_message_count_send_confirmations, MU_ENUM_TO_STRING(IOTHUB_CLIENT_CONFIRMATION_RESULT, result));
}

static void connection_status_callbakc(IOTHUB_CLIENT_CONNECTION_STATUS result, IOTHUB_CLIENT_CONNECTION_STATUS_REASON reason, void* user_context)
{
    (void)reason;
    (void)user_context;
    if (result == IOTHUB_CLIENT_CONNECTION_AUTHENTICATED)
    {
        //LogInfo("The device client is connected to iothub\r\n");
    }
    else
    {
        //LogInfo("The device client has been disconnected\r\n");
    }
}

void setup(){
    Serial.begin(115200);
    int result = 0;
    sample_init (ssid,pass);

    //arduino serail 연결구간
  

    
    device_ll_handle = IoTHubDeviceClient_LL_CreateFromConnectionString(connectionString, protocol);
    (void)IoTHub_Init();

    //LogInfo("Creating IoTHub Device handle\r\n");
    if (device_ll_handle == NULL)
    {
        //LogInfo("Error AZ002: Failure createing Iothub device. Hint: Check you connection string.\r\n");
    }
    else {
        // Set any option that are neccessary.
        // For available options please see the iothub_sdk_options.md documentation
        // turn off diagnostic sampling
        int diag_off = 0;
        IoTHubDeviceClient_LL_SetOption(device_ll_handle, OPTION_DIAGNOSTIC_SAMPLING_PERCENTAGE, &diag_off);
        IoTHubDeviceClient_LL_SetOption(device_ll_handle, OPTION_TRUSTED_CERT, certificates);
        //Setting the auto URL Encoder (recommended for MQTT). Please use this option unless
        //you are URL Encoding inputs yourself.
        //ONLY valid for use with MQTT
        bool urlEncodeOn = true;
        IoTHubDeviceClient_LL_SetOption(device_ll_handle, OPTION_AUTO_URL_ENCODE_DECODE, &urlEncodeOn);
        /* Setting Message call back, so we can receive Commands. */
        if (IoTHubClient_LL_SetMessageCallback(device_ll_handle, receive_message_callback, &receiveContext) != IOTHUB_CLIENT_OK) {
            //LogInfo("ERROR: IoTHubClient_LL_SetMessageCallback..........FAILED!\r\n");
        }
        do {
            if (message_sent < MessageCount ) {
                humidity_str = Serial.readStringUntil('\n');
                //Serial.println(humidity_str);
                humidity_str.toCharArray(humidity_char,256);
                //Serial.println(humidity_char);
                message_handle = IoTHubMessage_CreateFromString(humidity_char);
                //LogInfo("Sending message %d to IoTHub\r\n", (int)(message_sent + 1));
                result = IoTHubDeviceClient_LL_SendEventAsync(device_ll_handle, message_handle, send_confirm_callback, NULL);
                // The message is copied to the sdk so the we can destroy it
                IoTHubMessage_Destroy(message_handle);
                //Serial.write("hello");
                message_sent++;
                delay(3000);
            }
            else if (g_message_count_send_confirmations >= MessageCount)
            {
                // After all messages are all received stop running
                g_continueRunning = false;
            }
            IoTHubDeviceClient_LL_DoWork(device_ll_handle);
            ThreadAPI_Sleep(2);
        }while (g_continueRunning);

        // Clean up the iothub sdk handle
        IoTHubDeviceClient_LL_Destroy(device_ll_handle);
         
    }
    // Free all the sdk subsystem
    IoTHub_Deinit();

    //LogInfo("done with sending");
    return;
}

void loop(void)
{

}
