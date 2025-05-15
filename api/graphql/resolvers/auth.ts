import { GraphQLError } from 'graphql'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { constants } from '../../config/constants'
import { UserModel } from '../../models/user'
import { validatePassword } from '../../utils/validations'
import { LoginInput, UserInput } from '../../../src/generated/graphql'

const { JWT_SECRET } = constants

export const Auth = {
  Query: {
    login: async (
      _: any,
      { loginInput: { username, password } }: { loginInput: LoginInput }
    ) => {
      try {
        const ERROR_MESSAGE = 'Username or password is incorrect'

        if (!username || !password) {
          throw new GraphQLError('Username and password are required')
        }

        const user = await UserModel.findOne({ username })

        if (!user) {
          throw new GraphQLError(ERROR_MESSAGE)
        }

        const correctPassword = await bcrypt.compare(password, user.password)

        if (!correctPassword) {
          throw new GraphQLError(ERROR_MESSAGE)
        }

        const token = jwt.sign(
          { userId: user._id, username: user.username },
          JWT_SECRET,
          { expiresIn: '1h' },
        )

        return {
          userId: user._id,
          token,
          tokenExpiration: 60,
          username: user.username,
        }
      } catch (error) {
        // Ensure we always throw GraphQLError objects
        if (error instanceof GraphQLError) {
          throw error
        } else {
          console.error('Login error:', error)
          throw new GraphQLError(
            error instanceof Error ? error.message : 'An unexpected error occurred during login'
          )
        }
      }
    }
  },
  Mutation: {
    signup: async (
      _: any,
      { userInput: { username, password, confirmPassword } }: { userInput: UserInput }
    ) => {
      try {
        // Validate inputs
        if (!username || !password || !confirmPassword) {
          throw new GraphQLError('All fields are required')
        }

        const userExist = await UserModel.findOne({ username })

        if (userExist) {
          throw new GraphQLError(
            'Username is already being used, please try a different username.',
          )
        }

        if (username.length < 3) {
          throw new GraphQLError('Username must be at least 3 characters.')
        }

        if (!validatePassword(password)) {
          throw new GraphQLError('Password does not meet password requirements.')
        }

        if (password !== confirmPassword) {
          throw new GraphQLError('Password and confirm password do not match.')
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = new UserModel({ username, password: hashedPassword })

        const savedUser = await user.save()

        if (!savedUser || !savedUser._id) {
          throw new GraphQLError('Failed to create user account')
        }

        const token = jwt.sign(
          { userId: savedUser._id, username: savedUser.username },
          JWT_SECRET,
          { expiresIn: '1h' },
        )

        return {
          userId: savedUser._id,
          token,
          tokenExpiration: 60,
          username: savedUser.username,
        }
      } catch (error) {
        // Ensure we always throw GraphQLError objects
        if (error instanceof GraphQLError) {
          throw error
        } else {
          console.error('Signup error:', error)
          throw new GraphQLError(
            error instanceof Error ? error.message : 'An unexpected error occurred during signup'
          )
        }
      }
    }
  }
}
