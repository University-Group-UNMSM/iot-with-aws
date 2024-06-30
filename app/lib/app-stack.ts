import { Construct } from "constructs";
import { ConfigProps } from "./config";
import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { CfnTopicRule } from "aws-cdk-lib/aws-iot";
import { createResourceName } from "../utils/createName";

export type AppStackProps = StackProps & {
  config: Readonly<ConfigProps>;
};

export class AppStack extends Stack {
  public tableName;

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const TOPIC = "soil/moisture";
    const ERROR_TOPIC = "dynamodb/errors";

    // AWS DYNAMODB
    const table = new Table(this, "Table", {
      tableName: createResourceName("sensor-data-table"),
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.tableName = table.tableName;

    // DEFINE IAM ROLE FOR IOT RULES
    const actionRole = new Role(this, "ActionRole", {
      assumedBy: new ServicePrincipal("iot.amazonaws.com"),
    });

    // ADD A POLICY TO ALLOW SEND DATA TO DYNAMODB
    const dynamodbPolicyStatement = new PolicyStatement({
      actions: ["dynamodb:PutItem"],
      resources: [table.tableArn],
    });
    actionRole.addToPolicy(dynamodbPolicyStatement);

    // DEFINE IAM ROLE FOR HANDLING IOT RULES ERRORS
    const errorActionRole = new Role(this, "ErrorActionRole", {
      assumedBy: new ServicePrincipal("iot.amazonaws.com"),
    });

    // ADD A POLICY TO ALLOW PUBLISH ERRORS TO IOT CORE
    const errorDynamodbPolicyStatement = new PolicyStatement({
      actions: ["iot:Publish"],
      resources: [
        `arn:aws:iot:${props.env?.region}:${props.env?.account}:topic/${ERROR_TOPIC}`,
      ],
    });
    errorActionRole.addToPolicy(errorDynamodbPolicyStatement);

    // IOT RULES
    new CfnTopicRule(this, "Rule", {
      ruleName: "iot_stack_dynamo_rule",
      topicRulePayload: {
        sql: `SELECT * FROM '${TOPIC}'`,
        actions: [
          {
            dynamoDBv2: {
              roleArn: actionRole.roleArn,
              putItem: {
                tableName: table.tableName,
              },
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
