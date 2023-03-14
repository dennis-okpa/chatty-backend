import { notificationService } from '@service/db/notification.service'
import mongoose, { model, Model, Schema } from 'mongoose'
import { INotificationDocument } from '@root/features/notifications/interfaces/notification.interface'

const notificationSchema: Schema = new Schema({
  userTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  userFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  read: { type: Boolean, default: false },
  message: { type: String, default: '' },
  notificationType: String,
  entityId: mongoose.Types.ObjectId,
  createdItemId: mongoose.Types.ObjectId,
  comment: { type: String, default: '' },
  reaction: { type: String, default: '' },
  post: { type: String, default: '' },
  imgId: { type: String, default: '' },
  imgVersion: { type: String, default: '' },
  gifUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now() }
})

notificationSchema.methods.insertNotification = async function (body: INotificationDocument): Promise<INotificationDocument[]> {
  const { userTo, userFrom, message, notificationType, entityId, createdItemId, comment, reaction, post, imgId, imgVersion, gifUrl } = body

  await NotificationModel.create({
    userTo,
    userFrom,
    message,
    notificationType,
    entityId,
    createdItemId,
    comment,
    reaction,
    post,
    imgId,
    imgVersion,
    gifUrl
  })

  // eslint-disable-next-line no-useless-catch
  try {
    const notifications: INotificationDocument[] = await notificationService.getNotifications(userTo)
    return notifications
  } catch (error) {
    throw error
  }
}

const NotificationModel: Model<INotificationDocument> = model<INotificationDocument>('Notification', notificationSchema, 'Notification')
export { NotificationModel }
