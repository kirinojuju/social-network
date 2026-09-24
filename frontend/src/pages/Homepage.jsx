const Homepage = ({ user }) => {
  return (
    <div>
      <h2>Welcome to CMU Connect</h2>
      <p>You’re signed in as {user.displayName || user.email}.</p>
    </div>
  )
}

export default Homepage
