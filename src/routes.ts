import { authRoutes } from '@auth/routes/authRoutes'
import { currentUserRoutes } from '@auth/routes/currentRoutes'
import { authMiddleware } from '@global/helpers/auth-middleware'
import { Application } from 'express'
import { serverAdapter } from './shared/services/queues/base.queue'

const BASE_PATH = '/api/v1'

export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter())
    app.use(BASE_PATH, authRoutes.routes())
    app.use(BASE_PATH, authRoutes.signoutRoute())

    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes())
  }
  routes()
}
