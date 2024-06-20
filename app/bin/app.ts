#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AppStack } from "../lib/app-stack";
import { getConfig } from "../lib/config";

const config = getConfig();

const app = new cdk.App();

new AppStack(app, "AppStack", {
  env: { account: config.AWS_ACCOUNT_ID, region: config.AWS_REGION },
  config,
});
