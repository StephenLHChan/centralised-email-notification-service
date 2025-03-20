import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as lambda from "aws-cdk-lib/aws-lambda";
import * as kms from "aws-cdk-lib/aws-kms";
import * as sqs from "aws-cdk-lib/aws-sqs";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const key = new kms.Key(this, "kms", {
      alias: "/centralized-email-notification/sqs",
      description: "Key for centralized email-notification",
      enableKeyRotation: true,
    });

    const queue = new sqs.Queue(this, "queue", {
      queueName: "centralized-email-notification",
      visibilityTimeout: cdk.Duration.seconds(300),
      encryptionMasterKey: key,
    });

    const lambdaFunction = new lambda.Function(this, "lambda", {
      functionName: "centralized-email-notification",
      description: "Lambda for centralized email-notification",
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset("../service/lambdas/build"),
      handler: "index.handler",
    });

    queue.grantSendMessages(lambdaFunction);
    queue.grantConsumeMessages(lambdaFunction);
  }
}
