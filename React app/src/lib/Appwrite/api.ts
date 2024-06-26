import { INewPost, INewUser, IUpdatePost, IUpdateUser } from "@/Types";
import { account, appwriteConfig, avatars, databases, storage } from "./config";
import {  ID, Query } from "appwrite";


export async function createUserAccount(user:INewUser) {
    try{
        const newAccount=await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        )
        if(!newAccount) throw new Error

        const avatatUrl= avatars.getInitials(user.name)
        const newUser= await saveUserToDB({
            accountId: newAccount.$id,
            email:newAccount.email,
            name:newAccount.name,
            username: user.username,
            imageUrl:avatatUrl,
        })
        return newUser
    }
    catch(e){
        console.log(e)
        return e
    }
}

export async function saveUserToDB(user:{
    accountId:string;
    email:string;
    name:string;
    imageUrl:URL;
    username?:string;
}){
    try {
        const newUser=await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            user)
        return newUser
    } catch (e) {
        console.log(e)
    }
}

export async function signInAccount(user:{email:string,password:string}){
    try {
        const session=await account.createEmailSession(user.email,user.password)
        return session;
    } catch (e) {
        console.log(e)
    }
}

export async function getCurrentUser() {
    try {
        const currentAccount= await account.get()
        if(!currentAccount){
            throw new Error
        }
        const currentUser=await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId',currentAccount.$id)]
        )
        if(!currentUser){
            throw new Error
        }
        return currentUser.documents[0]
    } catch (e) {
        console.log(e)
        return null
    }
}

export async function signOutAccount(){
    try {
        const session=await account.deleteSession("current");
        return session;
    } catch (e) {
        console.log(e)
    }
}

export async function createPost(post :INewPost){
    try {
        const uploadedFile=await uploadFile(post.file[0])
        if(!uploadedFile) {throw new Error()}
        const fileUrl=getFilePreview(uploadedFile.$id)
        if(!fileUrl) {
            deleteFile(uploadedFile.$id)
            throw new Error()
        }
    
        const tags=post?.tags?.replace(/ /g,'').split(",")|| []
        const newPost=await databases.createDocument(appwriteConfig.databaseId,appwriteConfig.postCollectionId,ID.unique(),{
            creator: post.userId,
            caption:post.caption,
            imageUrl: fileUrl,
            imageId:uploadedFile.$id,
            location:post.location,
            tags:tags
        })
        if(!newPost){
            deleteFile(uploadedFile.$id)
                throw new Error()
        }
        return newPost
    } catch (error) {
        console.log(error)
    }
}

export async function uploadFile(file:File){
    try {
        const uploadedFile=await storage.createFile(appwriteConfig.storageId,ID.unique(),file);
        return uploadedFile
    } catch (error) {
        console.log(error)
    }
}

export function getFilePreview(fileId:string){
    try {
        const fileUrl=storage.getFilePreview(appwriteConfig.storageId,fileId,2000,2000,"top",100)
        return fileUrl
    } catch (error) {
        console.log(error)
    }
}

export async function deleteFile(fileId:string){
    try {
        await storage.deleteFile(appwriteConfig.storageId,fileId)
        return {status:"ok"}
    } catch (error) {
        console.log(error)
    }
}

export async function getRecentPosts(){
    try {
        const posts=await databases.listDocuments(appwriteConfig.databaseId,appwriteConfig.postCollectionId,[Query.orderDesc('$createdAt'),Query.limit(20)])
        if(!posts){throw new Error()}
        return posts
    } catch (error) {
        console.log(error)
    }
}

export async function likePost(postId:string ,likesArray:string[]) {
    try {
        const updatedPost=await databases.updateDocument(appwriteConfig.databaseId,appwriteConfig.postCollectionId,postId,{likes:likesArray})
        if(!updatedPost){throw new Error()}
        return updatedPost
    } catch (error) {
        console.log(error)
    }
}

export async function savePost(postId:string ,userId:string) {
    try {
        const updatedPost=await databases.createDocument(appwriteConfig.databaseId,appwriteConfig.savesCollectionId,ID.unique(),{user:userId,post:postId})
        if(!updatedPost){throw new Error()}
        return updatedPost
    } catch (error) {
        console.log(error)
    }
}

export async function deleteSavedPost(savedRecordId:string) {
    try {
        const statusCode=await databases.deleteDocument(appwriteConfig.databaseId,appwriteConfig.savesCollectionId,savedRecordId)
        if(!statusCode){throw new Error()}
        return {status:"ok"}
    } catch (error) {
        console.log(error)
    }
}

export async function getPostById(postId:string){
    try {
        const post =await databases.getDocument(appwriteConfig.databaseId,appwriteConfig.postCollectionId,postId)
        return post
    } catch (error) {
        console.log(error)
    }
}

export async function updatePost(post :IUpdatePost){
    const hasFileToUpdate= post.file.length>0
    try {
        let image={
            imageUrl: post.imageUrl,
            imageId: post.imageId
        }
        if(hasFileToUpdate){
            const uploadedFile=await uploadFile(post.file[0])
            if(!uploadedFile) {throw new Error()}
            const fileUrl=getFilePreview(uploadedFile.$id)
            if(!fileUrl) {
                deleteFile(uploadedFile.$id)
                throw new Error()
            }
            image={...image,imageUrl:fileUrl,imageId:uploadedFile.$id}
        }
    
        const tags=post?.tags?.replace(/ /g,'').split(",")|| []
        const updatedPost=await databases.updateDocument(appwriteConfig.databaseId,appwriteConfig.postCollectionId,post.postId,{
            caption:post.caption,
            imageUrl: image.imageUrl,
            imageId:image.imageId,
            location:post.location,
            tags:tags
        })
        if(!updatedPost){
            deleteFile(post.imageId)
                throw new Error()
        }
        return updatedPost
    } catch (error) {
        console.log(error)
    }
}

export async function deletePost(postId?:string,imageId?:string){
    if(!postId || !imageId){
        return;
    }
    try {
        const statusCode= await databases.deleteDocument(appwriteConfig.databaseId,appwriteConfig.postCollectionId,postId)
        if(!statusCode) throw Error
        await deleteFile(imageId);
        return {status:"ok"}
    } catch (error) {
        console.log(error)
    }
}

export async function getInfinitPosts({pageParam}:{pageParam:number}){
    const queries: any[]=[Query.orderDesc("$updatedAt"),Query.limit(10)]
    if(pageParam){
        queries.push(Query.cursorAfter(pageParam.toString()))
    }
    try {
        const posts=databases.listDocuments(appwriteConfig.databaseId,appwriteConfig.postCollectionId,queries)
        if(!posts){throw new Error()}
        return posts
    } catch (error) {
        console.log(error)
    }
}

export async function searchPosts(searchTerm:string){
    try {
        const posts=databases.listDocuments(appwriteConfig.databaseId,appwriteConfig.postCollectionId,[Query.search('caption',searchTerm)])
        if(!posts){throw new Error()}
        return posts
    } catch (error) {
        console.log(error)
    }
}

export async function getUsers(limit: number=10) {
    try {
      const users = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.orderDesc("$createdAt"), Query.limit(limit)]
      );
  
      if (!users) throw Error;
  
      return users;
    } catch (error) {
      console.log(error);
    }
}

export async function getUserById(userId: string) {
    try {
      const user = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        userId
      );
  
      if (!user) throw Error;
  
      return user;
    } catch (error) {
      console.log(error);
    }
}

export async function updateUser(user: IUpdateUser) {
    const hasFileToUpdate = user.file.length > 0;
    try {
      let image = {
        imageUrl: user.imageUrl,
        imageId: user.imageId,
      };
      if (hasFileToUpdate) {
        const uploadedFile = await uploadFile(user.file[0]);
        if (!uploadedFile) throw Error;
        const fileUrl = getFilePreview(uploadedFile.$id);
        if (!fileUrl) {
          await deleteFile(uploadedFile.$id);
          throw Error;
        }
  
        image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
      }
      const updatedUser = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        user.userId,
        {
          name: user.name,
          bio: user.bio,
          imageUrl: image.imageUrl,
          imageId: image.imageId,
        }
      );
      if (!updatedUser) {
        if (hasFileToUpdate) {
          await deleteFile(image.imageId);
        }
        throw Error;
      }
      if (user.imageId && hasFileToUpdate) {
        await deleteFile(user.imageId);
      }
  
      return updatedUser;
    } catch (error) {
      console.log(error);
    }
}

export async function getUserPosts(userId?: string) {
    if (!userId) return;
    try {
      const post = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.postCollectionId,
        [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
      );
      if (!post) throw Error;
      return post;
    } catch (error) {
      console.log(error);
    }
}

export async function deleteUser(userId?:string,imageId?:string){
    if(!userId ){
        return;
    }
    try {
        if(imageId){
            await deleteFile(imageId);
        }
        await databases.deleteDocument(appwriteConfig.databaseId,appwriteConfig.userCollectionId,userId)
        return {status:"Done"}
    } catch (error) {
        console.log(error)
    }
}
