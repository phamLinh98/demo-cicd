import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /* DynamoDB tables */
    // const userTable = new dynamodb.Table(this, "UserTable", {
    //   partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
    //   billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    //   removalPolicy: RemovalPolicy.RETAIN,
    //   tableName: "user",
    // });

    const uploadStatusTable = new dynamodb.Table(this, "UploadStatusTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      tableName: "upload-status",
    });

    /* Lambda layer */

    // get-upload-status call lambda function get-upload-status (src/build/lambda/api-get-upload-status.mjs)
    const getUploadStatusFn = new lambda.Function(this, "GetUploadStatusFn", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "get-upload-status.handler",
      code: lambda.Code.fromAsset("./src/build/lambda", {
        exclude: ["**", "!api-get-upload-status.mjs"],
      }),
      memorySize: 128,
      timeout: Duration.seconds(5),
      environment: {
        UPLOAD_TABLE: uploadStatusTable.tableName,
      },
      functionName: "get-upload-status",
    });

    // update policy for getUploadStatusFn
    uploadStatusTable.grantReadData(getUploadStatusFn);

    /* API Gateway (REST) */

    const api = new apigateway.RestApi(this, "ServerlessApi", {
      restApiName: "ServerlessDemoApi",
      deployOptions: { stageName: "dev" },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // GET /get-upload-status call lambda function getUploadStatusFn
    const getUploadStatus = api.root.addResource("get-upload-status");
    getUploadStatus.addMethod("GET", new apigateway.LambdaIntegration(getUploadStatusFn));

  }
}
