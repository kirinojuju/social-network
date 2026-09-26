import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'
import { getClientApp } from './firebase'

export async function saveFirestoreProfile(user, profile) {
  const db = getFirestore(getClientApp())
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    username: profile.username,
    displayName: profile.display_name,
    updatedAt: serverTimestamp(),
  })
}
