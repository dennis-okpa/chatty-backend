import { Request, Response } from 'express'
import { PostCache } from '@service/redis/post.cache'
import HTTP_STATUS from 'http-status-codes'
import { postQueue } from '@service/queues/post.queue'
import { socketIOPostObject } from '../../../shared/sockets/post'
import { joiValidation } from '@global/decorators/joi-validations.decorators'
import { postSchema, postWithImageSchema } from '@post/schemes/post.schemes'
import { IPostDocument } from '@post/interfaces/post.interface'
import { uploads } from '@global/helpers/cloudinary-upload'
import { BadRequestError } from '@global/helpers/error-handler'
import { UploadApiResponse } from 'cloudinary'
import { imageQueue } from '@service/queues/image.queue'

const postCache: PostCache = new PostCache()

export class Update {
  @joiValidation(postSchema)
  public async posts(req: Request, res: Response): Promise<void> {
    Update.prototype.updatePostWithImage(req)
    res.status(HTTP_STATUS.OK).json({ message: 'Post updated successfully' })
  }

  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    const { imgId, imgVersion } = req.body

    if (imgId && imgVersion) {
      Update.prototype.updatePostWithImage(req)
    } else {
      const result: UploadApiResponse = await Update.prototype.addImageToExistingPost(req)
      if (!result?.public_id) {
        throw new BadRequestError(result.message)
      }
    }

    res.status(HTTP_STATUS.OK).json({ message: 'Post with image updated successfully' })
  }

  private async updatePostWithImage(req: Request): Promise<void> {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = req.body
    const { postId } = req.params
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgId,
      imgVersion
    } as IPostDocument

    const postUpdated = await postCache.updatePostInCache(postId, updatedPost)
    socketIOPostObject.emit('update post', postUpdated, 'posts')
    postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated })
  }

  private async addImageToExistingPost(req: Request): Promise<UploadApiResponse> {
    const { post, bgColor, feelings, privacy, gifUrl, profilePicture, image } = req.body
    const { postId } = req.params

    const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse

    if (!result?.public_id) {
      return result
    }

    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgId: result.public_id,
      imgVersion: result.version.toString()
    } as IPostDocument

    const postUpdated = await postCache.updatePostInCache(postId, updatedPost)
    socketIOPostObject.emit('update post', postUpdated, 'posts')
    postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated })
    imageQueue.addImageJob('addImageToDB', {
      key: `${req.currentUser!.userId}`,
      imgId: result?.public_id,
      imgVersion: result.version.toString()
    })

    return result
  }
}
