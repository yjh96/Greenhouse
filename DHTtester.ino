// Example testing sketch for various DHT humidity/temperature sensors
// Written by ladyada, public domain
#include <SoftwareSerial.h>
#include "DHT.h"

#define DHTPIN 8     // what pin we're connected to
#define CDSDIGITAL 7
#define CDSANALOG A0
#define LED_RELAY 22 
SoftwareSerial esp(15,14);

// Uncomment whatever type you're using!
//#define DHTTYPE DHT11   // DHT 11 
#define DHTTYPE DHT22   // DHT 22  (AM2302)
//#define DHTTYPE DHT21   // DHT 21 (AM2301)

// Connect pin 1 (on the left) of the sensor to +5V
// Connect pin 2 of the sensor to whatever your DHTPIN is
// Connect pin 4 (on the right) of the sensor to GROUND
// Connect a 10K resistor from pin 2 (data) to pin 1 (power) of the sensor

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200); 
  Serial.println("DHTxx test!");
  esp.begin(115200);
  dht.begin();
  pinMode(LED_RELAY, OUTPUT);
}

void loop() {

  signed int cds_analog = analogRead(CDSANALOG);
  signed int cds_digital;
  char cds_analog_tmp[16];
  char cds_digital_tmp[16];
  if(digitalRead(CDSDIGITAL) == HIGH ){ //어두움
    cds_digital = 0;
    digitalWrite(LED_RELAY,LOW);
  }
  if (digitalRead(CDSDIGITAL) == LOW){ //밝음
    cds_digital = 1;
    digitalWrite(LED_RELAY,HIGH);
  }
  
  float h = dht.readHumidity();
  char hh_tmp[16];
  float t = dht.readTemperature();
  char tt_tmp[16];
  char data[256];


  // check if returns are valid, if they are NaN (not a number) then something went wrong!
  if (isnan(t) || isnan(h)) {
    Serial.println("Failed to read from DHT");
  } else {

    dtostrf(cds_analog,3,0,cds_analog_tmp);
    dtostrf(cds_digital,1,0,cds_digital_tmp);
    dtostrf(t,4,1,tt_tmp);
    dtostrf(h,4,1,hh_tmp);

    
    sprintf(data," %s&%s&%s&%s\n", tt_tmp, hh_tmp, cds_analog_tmp, cds_digital_tmp);
    
    Serial.print(data);
    esp.write(data);
    esp.read();
    delay(3000);
    }
  
}
