//Sensor Library
#include "DHT.h"
#include <Wire.h>
#include <BH1750FVI.h>
#include <cm1106_i2c.h>

//Pin Settings
#define DHTPIN 8     // what pin we're connected to
#define CDSDIGITAL 7
#define CDSANALOG A0
#define LED_RELAY 22
#define FAN_RELAY 23
#define DHTTYPE DHT22   // DHT 22  (AM2302)

//I2C 모듈
BH1750FVI::eDeviceMode_t DEVICEMODE = BH1750FVI::k_DevModeContHighRes;
BH1750FVI LightSensor(DEVICEMODE );

CM1106_I2C cm1106_i2c;
#define TdsSensorPin A1
#define VREF 5.0      // analog reference voltage(Volt) of the ADC
#define SCOUNT  30           // sum of sample point
int analogBuffer[SCOUNT];    // store the analog value in the array, read from ADC
int analogBufferTemp[SCOUNT];
int analogBufferIndex = 0,copyIndex = 0;
float averageVoltage = 0,tdsValue = 0,temperature = 25;

//Timer
extern volatile unsigned long timer0_millis;

DHT dht(DHTPIN, DHTTYPE);

unsigned long previousMillis = 0;
const long delayTime = 5000;
signed int LED_FORCE = 0;
signed int LED_AUTO = 1;
signed int FAN_FORCE = 0;
signed int FAN_AUTO = 1;
float command_temp = 24.00;
float command_humi = 60.00;

int getMedianNum(int bArray[], int iFilterLen) 
{
      int bTab[iFilterLen];
      for (byte i = 0; i<iFilterLen; i++)
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

void setup() {
  
  Serial.begin(115200);
  Serial3.begin(115200);
  
  pinMode(LED_RELAY, OUTPUT);
  pinMode(FAN_RELAY, OUTPUT);
  pinMode(TdsSensorPin,INPUT);

  dht.begin();
  LightSensor.begin();  
  cm1106_i2c.begin();
  
}

void loop() {
    unsigned long currentMillis = millis();
    
    signed int cds_analog = analogRead(CDSANALOG);
    signed int cds_digital;
    char cds_analog_tmp[16];
    char cds_digital_tmp[16];
    float h = dht.readHumidity();
    char hh_tmp[16];
    float t = dht.readTemperature();
    char tt_tmp[16];
    char tds_temp[16];
    char data[256];
    uint8_t ret = cm1106_i2c.measure_result();
    uint16_t lux = LightSensor.GetLightIntensity();
    int co2;
    char co2_temp[16];
    int co2_status;
    char co2_status_temp[16];
    int led_status;
    int fan_status;
    char led_status_temp[16];
    char fan_status_temp[16];
    char command_temp_temp[16];

  // TDS
    
  static unsigned long analogSampleTimepoint = millis();
   if(millis()-analogSampleTimepoint > 40U)     //every 40 milliseconds,read the analog value from the ADC
   {
     analogSampleTimepoint = millis();
     analogBuffer[analogBufferIndex] = analogRead(TdsSensorPin);    //read the analog value and store into the buffer
     analogBufferIndex++;
     if(analogBufferIndex == SCOUNT) 
         analogBufferIndex = 0;
   }   
   static unsigned long printTimepoint = millis();
   if(millis()-printTimepoint > 800U)
   {
      printTimepoint = millis();
      for(copyIndex=0;copyIndex<SCOUNT;copyIndex++)
        analogBufferTemp[copyIndex]= analogBuffer[copyIndex];
      averageVoltage = getMedianNum(analogBufferTemp,SCOUNT) * (float)VREF / 1024.0; // read the analog value more stable by the median filtering algorithm, and convert to voltage value
      float compensationCoefficient=1.0+0.02*(temperature-25.0);    //temperature compensation formula: fFinalResult(25^C) = fFinalResult(current)/(1.0+0.02*(fTP-25.0));
      float compensationVolatge=averageVoltage/compensationCoefficient;  //temperature compensation
      tdsValue=(133.42*compensationVolatge*compensationVolatge*compensationVolatge - 255.86*compensationVolatge*compensationVolatge + 857.39*compensationVolatge)*0.5; //convert voltage value to tds value
   }

   // CO2
    if (ret == 0) {
      co2 = cm1106_i2c.co2;
      switch (cm1106_i2c.status) {
        case CM1106_I2C_STATUS_PREHEATING: {
            co2_status = 0;
            break;
          }
        case CM1106_I2C_STATUS_NORMAL_OPERATION: {
            co2_status = 1;
            break;
          }
        case CM1106_I2C_STATUS_OPERATING_TROUBLE: {
            co2_status = 2;
            break;
          }
        case CM1106_I2C_STATUS_OUT_OF_FS: {
            co2_status = 3;
            break;
          }
        case CM1106_I2C_STATUS_NON_CALIBRATED: {
            co2_status = 4;
            break;
          }
      }
    }
    
  
  //LED

  if(LED_AUTO == 1){
    if(digitalRead(CDSDIGITAL) == HIGH){
      digitalWrite(LED_RELAY,LOW);
      cds_digital = 0;
      led_status = 1;
    }
    else if (digitalRead(CDSDIGITAL)==LOW){
      digitalWrite(LED_RELAY,HIGH);
      cds_digital = 1;
      led_status = 0;
    }
   }
    else if (LED_AUTO == 0 ){
      if(LED_FORCE == 1){
          digitalWrite(LED_RELAY,LOW);
          led_status = 1;
      }
      else if (LED_FORCE == 0){
        digitalWrite(LED_RELAY,HIGH);
        led_status = 0;
      }
   }

   //FAN

   if(FAN_AUTO == 1){
    if(co2 >= 800 || t > command_temp){
      digitalWrite(FAN_RELAY,LOW);
      fan_status = 1;
    }
    else {
      digitalWrite(FAN_RELAY,HIGH);
      fan_status = 0;
    }
   }
    else if (FAN_AUTO == 0 ){
      if(FAN_FORCE == 1){
          digitalWrite(FAN_RELAY,LOW);
          fan_status = 1;
      }
      else if (FAN_FORCE == 0){
        digitalWrite(FAN_RELAY,HIGH);
        fan_status = 0;
      }
   }


    do{
      String text = Serial3.readStringUntil('\n');
      Serial.println(text);
      if(text == "LED_ON" ) {
          LED_FORCE = 1;
          LED_AUTO = 0;
          Serial.print("FORCE : ");
          Serial.print(LED_FORCE);
          Serial.print(" AUTO : ");
          Serial.println(LED_AUTO);
      }
      else if (text == "LED_OFF" ) {
          LED_FORCE = 0;
          LED_AUTO = 0;
          Serial.print("FORCE : ");
          Serial.print(LED_FORCE);
          Serial.print(" AUTO : ");
          Serial.println(LED_AUTO);
      }
      else if ( text == "LED_AUTO" ) {
          LED_AUTO = 1;
          LED_FORCE = 0;
          Serial.print("FORCE : ");
          Serial.print(LED_FORCE);
          Serial.print(" AUTO : ");
          Serial.println(LED_AUTO);
      }
      else if(text == "FAN_ON" ) {
          FAN_FORCE = 1;
          FAN_AUTO = 0;
          Serial.print("FORCE : ");
          Serial.print(FAN_FORCE);
          Serial.print(" AUTO : ");
          Serial.println(FAN_AUTO);
      }
      else if (text == "FAN_OFF" ) {
          FAN_FORCE = 0;
          FAN_AUTO = 0;
          Serial.print("FORCE : ");
          Serial.print(FAN_FORCE);
          Serial.print(" AUTO : ");
          Serial.println(FAN_AUTO);
      }
      else if ( text == "FAN_AUTO" ) {
          FAN_FORCE = 0;
          FAN_AUTO = 1;
          Serial.print("FORCE : ");
          Serial.print(FAN_FORCE);
          Serial.print(" AUTO : ");
          Serial.println(FAN_AUTO);
      }
      else if (text.startsWith("T&")){
        int check = text.indexOf("&");
        String check_temp = text.substring(check+1,text.length());
        Serial.println(check_temp);
        command_temp = check_temp.toFloat();
        Serial.println(command_temp);
      }
      else if (text.startsWith("H&")){
          int check = text.indexOf("&");
          String check_humi = text.substring(check+1,text.length());
          Serial.println(check_humi);
          command_humi = check_humi.toFloat();
          Serial.println(command_humi);
      }
    }

    if (currentMillis - previousMillis > delayTime) {

        dtostrf(lux, 3, 0, cds_analog_tmp);
        dtostrf(cds_digital, 1, 0, cds_digital_tmp);
        dtostrf(t, 4, 1, tt_tmp);
        dtostrf(h, 4, 1, hh_tmp);
        dtostrf(tdsValue, 4,0, tds_temp);
        dtostrf(co2, 4,0, co2_temp);
        dtostrf(co2_status, 1,0, co2_status_temp);
        dtostrf(fan_status, 1,0, fan_status_temp);
        dtostrf(led_status, 1,0, led_status_temp);
        dtostrf(command_temp, 4,2, command_temp_temp);

        // temp & humidity & lux & cds_digital & tds & co2 & co2_status
        sprintf(data, " %s&%s&%s&%s&%s&%s&%s&%s&%s&%s!",
                tt_tmp,
                hh_tmp,
                cds_analog_tmp,
                cds_digital_tmp,
                tds_temp,
                co2_temp,
                co2_status_temp,
                fan_status_temp,
                led_status_temp,
                command_temp_temp);

        Serial3.write(data);
        timer0_millis = 0;
    }

}
