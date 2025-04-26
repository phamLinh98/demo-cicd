import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /* DynamoDB tables */
    const userTable = new dynamodb.Table(this, "UserTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      tableName: "user-123",
    });

    const uploadTable = new dynamodb.Table(this, "UploadTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      tableName: "upload-status-123777",
    });

    /* Lambda layers / common env can go here */

    const getUserFn = new lambda.Function(this, "GetUserFn", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "get-user.handler",
      code: lambda.Code.fromAsset("./src/build/lambda"), // folder
      memorySize: 128,
      timeout: Duration.seconds(5),
      environment: {
        USER_TABLE: userTable.tableName,
      },
      functionName: "get-user-123456",
    });

    const getUploadStatusFn = new lambda.Function(this, "GetUploadStatusFn", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "get-upload-status.handler",
      code: lambda.Code.fromAsset("./src/build/lambda"),
      memorySize: 128,
      timeout: Duration.seconds(5),
      environment: {
        UPLOAD_TABLE: uploadTable.tableName,
      },
      functionName: "get-upload-status-123",
    });

    /* Grant R/W */
    userTable.grantReadData(getUserFn);
    uploadTable.grantReadData(getUploadStatusFn);

    /* API Gateway (REST) */
    const api = new apigateway.RestApi(this, "ServerlessApi", {
      restApiName: "ServerlessDemoApi",
      deployOptions: { stageName: "prod" },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // /user/{id}
    const user = api.root.addResource("user");
    const userById = user.addResource("{id}");
    userById.addMethod("GET", new apigateway.LambdaIntegration(getUserFn));

    // /upload-status/{id}
    const upload = api.root.addResource("upload-status");
    const uploadById = upload.addResource("{id}");
    uploadById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getUploadStatusFn)
    );
  }
}
