import RPi.GPIO as GPIO
import paho.mqtt.client as mqtt
import paho.mqtt.enums as mqtt_enum
import random
import ssl
import json
import uuid
from decouple import config
from time import sleep
from datetime import datetime

def run():
  # MQTT Configuration
  broker_address = config('BROKER_ADDRESS', cast=str)
  broker_port = config('BROKER_PORT', cast=int)

  # Certificates
  # This folders are created by the Greengrass Core by default
  root_ca = "/greengrass/v2/rootCA.pem"
  thing_cert = "/greengrass/v2/thingCert.crt"
  private_key = "/greengrass/v2/privKey.key"

  topic = "soil/moisture"
  device = "rasbperry"

  # GPIO Configuration
  GPIO.setmode(GPIO.BCM)
  sensor_pin = 21 # GPIO pin number where the sensor is connected
  GPIO.setup(sensor_pin, GPIO.IN)

  # Callback function to handle connection established event
  def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker with result code "+str(rc))
    # Subscribe to the input topic
    client.subscribe(topic)

  # Callback function to handle message received event
  def on_message(client, userdata, msg):
    print(f"Received message on topic {msg.topic}: {msg.payload.decode()}")

  # Create MQTT client instance
  client_id = f'python-mqtt-{random.randint(0, 1000)}'
  client = mqtt.Client(callback_api_version=mqtt_enum.CallbackAPIVersion.VERSION1, client_id=client_id)

  # Set callback functions
  client.on_connect = on_connect
  client.on_message = on_message

  # Configure certificates
  client.tls_set(
    ca_certs=root_ca,
    certfile=thing_cert,
    keyfile=private_key,
    cert_reqs=ssl.CERT_REQUIRED,
    tls_version=ssl.PROTOCOL_TLSv1_2,
    ciphers=None
  )

  # Connect to MQTT broker
  connected = False
  while not connected:
    try:
      print("Attempting to connect to MQTT broker...")
      client.connect(broker_address, broker_port)
      connected = True
      print("Successfully connected to MQTT broker")
    except TimeoutError as e:
      print("Connection attempt timed out. Retrying in 5 seconds...")
      sleep(5)

  client.loop_start()

  while True:
    is_soil_wet = GPIO.input(sensor_pin) == GPIO.LOW
    # Get current timestamp
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')

    # Crea un diccionario y asigna los valores
    data = {
      "id": str(uuid.uuid4()),
      "timestamp": timestamp,
      "device": device,
      "isSoilWet": is_soil_wet
    }

    # Publish data to the output topic
    try:
        payload = json.dumps(data)
        client.publish(topic, payload, qos=1)
    except Exception as e:
        print("Error al publicar en el topic:", topic)
        print("Error:", e)
    else:
        print('Failed to get reading. Try again!')
