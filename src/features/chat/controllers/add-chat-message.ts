import { IMessageData } from '@chat/interfaces/chat.interface'
import { addChatSchema } from '@chat/schemes/chat'
import { joiValidation } from '@global/decorators/joi-validations.decorators'
import { uploads } from '@global/helpers/cloudinary-upload'
import { BadRequestError } from '@global/helpers/error-handler'
import { notificationTemplate } from '@service/emails/templates/notifications/notification-template'
import { emailQueue } from '@service/queues/email.queue'
import { MessageCache } from '@service/redis/message.cache'
import { UserCache } from '@service/redis/user.cache'
import { socketIOChatObject } from '@socket/chat'
import { IUserDocument } from '@user/interfaces/user.interface'
import { UploadApiResponse } from 'cloudinary'
import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'
import { IMessageNotification } from '../interfaces/chat.interface'

const userCache: UserCache = new UserCache()
const messageCache: MessageCache = new MessageCache()

export class Add {
  @joiValidation(addChatSchema)
  public async message(req: Request, res: Response) {
    const {
      conversationId,
      receiverId,
      receiverUsername,
      receiverAvatarColor,
      receiverProfilePicture,
      body,
      gifUrl,
      isRead,
      selectedImage
    } = req.body

    let fileUrl = ''
    const messageObjectId: ObjectId = new ObjectId()
    const conversationObjectId: ObjectId = !conversationId ? new ObjectId() : new mongoose.Types.ObjectId(conversationId)

    const sender: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser!.userId}`)) as IUserDocument

    if (selectedImage.length) {
      const result: UploadApiResponse = (await uploads(req.body.image, req.currentUser!.userId, true, true)) as UploadApiResponse
      if (!result?.public_id) {
        throw new BadRequestError(result.message)
      }
      fileUrl = `http://res.cloudinary.com/${process.env.CLOUD_NAME}/image/upload/v${result.version}/${result.public_id}`
    }

    const messageData: IMessageData = {
      _id: `${messageObjectId}`,
      conversationId: new mongoose.Types.ObjectId(conversationObjectId),
      receiverId,
      receiverAvatarColor,
      receiverProfilePicture,
      receiverUsername,
      senderUsername: `${req.currentUser!.username}`,
      senderId: `${req.currentUser!.userId}`,
      senderAvatarColor: `${sender.avatarColor}`,
      senderProfilePicture: sender.profilePicture,
      body,
      isRead,
      gifUrl,
      selectedImage: fileUrl,
      reaction: [],
      createdAt: new Date(),
      deleteForEveryone: false,
      deleteForMe: false
    }

    Add.prototype.emitSocketMessage(messageData)

    if (!isRead) {
      Add.prototype.messageNotification({
        currentUser: req.currentUser!,
        message: body,
        receiverName: receiverUsername,
        receiverId,
        messageData
      })
    }

    await messageCache.addChatListToCache(`${req.currentUser!.userId}`, `${receiverId}`, `${conversationObjectId}`)
    await messageCache.addChatListToCache(`${receiverId}`, `${req.currentUser!.userId}`, `${conversationObjectId}`)
    await messageCache.addChatMessageToCache(`${conversationObjectId}`, messageData)
    // 4 - add message chat queue

    res.status(HTTP_STATUS.OK).json({ message: 'Message added', conversationObjectId })
  }

  private emitSocketMessage(message: IMessageData) {
    socketIOChatObject.emit('message received', message)
    socketIOChatObject.emit('chat list', message)
  }

  private async messageNotification({ currentUser, message, receiverName, receiverId }: IMessageNotification): Promise<void> {
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(`${receiverId}`)) as IUserDocument
    if (cachedUser.notifications.messages) {
      const templateParams = {
        username: receiverName,
        message,
        header: `Message notification from ${currentUser.username}`
      }
      const template: string = notificationTemplate.notificationMessageTemplate(templateParams)
      emailQueue.addEmailJob('directMessageEmail', {
        receiverEmail: currentUser.email,
        template,
        subject: `You've received messages from ${currentUser.username}`
      })
    }
  }
}