import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
sensor_pin = 21
GPIO.setup(sensor_pin, GPIO.IN)

while True:
    if GPIO.input(sensor_pin) == GPIO.LOW:
        print("Soil is wet")
    else:
        print("Soil is dry")
    time.sleep(5)

