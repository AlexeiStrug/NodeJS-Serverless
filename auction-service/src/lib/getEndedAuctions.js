import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient;

export async function getEndedAuctions() {
    const now = new Date();

    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        IndexName: 'statusAndEndDate',
        KeyConditionExpression: '#status = :status AND endingAt <= :now',
        ExpressionAttributeValues: {
            ':status': 'OPEN',
            ':now': now.toISOString()
        },
        ExpressionAttributeNames: {
            '#status': 'status'
        },
    };

    return await dynamoDb.query(params).promise();
}
