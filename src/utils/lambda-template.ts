import { Context } from "aws-lambda";

export const handler = async (event: any, _: Context) => {

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello from Lambda!",
      input: event,
    }),
  };
};