import { Router, Request, Response } from 'express'
import { db } from '../db/database'

const router = Router()

// GET /api/activities - Get all activities or filter by user or pot
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userAddress, potId } = req.query

    let activities: any[]

    // Base query with joins for user, pot, and friend info
    const baseQuery = `
      SELECT
        a.*,
        u.name as user_name,
        u.address as user_address,
        p.name as pot_name,
        f.name as friend_name,
        f.address as friend_address
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN pots p ON a.pot_id = p.id
      LEFT JOIN users f ON a.friend_id = f.id
    `

    if (userAddress) {
      // Get user by address first
      const user = await db.get<any>(
        'SELECT id FROM users WHERE address = ? OR pubkey = ?',
        [userAddress, userAddress]
      )

      if (!user) {
        res.json([])
        return
      }

      activities = await db.all(
        `${baseQuery} WHERE a.user_id = ? ORDER BY a.timestamp DESC`,
        [user.id]
      )
    } else if (potId) {
      activities = await db.all(
        `${baseQuery} WHERE a.pot_id = ? ORDER BY a.timestamp DESC`,
        [potId]
      )
    } else {
      activities = await db.all(`${baseQuery} ORDER BY a.timestamp DESC`)
    }

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      timestamp: activity.timestamp,
      userId: activity.user_address || activity.user_id,
      userName: activity.user_name,
      userAddress: activity.user_address,
      potId: activity.pot_id,
      potName: activity.pot_name,
      friendId: activity.friend_id,
      friendName: activity.friend_name,
      friendAddress: activity.friend_address,
      amount: activity.amount,
      currency: activity.currency,
      transactionSignature: activity.transaction_signature
    }))

    res.json(formattedActivities)
  } catch (error) {
    console.error('Error fetching activities:', error)
    res.status(500).json({ error: 'Failed to fetch activities' })
  }
})

// POST /api/activities/:id/read - Mark activity as read
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existingActivity = await db.get('SELECT id FROM activities WHERE id = ?', [id])
    if (!existingActivity) {
      res.status(404).json({ error: 'Activity not found' })
      return
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error marking activity as read:', error)
    res.status(500).json({ error: 'Failed to mark activity as read' })
  }
})

export default router
