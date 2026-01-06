import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/database'
import { CreatePotRequest, UpdatePotRequest, AddContributionRequest, Pot } from '../types'

const router = Router()

// Helper function to get pot with full details (including user info)
async function getPotWithDetails(potId: string): Promise<Pot | null> {
  const pot = await db.get<any>('SELECT * FROM pots WHERE id = ?', [potId])

  if (!pot) {
    return null
  }

  // Get creator info
  const creator = await db.get<any>('SELECT * FROM users WHERE id = ?', [pot.creator_id])

  // Get released_by user info if pot is released
  let releasedByAddress = null
  if (pot.released_by) {
    const releasedByUser = await db.get<any>('SELECT address FROM users WHERE id = ?', [pot.released_by])
    releasedByAddress = releasedByUser?.address
  }

  // Get contributors with user info
  const contributorsData = await db.all<any>(
    `SELECT u.* FROM users u
     JOIN pot_contributors pc ON u.id = pc.user_id
     WHERE pc.pot_id = ?`,
    [potId]
  )

  // Get contributions with contributor info
  const contributionsData = await db.all<any>(
    `SELECT c.*, u.id as user_id, u.name as user_name, u.address as user_address
     FROM contributions c
     JOIN users u ON c.contributor_id = u.id
     WHERE c.pot_id = ?
     ORDER BY c.timestamp DESC`,
    [potId]
  )

  // Parse signatures JSON
  let signatures: string[] = []
  try {
    signatures = pot.signatures ? JSON.parse(pot.signatures) : []
  } catch (e) {
    console.error('Error parsing signatures:', e)
  }

  return {
    id: pot.id,
    name: pot.name,
    description: pot.description,
    creatorAddress: creator?.address || pot.creator_id,
    potPubkey: pot.pot_pubkey,
    vaultPubkey: pot.vault_pubkey,
    targetAmount: pot.target_amount,
    totalContributed: pot.total_contributed || 0,
    targetDate: pot.target_date,
    unlockTimestamp: pot.unlock_timestamp || 0,
    currency: pot.currency,
    category: pot.category,
    signersRequired: pot.signers_required || 1,
    signatures,
    contributors: contributorsData.map(u => u.address),
    contributions: contributionsData.map(c => ({
      id: c.id,
      potId: c.pot_id,
      contributorAddress: c.user_address,
      amount: c.amount,
      currency: c.currency,
      timestamp: c.timestamp
    })),
    createdAt: pot.created_at,
    isReleased: pot.is_released === 1,
    releasedAt: pot.released_at,
    releasedBy: releasedByAddress,
    recipientAddress: pot.recipient_address
  }
}

// POST /api/pots - Create a new pot
router.post('/', async (req: Request, res: Response) => {
  try {
    const potData: CreatePotRequest = req.body

    if (!potData.name || !potData.creatorAddress || !potData.targetAmount || !potData.targetDate || !potData.currency || !potData.category) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    // Use transaction for atomicity
    await db.beginTransaction()

    try {
      // Get or create user for creator
      let creator = await db.get<any>(
        'SELECT * FROM users WHERE address = ? OR pubkey = ?',
        [potData.creatorAddress, potData.creatorAddress]
      )

      if (!creator) {
        // Auto-create user if doesn't exist
        const userId = uuidv4()
        const now = new Date().toISOString()
        await db.run(
          'INSERT INTO users (id, pubkey, address, is_profile_complete, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, potData.creatorAddress, potData.creatorAddress, 0, now, now]
        )
        creator = await db.get<any>('SELECT * FROM users WHERE id = ?', [userId])
      }

      const potId = uuidv4()
      const now = new Date().toISOString()

      await db.run(
        `INSERT INTO pots (id, name, description, creator_id, pot_pubkey, vault_pubkey, target_amount, total_contributed, target_date, unlock_timestamp, currency, category, signers_required, recipient_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          potId,
          potData.name,
          potData.description || null,
          creator.id,
          potData.potPubkey || null,
          potData.vaultPubkey || null,
          potData.targetAmount,
          0, // total_contributed starts at 0
          potData.targetDate,
          potData.unlockTimestamp || 0,
          potData.currency,
          potData.category,
          potData.signersRequired || 1,
          potData.recipientAddress || null,
          now
        ]
      )

      // Add contributors
      if (potData.contributors && potData.contributors.length > 0) {
        for (const contributorAddress of potData.contributors) {
          let contributor = await db.get<any>(
            'SELECT * FROM users WHERE address = ? OR pubkey = ?',
            [contributorAddress, contributorAddress]
          )

          if (!contributor) {
            const userId = uuidv4()
            const now = new Date().toISOString()
            await db.run(
              'INSERT INTO users (id, pubkey, address, is_profile_complete, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
              [userId, contributorAddress, contributorAddress, 0, now, now]
            )
            contributor = await db.get<any>('SELECT * FROM users WHERE id = ?', [userId])
          }

          await db.run(
            'INSERT OR IGNORE INTO pot_contributors (pot_id, user_id) VALUES (?, ?)',
            [potId, contributor.id]
          )
        }
      }

      // Create activity
      await db.run(
        `INSERT INTO activities (id, type, timestamp, user_id, pot_id, transaction_signature)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'pot_created', now, creator.id, potId, potData.transactionSignature || null]
      )

      // Commit transaction
      await db.commit()

      const pot = await getPotWithDetails(potId)
      res.status(201).json(pot)
    } catch (error) {
      // Rollback on any error
      await db.rollback()
      throw error
    }
  } catch (error) {
    console.error('Error creating pot:', error)
    res.status(500).json({ error: 'Failed to create pot' })
  }
})

// GET /api/pots - Get all pots or filter by user
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.query

    let pots: any[]

    if (userAddress) {
      // Get user ID from address
      const user = await db.get<any>(
        'SELECT id FROM users WHERE address = ? OR pubkey = ?',
        [userAddress, userAddress]
      )

      if (!user) {
        res.json([])
        return
      }

      pots = await db.all(
        `SELECT DISTINCT p.* FROM pots p
         LEFT JOIN pot_contributors pc ON p.id = pc.pot_id
         WHERE p.creator_id = ? OR pc.user_id = ?
         ORDER BY p.created_at DESC`,
        [user.id, user.id]
      )
    } else {
      pots = await db.all('SELECT * FROM pots ORDER BY created_at DESC')
    }

    const potsWithDetails = await Promise.all(
      pots.map(pot => getPotWithDetails(pot.id))
    )

    res.json(potsWithDetails.filter(Boolean))
  } catch (error) {
    console.error('Error fetching pots:', error)
    res.status(500).json({ error: 'Failed to fetch pots' })
  }
})

// GET /api/pots/:id - Get pot by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const pot = await getPotWithDetails(id)

    if (!pot) {
      res.status(404).json({ error: 'Pot not found' })
      return
    }

    res.json(pot)
  } catch (error) {
    console.error('Error fetching pot:', error)
    res.status(500).json({ error: 'Failed to fetch pot' })
  }
})

// PATCH /api/pots/:id - Update pot details
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates: UpdatePotRequest = req.body

    const existingPot = await db.get('SELECT id FROM pots WHERE id = ?', [id])
    if (!existingPot) {
      res.status(404).json({ error: 'Pot not found' })
      return
    }

    const fields: string[] = []
    const values: any[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.targetAmount !== undefined) {
      fields.push('target_amount = ?')
      values.push(updates.targetAmount)
    }
    if (updates.targetDate !== undefined) {
      fields.push('target_date = ?')
      values.push(updates.targetDate)
    }
    if (updates.currency !== undefined) {
      fields.push('currency = ?')
      values.push(updates.currency)
    }
    if (updates.category !== undefined) {
      fields.push('category = ?')
      values.push(updates.category)
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' })
      return
    }

    values.push(id)
    await db.run(
      `UPDATE pots SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    const pot = await getPotWithDetails(id)
    res.json(pot)
  } catch (error) {
    console.error('Error updating pot:', error)
    res.status(500).json({ error: 'Failed to update pot' })
  }
})

// DELETE /api/pots/:id - Delete a pot
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existingPot = await db.get('SELECT id FROM pots WHERE id = ?', [id])
    if (!existingPot) {
      res.status(404).json({ error: 'Pot not found' })
      return
    }

    await db.run('DELETE FROM pots WHERE id = ?', [id])
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting pot:', error)
    res.status(500).json({ error: 'Failed to delete pot' })
  }
})

// POST /api/pots/:id/contributors - Add contributor to pot
router.post('/:id/contributors', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { contributorAddress } = req.body

    if (!contributorAddress) {
      res.status(400).json({ error: 'contributorAddress is required' })
      return
    }

    const existingPot = await db.get('SELECT id FROM pots WHERE id = ?', [id])
    if (!existingPot) {
      res.status(404).json({ error: 'Pot not found' })
      return
    }

    // Get or create contributor user
    let contributor = await db.get<any>(
      'SELECT * FROM users WHERE address = ? OR pubkey = ?',
      [contributorAddress, contributorAddress]
    )

    if (!contributor) {
      const userId = uuidv4()
      const now = new Date().toISOString()
      await db.run(
        'INSERT INTO users (id, pubkey, address, is_profile_complete, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, contributorAddress, contributorAddress, 0, now, now]
      )
      contributor = await db.get<any>('SELECT * FROM users WHERE id = ?', [userId])
    }

    await db.run(
      'INSERT OR IGNORE INTO pot_contributors (pot_id, user_id) VALUES (?, ?)',
      [id, contributor.id]
    )

    res.status(201).json({ success: true })
  } catch (error) {
    console.error('Error adding contributor:', error)
    res.status(500).json({ error: 'Failed to add contributor' })
  }
})

// DELETE /api/pots/:id/contributors/:address - Remove contributor from pot
router.delete('/:id/contributors/:address', async (req: Request, res: Response) => {
  try {
    const { id, address } = req.params

    const user = await db.get<any>(
      'SELECT id FROM users WHERE address = ? OR pubkey = ?',
      [address, address]
    )

    if (user) {
      await db.run(
        'DELETE FROM pot_contributors WHERE pot_id = ? AND user_id = ?',
        [id, user.id]
      )
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error removing contributor:', error)
    res.status(500).json({ error: 'Failed to remove contributor' })
  }
})

// POST /api/pots/:id/contributions - Add contribution to pot
router.post('/:id/contributions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { contributorAddress, amount, currency, transactionSignature }: AddContributionRequest = req.body

    if (!contributorAddress || amount === undefined || !currency) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    const existingPot = await db.get<any>('SELECT * FROM pots WHERE id = ?', [id])
    if (!existingPot) {
      res.status(404).json({ error: 'Pot not found' })
      return
    }

    // Use transaction for atomicity
    await db.beginTransaction()

    try {
      // Get or create contributor user
      let contributor = await db.get<any>(
        'SELECT * FROM users WHERE address = ? OR pubkey = ?',
        [contributorAddress, contributorAddress]
      )

      if (!contributor) {
        const userId = uuidv4()
        const now = new Date().toISOString()
        await db.run(
          'INSERT INTO users (id, pubkey, address, is_profile_complete, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, contributorAddress, contributorAddress, 0, now, now]
        )
        contributor = await db.get<any>('SELECT * FROM users WHERE id = ?', [userId])
      }

      const contributionId = uuidv4()
      const now = new Date().toISOString()

      await db.run(
        'INSERT INTO contributions (id, pot_id, contributor_id, amount, currency, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [contributionId, id, contributor.id, amount, currency, now]
      )

      // Update pot's total_contributed
      await db.run(
        'UPDATE pots SET total_contributed = total_contributed + ? WHERE id = ?',
        [amount, id]
      )

      // Ensure contributor is in pot_contributors
      await db.run(
        'INSERT OR IGNORE INTO pot_contributors (pot_id, user_id) VALUES (?, ?)',
        [id, contributor.id]
      )

      const contribution = await db.get<any>(
        'SELECT * FROM contributions WHERE id = ?',
        [contributionId]
      )

      // Create activity
      await db.run(
        `INSERT INTO activities (id, type, timestamp, user_id, pot_id, amount, currency, transaction_signature)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'contribution', now, contributor.id, id, amount, currency, transactionSignature || null]
      )

      // Commit transaction
      await db.commit()

      res.status(201).json({
        id: contribution.id,
        potId: contribution.pot_id,
        contributorAddress: contributor.address,
        amount: contribution.amount,
        currency: contribution.currency,
        timestamp: contribution.timestamp
      })
    } catch (error) {
      // Rollback on any error
      await db.rollback()
      throw error
    }
  } catch (error) {
    console.error('Error adding contribution:', error)
    res.status(500).json({ error: 'Failed to add contribution' })
  }
})

// DELETE /api/pots/:id/contributions/:contributionId - Remove contribution
router.delete('/:id/contributions/:contributionId', async (req: Request, res: Response) => {
  try {
    const { id, contributionId } = req.params

    await db.run(
      'DELETE FROM contributions WHERE id = ? AND pot_id = ?',
      [contributionId, id]
    )

    res.status(204).send()
  } catch (error) {
    console.error('Error removing contribution:', error)
    res.status(500).json({ error: 'Failed to remove contribution' })
  }
})

// POST /api/pots/:id/sign - Sign release for pot
router.post('/:id/sign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { signerAddress, transactionSignature } = req.body

    if (!signerAddress) {
      res.status(400).json({ error: 'signerAddress is required' })
      return
    }

    const existingPot = await db.get<any>('SELECT * FROM pots WHERE id = ?', [id])
    if (!existingPot) {
      res.status(404).json({ error: 'Pot not found' })
      return
    }

    // Get signer user
    let signer = await db.get<any>(
      'SELECT * FROM users WHERE address = ? OR pubkey = ?',
      [signerAddress, signerAddress]
    )

    if (!signer) {
      // Auto-create user if doesn't exist
      const userId = uuidv4()
      const now = new Date().toISOString()
      await db.run(
        'INSERT INTO users (id, pubkey, address, is_profile_complete, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, signerAddress, signerAddress, 0, now, now]
      )
      signer = await db.get<any>('SELECT * FROM users WHERE id = ?', [userId])
    }

    // Parse existing signatures
    let signatures: string[] = []
    try {
      signatures = existingPot.signatures ? JSON.parse(existingPot.signatures) : []
    } catch (e) {
      console.error('Error parsing signatures:', e)
    }

    // Check if already signed
    if (signatures.includes(signerAddress)) {
      res.status(400).json({ error: 'Already signed' })
      return
    }

    // Add signature
    signatures.push(signerAddress)

    const now = new Date().toISOString()

    await db.run(
      'UPDATE pots SET signatures = ? WHERE id = ?',
      [JSON.stringify(signatures), id]
    )

    // Create activity for sign_release
    await db.run(
      `INSERT INTO activities (id, type, timestamp, user_id, pot_id, transaction_signature)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), 'sign_release', now, signer.id, id, transactionSignature]
    )

    res.json({ success: true, signatures })
  } catch (error) {
    console.error('Error signing release:', error)
    res.status(500).json({ error: 'Failed to sign release' })
  }
})

// POST /api/pots/:id/release - Release pot funds
router.post('/:id/release', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { releasedBy, transactionSignature } = req.body

    if (!releasedBy) {
      res.status(400).json({ error: 'releasedBy is required' })
      return
    }

    const existingPot = await db.get<any>('SELECT * FROM pots WHERE id = ?', [id])
    if (!existingPot) {
      res.status(404).json({ error: 'Pot not found' })
      return
    }

    // Get user
    const user = await db.get<any>(
      'SELECT * FROM users WHERE address = ? OR pubkey = ?',
      [releasedBy, releasedBy]
    )

    if (!user) {
      res.status(400).json({ error: 'User not found' })
      return
    }

    const now = new Date().toISOString()

    await db.run(
      'UPDATE pots SET is_released = 1, released_at = ?, released_by = ? WHERE id = ?',
      [now, user.id, id]
    )

    const totalAmount = await db.get<{ total: number }>(
      'SELECT SUM(amount) as total FROM contributions WHERE pot_id = ?',
      [id]
    )

    // Create activity
    await db.run(
      `INSERT INTO activities (id, type, timestamp, user_id, pot_id, amount, currency, transaction_signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), 'release', now, user.id, id, totalAmount?.total || 0, existingPot.currency, transactionSignature || null]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Error releasing pot:', error)
    res.status(500).json({ error: 'Failed to release pot' })
  }
})

export default router
