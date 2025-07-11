import { ObjectId } from 'mongodb';

export const fetchUsers = async (database, userId: string, clubId: string) => {
    const collection = database.collection('users');
    const projection = {
        first_name: 1,
        last_name: 1,
        _id: 1,
    };

    if (userId) {
      const query = {_id: ObjectId.createFromHexString(userId)};
      const doc = await collection.findOne(query, {projection});
      return doc;
    } else {
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
