import { LexV2Event } from "aws-lambda";
import { mode, mean, median, min } from "simple-statistics";
import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const dynamo = new DynamoDBClient();
const lambda = new LambdaClient();

const featuresDict: Record<string, string> = {
  temperatura: "temperature",
  humedad: "humidity",
};

type SensorItem = {
  id: string;
  device: string;
  timestamp: string;
  temperature: number;
  humidity: number;
};

export const handler = async (event: LexV2Event) => {
  console.log("event=", event);

  if (event.sessionState.intent.name == "Irrigation") {
    await lambda.send(
      new InvokeCommand({
        FunctionName: "iot-plant-activate-irrigation",
        Payload: JSON.stringify({ duration: 3 }),
        InvocationType: "Event",
      })
    );

    return {
      sessionState: {
        dialogAction: {
          type: "Close",
        },
        intent: {
          name: "Irrigation",
          state: "Fulfilled",
        },
      },
      messages: [
        {
          contentType: "PlainText",
          content: "!Regando planta!",
        },
      ],
    };
  }

  const slots = event.interpretations[0].intent.slots;
  console.log("slots=", slots);
  const device_name = slots.device?.value.originalValue;
  const feature_name = slots.feature?.value.originalValue;
  const aggregation = slots.aggregation?.value.originalValue;

  console.log("event.bot.name=", event.bot.name);

  console.log(`request received for device: ${device_name}`);
  console.log(`request received for feature: ${feature_name}`);
  console.log(`request received for aggregation: ${aggregation}`);

  const data = await getDynamoData(device_name!, feature_name!, aggregation!);
  console.log(data);

  return close(data, "Fulfilled", {
    contentType: "PlainText",
    content: "response-test",
  });
};

const getDynamoData = async (
  device: string,
  feature: string,
  aggregation: string
) => {
  console.log("getDynamoData");

  const response = await dynamo.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      IndexName: "device-index",
      KeyConditionExpression: "device = :device",
      ExpressionAttributeValues: {
        ":device": { S: device },
      },
      ScanIndexForward: false,
      Limit: 600,
    })
  );

  console.log("response=", response);
  const featureId = featuresDict[feature] as "temperature" | "humidity";

  const resultAggregated = calculateAggregation(
    response,
    aggregation,
    featureId,
    device
  );
  console.log(resultAggregated);

  return resultAggregated;
};

const calculateAggregation = (
  response: QueryCommandOutput,
  aggregation: string,
  feature: "temperature" | "humidity",
  device: string
) => {
  const formattedValues = response.Items?.map((item) =>
    unmarshall(item)
  ) as SensorItem[];
  const rawValues = formattedValues.map((item: SensorItem) => item[feature]);
  const values = rawValues.filter((value) => value !== undefined);
  const timestamps = formattedValues.map((item: SensorItem) => item.timestamp);

  console.log(formattedValues);
  console.log(values);
  console.log(timestamps);

  if (aggregation === "promedio") {
    return `El valor promedio de la ${feature} is ${mean(values)}`;
    // return `El valor promedio de la característica ${featureId} para el dispositivo ${deviceId} es ${
    //   Math.random() * 100
    // }`;
  } else if (aggregation === "ultimo") {
    const lastTimestamp = timestamps[0];
    const lastDate = getFormattedDate(lastTimestamp);
    console.log(lastDate);
    // return `The last value of the feature ${featureId} for the device ${deviceId} is ${values[0]} at ${latestTimestamp}`;
    return `El último valor de la característica ${feature} es ${
      values[0]
    } en ${lastDate.toLocaleString()}`;
  } else if (aggregation === "rango") {
    // return `The range of values of the feature ${featureId} for the device ${deviceId} is from ${Math.min(
    //   ...values
    // )} to ${Math.max(...values)}`;
    return `El rango de valores de la característica ${feature} es de ${Math.min(
      ...values
    )} a ${Math.max(...values)}`;
  } else if (aggregation === "moda") {
    // return `The mode value of the feature ${featureId} for the device ${deviceId} is ${mode(
    //   values
    // )}`;
    return `El valor de moda de la ${feature} es ${mode(values)}`;
  } else if (aggregation === "mediana") {
    // return `The median value of the feature ${featureId} for the device ${deviceId} is ${median(
    //   values
    // )}`;
    return `La mediana de la ${feature} es ${median(values)}`;
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

const getFormattedDate = (timestamp: string) => {
  let year = parseInt(timestamp.substring(0, 4), 10);
  let month = parseInt(timestamp.substring(4, 6), 10) - 1; // Los meses en JavaScript son 0-indexados
  let day = parseInt(timestamp.substring(6, 8), 10);
  let hours = parseInt(timestamp.substring(8, 10), 10);
  let minutes = parseInt(timestamp.substring(10, 12), 10);
  let seconds = parseInt(timestamp.substring(12, 14), 10);

  return new Date(year, month, day, hours, minutes, seconds);
};
