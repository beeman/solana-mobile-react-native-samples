# Cause Pots - Backend Server Implementation

## 🎯 Overview

Lightweight caching server that syncs with Solana blockchain and serves data to mobile app for fast loading times.

**Core Responsibilities:**
- Cache pot data from blockchain
- Provide REST API for frontend
- Sync blockchain events in real-time
- Aggregate contribution history
- Serve activity feeds

---

## 📋 Setup Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed
- [ ] Solana CLI configured
- [ ] Access to deployed Anchor program

### Initial Setup

```bash
# 1. Initialize Node.js project
cd backend
npm init -y

# 2. Install dependencies
npm install express cors dotenv pg
npm install @solana/web3.js @coral-xyz/anchor
npm install --save-dev typescript @types/node @types/express ts-node nodemon

# 3. Setup TypeScript
npx tsc --init

# 4. Create project structure
mkdir -p src/{routes,services,models,db,utils}
mkdir -p src/config

# 5. Setup PostgreSQL database
createdb cause_pots_db
```

### Project Structure

```
backend/
├── src/
│   ├── index.ts                 # Express app entry
│   ├── config/
│   │   ├── database.ts          # DB connection
│   │   └── solana.ts            # Solana/Anchor config
│   ├── db/
│   │   ├── schema.sql           # Database schema
│   │   └── migrations.ts        # DB migrations
│   ├── models/
│   │   ├── Pot.ts               # Pot data model
│   │   ├── Contribution.ts      # Contribution model
│   │   └── Contributor.ts       # Contributor model
│   ├── routes/
│   │   ├── pots.ts              # Pot endpoints
│   │   ├── contributions.ts     # Contribution endpoints
│   │   └── health.ts            # Health check
│   ├── services/
│   │   ├── blockchain-sync.ts   # Blockchain polling
│   │   ├── pot-service.ts       # Pot business logic
│   │   └── event-listener.ts    # Program event listener
│   └── utils/
│       ├── logger.ts            # Logging utility
│       └── validators.ts        # Input validation
├── .env.example
├── package.json
├── tsconfig.json
└── IMPLEMENTATION.md            # This file
```

---

## 🗄️ Database Schema

### Schema Definition

```sql
-- db/schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pots table
CREATE TABLE pots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pot_pubkey VARCHAR(44) UNIQUE NOT NULL,
    authority_pubkey VARCHAR(44) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount BIGINT NOT NULL,
    total_contributed BIGINT DEFAULT 0,
    currency VARCHAR(10) NOT NULL CHECK (currency IN ('SOL', 'USDC')),
    unlock_timestamp BIGINT NOT NULL,
    signers_required SMALLINT NOT NULL,
    is_released BOOLEAN DEFAULT FALSE,
    released_at TIMESTAMP,
    recipient_pubkey VARCHAR(44),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    synced_at TIMESTAMP DEFAULT NOW()
);

-- Contributors table (junction table)
CREATE TABLE contributors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pot_pubkey VARCHAR(44) NOT NULL REFERENCES pots(pot_pubkey) ON DELETE CASCADE,
    contributor_pubkey VARCHAR(44) NOT NULL,
    total_contributed BIGINT DEFAULT 0,
    contribution_count INTEGER DEFAULT 0,
    last_contribution_at TIMESTAMP,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(pot_pubkey, contributor_pubkey)
);

-- Contributions table
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pot_pubkey VARCHAR(44) NOT NULL REFERENCES pots(pot_pubkey) ON DELETE CASCADE,
    contributor_pubkey VARCHAR(44) NOT NULL,
    amount BIGINT NOT NULL,
    tx_signature VARCHAR(88) NOT NULL UNIQUE,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Release signatures table
CREATE TABLE release_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pot_pubkey VARCHAR(44) NOT NULL REFERENCES pots(pot_pubkey) ON DELETE CASCADE,
    signer_pubkey VARCHAR(44) NOT NULL,
    signed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(pot_pubkey, signer_pubkey)
);

-- Activity feed table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('pot_created', 'contribution', 'release_signed', 'funds_released', 'contributor_added')),
    pot_pubkey VARCHAR(44) REFERENCES pots(pot_pubkey) ON DELETE CASCADE,
    user_pubkey VARCHAR(44) NOT NULL,
    amount BIGINT,
    currency VARCHAR(10),
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pots_authority ON pots(authority_pubkey);
CREATE INDEX idx_pots_is_released ON pots(is_released);
CREATE INDEX idx_pots_created_at ON pots(created_at DESC);
CREATE INDEX idx_contributors_pubkey ON contributors(contributor_pubkey);
CREATE INDEX idx_contributions_pot ON contributions(pot_pubkey);
CREATE INDEX idx_contributions_contributor ON contributions(contributor_pubkey);
CREATE INDEX idx_contributions_timestamp ON contributions(timestamp DESC);
CREATE INDEX idx_activities_user ON activities(user_pubkey);
CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pots_updated_at BEFORE UPDATE ON pots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Migration Script

```typescript
// db/migrations.ts
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export async function runMigrations(pool: Pool) {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    try {
        await pool.query(schema);
        console.log('✅ Database migrations completed');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}
```

---

## 🔧 Configuration

### Environment Variables

```bash
# .env.example
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cause_pots_db

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
PROGRAM_ID=YourProgramIDHere

# Sync settings
SYNC_INTERVAL_MS=10000
EVENT_POLL_INTERVAL_MS=5000

# CORS
CORS_ORIGIN=http://localhost:8081
```

### Database Config

```typescript
// config/database.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    process.exit(-1);
});

export async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Database connected');
        client.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}
```

### Solana Config

```typescript
// config/solana.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { CausePots } from '../types/cause_pots'; // Generated from IDL
import idl from '../idl/cause_pots.json';
import dotenv from 'dotenv';

dotenv.config();

export const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
);

export const programId = new PublicKey(process.env.PROGRAM_ID!);

// Read-only wallet for RPC calls
const dummyWallet = Wallet.local();

export const provider = new AnchorProvider(
    connection,
    dummyWallet,
    { commitment: 'confirmed' }
);

export const program = new Program<CausePots>(
    idl as any,
    programId,
    provider
);

export async function testSolanaConnection() {
    try {
        const version = await connection.getVersion();
        console.log('✅ Solana connected:', version);
    } catch (error) {
        console.error('❌ Solana connection failed:', error);
        throw error;
    }
}
```

---

## 🌐 API Endpoints

### 1. Pot Endpoints

```typescript
// routes/pots.ts
import { Router } from 'express';
import { PotService } from '../services/pot-service';

const router = Router();
const potService = new PotService();

// GET /api/pots - List all pots
router.get('/', async (req, res) => {
    try {
        const { limit = 50, offset = 0, is_released, authority } = req.query;

        const pots = await potService.listPots({
            limit: Number(limit),
            offset: Number(offset),
            isReleased: is_released === 'true' ? true : is_released === 'false' ? false : undefined,
            authority: authority as string,
        });

        res.json({
            success: true,
            data: pots,
            meta: {
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    } catch (error) {
        console.error('Error fetching pots:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch pots' });
    }
});

// GET /api/pots/:pubkey - Get pot details
router.get('/:pubkey', async (req, res) => {
    try {
        const { pubkey } = req.params;
        const pot = await potService.getPotByPubkey(pubkey);

        if (!pot) {
            return res.status(404).json({ success: false, error: 'Pot not found' });
        }

        res.json({ success: true, data: pot });
    } catch (error) {
        console.error('Error fetching pot:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch pot' });
    }
});

// GET /api/pots/:pubkey/contributors - Get pot contributors
router.get('/:pubkey/contributors', async (req, res) => {
    try {
        const { pubkey } = req.params;
        const contributors = await potService.getContributors(pubkey);

        res.json({ success: true, data: contributors });
    } catch (error) {
        console.error('Error fetching contributors:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch contributors' });
    }
});

// GET /api/pots/:pubkey/contributions - Get pot contributions
router.get('/:pubkey/contributions', async (req, res) => {
    try {
        const { pubkey } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const contributions = await potService.getContributions(pubkey, {
            limit: Number(limit),
            offset: Number(offset),
        });

        res.json({ success: true, data: contributions });
    } catch (error) {
        console.error('Error fetching contributions:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch contributions' });
    }
});

// GET /api/pots/:pubkey/signatures - Get release signatures
router.get('/:pubkey/signatures', async (req, res) => {
    try {
        const { pubkey } = req.params;
        const signatures = await potService.getReleaseSignatures(pubkey);

        res.json({ success: true, data: signatures });
    } catch (error) {
        console.error('Error fetching signatures:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch signatures' });
    }
});

// POST /api/pots - Cache a new pot (called from frontend after on-chain creation)
router.post('/', async (req, res) => {
    try {
        const { pot_pubkey } = req.body;

        if (!pot_pubkey) {
            return res.status(400).json({ success: false, error: 'pot_pubkey is required' });
        }

        // Fetch from blockchain and cache
        const pot = await potService.syncPotFromBlockchain(pot_pubkey);

        res.status(201).json({ success: true, data: pot });
    } catch (error) {
        console.error('Error caching pot:', error);
        res.status(500).json({ success: false, error: 'Failed to cache pot' });
    }
});

export default router;
```

### 2. User Endpoints

```typescript
// routes/users.ts
import { Router } from 'express';
import { PotService } from '../services/pot-service';

const router = Router();
const potService = new PotService();

// GET /api/users/:pubkey/pots - Get pots for a user
router.get('/:pubkey/pots', async (req, res) => {
    try {
        const { pubkey } = req.params;
        const pots = await potService.getUserPots(pubkey);

        res.json({ success: true, data: pots });
    } catch (error) {
        console.error('Error fetching user pots:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user pots' });
    }
});

// GET /api/users/:pubkey/contributions - Get user's contributions across all pots
router.get('/:pubkey/contributions', async (req, res) => {
    try {
        const { pubkey } = req.params;
        const contributions = await potService.getUserContributions(pubkey);

        res.json({ success: true, data: contributions });
    } catch (error) {
        console.error('Error fetching user contributions:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch contributions' });
    }
});

// GET /api/users/:pubkey/activities - Get user activity feed
router.get('/:pubkey/activities', async (req, res) => {
    try {
        const { pubkey } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const activities = await potService.getUserActivities(pubkey, {
            limit: Number(limit),
            offset: Number(offset),
        });

        res.json({ success: true, data: activities });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch activities' });
    }
});

export default router;
```

### 3. Health Check

```typescript
// routes/health.ts
import { Router } from 'express';
import { pool } from '../config/database';
import { connection } from '../config/solana';

const router = Router();

router.get('/', async (req, res) => {
    try {
        // Check database
        await pool.query('SELECT 1');

        // Check Solana connection
        await connection.getSlot();

        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'up',
                solana: 'up',
            },
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
```

---

## 🔄 Blockchain Sync Service

### Main Sync Service

```typescript
// services/blockchain-sync.ts
import { program } from '../config/solana';
import { PotService } from './pot-service';
import { PublicKey } from '@solana/web3.js';

export class BlockchainSyncService {
    private potService: PotService;
    private syncInterval: NodeJS.Timeout | null = null;
    private isRunning = false;

    constructor() {
        this.potService = new PotService();
    }

    /**
     * Start the sync service
     */
    async start() {
        if (this.isRunning) {
            console.log('Sync service already running');
            return;
        }

        console.log('🚀 Starting blockchain sync service...');
        this.isRunning = true;

        // Run initial sync
        await this.syncAllPots();

        // Setup periodic sync
        const intervalMs = Number(process.env.SYNC_INTERVAL_MS) || 10000;
        this.syncInterval = setInterval(async () => {
            await this.syncAllPots();
        }, intervalMs);

        console.log(`✅ Sync service started (interval: ${intervalMs}ms)`);
    }

    /**
     * Stop the sync service
     */
    stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.isRunning = false;
        console.log('🛑 Sync service stopped');
    }

    /**
     * Sync all pots from blockchain
     */
    private async syncAllPots() {
        try {
            console.log('🔄 Syncing pots from blockchain...');

            // Fetch all pot accounts from blockchain
            const potAccounts = await program.account.potAccount.all();

            console.log(`Found ${potAccounts.length} pots on-chain`);

            // Sync each pot
            for (const potAccount of potAccounts) {
                try {
                    await this.potService.syncPotFromBlockchain(
                        potAccount.publicKey.toString()
                    );
                } catch (error) {
                    console.error(
                        `Failed to sync pot ${potAccount.publicKey.toString()}:`,
                        error
                    );
                }
            }

            console.log('✅ Sync completed');
        } catch (error) {
            console.error('❌ Sync failed:', error);
        }
    }

    /**
     * Sync a specific pot by pubkey
     */
    async syncPot(potPubkey: string) {
        return await this.potService.syncPotFromBlockchain(potPubkey);
    }
}
```

### Event Listener Service

```typescript
// services/event-listener.ts
import { program, connection } from '../config/solana';
import { PotService } from './pot-service';

export class EventListenerService {
    private potService: PotService;
    private listeners: number[] = [];

    constructor() {
        this.potService = new PotService();
    }

    /**
     * Start listening to program events
     */
    async start() {
        console.log('🎧 Starting event listener...');

        // Listen to PotCreated events
        const potCreatedListener = program.addEventListener('PotCreated', async (event, slot) => {
            console.log('📢 PotCreated event:', event);
            try {
                await this.potService.syncPotFromBlockchain(event.pot.toString());
                await this.potService.addActivity({
                    activityType: 'pot_created',
                    potPubkey: event.pot.toString(),
                    userPubkey: event.authority.toString(),
                    metadata: {
                        name: event.name,
                        targetAmount: event.targetAmount.toString(),
                    },
                });
            } catch (error) {
                console.error('Error handling PotCreated event:', error);
            }
        });
        this.listeners.push(potCreatedListener);

        // Listen to ContributionMade events
        const contributionListener = program.addEventListener('ContributionMade', async (event, slot) => {
            console.log('📢 ContributionMade event:', event);
            try {
                await this.potService.syncPotFromBlockchain(event.pot.toString());
                await this.potService.addActivity({
                    activityType: 'contribution',
                    potPubkey: event.pot.toString(),
                    userPubkey: event.contributor.toString(),
                    amount: event.amount.toString(),
                    metadata: {
                        totalContributed: event.totalContributed.toString(),
                    },
                });
            } catch (error) {
                console.error('Error handling ContributionMade event:', error);
            }
        });
        this.listeners.push(contributionListener);

        // Listen to ReleaseSignatureAdded events
        const signatureListener = program.addEventListener('ReleaseSignatureAdded', async (event, slot) => {
            console.log('📢 ReleaseSignatureAdded event:', event);
            try {
                await this.potService.syncPotFromBlockchain(event.pot.toString());
                await this.potService.addActivity({
                    activityType: 'release_signed',
                    potPubkey: event.pot.toString(),
                    userPubkey: event.signer.toString(),
                    metadata: {
                        signaturesCount: event.signaturesCount,
                        signersRequired: event.signersRequired,
                    },
                });
            } catch (error) {
                console.error('Error handling ReleaseSignatureAdded event:', error);
            }
        });
        this.listeners.push(signatureListener);

        // Listen to FundsReleased events
        const releaseListener = program.addEventListener('FundsReleased', async (event, slot) => {
            console.log('📢 FundsReleased event:', event);
            try {
                await this.potService.syncPotFromBlockchain(event.pot.toString());
                await this.potService.addActivity({
                    activityType: 'funds_released',
                    potPubkey: event.pot.toString(),
                    userPubkey: event.releasedBy.toString(),
                    amount: event.amount.toString(),
                    metadata: {
                        recipient: event.recipient.toString(),
                    },
                });
            } catch (error) {
                console.error('Error handling FundsReleased event:', error);
            }
        });
        this.listeners.push(releaseListener);

        console.log('✅ Event listeners started');
    }

    /**
     * Stop all event listeners
     */
    async stop() {
        console.log('🛑 Stopping event listeners...');
        for (const listener of this.listeners) {
            await program.removeEventListener(listener);
        }
        this.listeners = [];
        console.log('✅ Event listeners stopped');
    }
}
```

---

## 💼 Business Logic Service

```typescript
// services/pot-service.ts
import { pool } from '../config/database';
import { program } from '../config/solana';
import { PublicKey } from '@solana/web3.js';

export interface PotData {
    id: string;
    pot_pubkey: string;
    authority_pubkey: string;
    name: string;
    description?: string;
    target_amount: string;
    total_contributed: string;
    currency: string;
    unlock_timestamp: string;
    signers_required: number;
    is_released: boolean;
    released_at?: Date;
    recipient_pubkey?: string;
    created_at: Date;
    updated_at: Date;
}

export class PotService {
    /**
     * Fetch pot from blockchain and sync to database
     */
    async syncPotFromBlockchain(potPubkey: string): Promise<PotData> {
        const pot = await program.account.potAccount.fetch(new PublicKey(potPubkey));

        const potData = {
            pot_pubkey: potPubkey,
            authority_pubkey: pot.authority.toString(),
            name: pot.name,
            description: pot.description || '',
            target_amount: pot.targetAmount.toString(),
            total_contributed: pot.totalContributed.toString(),
            currency: pot.currency.sol ? 'SOL' : 'USDC',
            unlock_timestamp: pot.unlockTimestamp.toString(),
            signers_required: pot.signersRequired,
            is_released: pot.isReleased,
            released_at: pot.releasedAt ? new Date(pot.releasedAt.toNumber() * 1000) : null,
            recipient_pubkey: pot.recipient?.toString(),
        };

        // Upsert pot
        const query = `
            INSERT INTO pots (
                pot_pubkey, authority_pubkey, name, description,
                target_amount, total_contributed, currency,
                unlock_timestamp, signers_required, is_released,
                released_at, recipient_pubkey, synced_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            ON CONFLICT (pot_pubkey)
            DO UPDATE SET
                total_contributed = $6,
                is_released = $10,
                released_at = $11,
                recipient_pubkey = $12,
                synced_at = NOW()
            RETURNING *
        `;

        const result = await pool.query(query, [
            potData.pot_pubkey,
            potData.authority_pubkey,
            potData.name,
            potData.description,
            potData.target_amount,
            potData.total_contributed,
            potData.currency,
            potData.unlock_timestamp,
            potData.signers_required,
            potData.is_released,
            potData.released_at,
            potData.recipient_pubkey,
        ]);

        // Sync contributors
        await this.syncContributors(potPubkey, pot.contributors);

        // Sync signatures
        if (pot.signatures && pot.signatures.length > 0) {
            await this.syncSignatures(potPubkey, pot.signatures);
        }

        return result.rows[0];
    }

    /**
     * Sync contributors for a pot
     */
    private async syncContributors(potPubkey: string, contributors: PublicKey[]) {
        for (const contributor of contributors) {
            const query = `
                INSERT INTO contributors (pot_pubkey, contributor_pubkey)
                VALUES ($1, $2)
                ON CONFLICT (pot_pubkey, contributor_pubkey) DO NOTHING
            `;
            await pool.query(query, [potPubkey, contributor.toString()]);
        }
    }

    /**
     * Sync release signatures
     */
    private async syncSignatures(potPubkey: string, signatures: PublicKey[]) {
        for (const signer of signatures) {
            const query = `
                INSERT INTO release_signatures (pot_pubkey, signer_pubkey)
                VALUES ($1, $2)
                ON CONFLICT (pot_pubkey, signer_pubkey) DO NOTHING
            `;
            await pool.query(query, [potPubkey, signer.toString()]);
        }
    }

    /**
     * List pots with filters
     */
    async listPots(options: {
        limit: number;
        offset: number;
        isReleased?: boolean;
        authority?: string;
    }): Promise<PotData[]> {
        let query = 'SELECT * FROM pots WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (options.isReleased !== undefined) {
            query += ` AND is_released = $${paramIndex}`;
            params.push(options.isReleased);
            paramIndex++;
        }

        if (options.authority) {
            query += ` AND authority_pubkey = $${paramIndex}`;
            params.push(options.authority);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(options.limit, options.offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Get pot by pubkey
     */
    async getPotByPubkey(pubkey: string): Promise<PotData | null> {
        const result = await pool.query(
            'SELECT * FROM pots WHERE pot_pubkey = $1',
            [pubkey]
        );
        return result.rows[0] || null;
    }

    /**
     * Get pots for a user (created or contributed to)
     */
    async getUserPots(userPubkey: string): Promise<PotData[]> {
        const query = `
            SELECT DISTINCT p.*
            FROM pots p
            LEFT JOIN contributors c ON p.pot_pubkey = c.pot_pubkey
            WHERE p.authority_pubkey = $1 OR c.contributor_pubkey = $1
            ORDER BY p.created_at DESC
        `;
        const result = await pool.query(query, [userPubkey]);
        return result.rows;
    }

    /**
     * Get contributors for a pot
     */
    async getContributors(potPubkey: string) {
        const result = await pool.query(
            'SELECT * FROM contributors WHERE pot_pubkey = $1 ORDER BY total_contributed DESC',
            [potPubkey]
        );
        return result.rows;
    }

    /**
     * Get contributions for a pot
     */
    async getContributions(potPubkey: string, options: { limit: number; offset: number }) {
        const result = await pool.query(
            `SELECT * FROM contributions
             WHERE pot_pubkey = $1
             ORDER BY timestamp DESC
             LIMIT $2 OFFSET $3`,
            [potPubkey, options.limit, options.offset]
        );
        return result.rows;
    }

    /**
     * Get user contributions across all pots
     */
    async getUserContributions(userPubkey: string) {
        const result = await pool.query(
            `SELECT * FROM contributions
             WHERE contributor_pubkey = $1
             ORDER BY timestamp DESC`,
            [userPubkey]
        );
        return result.rows;
    }

    /**
     * Get release signatures for a pot
     */
    async getReleaseSignatures(potPubkey: string) {
        const result = await pool.query(
            'SELECT * FROM release_signatures WHERE pot_pubkey = $1 ORDER BY signed_at DESC',
            [potPubkey]
        );
        return result.rows;
    }

    /**
     * Get user activity feed
     */
    async getUserActivities(userPubkey: string, options: { limit: number; offset: number }) {
        const result = await pool.query(
            `SELECT * FROM activities
             WHERE user_pubkey = $1
             ORDER BY timestamp DESC
             LIMIT $2 OFFSET $3`,
            [userPubkey, options.limit, options.offset]
        );
        return result.rows;
    }

    /**
     * Add activity to feed
     */
    async addActivity(data: {
        activityType: string;
        potPubkey: string;
        userPubkey: string;
        amount?: string;
        metadata?: any;
    }) {
        const query = `
            INSERT INTO activities (activity_type, pot_pubkey, user_pubkey, amount, metadata)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await pool.query(query, [
            data.activityType,
            data.potPubkey,
            data.userPubkey,
            data.amount,
            JSON.stringify(data.metadata),
        ]);
        return result.rows[0];
    }
}
```

---

## 🚀 Main Application

```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import { testSolanaConnection } from './config/solana';
import { BlockchainSyncService } from './services/blockchain-sync';
import { EventListenerService } from './services/event-listener';
import potsRouter from './routes/pots';
import usersRouter from './routes/users';
import healthRouter from './routes/health';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Routes
app.use('/api/pots', potsRouter);
app.use('/api/users', usersRouter);
app.use('/api/health', healthRouter);

// Start server
async function start() {
    try {
        // Test connections
        await testConnection();
        await testSolanaConnection();

        // Start sync service
        const syncService = new BlockchainSyncService();
        await syncService.start();

        // Start event listener
        const eventListener = new EventListenerService();
        await eventListener.start();

        // Start Express server
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down gracefully...');
            syncService.stop();
            await eventListener.stop();
            process.exit(0);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

start();
```

---

## 📦 Package.json Scripts

```json
{
  "name": "cause-pots-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "migrate": "ts-node src/db/migrations.ts",
    "test": "jest"
  },
  "dependencies": {
    "@coral-xyz/anchor": "^0.29.0",
    "@solana/web3.js": "^1.87.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.17",
    "@types/node": "^20.0.0",
    "@types/pg": "^8.10.0",
    "nodemon": "^3.0.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.0.0"
  }
}
```

---

## ✅ Implementation Checklist

### Phase 1: Setup
- [ ] Initialize project and install dependencies
- [ ] Setup TypeScript configuration
- [ ] Create project structure
- [ ] Setup environment variables
- [ ] Create database and run migrations

### Phase 2: Core Services
- [ ] Implement database models
- [ ] Implement PotService
- [ ] Implement BlockchainSyncService
- [ ] Implement EventListenerService

### Phase 3: API Endpoints
- [ ] Implement pot endpoints
- [ ] Implement user endpoints
- [ ] Implement health check
- [ ] Add input validation
- [ ] Add error handling

### Phase 4: Testing & Deployment
- [ ] Write integration tests
- [ ] Test sync service
- [ ] Test event listeners
- [ ] Deploy to cloud (Heroku/Railway/DigitalOcean)
- [ ] Setup monitoring and logging

---

## 🐛 Known Issues / TODO

- [ ] Add rate limiting
- [ ] Add API authentication
- [ ] Implement pagination metadata
- [ ] Add request logging
- [ ] Add performance monitoring
- [ ] Implement caching layer (Redis)
- [ ] Add WebSocket for real-time updates
- [ ] Implement retry logic for failed syncs
- [ ] Add database connection pooling optimization

---

*Last Updated: 2025-12-02*
