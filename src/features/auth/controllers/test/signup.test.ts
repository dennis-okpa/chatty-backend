/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express'
import * as cloudinaryUploads from '@global/helpers/cloudinary-upload'
import { authMock, authMockRequest, authMockResponse } from '@root/mocks/auth.mock'
import { CustomError } from '@global/helpers/error-handler'
import { SignUp } from '../signup'
import { authService } from '../../../../shared/services/db/auth.service'
import { UserCache } from '@service/redis/user.cache'

jest.mock('@service/queues/base.queue')
jest.mock('@service/queues/auth.queue')
jest.mock('@service/queues/user.queue')
jest.mock('@service/redis/user.cache')
jest.mock('@global/helpers/cloudinary-upload')

const mockParams = {
  username: 'manny',
  email: 'manny@test.com',
  password: 'qwerty',
  avatarColor: 'red',
  avatarImage: 'data:text/plain;base64,SGVsbGBsIFdvcmxkIQ=='
}

interface iMockRequest {
  username?: string
  email?: string
  password?: string
  avatarColor?: string
  avatarImage?: string
}

const mockRequest = (
  props: iMockRequest
): { req: Request; res: Response; testSignUpError: (callBackTest: (error: CustomError) => void) => void } => {
  const req: Request = authMockRequest(
    {},
    {
      ...mockParams,
      ...props
    }
  ) as Request
  const res: Response = authMockResponse()

  const testSignUpError = (callBackTest: (error: CustomError) => void) => {
    SignUp.prototype.create(req, res).catch(callBackTest)
  }

  return { req, res, testSignUpError }
}

describe('SignUp', () => {
  it('should throw an error if username is not available', () => {
    const { testSignUpError } = mockRequest({
      username: ''
    })

    testSignUpError((error: CustomError) => {
      expect(error.statusCode).toEqual(400)
      expect(error.serializeErrors().message).toEqual('Username is a required field')
    })
  })

  it('should throw an error if username is less than minimum length', () => {
    const { testSignUpError } = mockRequest({
      username: 'ma'
    })

    testSignUpError((error: CustomError) => {
      expect(error.statusCode).toEqual(400)
      expect(error.serializeErrors().message).toEqual('Invalid username')
    })
  })

  it('should throw an error if username is greater than maximum length', () => {
    const { testSignUpError } = mockRequest({
      username: 'mathematics'
    })

    testSignUpError((error: CustomError) => {
      expect(error.statusCode).toEqual(400)
      expect(error.serializeErrors().message).toEqual('Invalid username')
    })
  })

  it('should throw an error if email is not valid', () => {
    const { testSignUpError } = mockRequest({
      email: 'not valid'
    })

    testSignUpError((error: CustomError) => {
      expect(error.statusCode).toEqual(400)
      expect(error.serializeErrors().message).toEqual('Email must be valid')
    })
  })

  it('should throw an error if email is not available', () => {
    const { testSignUpError } = mockRequest({
      email: ''
    })

    testSignUpError((error: CustomError) => {
      expect(error.statusCode).toEqual(400)
      expect(error.serializeErrors().message).toEqual('Email is a required field')
    })
  })

  it('should throw an error if password is not available', () => {
    const { testSignUpError } = mockRequest({
      password: ''
    })

    testSignUpError((error: CustomError) => {
      expect(error.statusCode).toEqual(400)
      expect(error.serializeErrors().message).toEqual('Password is a required field')
    })
  })

  it('should throw an error if password is not valid', () => {
    const { testSignUpError } = mockRequest({
      password: 'not valid'
    })

    testSignUpError((error: CustomError) => {
      expect(error.statusCode).toEqual(400)
      expect(error.serializeErrors().message).toEqual('Invalid password')
    })
  })

  it('should throw an error if password is less than minimum length', () => {
    const { testSignUpError } = mockRequest({
      password: 'ma'
    })

    testSignUpError((error: CustomError) => {
      expect(error.statusCode).toEqual(400)
      expect(error.serializeErrors().message).toEqual('Invalid password')
    })
  })

  it('should throw an error if password is greater than maximum length', () => {
    const { testSignUpError } = mockRequest({
      password: 'mathematics'
    })

    testSignUpError((error: CustomError) => {
      expect(error.statusCode).toEqual(400)
      expect(error.serializeErrors().message).toEqual('Invalid password')
    })
  })

  it('should throw unauthorized error is user already exists', () => {
    const { testSignUpError } = mockRequest({})

    jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(authMock)

    testSignUpError((error: CustomError) => {
      expect(error.statusCode).toEqual(400)
      expect(error.serializeErrors().message).toEqual('Invalid credentials')
    })
  })

  it('should set session data for valid credentials and send correct json response', async () => {
    const { req, res } = mockRequest({})

    jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(null as any)
    const userSpy = jest.spyOn(UserCache.prototype, 'saveUserToCache')
    jest.spyOn(cloudinaryUploads, 'uploads').mockImplementation((): any =>
      Promise.resolve({
        version: '123456789',
        public_id: '12345566'
      })
    )

    await SignUp.prototype.create(req, res)
    expect(req.session?.jwt).toBeDefined()
    expect(res.json).toHaveBeenCalledWith({
      message: 'User created successfully',
      user: userSpy.mock.calls[0][2],
      token: req.session?.jwt
    })
  })
})
