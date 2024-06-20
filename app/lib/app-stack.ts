import { Construct } from "constructs";
import { ConfigProps } from "./config";
import { Stack, StackProps } from "aws-cdk-lib";

export type AppStackProps = StackProps & {
  config: Readonly<ConfigProps>;
};

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const { config } = props;
  }
}
