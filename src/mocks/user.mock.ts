import { IAuthDocument } from '@auth/interfaces/auth.interface'
import { IUserDocument } from '@user/interfaces/user.interface'
import { authMock } from '@root/mocks/auth.mock'

export const mergedAuthAndUserData = {
  ...authMock,
  authId: authMock._id
} as unknown as IAuthDocument | IUserDocument

export const existingUser = {
  _id: '60263f14648fed5246e322d9',
  authId: '60263f14648fed5246e322d9',
  uId: '4',
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

export const existingUserTwo = {
  _id: '63d20f44fd61db9785c53608',
  authId: '63d20f44fd61db9785c53608',
  uId: '800431745909',
  username: 'baker2',
  email: 'test2@test.com',
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
