import { GraphQLError } from 'graphql'
import { UserModel } from '../../models/user'
import { IAuthParams } from '../../interfaces/types'
import { UserInputFull } from '../../../src/generated/graphql'

export const Users = {
  Query: {
    getUser: async (
      _: any,
      { id }: { id: string },
      context: IAuthParams,
    ) => {
      if (!context.isAuthorized) {
        throw new GraphQLError('Unauthenticated')
      }

      const user = await UserModel.findById(context.userId)

      if (!user) {
        throw new GraphQLError('Unauthenticated')
      }

      if (id !== context.userId) {
        throw new GraphQLError('Profile not found')
      }

      // const full = await UserModel.findOne({ _id: id }).populate('address');

      return user
    }
  },
  Mutation: {
    saveUser: async (
      _: any,
      {
        user: { _id, username, firstName, lastName, email, phoneNumber, bio },
      }: { user: UserInputFull },
      context: IAuthParams,
    ) => {
      if (!context.isAuthorized) {
        throw new GraphQLError('Unauthenticated')
      }

      const user = await UserModel.findById(context.userId)

      if (!user) {
        throw new GraphQLError('Unauthenticated')
      }

      if (_id !== context.userId) {
        throw new GraphQLError('Unauthenticated')
      }

      if (!username) {
        throw new GraphQLError('Username is required')
      }

      const userByUsername = await UserModel.findOne({ username })

      if (userByUsername && userByUsername._id.toString() !== _id) {
        throw new GraphQLError(
          `"${username}" is already being used, please try a different username.`,
        )
      }

      const updatedUser = await UserModel.findOneAndUpdate(
        { _id },
        { username, firstName, lastName, email, phoneNumber, bio },
        { new: true },
      )

      return updatedUser
    }
  }
}
