import { db } from './database'
import dotenv from 'dotenv'

dotenv.config()

async function initializeDatabase() {
  try {
    await db.connect()
    await db.init()
    console.log('Database initialization completed successfully')
    await db.close()
    process.exit(0)
  } catch (error) {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  }
}

initializeDatabase()
