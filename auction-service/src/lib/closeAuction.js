import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient;
const sqs = new AWS.SQS();


export async function closeAuction(auction) {
    let notifyBidder;
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: {id: auction.id},
        UpdateExpression: 'set #status = :status',
        ExpressionAttributeValues: {
            ':status': 'CLOSED',
        },
        ExpressionAttributeNames: {
            '#status': 'status',
        }
    };

    await dynamoDb.update(params).promise();

    const {title, seller, highestBid} = auction;
    const {amount, bidder} = highestBid;

    if (amount === 0) {
        await sqs.sendMessage({
            QueueUrl: process.env.MAIL_QUEUE_URL,
            MessageBody: JSON.stringify({
                subject: 'No bid on your action item.',
                recipient: seller,
                body: `Oh no! Your item did not get any bid!`
            })
        }).promise();

        return;
    }

    const notifySeller = sqs.sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
            subject: 'Your item have been sold',
            recipient: seller,
            body: `Woohoo! Your item '${title}' has been sold for $'${amount}'!`
        })
    }).promise();

    notifyBidder = sqs.sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
            subject: 'You won an auction',
            recipient: bidder,
            body: `What a great deal! You got yourself a '${title}' for $'${amount}'!`
        })
    }).promise();

    return Promise.all([notifySeller, notifyBidder]);
}
