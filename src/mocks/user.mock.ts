import { IAuthDocument } from '@auth/interfaces/auth.interface'
import { IUserDocument } from '@user/interfaces/user.interface'
import { authMock } from '@root/mocks/auth.mock'

export const mergedAuthAndUserData = {
  ...authMock,
  authId: authMock._id
} as unknown as IAuthDocument | IUserDocument

export const existingUser = {
  _id: '2323423423424324',
  authId: '2342134234234234234',
  uId: '234234234234234234',
  username: 'baker',
  email: 'test@test.com',
  password: 'password1',
  avatarColor: 'red',
  profilePicture: 'profilePic',
  blocked: [],
  blockedBy: [],
  work: '',
  location: '',
  school: '',
  quote: '',
  bgImageVersion: '',
  bgImageId: '',
  followersCount: 1,
  followingCount: 1,
  postsCount: 1,
  notifications: {
    messages: true,
    reactions: true,
    comments: true,
    follows: true
  },
  social: {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: ''
  },
  createdAt: new Date()
} as unknown as IUserDocument
