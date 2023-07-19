import { IMessageData } from '@chat/interfaces/chat.interface'
import { markChatSchema } from '@chat/schemes/chat'
import { joiValidation } from '@global/decorators/joi-validations.decorators'
import { chatQueue } from '@service/queues/chat.queue'
import { MessageCache } from '@service/redis/message.cache'
import { socketIOChatObject } from '@socket/chat'
import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import mongoose from 'mongoose'

const messageCache: MessageCache = new MessageCache()

export class Update {
  @joiValidation(markChatSchema)
  public async message(req: Request, res: Response) {
    const { senderId, receiverId } = req.body

    const updatedMessage: IMessageData = await messageCache.updateChatMessages(`${senderId}`, `${receiverId}`)
    socketIOChatObject.emit('message read', updatedMessage)
    socketIOChatObject.emit('chat list', updatedMessage)
    chatQueue.addChatJob('markMessagesAsReadInDB', {
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId)
    })

    res.status(HTTP_STATUS.OK).json({ message: 'Message marked as read' })
  }
}
