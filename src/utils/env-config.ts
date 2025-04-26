export const envConfig = {
      AWS_REGION: process.env.AWS_REGION || "ap-southeast-1",
}

export const getEnvConfig = () => {
      return {
            AWS_REGION: process.env.AWS_REGION || "ap-southeast-1",
      };
}