import { Types } from 'mongoose'

export interface IEvent {
  id?: string
  title: string
  start: string
  end: string
  description: string
  url: string
  isPrivate: boolean
  createdBy: Types.ObjectId
  venue: string
  speaker: string
  hosted_by: string
  number_of_attendees: number
  contact_number: string
}

export interface IUser {
  username: string
  password: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  bio: string
  createdEvents: Types.ObjectId[]
}

export interface IAuth {
  userId: string
  username: string
  token: string
  tokenExpiration?: number
}

export interface IContext {
  auth?: IAuth
}

export interface IAuthParams {
  isAuthorized: boolean
  userId: string
}
