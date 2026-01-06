import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { db } from './db/database'
import potsRouter from './routes/pots'
import friendsRouter from './routes/friends'
import activitiesRouter from './routes/activities'
import usersRouter from './routes/users'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// CORS configuration - allows all origins for demo/development
// ⚠️ For production: Configure specific allowed origins in .env
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}))
app.use(express.json())

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Cause Pots API Server',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      pots: '/api/pots',
      friends: '/api/friends',
      activities: '/api/activities'
    }
  })
})

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await db.get('SELECT 1')
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.use('/api/users', usersRouter)
app.use('/api/pots', potsRouter)
app.use('/api/friends', friendsRouter)
app.use('/api/activities', activitiesRouter)

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' })
})

async function start() {
  try {
    await db.connect()
    await db.init()
    console.log('Database connected and initialized')

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`)
      console.log(`Health check: http://localhost:${PORT}/health`)
      console.log(`API endpoints: http://localhost:${PORT}/api`)
    })

    process.on('SIGINT', async () => {
      console.log('\nShutting down gracefully...')
      await db.close()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      console.log('\nShutting down gracefully...')
      await db.close()
      process.exit(0)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
