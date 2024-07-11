import {
  IoTDataPlaneClient,
  PublishCommand,
} from "@aws-sdk/client-iot-data-plane";

const client = new IoTDataPlaneClient({ region: "us-east-1" });

export const handler = async (event: { duration: number }) => {
  await client.send(
    new PublishCommand({
      topic: "relay/activate",
      payload: Buffer.from(JSON.stringify({ duration: event.duration })),
      qos: 1,
    })
  );
};
