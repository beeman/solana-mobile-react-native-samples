-- Users table (wallet-based)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    pubkey TEXT UNIQUE NOT NULL,
    address TEXT UNIQUE NOT NULL,
    name TEXT,
    domain TEXT,
    avatar_uri TEXT,
    is_profile_complete INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Pots table
CREATE TABLE IF NOT EXISTS pots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id TEXT NOT NULL,
    pot_pubkey TEXT UNIQUE,
    vault_pubkey TEXT,
    target_amount REAL NOT NULL,
    total_contributed REAL DEFAULT 0,
    target_date TEXT NOT NULL,
    unlock_timestamp INTEGER DEFAULT 0,
    currency TEXT NOT NULL CHECK (currency IN ('SOL', 'USDC')),
    category TEXT NOT NULL CHECK (category IN ('Goal', 'Emergency', 'Bills', 'Events', 'Others')),
    signers_required INTEGER DEFAULT 1,
    signatures TEXT DEFAULT '[]',
    is_released INTEGER DEFAULT 0,
    released_at TEXT,
    released_by TEXT,
    recipient_address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (released_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Contributors junction table (links pots to contributors)
CREATE TABLE IF NOT EXISTS pot_contributors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pot_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (pot_id) REFERENCES pots(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(pot_id, user_id)
);

-- Contributions table
CREATE TABLE IF NOT EXISTS contributions (
    id TEXT PRIMARY KEY,
    pot_id TEXT NOT NULL,
    contributor_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('SOL', 'USDC')),
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (pot_id) REFERENCES pots(id) ON DELETE CASCADE,
    FOREIGN KEY (contributor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Friends table (relationship between users)
CREATE TABLE IF NOT EXISTS friends (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    display_name TEXT,
    added_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, friend_id)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('pot_created', 'contribution', 'release', 'sign_release', 'friend_added')),
    timestamp TEXT DEFAULT (datetime('now')),
    user_id TEXT NOT NULL,
    pot_id TEXT,
    friend_id TEXT,
    amount REAL,
    currency TEXT CHECK (currency IN ('SOL', 'USDC')),
    transaction_signature TEXT,
    metadata TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pot_id) REFERENCES pots(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_pubkey ON users(pubkey);
CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);
CREATE INDEX IF NOT EXISTS idx_users_domain ON users(domain);
CREATE INDEX IF NOT EXISTS idx_pots_creator ON pots(creator_id);
CREATE INDEX IF NOT EXISTS idx_pots_pubkey ON pots(pot_pubkey);
CREATE INDEX IF NOT EXISTS idx_pots_created_at ON pots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pot_contributors_pot ON pot_contributors(pot_id);
CREATE INDEX IF NOT EXISTS idx_pot_contributors_user ON pot_contributors(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_pot ON contributions(pot_id);
CREATE INDEX IF NOT EXISTS idx_contributions_contributor ON contributions(contributor_id);
CREATE INDEX IF NOT EXISTS idx_contributions_timestamp ON contributions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_pot ON activities(pot_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);
