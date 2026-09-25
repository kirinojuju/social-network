export default function Homepage({ profile }) {
  return (
    <div>
      <h2>Welcome to CMU Connect</h2>
      <p>You're signed in as {profile.display_name}.</p>
      <p>Username: <strong>@{profile.username}</strong></p>
      <p>Email: {profile.email}</p>
      <p>PostgreSQL profile ID: <code>{profile.id}</code></p>
    </div>
  )
}
