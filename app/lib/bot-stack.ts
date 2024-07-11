import { Duration, Stack, StackProps } from "aws-cdk-lib";
import {
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { CfnBot, CfnBotAlias, CfnBotVersion } from "aws-cdk-lib/aws-lex";
import { Construct } from "constructs";
import * as slots from "./bot/slots";
import * as intents from "./bot/intents";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import path = require("path");
import { RetentionDays } from "aws-cdk-lib/aws-logs";

type BotStackProps = StackProps & {
  tableName: string;
};

export class BotStack extends Stack {
  constructor(scope: Construct, id: string, props: BotStackProps) {
    super(scope, id, props);

    const lambdaRole = new Role(this, "BotLambdaRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    const botLambda = new NodejsFunction(this, "BotFullfillmentLambda", {
      runtime: Runtime.NODEJS_20_X,
      functionName: "iot-plant-bot-fulfillment",
      memorySize: 256,
      timeout: Duration.seconds(10),
      logRetention: RetentionDays.ONE_MONTH,
      role: lambdaRole,
      entry: path.resolve("lambdas/BotFullfillmentLambda.ts"),
      environment: {
        TABLE_NAME: props.tableName,
      },
    });
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    lambdaRole.addToPolicy(
      new PolicyStatement({
        actions: ["dynamodb:*"],
        resources: [
          "arn:aws:dynamodb:" +
            Stack.of(this).region +
            ":" +
            Stack.of(this).account +
            ":table/" +
            props.tableName +
            "/*",
        ],
      })
    );

    const botRole = new Role(this, "BotRole", {
      assumedBy: new ServicePrincipal("lex.amazonaws.com"),
    });

    botRole.addToPolicy(
      new PolicyStatement({
        actions: ["lex:*", "polly:SynthesizeSpeech"],
        resources: ["*"],
      })
    );

    botRole.addToPolicy(
      new PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [botLambda.functionArn],
      })
    );

    const bot = new CfnBot(this, "LexBot", {
      roleArn: botRole.roleArn,
      dataPrivacy: {
        ChildDirected: true,
      },
      idleSessionTtlInSeconds: 120,
      name: "iot-plant-bot",
      botLocales: [
        {
          localeId: "es_419",
          nluConfidenceThreshold: 0.4,
          slotTypes: [
            slots.deviceTypeName,
            slots.featureTypeName,
            slots.aggregationTypeName,
          ],
          intents: [
            intents.greetingIntent,
            intents.getDataIntent(
              slots.deviceTypeName.name,
              slots.featureTypeName.name,
              slots.aggregationTypeName.name
            ),
            intents.fallbackIntent,
          ],
        },
      ],
    });

    const botVersion = new CfnBotVersion(this, "LexBotVersion", {
      botId: bot.attrId,
      botVersionLocaleSpecification: [
        {
          localeId: "es_419",
          botVersionLocaleDetails: {
            sourceBotVersion: "DRAFT",
          },
        },
      ],
    });

    const botAlias = new CfnBotAlias(this, "LexBotAliasTest", {
      botAliasName: "iot-plant-alias-test",
      botId: bot.attrId,
      botVersion: botVersion.attrBotVersion,
      botAliasLocaleSettings: [
        {
          botAliasLocaleSetting: {
            enabled: true,
            codeHookSpecification: {
              lambdaCodeHook: {
                codeHookInterfaceVersion: "1.0",
                lambdaArn: botLambda.functionArn,
              },
            },
          },
          localeId: "es_419",
        },
      ],
    });

    botLambda.addPermission("LexInvokePermission", {
      principal: new ServicePrincipal("lex.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: botAlias.attrArn,
    });
  }
}
