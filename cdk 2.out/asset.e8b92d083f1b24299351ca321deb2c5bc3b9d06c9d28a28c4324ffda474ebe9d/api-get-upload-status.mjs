
;// ./src/utils/env-config.ts
const envConfig = {
    AWS_REGION: process.env.AWS_REGION || "ap-southeast-1",
};
const getEnvConfig = () => {
    return {
        AWS_REGION: process.env.AWS_REGION || "ap-southeast-1",
    };
};

;// ./src/lambda/api/get-upload-status.ts

const handler = async (event, _) => {
    console.log("Env config", envConfig);
    console.log("get EnvConfig", getEnvConfig());
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Hello from Lambda!",
            input: event,
        }),
    };
};

export { handler };
