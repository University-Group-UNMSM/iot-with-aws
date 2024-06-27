import { Construct } from "constructs";
import { ConfigProps } from "./config";
import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";

function createResourceName(name: string) {
  const project = "iot-stack";

  return `${project}-${name}`;
}

export type AppStackProps = StackProps & {
  config: Readonly<ConfigProps>;
};

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    // AWS DYNAMODB
    const table = new Table(this, "Table", {
      tableName: createResourceName("temp-measure-table"),
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // AWS LAMBDAS FUNCTION
    const savePayloadFunction = new Function(this, "SavePayloadFunction", {
      runtime: Runtime.PYTHON_3_12,
      handler: "save_payload.lambda_handler",
      functionName: createResourceName("save-payload-lambda"),
      description: "Lambda function para guardar el payload en Dynamodb.",
      retryAttempts: 0,
      code: Code.fromAsset("lambda-code"),
      timeout: Duration.seconds(240),
      memorySize: 1024,
      environment: {
        ["TBL_NAME"]: table.tableName,
      },
    });
  }
}
