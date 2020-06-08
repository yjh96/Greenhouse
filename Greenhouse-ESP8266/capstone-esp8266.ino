#include <AzureIoTHub.h>
#include <SoftwareSerial.h>
#include <stdio.h>
#include <stdlib.h>
#include "iot_config.h"
#include "sample_init.h"
#include "Esp.h"

//iot_config.h 헤더파일에 Wlan의 ssid와 password를 로딩할 수 있도록 함
static char ssid[] = IOT_CONFIG_WIFI_SSID;
static char pass[] = IOT_CONFIG_WIFI_PASSWORD;

#include "AzureIoTProtocol_MQTT.h"
#include "iothubtransportmqtt.h"

static const char *connectionString = DEVICE_CONNECTION_STRING;
static bool g_continueRunning = true;
static size_t g_message_count_send_confirmations = 0;

IOTHUB_MESSAGE_HANDLE message_handle;
size_t message_sent = 0;
String data;
char dataChar[512];

IOTHUB_CLIENT_TRANSPORT_PROVIDER protocol = MQTT_Protocol;

IOTHUB_DEVICE_CLIENT_LL_HANDLE device_ll_handle;

static int callbackCounter;
int receiveContext = 0;

static IOTHUBMESSAGE_DISPOSITION_RESULT receive_message_callback(IOTHUB_MESSAGE_HANDLE message, void *userContextCallback)
{
  int *counter = (int *)userContextCallback;
  const char *buffer = NULL;
  size_t size;
  MAP_HANDLE mapProperties;
  const char *messageId;

  if ((messageId = IoTHubMessage_GetMessageId(message)) == NULL)
  {
    messageId = "<null>";
  }
  if (IoTHubMessage_GetByteArray(message, (const unsigned char **)&buffer, &size) != IOTHUB_MESSAGE_OK)
  {
  }
  else
  {
    // 원격명령을 Serial 에 표기할 수 있도록 함.
    if (size == (strlen("LED_ON") * sizeof(char)) && memcmp(buffer, "LED_ON", size) == 0)
    {
      LogInfo("LED_ON\n");
    }
    else if (size == (strlen("LED_OFF") * sizeof(char)) && memcmp(buffer, "LED_OFF", size) == 0)
    {
      LogInfo("LED_OFF\n");
    }
    else if (size == (strlen("LED_AUTO") * sizeof(char)) && memcmp(buffer, "LED_AUTO", size) == 0)
    {
      LogInfo("LED_AUTO\n");
    }
    else if (size == (strlen("FAN_ON") * sizeof(char)) && memcmp(buffer, "FAN_ON5", size) == 0)
    {
      LogInfo("FAN_ON\n");
    }
    else if (size == (strlen("FAN_OFF") * sizeof(char)) && memcmp(buffer, "FAN_OFF", size) == 0)
    {
      LogInfo("FAN_OFF\n");
    }
    else if (size == (strlen("FAN_AUTO") * sizeof(char)) && memcmp(buffer, "FAN_AUTO", size) == 0)
    {
      LogInfo("FAN_AUTO\n");
    }
    else if (size == (strlen("FAN_AUTO") * sizeof(char)) && memcmp(buffer, "FAN_AUTO", size) == 0)
    {
      LogInfo("FAN_AUTO\n");
    }
    else
    {
      const char *buffer_temp = buffer;
      LogInfo("%s\n", buffer_temp);
      LogInfo("\n");
    }
  }
  (*counter)++;
  return IOTHUBMESSAGE_ACCEPTED;
}

static void send_confirm_callback(IOTHUB_CLIENT_CONFIRMATION_RESULT result, void *userContextCallback)
{
  (void)userContextCallback;
  g_message_count_send_confirmations++;
  
}

static void connection_status_callback(IOTHUB_CLIENT_CONNECTION_STATUS result, IOTHUB_CLIENT_CONNECTION_STATUS_REASON reason, void *user_context)
{
  (void)reason;
  (void)user_context;
  if (result == IOTHUB_CLIENT_CONNECTION_AUTHENTICATED)
  {
    
  }
  else
  {
    
  }
}

void setup()
{
  Serial.begin(115200);
  int result = 0;
  sample_init(ssid, pass);

  //arduino serail 연결구간

  device_ll_handle = IoTHubDeviceClient_LL_CreateFromConnectionString(connectionString, protocol);
  (void)IoTHub_Init();

  
  if (device_ll_handle == NULL)
  {
    
  }
  else
  {
   
    int diag_off = 0;
    IoTHubDeviceClient_LL_SetOption(device_ll_handle, OPTION_DIAGNOSTIC_SAMPLING_PERCENTAGE, &diag_off);
    IoTHubDeviceClient_LL_SetOption(device_ll_handle, OPTION_TRUSTED_CERT, certificates);
  
    bool urlEncodeOn = true;
    IoTHubDeviceClient_LL_SetOption(device_ll_handle, OPTION_AUTO_URL_ENCODE_DECODE, &urlEncodeOn);
    
    if (IoTHubClient_LL_SetMessageCallback(device_ll_handle, receive_message_callback, &receiveContext) != IOTHUB_CLIENT_OK)
    {
      
    }
    do
    {
      data = Serial.readStringUntil('!');
      if (data != "")
      {

        data.toCharArray(dataChar, 512);

        message_handle = IoTHubMessage_CreateFromString(dataChar);

        result = IoTHubDeviceClient_LL_SendEventAsync(device_ll_handle, message_handle, send_confirm_callback, NULL);
        IoTHubMessage_Destroy(message_handle);
        message_sent++;
        IoTHubDeviceClient_LL_DoWork(device_ll_handle);
        ThreadAPI_Sleep(2);
        data = "";
      }
    } while (g_continueRunning);
    IoTHubDeviceClient_LL_Destroy(device_ll_handle);
  }  
  IoTHub_Deinit();


  return;
}

void loop(void)
{
}
