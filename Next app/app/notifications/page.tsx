"use client";

import MultiplePostsSkeleton from "@/components/skeletons/multiplePostSkeleton";
import { userState } from "@/state/atoms/userState";
import { Messages } from "@prisma/client";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";

export interface chats {
  id: string;
  updatedAt: Date;
  members: { id: string; name: string; imageUrl: string; tag: string }[];
  messages: Messages[];
}

const Page = () => {
  const [user, setUser] = useRecoilState(userState);
  const [chats, setChats] = useState<chats[]>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getChats = async () => {
      const { data } = await axios.get(`/api/users/getChats/${user.id}`);
      setChats(data?.chatRooms);
      setIsLoading(false);
    };
    getChats();
  }, [user]);

  if (isLoading) {
    return <MultiplePostsSkeleton />;
  }

  if (chats) {
    return (
      <aside className=" hidden h-screen w-full flex-col overflow-y-scroll border-l-2  p-2  lg:col-start-9 lg:col-end-13 lg:flex">
        <div className=" rounded-2xl bg-slate-200 p-2 dark:bg-slate-800">
          <h1 className=" p-2 text-xl font-extrabold">Notifications</h1>
          {chats?.map((chat) => {
            return (
              <Link
                href={`/chats/${chat.id}`}
                className=" flex w-full gap-2 p-3"
                key={chat.id}
              >
                <div className="flex w-full flex-wrap gap-2 rounded-full border-x-2 border-y-2 border-gray-300 p-3 text-sm">
                  You have a new message from {chat.members[0]?.name}:{" "}
                  {chat.messages[0].text
                    ? chat.messages[0].text
                    : chat.messages[0].image
                    ? "Image"
                    : "video"}
                </div>
              </Link>
            );
          })}
        </div>
      </aside>
    );
  } else {
    return (
      <div className="page flex h-screen items-center justify-center ">
        No Notifications
      </div>
    );
  }
};

export default Page;
