//센서 라이브러리
#include "DHT.h"
#include <Wire.h>
#include <BH1750FVI.h>
#include <cm1106_i2c.h>

//핀 세팅
#define DHTPIN 44
#define DHTTYPE DHT22
#define LED_RELAY 26
#define FAN_RELAY 32
#define TdsSensorPin A13

//I2C 모듈
BH1750FVI::eDeviceMode_t DEVICEMODE = BH1750FVI::k_DevModeContHighRes;
BH1750FVI LightSensor(DEVICEMODE);

//CM1107 모듈
CM1106_I2C cm1106_i2c;

//TDS 센서
#define VREF 5.0          // analog reference voltage(Volt) of the ADC
#define SCOUNT 30         // sum of sample point
int analogBuffer[SCOUNT]; // store the analog value in the array, read from ADC
int analogBufferTemp[SCOUNT];
int analogBufferIndex = 0, copyIndex = 0;
float averageVoltage = 0, tdsValue = 0, temperature = 25;

//Timer 접근
extern volatile unsigned long timer0_millis;

//DHT 설정
DHT dht(DHTPIN, DHTTYPE);

// 기본 설정
unsigned long previousMillis = 0;
const long delayTime = 5000;
signed int LED_FORCE = 0;
signed int LED_AUTO = 1;
signed int FAN_FORCE = 0;
signed int FAN_AUTO = 1;
float command_temp = 24.00;
//float command_humi = 60.00;

//TDS 계산식
int getMedianNum(int bArray[], int iFilterLen)
{
  int bTab[iFilterLen];
  for (byte i = 0; i < iFilterLen; i++)
    bTab[i] = bArray[i];
  int i, j, bTemp;
  for (j = 0; j < iFilterLen - 1; j++)
  {
    for (i = 0; i < iFilterLen - j - 1; i++)
    {
      if (bTab[i] > bTab[i + 1])
      {
        bTemp = bTab[i];
        bTab[i] = bTab[i + 1];
        bTab[i + 1] = bTemp;
      }
    }
  }
  if ((iFilterLen & 1) > 0)
    bTemp = bTab[(iFilterLen - 1) / 2];
  else
    bTemp = (bTab[iFilterLen / 2] + bTab[iFilterLen / 2 - 1]) / 2;
  return bTemp;
}

void setup()
{

  Serial.begin(115200);
  Serial3.begin(115200);

  pinMode(LED_RELAY, OUTPUT);
  pinMode(FAN_RELAY, OUTPUT);
  pinMode(TdsSensorPin, INPUT);

  dht.begin();

  LightSensor.begin();
  cm1106_i2c.begin();
}

void loop()
{
  unsigned long currentMillis = millis();
  int luxDigital;
  char luxChar[16];
  char luxDigitalChar[16];
  float humidity = dht.readHumidity();
  char humidityChar[16];
  float temperature = dht.readTemperature();
  char temperatureChar[16];
  char tdsChar[16];
  char data[256];
  uint8_t ret = cm1106_i2c.measure_result();
  uint16_t lux = LightSensor.GetLightIntensity();
  int co2;
  char co2Char[16];
  int co2Status;
  char co2StatusTempTemp[16];
  int ledStatus;
  int fanStatus;
  char ledStatusChar[16];
  char fanStatusChar[16];
  char commandTempChar[16];

  // TDS

  static unsigned long analogSampleTimepoint = millis();
  if (millis() - analogSampleTimepoint > 40U) //every 40 milliseconds,read the analog value from the ADC
  {
    analogSampleTimepoint = millis();
    analogBuffer[analogBufferIndex] = analogRead(TdsSensorPin); //read the analog value and store into the buffer
    analogBufferIndex++;
    if (analogBufferIndex == SCOUNT)
      analogBufferIndex = 0;
  }
  static unsigned long printTimepoint = millis();
  if (millis() - printTimepoint > 800U)
  {
    printTimepoint = millis();
    for (copyIndex = 0; copyIndex < SCOUNT; copyIndex++)
      analogBufferTemp[copyIndex] = analogBuffer[copyIndex];
    averageVoltage = getMedianNum(analogBufferTemp, SCOUNT) * (float)VREF / 1024.0;                                                                                                  // read the analog value more stable by the median filtering algorithm, and convert to voltage value
    float compensationCoefficient = 1.0 + 0.02 * (temperature - 25.0);                                                                                                               //temperature compensation formula: fFinalResult(25^C) = fFinalResult(current)/(1.0+0.02*(fTP-25.0));
    float compensationVolatge = averageVoltage / compensationCoefficient;                                                                                                            //temperature compensation
    tdsValue = (133.42 * compensationVolatge * compensationVolatge * compensationVolatge - 255.86 * compensationVolatge * compensationVolatge + 857.39 * compensationVolatge) * 0.5; //convert voltage value to tds value
  }

  // CO2
  if (ret == 0)
  {
    co2 = cm1106_i2c.co2;
    switch (cm1106_i2c.status)
    {
    case CM1106_I2C_STATUS_PREHEATING:
    {
      co2Status = 0;
      break;
    }
    case CM1106_I2C_STATUS_NORMAL_OPERATION:
    {
      co2Status = 1;
      break;
    }
    case CM1106_I2C_STATUS_OPERATING_TROUBLE:
    {
      co2Status = 2;
      break;
    }
    case CM1106_I2C_STATUS_OUT_OF_FS:
    {
      co2Status = 3;
      break;
    }
    case CM1106_I2C_STATUS_NON_CALIBRATED:
    {
      co2Status = 4;
      break;
    }
    }
  }

  //LED

  if (LED_AUTO == 1)
  {
    if (lux <= 800)
    {
      digitalWrite(LED_RELAY, LOW);
      luxDigital = 0;
      ledStatus = 1;
    }
    else
    {
      digitalWrite(LED_RELAY, HIGH);
      luxDigital = 1;
      ledStatus = 0;
    }
  }
  else if (LED_AUTO == 0)
  {
    if (LED_FORCE == 1)
    {
      digitalWrite(LED_RELAY, LOW);
      ledStatus = 1;
    }
    else if (LED_FORCE == 0)
    {
      digitalWrite(LED_RELAY, HIGH);
      ledStatus = 0;
    }
  }

  //FAN

  if (FAN_AUTO == 1)
  {
    if (co2 >= 800 || temperature > command_temp)
    {
      digitalWrite(FAN_RELAY, LOW);
      fanStatus = 1;
    }
    else
    {
      digitalWrite(FAN_RELAY, HIGH);
      fanStatus = 0;
    }
  }
  else if (FAN_AUTO == 0)
  {
    if (FAN_FORCE == 1)
    {
      digitalWrite(FAN_RELAY, LOW);
      fanStatus = 1;
    }
    else if (FAN_FORCE == 0)
    {
      digitalWrite(FAN_RELAY, HIGH);
      fanStatus = 0;
    }
  }

  if (Serial3.available())
  {
    String text = Serial3.readStringUntil('\n');
    Serial.println(text);
    if (text == "LED_ON")
    {
      LED_FORCE = 1;
      LED_AUTO = 0;
      Serial.print("FORCE : ");
      Serial.print(LED_FORCE);
      Serial.print(" AUTO : ");
      Serial.println(LED_AUTO);
    }
    else if (text == "LED_OFF")
    {
      LED_FORCE = 0;
      LED_AUTO = 0;
      Serial.print("FORCE : ");
      Serial.print(LED_FORCE);
      Serial.print(" AUTO : ");
      Serial.println(LED_AUTO);
    }
    else if (text == "LED_AUTO")
    {
      LED_AUTO = 1;
      LED_FORCE = 0;
      Serial.print("FORCE : ");
      Serial.print(LED_FORCE);
      Serial.print(" AUTO : ");
      Serial.println(LED_AUTO);
    }
    else if (text == "FAN_ON")
    {
      FAN_FORCE = 1;
      FAN_AUTO = 0;
      Serial.print("FORCE : ");
      Serial.print(FAN_FORCE);
      Serial.print(" AUTO : ");
      Serial.println(FAN_AUTO);
    }
    else if (text == "FAN_OFF")
    {
      FAN_FORCE = 0;
      FAN_AUTO = 0;
      Serial.print("FORCE : ");
      Serial.print(FAN_FORCE);
      Serial.print(" AUTO : ");
      Serial.println(FAN_AUTO);
    }
    else if (text == "FAN_AUTO")
    {
      FAN_FORCE = 0;
      FAN_AUTO = 1;
      Serial.print("FORCE : ");
      Serial.print(FAN_FORCE);
      Serial.print(" AUTO : ");
      Serial.println(FAN_AUTO);
    }
    else if (text.startsWith("T&"))
    {
      int check = text.indexOf("&");
      String check_temp = text.substring(check + 1, text.length());
      Serial.println(check_temp);
      command_temp = check_temp.toFloat();
      Serial.println(command_temp);
    }
    //    else if (text.startsWith("H&"))
    //    {
    //      int check = text.indexOf("&");
    //      String check_humi = text.substring(check + 1, text.length());
    //      Serial.println(check_humi);
    //      command_humi = check_humi.toFloat();
    //      Serial.println(command_humi);
    //    }
  }
  if (currentMillis - previousMillis > delayTime)
  {
    dtostrf(lux, 5, 0, luxChar);
    dtostrf(luxDigital, 1, 0, luxDigitalChar);
    dtostrf(temperature, 4, 1, temperatureChar);
    dtostrf(humidity, 4, 1, humidityChar);
    dtostrf(tdsValue, 4, 0, tdsChar);
    dtostrf(co2, 4, 0, co2Char);
    dtostrf(co2Status, 1, 0, co2StatusTempTemp);
    dtostrf(fanStatus, 1, 0, fanStatusChar);
    dtostrf(ledStatus, 1, 0, ledStatusChar);
    dtostrf(command_temp, 4, 2, commandTempChar);

    // temp & humidity & lux & luxDigital & tds & co2 & co2Status
    sprintf(data, " %s&%s&%s&%s&%s&%s&%s&%s&%s&%s!",
            temperatureChar,
            humidityChar,
            luxChar,
            luxDigitalChar,
            tdsChar,
            co2Char,
            co2StatusTempTemp,
            fanStatusChar,
            ledStatusChar,
            commandTempChar);
    Serial.print(data);
    Serial3.write(data);
    timer0_millis = 0;
  }
}
