import {getAuctionById} from "./getAuction";
import {Buffer} from "buffer";
import {uploadPictureToS3} from "../lib/uploadPictureToS3";
import {setAuctionPictureUrl} from "../lib/setAuctionPictureUrl";
import uploadPictureSchema from "../lib/schemas/uploadPictureSchema"
import middy from "@middy/core";
import validator from "@middy/validator";
import httpErrorHandler from "@middy/http-error-handler";
import createHttpError from "http-errors";
import cors from "@middy/http-cors";

export async function uploadAuctionPicture(event) {
    const {id} = event.pathParameters;
    const {email} = event.requestContext.authorizer;
    const auction = await getAuctionById(id);

    if (auction.seller !== email) {
        throw new createHttpError.Forbidden('You are not a seller.')
    }

    const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    let updatedAuction;

    try {
        const pictureUrl = uploadPictureToS3(auction.id, +'.jpg', buffer);
        updatedAuction = await setAuctionPictureUrl(auction.id, pictureUrl);
    } catch (e) {
        console.log(e);
        throw new createHttpError.InternalServerError(e);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(updatedAuction)
    };
}

export const handler = middy(uploadAuctionPicture)
    .use(httpErrorHandler())
    .use(validator({inputSchema: uploadPictureSchema}))
    .use(cors());

