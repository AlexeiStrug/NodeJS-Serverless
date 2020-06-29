import {v4 as uuid} from 'uuid';
import AWS from 'aws-sdk';
import createHttpError from "http-errors"
import commonMiddleware from "../lib/commonMiddleware";
import validator from "@middy/validator";
import createAuctionSchema from "../lib/schemas/createAuctionSchema";

const dynamoDb = new AWS.DynamoDB.DocumentClient;

async function createAuction(event, context) {
    const {title} = event.body;
    const {email} = event.requestContext.authorizer;
    const now = new Date();
    const endDate = new Date();
    endDate.setHours(now.getHours() + 1);

    const auction = {
        id: uuid(),
        title,
        status: 'OPEN',
        createdAt: now.toISOString(),
        endingAt: endDate.toISOString(),
        highestBid: {
            amount: 0,
        },
        seller: email,
    };

    try {
        await dynamoDb.put({
            TableName: process.env.AUCTIONS_TABLE_NAME,
            Item: auction,
        }).promise();
    } catch (e) {
        console.log(e);
        throw new createHttpError.InternalServerError(e);
    }


    return {
        statusCode: 201,
        body: JSON.stringify(auction),
    };
}

export const handler = commonMiddleware(createAuction)
    .use(validator({inputSchema: createAuctionSchema}))
