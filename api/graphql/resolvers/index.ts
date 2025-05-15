import { Auth } from './auth'
import { Events } from './events'
import { Users } from './users'
import { Attendees } from './attendees'

// Combine all resolvers
export const resolvers = {
  Query: {
    ...Auth.Query,
    ...Events.Query,
    ...Users.Query,
    ...Attendees.Query,
  },
  Mutation: {
    ...Auth.Mutation,
    ...Events.Mutation,
    ...Users.Mutation,
    ...Attendees.Mutation,
  }
}
