import mongoose from 'mongoose';
import { User } from '~/types';

export default eventHandler(async () => {
    const users = await mongoose.connection.db.collection<User>(process.env.MONGODB_COLLECTION_NAME as string).find({}).toArray();

    return users;
});
