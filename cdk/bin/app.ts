#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { ApiStack } from "../lib/api-stack";

const app = new App();
new ApiStack(app, "ServerlessApiStack", {
  /* env: { account: process.env.CDK_DEFAULT_ACCOUNT,
           region: process.env.CDK_DEFAULT_REGION } */
  env: {
    account: "650251698778",
    region: "ap-northeast-1",
  },
});