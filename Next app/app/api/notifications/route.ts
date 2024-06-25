import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const GET = async (req:any) => {
    const url = new URL(req.url);
    const userId:string|null = url.searchParams.get('userId');
    if (!userId) {
        return new NextResponse('User ID is required', { status: 400 });
    }
  try {
    const lastComment = await prisma.comments.findFirst({
      where: {
        post: {
          user: {
            id: userId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    const lastMessage = await prisma.messages.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    const lastCommunityPost = await prisma.communityPost.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    const data= {
        lastComment,
        lastMessage,
        lastCommunityPost,
    }
    return new NextResponse(JSON.stringify(data));
  } catch (error) {
    return new NextResponse("error", { status: 404 });
  }
};