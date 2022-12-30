// import { IAuthDocument } from '@auth/interfaces/auth.interface'
import { UserModel } from '@user/models/user.schema'
// import { Helpers } from '../../globals/helpers/helpers'
import { IUserDocument } from '../../../features/user/interfaces/user.interface'

class UserService {
  public async addUserData(data: IUserDocument): Promise<void> {
    await UserModel.create(data)
  }

  // public async createAuthUser(data: IAuthDocument): Promise<void> {
  //   await AuthModel.create(data)
  // }

  // public async getUserByUsernameOrEmail(username: string, email: string): Promise<IAuthDocument> {
  //   const query = {
  //     $or: [{ username: Helpers.firstLetterUppercase(username) }, { email: Helpers.lowerCase(email) }]
  //   }

  //   const user: IAuthDocument = (await AuthModel.findOne(query).exec()) as IAuthDocument

  //   return user
  // }
}

export const userService: UserService = new UserService()
