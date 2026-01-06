import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/cause-pots.db')

class Database {
  private db: sqlite3.Database | null = null

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const dir = path.dirname(DB_PATH)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error connecting to database:', err)
          reject(err)
        } else {
          console.log('Connected to SQLite database')
          resolve()
        }
      })
    })
  }

  async init(): Promise<void> {
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      this.db.exec(schema, (err) => {
        if (err) {
          console.error('Error initializing database:', err)
          reject(err)
        } else {
          console.log('Database initialized successfully')
          resolve()
        }
      })
    })
  }

  run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err)
        } else {
          resolve({ lastID: this.lastID, changes: this.changes })
        }
      })
    })
  }

  get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row as T | undefined)
        }
      })
    })
  }

  all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows as T[])
        }
      })
    })
  }

  async beginTransaction(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      this.db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async commit(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      this.db.run('COMMIT', (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async rollback(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'))
        return
      }

      this.db.run('ROLLBACK', (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }

      this.db.close((err) => {
        if (err) {
          reject(err)
        } else {
          console.log('Database connection closed')
          this.db = null
          resolve()
        }
      })
    })
  }
}

export const db = new Database()
