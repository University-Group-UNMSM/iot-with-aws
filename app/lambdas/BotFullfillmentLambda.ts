import { LexV2Event } from "aws-lambda";
import { mode, mean, median } from "simple-statistics";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const dynamo = new DynamoDBClient();

export const handler = async (event: LexV2Event) => {
  console.log("event=", event);

  const slots = event.interpretations[0].intent.slots;
  console.log("slots=", slots);
  const device_name = slots.device?.value.originalValue;
  const feature_name = slots.feature?.value.originalValue;
  const aggregation = slots.aggregation?.value.originalValue;

  console.log("event.bot.name=", event.bot.name);

  console.log(`request received for device: ${device_name}`);
  console.log(`request received for feature: ${feature_name}`);
  console.log(`request received for aggregation: ${aggregation}`);

  const data = getDynamoData(device_name!, feature_name!, aggregation!);
  console.log(data);

  return close(data, "Fulfilled", {
    contentType: "PlainText",
    content: "response-test",
  });
};

const getDynamoData = async (
  deviceId: string,
  featureId: string,
  aggregationId: string
) => {
  console.log("getDynamoData");

  const response = await dynamo.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "device_id = :device_id",
      ExpressionAttributeValues: {
        ":device_id": { S: deviceId },
      },
    })
  );

  console.log("response=", response);

  const resultAggregated = calculateAggregation(
    response,
    aggregationId,
    featureId,
    deviceId
  );
  console.log(resultAggregated);

  return resultAggregated;
};

const calculateAggregation = (
  response: any,
  aggregation: string,
  featureId: string,
  deviceId: string
) => {
  const values = response.Items.map((item: any) => item[featureId]);
  const timestamp = response.Items.map((item: any) => item.timestamp);

  if (aggregation === "promedio") {
    return `The mean value of the feature ${featureId} for the device ${deviceId} is ${mean(
      values
    )}`;
  } else if (aggregation === "ultimo") {
    const latestTimestamp = new Date(timestamp[0]);
    console.log(timestamp);
    return `The last value of the feature ${featureId} for the device ${deviceId} is ${values[0]} at ${latestTimestamp}`;
  } else if (aggregation === "rango") {
    return `The range of values of the feature ${featureId} for the device ${deviceId} is from ${Math.min(
      ...values
    )} to ${Math.max(...values)}`;
  } else if (aggregation === "moda") {
    return `The mode value of the feature ${featureId} for the device ${deviceId} is ${mode(
      values
    )}`;
  } else if (aggregation === "media") {
    return `The median value of the feature ${featureId} for the device ${deviceId} is ${median(
      values
    )}`;
  } else {
    return null;
  }
};

const close = (event_data: any, fulfillment_state: string, message: any) => {
  const response = {
    sessionState: {
      dialogAction: {
        type: "Close",
      },
      intent: {
        name: "GetData",
        state: fulfillment_state,
      },
    },
    messages: [
      {
        contentType: "PlainText",
        content: event_data,
      },
    ],
  };

  console.log(
    `Lambda fulfillment function response = \n${JSON.stringify(response)}`
  );

  return response;
};
