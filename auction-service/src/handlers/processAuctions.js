import {getEndedAuctions} from '../lib/getEndedAuctions';
import {closeAuction} from '../lib/closeAuction';
import createHttpError from "http-errors";

async function processAuctions(event, context) {
    try {
        const auctionsToClose = await getEndedAuctions();
        const closePromises = auctionsToClose.map(auction => closeAuction(auction));
        await Promise.all(closePromises);
        return {closed: closePromises.length};
    } catch (e) {
        console.log(e);
        throw new createHttpError.InternalServerError(e);
    }
}

export const handler = processAuctions;
