# Installation backup and restore

Use Node 24. The password comes from `ILAW_BACKUP_PASSWORD` in the operator environment; use at least 12 characters. Do not put it in the command line, git or logs.

```sh
node scripts/backup.js backup data/ilaw.sqlite /secure-location/ilaw-backup.json
node scripts/backup.js restore /secure-location/ilaw-backup.json /new-installation/data
```

Backup takes a consistent SQLite snapshot using Node's backup API, checks integrity and encrypts both the database and its credential encryption key with authenticated AES-256-GCM and a scrypt-derived key. Images are part of SQLite. The archive contains account credentials and records inside its encryption envelope; protect it and its password separately.

Restore refuses an existing destination. It verifies authentication, content hashes, SQLite integrity and foreign keys before moving a staging directory into place. Restored sessions are invalidated; teachers must sign in again. Start the restored installation with `ILAW_DB_PATH=/new-installation/data/ilaw.sqlite`. Keep the matching `.keys` file. Retained worker leases expire normally; unfinished work uses the existing generation recovery path.

The automated restore exercise checks key preservation, wrong passwords, tampering, session invalidation and refusal to overwrite. A draft JSON download in the editor only preserves that lesson; it excludes account keys and server records.
