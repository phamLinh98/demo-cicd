import { Context } from "aws-lambda";
import { envConfig, getEnvConfig } from "../../utils/env-config";

export const handler = async (event: any, _: Context) => {

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