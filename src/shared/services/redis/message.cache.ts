import { IMessageData } from '@chat/interfaces/chat.interface'
import { ServerError } from '@global/helpers/error-handler'
import { config } from '@root/config'
import { BaseCache } from '@service/redis/base.cache'
import Logger from 'bunyan'
import { findIndex } from 'lodash'

const log: Logger = config.createLogger('messageCache')

export class MessageCache extends BaseCache {
  constructor() {
    super('messageCache')
  }

  public async addChatListToCache(senderId: string, receiverId: string, conversationId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      const userChatList = await this.client.LRANGE(`chatList:${senderId}`, 0, -1)
      if (userChatList.length === 0) {
        await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }))
      } else {
        const receiverIndex: number = findIndex(userChatList, listItem => listItem.includes(receiverId))
        if (receiverIndex < 0) {
          await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }))
        }
      }
    } catch (error) {
      log.error(error)
      throw new ServerError('Server error. Try again.')
    }
  }

  public async addChatMessageToCache(conversationId: string, value: IMessageData): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      await this.client.RPUSH(`messages:${conversationId}`, JSON.stringify(value))
    } catch (error) {
      log.error(error)
      throw new ServerError('Server error. Try again.')
    }
  }
}