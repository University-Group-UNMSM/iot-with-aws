#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AppStack } from "../lib/app-stack";
import { getConfig } from "../lib/config";
import { BotStack } from "../lib/bot-stack";

const config = getConfig();

const app = new cdk.App();

const baseStack = new AppStack(app, "IotStack", {
  env: { account: config.AWS_ACCOUNT_ID, region: config.AWS_REGION },
  config,
});

new BotStack(app, "BotStack", {
  env: { account: config.AWS_ACCOUNT_ID, region: config.AWS_REGION },
  tableName: baseStack.tableName,
});
