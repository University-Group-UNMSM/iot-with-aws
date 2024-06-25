import { Construct } from "constructs";
import { ConfigProps } from "./config";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export type AppStackProps = cdk.StackProps & {
  config: Readonly<ConfigProps>;
};

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
		super(scope, id, props);
		
		// AWS DYNAMODB
		const table = new dynamodb.Table(this, 'Table', {
			tableName: 'temp-measure-table',
			partitionKey: {
				name: 'id',
				type: dynamodb.AttributeType.STRING,
			},
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});
  }
}
