import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import FileUploader from "../shared/FileUploader";
import { postValidation } from "@/lib/validation";
import { Models } from "appwrite";
import {
  useCreatePost,
  useDeletePost,
  useUpdatePost,
} from "@/lib/react-query/QueriesAndMutations";
import { useUserContext } from "@/context/AuthContext";
import { useToast } from "../ui/use-toast";
import { useState } from "react";
type PostFormProps = {
  post?: Models.Document;
  action: "create" | "update";
};

const PostForm = ({ post, action }: PostFormProps) => {
  const [wantToDelete, setWantToDelete] = useState(false);

  const { mutateAsync: createPost, isPending: isLoadingCreate } =
    useCreatePost();
  const { mutateAsync: updatePost, isPending: isLoadingUpdate } =
    useUpdatePost();
  const { mutateAsync: deletePost } = useDeletePost();

  const { user } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof postValidation>>({
    resolver: zodResolver(postValidation),
    defaultValues: {
      caption: post ? post?.caption : "",
      file: [],
      location: post ? post?.location : "",
      tags: post ? post?.tags.join(",") : "",
    },
  });

  async function handleDeletePost() {
    try {
      const deletedPost = await deletePost({
        postId: post?.$id,
        imageId: post?.imageId,
      });
      if (!deletedPost) {
        throw new Error();
      }
      return navigate("/");
    } catch (error) {
      console.log(error);
    }
  }
  async function onSubmit(values: z.infer<typeof postValidation>) {
    if (post && action === "update") {
      const updatedPost = await updatePost({
        ...values,
        postId: post.$id,
        imageId: post?.imageId,
        imageUrl: post?.imageUrl,
      });
      if (!updatedPost) {
        toast({
          title: "Please try again",
        });
      }
      return navigate(`/posts/${post.$id}`);
    }
    const newPost = await createPost({
      ...values,
      userId: user.id,
    });
    if (!newPost) {
      toast({
        title: "please try again",
      });
    }
    navigate("/");
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-9 w-full max-w-5xl"
      >
        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Caption</FormLabel>
              <FormControl>
                <Textarea
                  className="shad-textarea custom-scrollbar"
                  {...field}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Add Photos</FormLabel>
              <FormControl>
                <FileUploader
                  fieldChange={field.onChange}
                  mediaUrl={post?.imageUrl}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Add Location</FormLabel>
              <FormControl>
                <Input type="text" className="shad-input" {...field}></Input>
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">
                Add Tags (seperated by " , ")
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className="shad-input"
                  placeholder="Art, Expression, Learn"
                  {...field}
                ></Input>
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />
        <div className="flex items-center gap-4 justify-end">
          {action === "update" && (
            <Button
              type="button"
              className="h-12 bg-red px-5 text-light-1 flex gap-2 !important"
              onClick={() => setWantToDelete(true)}
            >
              Delete
            </Button>
          )}
          <Button
            type="button"
            className="shad-button_dark_4"
            onClick={() => navigate("/")}
          >
            cancel
          </Button>
          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap"
            disabled={isLoadingCreate || isLoadingUpdate}
          >
            {action === "create" ? "Submit" : "Update"}
          </Button>
        </div>
      </form>
      {wantToDelete && (
        <div className="flex flex-col justify-center items-center w-full h-full bg-black bg-opacity-80 fixed gap-2 top-0 right-0">
          <div className="h-12 ">
            <p className="text-light-1 text-ellipsis">
              Are you sure you want to delete this post?
            </p>
          </div>
          <div className="flex flex-row items-center justify-center gap-2 h-12">
            <Button
              type="button"
              className="h-8 bg-dark-4 px-5 text-light-1 flex gap-2 !important"
              onClick={() => setWantToDelete(false)}
            >
              cancel
            </Button>
            <Button
              type="button"
              className="h-8 bg-red px-5 text-light-1 flex gap-2 !important"
              onClick={handleDeletePost}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </Form>
  );
};
export default PostForm;
