import { ServerError } from '@global/helpers/error-handler'
import { IReaction, IReactionDocument } from '@reaction/interfaces/reaction.interface'
import { config } from '@root/config'
import { BaseCache } from '@service/redis/base.cache'
import Logger from 'bunyan'
import { Helpers } from '@global/helpers/helpers'
import { find } from 'lodash'

const log: Logger = config.createLogger('reactionsCache')

export class ReactionCache extends BaseCache {
  constructor() {
    super('reactionsCache')
  }

  public async savePostReactionToCache(
    key: string,
    reaction: IReactionDocument,
    postReactions: IReaction,
    type: string,
    previousReaction: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      if (previousReaction) {
        this.removePostReactionFromCache(key, reaction.username, postReactions)
      }

      if (type) {
        await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reaction))
        const dataToSave: string[] = ['reactions', JSON.stringify(postReactions)]
        await this.client.HSET(`posts:${key}`, dataToSave)
      }
    } catch (error) {
      log.error(error)
      throw new ServerError('Server error. Try again.')
    }
  }

  public async removePostReactionFromCache(key: string, username: string, postReactions: IReaction): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      const response: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1)
      const multi: ReturnType<typeof this.client.multi> = this.client.multi()
      const userPreiousReaction: IReactionDocument = this.getPreviousReaction(response, username) as IReactionDocument

      multi.LREM(`reactions:${key}`, 1, JSON.stringify(userPreiousReaction))
      await multi.exec()

      const dataToSave: string[] = ['reactions', JSON.stringify(postReactions)]
      await this.client.HSET(`posts:${key}`, dataToSave)
    } catch (error) {
      log.error(error)
      throw new ServerError('Server error. Try again.')
    }
  }

  public async getReactionsFromCache(postId: string): Promise<[IReactionDocument[], number]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      const reactionCount: number = await this.client.LLEN(`reactions:${postId}`)
      const response: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1)

      const list: IReactionDocument[] = []

      for (const item of response) {
        list.push(Helpers.parseJson(item) as IReactionDocument)
      }

      return response.length ? [list, reactionCount] : [[], 0]
    } catch (error) {
      log.error(error)
      throw new ServerError('Server error. Try again.')
    }
  }

  public async getSingleReactionByUsernameFromCache(postId: string, username: string): Promise<[IReactionDocument, number] | []> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      const response: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1)

      const list: IReactionDocument[] = []

      for (const item of response) {
        list.push(Helpers.parseJson(item) as IReactionDocument)
      }

      const result: IReactionDocument = find(
        list,
        (listItem: IReactionDocument) => listItem.postId === postId && listItem.username === username
      ) as IReactionDocument

      return result ? [result, 1] : []
    } catch (error) {
      log.error(error)
      throw new ServerError('Server error. Try again.')
    }
  }

  private getPreviousReaction(response: string[], username: string): IReactionDocument | undefined {
    const list: IReactionDocument[] = []

    for (const item of response) {
      list.push(Helpers.parseJson(item) as IReactionDocument)
    }

    return find(list, (listItem: IReactionDocument) => listItem.username === username)
  }
}
