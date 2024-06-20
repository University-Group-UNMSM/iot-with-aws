import * as dotenv from "dotenv";
import path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export type ConfigProps = {
  AWS_REGION: string;
  AWS_ACCOUNT_ID: string;
};

export const getConfig = (): ConfigProps => {
  return {
    AWS_REGION: process.env.AWS_REGION ?? "",
    AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID ?? "us-east-1",
  };
};
