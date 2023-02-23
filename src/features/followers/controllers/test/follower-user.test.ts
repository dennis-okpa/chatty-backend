import { Add } from '@follower/controllers/follower-user'
import { authUserPayload } from '@root/mocks/auth.mock'
import { followersMockRequest, followersMockResponse } from '@root/mocks/followers.mock'
import { existingUser } from '@root/mocks/user.mock'
import { followerQueue } from '@service/queues/follower.queue'
import { FollowerCache } from '@service/redis/follower.cache'
import { UserCache } from '@service/redis/user.cache'
import * as followerServer from '@socket/follower'
import { Request, Response } from 'express'
import { Server } from 'socket.io'

jest.useFakeTimers()
jest.mock('@service/queues/base.queue')
jest.mock('@service/redis/user.cache')
jest.mock('@service/redis/follower.cache')

Object.defineProperties(followerServer, {
  socketIOFollowerObject: {
    value: new Server(),
    writable: true
  }
})

describe('Add', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  describe('follower', () => {
    it('should call updateFollowersCountInCache', async () => {
      const req: Request = followersMockRequest({}, authUserPayload, { followerId: '63de5092022096cadd30245e' }) as Request
      const res: Response = followersMockResponse()
      jest.spyOn(FollowerCache.prototype, 'updateFollowersCountInCache')
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(existingUser)

      await Add.prototype.follower(req, res)
      expect(FollowerCache.prototype.updateFollowersCountInCache).toHaveBeenCalledTimes(2)
      expect(FollowerCache.prototype.updateFollowersCountInCache).toHaveBeenCalledWith('63de5092022096cadd30245e', 'followersCount', 1)
      expect(FollowerCache.prototype.updateFollowersCountInCache).toHaveBeenCalledWith(`${existingUser._id}`, 'followingCount', 1)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Following user now'
      })
    })

    it('should call saveFollowerToCache', async () => {
      const req: Request = followersMockRequest({}, authUserPayload, { followerId: '63de5092022096cadd30245e' }) as Request
      const res: Response = followersMockResponse()
      jest.spyOn(followerServer.socketIOFollowerObject, 'emit')
      jest.spyOn(FollowerCache.prototype, 'saveFollowerToCache')
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(existingUser)

      await Add.prototype.follower(req, res)
      expect(UserCache.prototype.getUserFromCache).toHaveBeenCalledTimes(2)
      expect(FollowerCache.prototype.saveFollowerToCache).toHaveBeenCalledTimes(2)
      expect(FollowerCache.prototype.saveFollowerToCache).toHaveBeenCalledWith(
        `following:${req.currentUser!.userId}`,
        '63de5092022096cadd30245e'
      )
      expect(FollowerCache.prototype.saveFollowerToCache).toHaveBeenCalledWith(
        'followers:63de5092022096cadd30245e',
        `${req.currentUser!.userId}`
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Following user now'
      })
    })

    it('should call followerQueue addFollowerJob', async () => {
      const req: Request = followersMockRequest({}, authUserPayload, { followerId: '63de5092022096cadd30245e' }) as Request
      const res: Response = followersMockResponse()
      const spy = jest.spyOn(followerQueue, 'addFollowerJob')

      await Add.prototype.follower(req, res)
      expect(followerQueue.addFollowerJob).toHaveBeenCalledWith('addFollowerToDB', {
        keyOne: `${req.currentUser?.userId}`,
        keyTwo: '63de5092022096cadd30245e',
        username: req.currentUser?.username,
        followerDocumentId: spy.mock.calls[0][1].followerDocumentId
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Following user now'
      })
    })
  })
})
