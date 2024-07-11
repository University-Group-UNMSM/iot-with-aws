import RPi.GPIO as GPIO
import paho.mqtt.client as mqtt
import paho.mqtt.enums as mqtt_enum
import random
import ssl
from time import sleep
import json

def run():
  # MQTT Configuration
  broker_address = 'a2ckoa5arygoe1-ats.iot.us-east-1.amazonaws.com'
  broker_port = 8883

  # Certificates
  # This folders are created by the Greengrass Core by default
  root_ca = "/greengrass/v2/rootCA.pem"
  thing_cert = "/greengrass/v2/thingCert.crt"
  private_key = "/greengrass/v2/privKey.key"

  topic = "relay/activate"

  GPIO.setmode(GPIO.BCM)
  channel = 18
  GPIO.setup(channel, GPIO.OUT)

  # Callback function to handle connection established event
  def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker with result code "+str(rc))
    # Subscribe to the input topic
    client.subscribe(topic)

  # Callback function to handle message received event
  def on_message(client, userdata, msg):
    print(f"Received message on topic {msg.topic}: {msg.payload.decode()}")
    payload = json.loads(msg.payload.decode())
    GPIO.output(channel, GPIO.LOW)
    sleep(payload.get('duration', 3))
    GPIO.output(channel, GPIO.HIGH)

  # Create MQTT client instance
  client_id = f'python-mqtt-{random.randint(0, 1000)}'
  print(f"Client ID: {client_id}")
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

  client.loop_forever()
