import type { ObjectId } from 'mongoose'

export interface User {
    // _id?: ObjectId,
    email: string,
    phone: string,
    firstName: string,
    lastName: string,
    age: number,
    country: string,
    courses: string[]
};
