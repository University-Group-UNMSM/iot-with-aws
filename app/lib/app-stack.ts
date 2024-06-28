import { Construct } from "constructs";
import { ConfigProps } from "./config";
import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import * as iot from 'aws-cdk-lib/aws-iot';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { createName } from "../utils/createName";
import { KinesisEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

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

    const TOPIC = 'raspberry/sensor';
		const ERROR_TOPIC = 'kinesis/errors';

    // AWS KINESIS DATA STREAM
		const stream = new kinesis.Stream(this, 'DataStream', {
			streamName: createName('kinesis', 'data_stream'),
			encryption: kinesis.StreamEncryption.MANAGED,
		});

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

    table.grantReadWriteData(savePayloadFunction);

		savePayloadFunction.addEventSource(
			new KinesisEventSource(stream, {
				batchSize: 100,
				startingPosition: lambda.StartingPosition.LATEST,
			})
		);

    // DEFINE IAM ROLE FOR IOT RULES
		const actionRole = new iam.Role(this, 'ActionRole', {
			assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
		});

    // ADD A POLICY TO ALLOW SEND DATA TO KINESIS
		const kinesisPolicyStatement = new iam.PolicyStatement({
			actions: ['kinesis:PutRecord'],
			resources: [stream.streamArn],
		});
		actionRole.addToPolicy(kinesisPolicyStatement);

    // DEFINE IAM ROLE FOR HANDLING IOT RULES ERRORS
		const errorActionRole = new iam.Role(this, 'ErrorActionRole', {
			assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
		});

    // ADD A POLICY TO ALLOW PUBLISH ERRORS TO IOT CORE
		const errorKinesisPolicyStatement = new iam.PolicyStatement({
			actions: ['iot:Publish'],
    resources: [`arn:aws:iot:${props.env?.region}:${props.env?.account}:topic/${ERROR_TOPIC}`],
		});
		errorActionRole.addToPolicy(errorKinesisPolicyStatement);

    // IOT RULES
    new iot.CfnTopicRule(this, 'Rule', {
			ruleName: createName('iot_core', 'rule'),
			topicRulePayload: {
				sql: `SELECT * FROM '${TOPIC}'`,
				actions: [
					{
						kinesis: {
							roleArn: actionRole.roleArn,
							streamName: stream.streamName,
							partitionKey: '${newuuid()}',
						},
					},
				],
				errorAction: {
					republish: {
						roleArn: errorActionRole.roleArn,
						topic: ERROR_TOPIC,
						qos: 0,
					},
				},
			},
		});
  }
}
