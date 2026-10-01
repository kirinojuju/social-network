import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { initializeApp, deleteApp } from 'firebase/app'
import { createUserWithEmailAndPassword, deleteUser, getAuth } from 'firebase/auth'
import {
  collection, deleteDoc, doc, getDoc, getDocs, getFirestore, limit, orderBy, query,
  serverTimestamp, setDoc, Timestamp, updateDoc, where,
} from 'firebase/firestore'

const env = Object.fromEntries(readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .split(/\r?\n/).filter(line => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
  .map(line => { const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1)] }))
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}
if (Object.values(config).some(value => !value)) throw new Error('Firebase web config missing')

const suffix = randomUUID().replace(/-/g, '')
const password = `${randomBytes(24).toString('base64url')}Aa1!`
const apps = []
const accounts = []
let postPath
let profilePath

function removeTestDocument(documentPath) {
  const result = spawnSync('npx.cmd', ['-y', 'firebase-tools@latest', 'firestore:delete',
    documentPath, '--force', '--project', config.projectId], {
    cwd: new URL('../..', import.meta.url), shell: true, encoding: 'utf8',
  })
  if (result.status !== 0) throw new Error(`Could not remove test document ${documentPath}`)
}

async function main() {
  try {
    for (let number = 1; number <= 2; number++) {
      const app = initializeApp(config, `rules-check-${suffix}-${number}`)
      apps.push(app)
      const credential = await createUserWithEmailAndPassword(getAuth(app),
        `rules-check-${suffix}-${number}@example.invalid`, password)
      accounts.push(credential.user)
    }
    const [owner, other] = accounts
    const db = getFirestore(apps[0])
    const otherDb = getFirestore(apps[1])
    const profileName = `users/${owner.uid}`
    const profile = doc(db, profileName)
    await setDoc(profile, { uid: owner.uid, email: owner.email,
      username: `check_${suffix.slice(0, 12)}`, displayName: 'Rules Check',
      updatedAt: serverTimestamp() })
    profilePath = profileName
    assert.equal((await getDoc(profile)).data().uid, owner.uid)
    await assert.rejects(getDoc(doc(otherDb, profilePath)), error => error.code === 'permission-denied')
    await assert.rejects(setDoc(profile, { uid: owner.uid, email: owner.email,
      username: `check_${suffix.slice(0, 12)}`, displayName: 'Rules Check',
      updatedAt: serverTimestamp(), role: 'admin' }), error => error.code === 'permission-denied')

    const postName = `posts/rules_check_${suffix}`
    const post = doc(db, postName)
    const own = query(collection(db, 'posts'), where('authorUid', '==', owner.uid),
      orderBy('createdAt', 'desc'), limit(50))
    const ownedIds = query(collection(db, 'posts'), where('authorUid', '==', owner.uid))
    assert.equal((await getDocs(own)).empty, true)
    assert.equal((await getDocs(ownedIds)).empty, true)
    const fields = { authorUid: owner.uid, content: 'Rules check', visibility: 'private',
      createdAt: serverTimestamp(), originalCreatedAt: new Date().toISOString(), imageId: null }
    await setDoc(post, fields)
    postPath = postName
    assert.equal((await getDoc(post)).data().content, 'Rules check')
    assert.ok((await getDocs(own)).docs.some(item => item.id === post.id))
    assert.ok((await getDocs(ownedIds)).docs.some(item => item.id === post.id))
    await assert.rejects(getDoc(doc(otherDb, postPath)), error => error.code === 'permission-denied')
    await assert.rejects(getDocs(query(collection(otherDb, 'posts'),
      where('authorUid', '==', owner.uid))), error => error.code === 'permission-denied')
    await assert.rejects(getDocs(collection(db, 'posts')), error => error.code === 'permission-denied')
    const anonymousApp = initializeApp(config, `rules-check-${suffix}-anonymous`)
    apps.push(anonymousApp)
    await assert.rejects(getDoc(doc(getFirestore(anonymousApp), postPath)),
      error => error.code === 'permission-denied')
    await assert.rejects(setDoc(doc(db, `posts/spoof_${suffix}`),
      { ...fields, authorUid: other.uid }), error => error.code === 'permission-denied')
    await assert.rejects(updateDoc(post, { content: 'changed' }), error => error.code === 'permission-denied')
    await assert.rejects(setDoc(doc(db, `posts/extra_${suffix}`),
      { ...fields, extra: true }), error => error.code === 'permission-denied')
    await assert.rejects(setDoc(doc(db, `posts/long_${suffix}`),
      { ...fields, content: 'x'.repeat(10001) }), error => error.code === 'permission-denied')
    await assert.rejects(setDoc(doc(db, `posts/time_${suffix}`),
      { ...fields, createdAt: Timestamp.fromDate(new Date('2000-01-01')) }),
      error => error.code === 'permission-denied')
    await assert.rejects(deleteDoc(post), error => error.code === 'permission-denied')
    console.log('Live Firestore owner access, query, and denial checks passed.')
  } finally {
    const failures = []
    for (const target of [postPath, profilePath]) {
      if (!target) continue
      try { removeTestDocument(target) } catch (error) { failures.push(error.message) }
    }
    for (const account of accounts) {
      try { await deleteUser(account) } catch { failures.push('Could not remove a test account') }
    }
    for (const app of apps) await deleteApp(app)
    if (failures.length) {
      console.error(failures.join('; '))
      process.exitCode = 1
    } else {
      console.log('Firestore and Firebase test data cleanup complete.')
    }
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
