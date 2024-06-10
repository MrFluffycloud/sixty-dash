import mongoose from 'mongoose';
import { User } from '~/types';

function isUser(user: unknown): User {
    return user as User;
}

export default eventHandler(async event => {
    const body = await readValidatedBody(event, isUser);

    // @ts-expect-error
    delete body._id;

    await mongoose.connection.db.collection<User>(process.env.MONGODB_COLLECTION_NAME as string).updateOne({
        email: body.email
    }, {
        '$set': body
    });
})
