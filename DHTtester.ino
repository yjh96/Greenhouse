  // Example testing sketch for various DHT humidity/temperature sensors
// Written by ladyada, public domain
#include "DHT.h"

#define DHTPIN 8     // what pin we're connected to
#define CDSDIGITAL 7
#define CDSANALOG A0
#define LED_RELAY 22 

#define DHTTYPE DHT22   // DHT 22  (AM2302)

extern volatile unsigned long timer0_millis;

DHT dht(DHTPIN, DHTTYPE);

unsigned long previousMillis = 0;
const long delayTime = 5000;
signed int LED_FORCE = 0;
signed int LED_AUTO = 1;

void setup() {
  Serial.begin(115200);
  Serial3.begin(115200);
  dht.begin();
  pinMode(LED_RELAY, OUTPUT);
}

void loop() {
    unsigned long currentMillis = millis();
    
    signed int cds_analog = analogRead(CDSANALOG);
    signed int cds_digital;
    char cds_analog_tmp[16];
    char cds_digital_tmp[16];

    if(LED_AUTO == 1){
        if(digitalRead(CDSDIGITAL) == HIGH){
            digitalWrite(LED_RELAY,LOW);
        }
        else if (digitalRead(CDSDIGITAL)==LOW){
            digitalWrite(LED_RELAY,HIGH);
        }
    }

    else if (LED_AUTO == 0 ){
        if(LED_FORCE == 1){
            digitalWrite(LED_RELAY,LOW);
        }
        else if (LED_FORCE == 0){
            digitalWrite(LED_RELAY,HIGH);
        }
    }
    /**
    if(digitalRead(CDSDIGITAL) == HIGH ){ //어두움
        cds_digital = 0;
        if(LED_FORCE == 0 && LED_AUTO == 1){
          digitalWrite(LED_RELAY,HIGH);
        }
        else if (LED_FORCE == 1){
        digitalWrite(LED_RELAY,LOW);
        }
    }
    if (digitalRead(CDSDIGITAL) == LOW){ //밝음
        cds_digital = 1;
        if(LED_FORCE == 1 && LED_AUTO == 1){
          digitalWrite(LED_RELAY,LOW);
        }
        else if (LED_FORCE == 0){
        digitalWrite(LED_RELAY,HIGH);
        }
    }
    **/

    float h = dht.readHumidity();
    char hh_tmp[16];
    float t = dht.readTemperature();
    char tt_tmp[16];
    char data[256];

    if(Serial3.available()){
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
    }

    // check if returns are valid, if they are NaN (not a number) then something went wrong!
    //if (isnan(t) || isnan(h)) {
    //Serial.println("Failed to read from DHT");
    //} else
    if (currentMillis - previousMillis > delayTime) {

        dtostrf(cds_analog, 3, 0, cds_analog_tmp);
        dtostrf(cds_digital, 1, 0, cds_digital_tmp);
        dtostrf(t, 4, 1, tt_tmp);
        dtostrf(h, 4, 1, hh_tmp);

        sprintf(data, " %s&%s&%s&%s\n", tt_tmp, hh_tmp, cds_analog_tmp, cds_digital_tmp);

        Serial.print(data);
        Serial3.write(data);
        timer0_millis = 0;
    }

}
