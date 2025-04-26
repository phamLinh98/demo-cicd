import { Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
      CodePipeline,
      CodePipelineSource,
      CodeBuildStep,
} from 'aws-cdk-lib/pipelines';
import { ApiStack } from './api-stack';

import 'dotenv/config';   // tự load .env trong cwd

export class ApiDeployStage extends Stage {
      constructor(scope: Construct, id: string, props?: StageProps) {
            super(scope, id, props);
            new ApiStack(this, 'ServerlessApiStack', props);
      }
}

export class PipelineStack extends Stack {
      constructor(scope: Construct, id: string, props?: StackProps) {
            super(scope, id, props);

            const githubConnectionArn = process.env.GITHUB_CONNECTION_ARN;
            const account = process.env.CDK_DEFAULT_ACCOUNT;
            const region = process.env.CDK_DEFAULT_REGION;

            console.log('GITHUB_CONNECTION_ARN:', githubConnectionArn);
            console.log('CDK_DEFAULT_ACCOUNT:', account);
            console.log('CDK_DEFAULT_REGION:', region);

            // Validate môi trường
            if (!githubConnectionArn) {
                  throw new Error('Environment variable GITHUB_CONNECTION_ARN is required');
            }
            if (!account || !region) {
                  throw new Error('Environment variables CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION are required');
            }

            const pipeline = new CodePipeline(this, 'ServerlessPipeline', {
                  pipelineName: 'ServerlessDemoPipeline',
                  synth: new CodeBuildStep('SynthStep', {
                        input: CodePipelineSource.connection(
                              'phamLinh98/demo-cicd',
                              'develop',
                              { connectionArn: githubConnectionArn },
                        ),
                        buildEnvironment: { privileged: true },
                        commands: [
                              'npm install -g aws-cdk',
                              'npm ci',
                              'npm --prefix cdk ci',
                              'npm run build:lambda',
                              'ls -la',
                              'ls -la src/build/lambda',
                              'ls -la cdk',
                              'echo "export CDK_DEFAULT_ACCOUNT=$CDK_DEFAULT_ACCOUNT" >> .env',
                              'echo "export CDK_DEFAULT_REGION=$CDK_DEFAULT_REGION" >> .env',
                              // "npx cdk synth --app 'npx ts-node --prefer-ts-exts cdk/bin/app.ts' --output cdk/cdk.out",
                              "npx cdk deploy --app 'npx ts-node --prefer-ts-exts cdk/bin/app.ts' --output cdk/cdk.out",
                              'ls -la',
                        ],
                        primaryOutputDirectory: 'cdk/cdk.out',
                  }),
            });

            pipeline.addStage(
                  new ApiDeployStage(this, 'Prod', {
                        env: { account, region },
                  }),
            );
      }
}