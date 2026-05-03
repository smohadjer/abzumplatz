import { Db, ObjectId, WithId } from 'mongodb';

type FetchedUser = {
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    role: string;
    club_id?: string;
}

export async function fetchUsers(database: Db, userId: string, clubId?: undefined): Promise<WithId<FetchedUser> | null>;
export async function fetchUsers(database: Db, userId: undefined, clubId: string): Promise<WithId<FetchedUser>[]>;
export async function fetchUsers(database: Db, userId?: string, clubId?: string) {
    const collection = database.collection('users');

    if (userId) {
      const projection = {
          first_name: 1,
          last_name: 1,
          _id: 1,
          club_id: 1,
          role: 1,
          email: 1,
          status: 1,
      };
      const query = {_id: ObjectId.createFromHexString(userId)};
      const doc = await collection.findOne(query, {projection});
      return doc;
    } else {
      const projection = {
          first_name: 1,
          last_name: 1,
	          email: 1,
	          status: 1,
	          role: 1,
	          _id: 1,
	      };
      const query = { club_id: clubId };
      // why did we need this?
      // if (req.query?.first_name) {
      //     query.first_name = req.query.first_name;
      // }
      const docs = await collection.find(query, {projection})
        // using collation so sort is case insensitive
        .collation({
          locale: 'en',
          strength: 2 /* case insensitive search */
        })
        .sort({ first_name: 1 })
        .toArray();

      return docs;
    }
};
