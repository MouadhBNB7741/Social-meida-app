import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

interface DataType{
  name:any,
  imageUrl: any
  about: any,
  bgImage: any,
  tag: any,
  password?:any
}

export const PUT = async (req: any) => {
  const user = await req.json();
  const dataToUpdate:DataType = {
    name: user?.name,
    imageUrl: user?.imageUrl,
    about: user?.about,
    bgImage: user?.bgImage,
    tag: user?.tag,
  };
  if(user?.password && user?.password!==""){
    dataToUpdate.password = await bcrypt.hash(user.password, 10);
  }
  try {
    await prisma.users.update({
      where: {
        id: user?.id,
      },
      data: dataToUpdate,
    });
  } catch (error) {
    console.log(error);
    return new NextResponse(JSON.stringify(error), { status: 403 });
  }
  return new NextResponse(JSON.stringify("updated"));
};
