import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamoDB = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "users";

export const createUser = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const { name, email } = body;

    if (!name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "name and email are required",
        }),
      };
    }

    const user = {
      id: crypto.randomUUID(),
      name,
      email,
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: user,
      }),
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "User created successfully",
        user,
      }),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};

export const listUsers = async (event) => {
  try {
    const limit = Number(event.queryStringParameters?.limit || 10);

    const cursor = event.queryStringParameters?.cursor;

    const params = {
      TableName: TABLE_NAME,
      Limit: limit,
    };

    if (cursor) {
      params.ExclusiveStartKey = JSON.parse(
        Buffer.from(cursor, "base64").toString(),
      );
    }

    const result = await dynamoDB.send(new ScanCommand(params));

    let nextCursor = null;

    if (result.LastEvaluatedKey) {
      nextCursor = Buffer.from(
        JSON.stringify(result.LastEvaluatedKey),
      ).toString("base64");
    }

    return {
      statusCode: 200,

      body: JSON.stringify({
        items: result.Items,
        nextCursor,
      }),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};

export const getUser = async (event) => {
  try {
    const id = event.pathParameters?.id;

    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          id,
        },
      }),
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};

export const updateUser = async (event) => {
  try {
    const id = event.pathParameters?.id;

    const body = JSON.parse(event.body || "{}");

    const { name, email } = body;

    if (!name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "name and email are required",
        }),
      };
    }

    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,

        Key: {
          id,
        },

        UpdateExpression: "SET #name = :name, email = :email",

        ExpressionAttributeNames: {
          "#name": "name",
        },

        ExpressionAttributeValues: {
          ":name": name,
          ":email": email,
        },

        ReturnValues: "ALL_NEW",
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User updated successfully",
        user: result.Attributes,
      }),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};

export const deleteUser = async (event) => {
  try {
    const id = event.pathParameters?.id;

    await dynamoDB.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          id,
        },
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User deleted successfully",
      }),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};

export const getUserByEmail = async (event) => {
  try {
    const email = event.queryStringParameters?.email;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "email is required",
        }),
      };
    }

    const result = await dynamoDB.send(
      new QueryCommand({
        TableName: TABLE_NAME,

        IndexName: "EmailIndex",

        KeyConditionExpression: "email = :email",

        ExpressionAttributeValues: {
          ":email": email,
        },
      }),
    );

    if (!result.Items?.length) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items[0]),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};
