import { authRoutes } from '@auth/routes/authRoutes'
import { currentUserRoutes } from '@auth/routes/currentRoutes'
import { commentRoutes } from '@comment/routes/commentRoutes'
import { followerRoutes } from '@follower/routes/followerRoutes'
import { authMiddleware } from '@global/helpers/auth-middleware'
import { notificationRoutes } from '@notification/routes/notificationRoutes'
import { postRoutes } from '@post/routes/postRoutes'
import { reactionRoutes } from '@reaction/routes/reactionRoutes'
import { Application } from 'express'
import { imageRoutes } from './features/images/routes/imageRoutes'
import { serverAdapter } from './shared/services/queues/base.queue'

const BASE_PATH = '/api/v1'

export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter())
    app.use(BASE_PATH, authRoutes.routes())
    app.use(BASE_PATH, authRoutes.signoutRoute())

    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes())
    app.use(BASE_PATH, authMiddleware.verifyUser, postRoutes.routes())
    app.use(BASE_PATH, authMiddleware.verifyUser, reactionRoutes.routes())
    app.use(BASE_PATH, authMiddleware.verifyUser, commentRoutes.routes())
    app.use(BASE_PATH, authMiddleware.verifyUser, followerRoutes.routes())
    app.use(BASE_PATH, authMiddleware.verifyUser, notificationRoutes.routes())
    app.use(BASE_PATH, authMiddleware.verifyUser, imageRoutes.routes())
  }
  routes()
}
