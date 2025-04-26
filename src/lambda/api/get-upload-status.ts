import { Context } from "aws-lambda";
import { envConfig, getEnvConfig } from "../../utils/env-config";

export const handler = async (event: any, _: Context) => {

  console.log("V2 Env config", envConfig);
  console.log("V2 get EnvConfig", getEnvConfig());
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello from Lambda! V2",
      input: event,
    }),
  };
};