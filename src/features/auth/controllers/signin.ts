import { IAuthDocument } from '@auth/interfaces/auth.interface'
import { loginSchema } from '@auth/schemas/signin'
import { joiValidation } from '@global/decorators/joi-validations.decorators'
import { config } from '@root/config'
import { userService } from '@service/db/user.service'
// import { IResetPasswordParams } from '@user/interfaces/user.interface'
import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
// import publicIp from 'ip'
import JWT from 'jsonwebtoken'
// import moment from 'moment'
import { BadRequestError } from '../../../shared/globals/helpers/error-handler'
import { authService } from '@service/db/auth.service'
// import { resetPasswordTemplate } from '@service/emails/templates/reset-password/reset-password-template'
// import { emailQueue } from '@service/queues/email.queue'
import { IUserDocument } from '../../user/interfaces/user.interface'

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

    const userDocument: IUserDocument = {
      ...user,
      authId: existingUser!._id,
      username: existingUser!.username,
      email: existingUser!.email,
      avatarColor: existingUser!.avatarColor,
      uId: existingUser!.uId,
      createdAt: existingUser!.createdAt
    } as IUserDocument

    // const templateParams: IResetPasswordParams = {
    //   username: existingUser.username,
    //   email: existingUser.email,
    //   ipaddress: publicIp.address(),
    //   date: moment().format('DD/MM/YYYY HH:mm')
    // }

    // const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams)

    // emailQueue.addEmailJob('forgotPasswordEmail', {
    //   template,
    //   receiverEmail: 'viola.lind46@ethereal.email',
    //   subject: 'Password reset confirmation'
    // })

    req.session = { jwt: userJwt }
    res.status(HTTP_STATUS.OK).json({ message: 'User login successfully', user: userDocument, token: userJwt })
  }
}
