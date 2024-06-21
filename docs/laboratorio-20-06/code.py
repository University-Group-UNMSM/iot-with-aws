import network
from time import sleep
from machine import Pin
import dht
import ujson
from umqtt.simple import MQTTClient

cert = """"""

key = """"""

ssl_params={"key":key, "cert":cert, "server_side":False}

# MQTT Server Parameters
MQTT_CLIENT_ID = "my_client_id"
MQTT_BROKER    = "myendpoint.iot.us-east-1.amazonaws.com"
MQTT_PORT      = 8883
MQTT_TEMP_TOPIC= "sdk/test/python"
MQTT_HUM_TOPIC = "indobot/hum"

sensor = dht.DHT22(Pin(15))

def connect_to_wifi():
    print("conectando wifi", end="")
    sta_if = network.WLAN(network.STA_IF)
    sta_if.active(True)
    sta_if.connect("Wokwi-GUEST", "")
    while not sta_if.isconnected():
        print(".", end="")
        sleep(0.1)
    print("Successfully connected to Wifi!")

def connect_to_mqtt():
    print('connecting to aws iot core')
    client = MQTTClient(
        MQTT_CLIENT_ID,
        MQTT_BROKER,
        port=MQTT_PORT,
        ssl=True,
        ssl_params=ssl_params
    )
    client.connect()
    return client

connect_to_wifi()

mqtt_client = connect_to_mqtt()

while True:
    try:
        sleep(2)

        sensor.measure()
        temp = sensor.temperature()
        hum = sensor.humidity()
        temp_f = temp * (9/5) + 32.0

        mqtt_client.publish(MQTT_TEMP_TOPIC, str(temp), qos=0)
        print('Temperature: %3.1f C' %temp)
        print('Temperature: %3.1f F' %temp_f)
        print('Humidity: %3.1f %%' %hum)
    except OSError as e:
        print(e)
        print('Failed to read sensor.')


