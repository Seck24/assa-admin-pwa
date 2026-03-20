#!/usr/bin/env node
// Usage: node scripts/seed-admin.js
// Run once to generate the bootstrap super_admin INSERT SQL
const crypto = require('crypto')

const config = {
  username:  'seck',
  password:  'Preo2026Admin225',  // change after first login
  nom:       'Seck Lou\u00e9',
  role:      'super_admin',
}

const uid  = crypto.randomUUID()
const salt = crypto.randomBytes(32).toString('hex')
const hash = crypto.pbkdf2Sync(config.password, salt, 100000, 64, 'sha512').toString('hex')

console.log('-- Bootstrap super_admin SQL:')
console.log(`-- username: ${config.username}`)
console.log(`-- password: ${config.password}   <-- change after first login`)
console.log('')
console.log(`INSERT INTO admin_users (uid, nom, username, mot_de_passe_hash, salt, role, actif, must_change_password)`)
console.log(`VALUES (`)
console.log(`  '${uid}',`)
console.log(`  '${config.nom}',`)
console.log(`  '${config.username}',`)
console.log(`  '${hash}',`)
console.log(`  '${salt}',`)
console.log(`  'super_admin',`)
console.log(`  true,`)
console.log(`  true`)
console.log(`);`)
