import { Collection, ObjectId } from 'mongodb';
import { ClubDocument } from './_types.js';

type FetchClubOptions = {
    projection?: Record<string, 0 | 1>;
}

export async function fetchClub(
    id: string,
    collection: Collection<ClubDocument>,
    options?: FetchClubOptions
) {
    const query = {_id: ObjectId.createFromHexString(id)};
    return collection.findOne(query, options ? {projection: options.projection} : undefined);
}
