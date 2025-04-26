# 1️⃣ Source structure & Webpack bundle

##  1.1 Khởi tạo thư mục gốc

```bash
mkdir awesome-serverless-cdk
cd awesome-serverless-cdk
npm init -y                     # package.json
git init
```

## 1.2 Scaffold cây thư mục

# code

```bash
mkdir -p src/lambda src/build/lambda
touch src/lambda/get-user.ts
touch src/lambda/get-upload-status.ts
# toolchain
touch webpack.config.js .gitignore tsconfig.json
```

.gitignore (rút gọn)
```
node_modules
cdk.out
src/build
.idea
```

## 1.3 Viết Lambda handlers (TypeScript)

Giản lược tối đa – bạn open‑minded refactor tuỳ nghiệp vụ thật.

src/lambda/get-user.ts
```ts
import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});
const TABLE = process.env.USER_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2, _: Context) => {
  const id = event.pathParameters?.id;
  if (!id) return { statusCode: 400, body: "Missing id" };

  const { Item } = await ddb.send(new GetItemCommand({
    TableName: TABLE,
    Key: { id: { S: id } },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(Item ?? {}),
  };
};
```

src/lambda/get-upload-status.ts
```ts
import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});
const TABLE = process.env.UPLOAD_TABLE!;

export const handler = async (event: APIGatewayProxyEventV2, _: Context) => {
  const id = event.pathParameters?.id;
  if (!id) return { statusCode: 400, body: "Missing id" };

  const { Item } = await ddb.send(new GetItemCommand({
    TableName: TABLE,
    Key: { id: { S: id } },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(Item ?? {}),
  };
};
```

## 1.4 Thiết lập Webpack
```bash
npm i -D webpack webpack-cli ts-loader ts-node @types/aws-lambda @types/node
```

webpack.config.js
```js
const path = require("path");
module.exports = {
  mode: "production",
  target: "node18",
  entry: {
    "get-user": "./src/lambda/get-user.ts",
    "get-upload-status": "./src/lambda/get-upload-status.ts",
  },
  resolve: { extensions: [".ts", ".js"] },
  module: {
    rules: [
      { test: /\.ts$/, loader: "ts-loader", exclude: /node_modules/ },
    ],
  },
  output: {
    path: path.resolve(__dirname, "src/build/lambda"),
    filename: "[name].mjs",
    library: { type: "module" },
    module: true,               // giữ ESM
  },
  experiments: { outputModule: true },
  externalsType: "node-commonjs",
};
```

tsconfig.json (tối giản)
```json
{
  "compilerOptions": {
    "module": "ES2022",
    "target": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "skipLibCheck": true,
    "types": ["node", "aws-lambda"]
  },
  "include": ["src/**/*"]
}
```

## 1.5 Script build

Thêm vào package.json:

```json
"scripts": {
  "build:lambda": "webpack"
}
```
Chạy thử:

```bash
npm run build:lambda
# -> src/build/lambda/get-user.mjs
# -> src/build/lambda/get-upload-status.mjs
```

🎉 Phần app code đã sẵn sàng để CDK gom vào CloudFormation template.

⸻

# 2️⃣ AWS CDK – TypeScript IaC như dân chơi

## 2.1 Cài & bootstrap

```bash
npm install -g aws-cdk@2
cdk --version                   # sanity check
aws configure                   # export AWS creds/profile trước
cdk bootstrap aws://650251698778/ap-northeast-1
```

## 2.2 Khởi tạo project CDK

```bash
mkdir cdk
cd cdk
cdk init app --language typescript
npm i aws-cdk-lib constructs
```

Cấu trúc CDK sau khi init

```asci
cdk/
 ├─ bin/
 │   └─ app.ts
 ├─ lib/
 │   └─ api-stack.ts   // ta sẽ viết ở đây
 └─ cdk.json
```

## 2.3 Viết stack (lib/api-stack.ts)

```ts
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
      tableName: "user",
    });

    const uploadTable = new dynamodb.Table(this, "UploadTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      tableName: "upload-status",
    });

    /* Lambda layers / common env can go here */

    const getUserFn = new lambda.Function(this, "GetUserFn", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "get-user.handler",
      code: lambda.Code.fromAsset("../src/build/lambda"), // folder
      memorySize: 128,
      timeout: Duration.seconds(5),
      environment: {
        USER_TABLE: userTable.tableName,
      },
      functionName: "get-user",
    });

    const getUploadStatusFn = new lambda.Function(this, "GetUploadStatusFn", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "get-upload-status.handler",
      code: lambda.Code.fromAsset("../src/build/lambda"),
      memorySize: 128,
      timeout: Duration.seconds(5),
      environment: {
        UPLOAD_TABLE: uploadTable.tableName,
      },
      functionName: "get-upload-status",
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
```

## 2.4 Wire stack vào bin/app.ts

```ts
#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { ApiStack } from "../lib/api-stack";

const app = new App();
new ApiStack(app, "ServerlessApiStack", {
  /* env: { account: process.env.CDK_DEFAULT_ACCOUNT,
           region: process.env.CDK_DEFAULT_REGION } */
});
```

## 2.5 Nối build Lambda & synth

Trong cdk/package.json thêm:
```json
"scripts": {
  "prebuild": "npm --prefix .. run build:lambda",
  "build": "tsc",
  // "synth": "cdk synth",
  "synth": "cdk synth --app 'npx ts-node path/to/your/app.ts'",
  "deploy": "cdk deploy"
}
```

Khi bạn npm run synth hay deploy, nó auto chạy Webpack trước, bảo đảm mã trong src/build luôn fresh.

## 2.6 Deploy thử
```bash
npm run build:lambda        # build code
cdk synth                   # xem template
cdk deploy                  # boom! 🎆
```

## 2.7 Test API

```bash
curl -X GET https://hhoe478b5f.execute-api.ap-northeast-1.amazonaws.com/prod/get-user-by-id/1
```

## 2.8 Clean up

```bash
cdk destroy
# Optional: delete tables
aws dynamodb delete-table --table-name user
aws dynamodb delete-table --table-name upload-status
```

## 2.9 off CDKToolkit

```bash
aws cloudformation delete-stack --stack-name CDKToolkit --output json
aws cloudformation describe-stacks --stack-name CDKToolkit --output json
aws cloudformation describe-stack-resources --stack-name CDKToolkit --output json
```

⸻

# 3️⃣ CI/CD – luôn xanh & luôn ship

Một GitHub Actions đơn giản (đặt .github/workflows/cicd.yml):

```yml
name: CDK CI/CD

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write      # cho OIDC
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - name: Install root deps
        run: npm ci
      - name: Install CDK deps
        run: |
          cd cdk
          npm ci
      - name: Synth & Deploy
        env:
          AWS_REGION: ap-southeast-1
          CDK_NEW_BOOTSTRAP: "1"
        run: |
          npx cdk synth
          npx cdk deploy --require-approval never
```

Key best‑practice points

Hạng mục	Best practice
Monorepo	Root giữ app code; thư mục cdk/ độc lập.
Bundling	Webpack emit .mjs ESM, giảm cold‑start.
Least privilege	Lambda chỉ grantReadData bảng tương ứng.
One‑stack‑one‑purpose	Stack riêng cho API; nếu sau này thêm SQS/SNS, tách stack để tránh blast radius.
Bootstrap mới	Sử dụng CDK v2 (one‑package) + new bootstrap (trusted accounts).
CI/CD	GitHub OIDC -> AWS IAM Role, không dùng long‑lived keys.



⸻

## 4️⃣ Next‑level ideas cho project “to bự”
	•	Domain‑driven folder – /src/services/user, /src/services/upload, mỗi service export construct riêng (class UserService extends Construct { … }).
	•	Lambda Powertools – observability, idempotency, tracer.
	•	Step Functions – orchestration nếu upload flow phức tạp.
	•	SST / CDK‑TF – nếu đội bạn xài multi‑cloud, consider Terraform‑CDK.
	•	Feature flags – LaunchDarkly or AppConfig cho rollout canary.
	•	Unit tests – Jest + aws-cdk-lib/assertions.

⸻

Thế là bạn đã có một blueprint gọn gàng — từ source layout, bundling, CDK stack, tới CI/CD — để scale thành dự án serverless cỡ enterprise. Copy‑paste, biến tấu, rồi cứ thế mà “đập lệnh” thôi. Chúc bạn shipping mượt, build nhanh, deploy gọn!