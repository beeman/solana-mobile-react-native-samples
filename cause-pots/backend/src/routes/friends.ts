import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/database'
import { AddFriendRequest, UpdateFriendRequest } from '../types'

const router = Router()

// POST /api/friends - Add a friend
router.post('/', async (req: Request, res: Response) => {
  try {
    const friendData: AddFriendRequest = req.body

    if (!friendData.address) {
      res.status(400).json({ error: 'address is required' })
      return
    }

    // Check if friend user exists in database
    const friendUser = await db.get<any>(
      'SELECT * FROM users WHERE address = ? OR pubkey = ?',
      [friendData.address, friendData.address]
    )

    if (!friendUser) {
      res.status(404).json({
        error: 'User not found',
        message: 'The address you entered does not exist in our database. Please use an address from the seed data or create a user first.'
      })
      return
    }

    // Get current user from header/body (for now, we'll assume it's passed)
    // In production, this would come from authentication middleware
    const { currentUserAddress } = req.body

    if (!currentUserAddress) {
      res.status(400).json({ error: 'currentUserAddress is required' })
      return
    }

    let currentUser = await db.get<any>(
      'SELECT * FROM users WHERE address = ? OR pubkey = ?',
      [currentUserAddress, currentUserAddress]
    )

    if (!currentUser) {
      // Create current user if doesn't exist
      const userId = uuidv4()
      const now = new Date().toISOString()
      await db.run(
        'INSERT INTO users (id, pubkey, address, is_profile_complete, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, currentUserAddress, currentUserAddress, 0, now, now]
      )
      currentUser = await db.get<any>('SELECT * FROM users WHERE id = ?', [userId])
    }

    // Check if friendship already exists
    const existingFriendship = await db.get(
      'SELECT id FROM friends WHERE user_id = ? AND friend_id = ?',
      [currentUser.id, friendUser.id]
    )

    if (existingFriendship) {
      res.status(409).json({ error: 'Friend relationship already exists' })
      return
    }

    const friendshipId = uuidv4()
    const now = new Date().toISOString()

    await db.run(
      'INSERT INTO friends (id, user_id, friend_id, display_name, added_at) VALUES (?, ?, ?, ?, ?)',
      [friendshipId, currentUser.id, friendUser.id, friendData.displayName || null, now]
    )

    // Create activity
    await db.run(
      `INSERT INTO activities (id, type, timestamp, user_id, friend_id)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), 'friend_added', now, currentUser.id, friendUser.id]
    )

    res.status(201).json({
      id: friendshipId,
      publicKey: friendUser.pubkey,
      address: friendUser.address,
      displayName: friendData.displayName || friendUser.name,
      addedAt: now
    })
  } catch (error) {
    console.error('Error adding friend:', error)
    res.status(500).json({ error: 'Failed to add friend' })
  }
})

// GET /api/friends - Get all friends for a user
router.get('/', async (req: Request, res: Response) => {
  try {
    const { address, userAddress } = req.query
    const searchAddress = (address || userAddress) as string

    if (!searchAddress) {
      res.status(400).json({ error: 'address or userAddress query parameter is required' })
      return
    }

    // Get user
    const user = await db.get<any>(
      'SELECT * FROM users WHERE address = ? OR pubkey = ?',
      [searchAddress, searchAddress]
    )

    if (!user) {
      res.json([])
      return
    }

    // Get all friends for this user
    const friends = await db.all<any>(
      `SELECT u.*, f.id as friendship_id, f.display_name as custom_name, f.added_at
       FROM friends f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = ?
       ORDER BY f.added_at DESC`,
      [user.id]
    )

    const formattedFriends = friends.map(friend => ({
      id: friend.friendship_id,
      publicKey: friend.pubkey,
      address: friend.address,
      displayName: friend.custom_name || friend.name,
      addedAt: friend.added_at
    }))

    res.json(formattedFriends)
  } catch (error) {
    console.error('Error fetching friends:', error)
    res.status(500).json({ error: 'Failed to fetch friends' })
  }
})

// GET /api/friends/:id - Get friend by friendship ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const friendship = await db.get<any>(
      `SELECT u.*, f.id as friendship_id, f.display_name as custom_name, f.added_at
       FROM friends f
       JOIN users u ON f.friend_id = u.id
       WHERE f.id = ?`,
      [id]
    )

    if (!friendship) {
      res.status(404).json({ error: 'Friend not found' })
      return
    }

    res.json({
      id: friendship.friendship_id,
      publicKey: friendship.pubkey,
      address: friendship.address,
      displayName: friendship.custom_name || friendship.name,
      addedAt: friendship.added_at
    })
  } catch (error) {
    console.error('Error fetching friend:', error)
    res.status(500).json({ error: 'Failed to fetch friend' })
  }
})

// PATCH /api/friends/:id - Update friend (custom display name)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates: UpdateFriendRequest = req.body

    const existingFriendship = await db.get('SELECT id FROM friends WHERE id = ?', [id])
    if (!existingFriendship) {
      res.status(404).json({ error: 'Friend not found' })
      return
    }

    if (updates.displayName !== undefined) {
      await db.run(
        'UPDATE friends SET display_name = ? WHERE id = ?',
        [updates.displayName, id]
      )
    }

    const friendship = await db.get<any>(
      `SELECT u.*, f.id as friendship_id, f.display_name as custom_name, f.added_at
       FROM friends f
       JOIN users u ON f.friend_id = u.id
       WHERE f.id = ?`,
      [id]
    )

    res.json({
      id: friendship.friendship_id,
      publicKey: friendship.pubkey,
      address: friendship.address,
      displayName: friendship.custom_name || friendship.name,
      addedAt: friendship.added_at
    })
  } catch (error) {
    console.error('Error updating friend:', error)
    res.status(500).json({ error: 'Failed to update friend' })
  }
})

// DELETE /api/friends/:id - Remove a friend
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existingFriendship = await db.get('SELECT id FROM friends WHERE id = ?', [id])
    if (!existingFriendship) {
      res.status(404).json({ error: 'Friend not found' })
      return
    }

    await db.run('DELETE FROM friends WHERE id = ?', [id])
    res.status(204).send()
  } catch (error) {
    console.error('Error removing friend:', error)
    res.status(500).json({ error: 'Failed to remove friend' })
  }
})

export default router
