import { IChatJobData, IMessageData } from '@chat/interfaces/chat.interface'
import { BaseQueue } from '@service/queues/base.queue'
import { chatWorker } from '@workers/chat.worker'

class ChatQueue extends BaseQueue {
  constructor() {
    super('chats')
    this.processJob('addChatMessageToDB', 5, chatWorker.addChatMessageToDB)
    this.processJob('markMessageAsDeletedInDB', 5, chatWorker.markMessageAsDeleted)
    this.processJob('markMessagesAsReadInDB', 5, chatWorker.markMessagesAsReadInDB)
  }

  public addChatJob(name: string, data: IChatJobData | IMessageData): void {
    this.addJob(name, data)
  }
}

export const chatQueue: ChatQueue = new ChatQueue()
