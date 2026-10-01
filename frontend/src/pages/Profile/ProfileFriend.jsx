import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

import "./ProfileFriend.css";

const friends = [
  {
    id: 1,
    name: "User_Name",
    faculty: "Engineering",
  },
  {
    id: 2,
    name: "User_Name",
    faculty: "Engineering",
  },
  {
    id: 3,
    name: "User_Name",
    faculty: "Engineering",
  },
  {
    id: 4,
    name: "User_Name",
    faculty: "Engineering",
  },
];

function ProfileFriends() {
  return (
    <section className="profile-friends">

      <h2>Friends</h2>

      <div className="friends-list">

        {friends.map((friend) => (
          <div className="friend-item" key={friend.id}>

            <AccountCircleOutlinedIcon className="friend-avatar" />

            <div className="friend-info">

              <span className="friend-name">
                {friend.name}
              </span>

              <span className="friend-faculty">
                {friend.faculty}
              </span>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}

export default ProfileFriends;