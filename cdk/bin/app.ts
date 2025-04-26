#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { ApiStack } from "../lib/api-stack";
import { PipelineStack } from "../lib/pipeline-stack";
import 'dotenv/config';   // tự load .env trong cwd

const app = new App();
new ApiStack(app, "ServerlessApiStack", {
  /* env: { account: process.env.CDK_DEFAULT_ACCOUNT,
           region: process.env.CDK_DEFAULT_REGION } */
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// const app = new App();
// new PipelineStack(app, 'PipelineStack', {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: process.env.CDK_DEFAULT_REGION,
//   },
// });