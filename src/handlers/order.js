import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({});

export const createOrder = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const order = {
      orderId: crypto.randomUUID(),
      userId: body.userId,
      amount: body.amount,
    };

    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: process.env.ORDER_QUEUE_URL,

        MessageBody: JSON.stringify({
          message: "Order accepted for processing",
          order,
        }),
      }),
    );

    return {
      status: 202,
      body: JSON.stringify(order),
    };
  } catch (error) {
    console.error(error);

    return {
      status: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};

export const processOrder = async (event) => {
  console.log("SQS Event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const order = JSON.parse(record.body);

    console.log("Processing order:", order);

    // Now here Processing can be done in the background:
    // generate invoice
    // send notification
    // process background work
  }
};
