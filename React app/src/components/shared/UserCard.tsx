import { Models } from "appwrite";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../ui/button";
import { useUserContext } from "@/context/AuthContext";

type UserCardProps = {
  user: Models.Document;
};

const UserCard = ({ user }: UserCardProps) => {
  const { user: currentUser } = useUserContext();
  const navigate = useNavigate();
  return (
    <div className="user-card">
      <Link
        to={`/profile/${user.$id}`}
        className="flex-center flex-col gap-4 w-full"
      >
        <img
          src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
          alt="creator"
          className="rounded-full w-14 h-14"
        />

        <div className="flex-center flex-col gap-1">
          <p className="base-medium text-light-1 text-center line-clamp-1">
            {user.name}
          </p>
          <p className="small-regular text-light-3 text-center line-clamp-1">
            @{user.username}
          </p>
        </div>
      </Link>
      <Button
        type="button"
        size="sm"
        className="shad-button_primary px-5"
        onClick={() => navigate(`/messenger/${user.$id}`)}
      >
        Message
      </Button>
    </div>
  );
};

export default UserCard;
