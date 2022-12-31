import JWT from 'jsonwebtoken'
import { Request, Response } from 'express'
import { config } from '@root/config'
import { joiValidation } from '@global/decorators/joi-validations.decorators'
import HTTP_STATUS from 'http-status-codes'
import { BadRequestError } from '../../../shared/globals/helpers/error-handler'
import { authService } from '../../../shared/services/db/auth.service'
import { loginSchema } from '@auth/schemas/signin'
import { IAuthDocument } from '@auth/interfaces/auth.interface'
import { IUserDocument } from '../../user/interfaces/user.interface'
import { userService } from '@services/db/user.service'
import { mailTransport } from '../../../shared/services/emails/mail-transport'

export class SignIn {
  @joiValidation(loginSchema)
  public async read(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body
    const existingUser: IAuthDocument = await authService.getAuthUserByUsername(username)
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials')
    }

    const passwordsMatch: boolean = await existingUser.comparePassword(password)
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials')
    }

    const user: IUserDocument = await userService.getUserByAuthId(`${existingUser._id}`)

    console.log('user', user)

    const userJwt: string = JWT.sign(
      {
        userId: existingUser._id, // TODO: user._id
        uId: existingUser.uId,
        email: existingUser.email,
        username: existingUser.username,
        avatorColor: existingUser.avatarColor
      },
      config.JWT_TOKEN!
    )
    await mailTransport.sendEmail(
      'viola.lind46@ethereal.email',
      'Testing development',
      'This is a test email to show that development email sender works'
    )
    req.session = { jwt: userJwt }

    const userDocument: IUserDocument = {
      ...user,
      authId: existingUser!._id,
      username: existingUser!.username,
      email: existingUser!.email,
      avatarColor: existingUser!.avatarColor,
      uId: existingUser!.uId,
      createdAt: existingUser!.createdAt
    } as IUserDocument

    res.status(HTTP_STATUS.OK).json({ message: 'User login successfully', user: userDocument, token: userJwt })
  }
}
