"use client";

import {
  AlertCircleIcon,
  LoaderCircle,
  Plus,
  UploadIcon,
  XIcon,
} from "lucide-react";

import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import "@/components/ui/style.css";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Redo, Undo } from "lucide-react";
import { Controller } from "react-hook-form";
import { Form } from "./ui/form";

const extensions = [StarterKit];
export default function CreatePostDropzone() {
  const maxSizeMB = 5;
  const maxSize = maxSizeMB * 1024 * 1024;
  const maxFiles = 6;

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  const [html, setHtml] = useState("");

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    accept: "image/png,image/jpeg,image/jpg",
    multiple: true,
    maxFiles,
    maxSize,
  });

  const createPostFormSchema = z.object({
    description: z
      .string()
      .min(2, {
        message: "Description must be at least 2 characters.",
      })
      .max(400, {
        message: "Description must be at most 400 characters.",
      })
      .trim(),
  });

  const form = useForm<z.infer<typeof createPostFormSchema>>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      description: "",
    },
  });

  async function onSubmit() {
    setIsLoading(true);
    const validation = createPostFormSchema.safeParse({
      description: text,
    });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setIsLoading(false);
      return;
    }
    const postData = new FormData();
    if (files.length > 0) {
      files.forEach((file) => {
        postData.append("files", file.file as File);
      });
    }
    postData.append("description", html);
    const response = await fetch("/api/post", {
      method: "POST",
      body: postData,
    });

    if ((await response.json()).status == 500) {
      toast.error("Failed to create post");
      setIsLoading(false);
      form.reset();
      clearFiles();
      return;
    }
    setIsLoading(false);
    form.reset();
    clearFiles();
    toast.success("Post created successfully");
    setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={"ghost"} className="cursor-pointer" size={"icon"}>
          <Plus className="size-7" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="flex flex-col sm:max-h-[min(640px,80vh)] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Create Post</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="overflow-y-auto">
          <div className="flex flex-col gap-2">
            <Form {...form}>
              <form
                id="create-post-form"
                onSubmit={onSubmit}
                className="space-y-4"
              >
                <Controller
                  control={form.control}
                  name="description"
                  defaultValue=""
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <EditorProvider
                      slotBefore={<MenuBar />}
                      extensions={extensions}
                      content={value}
                      onUpdate={({ editor }) => {
                        setText(editor.getText());
                        const html = editor.getHTML();
                        setHtml(html);
                        onChange(html);
                      }}
                    />
                  )}
                />
              </form>
            </Form>
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              data-dragging={isDragging || undefined}
              data-files={files.length > 0 || undefined}
              className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors not-data-[files]:justify-center has-[input:focus]:ring-[3px]"
            >
              <input
                {...getInputProps()}
                className="sr-only"
                aria-label="Upload image file"
              />
              <div className="flex flex-col items-center justify-center px-4 py-1 text-center">
                <p className="mb-1.5 text-sm font-medium">
                  Drop your images here (Max {maxFiles} images)
                </p>
                <p className="text-muted-foreground text-xs">
                  PNG, JPG, JPEG (max. {maxSizeMB}MB)
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={openFileDialog}
                >
                  <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
                  Select images
                </Button>
              </div>
            </div>
            {errors.length > 0 && (
              <div
                className="text-destructive flex items-center gap-1 text-xs"
                role="alert"
              >
                <AlertCircleIcon className="size-3 shrink-0" />
                <span>{errors[0]}</span>
              </div>
            )}
            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2 pe-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-accent aspect-square shrink-0 rounded">
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="size-10 rounded-[inherit] object-cover"
                        />
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="truncate text-[13px] font-medium">
                          {file.file.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatBytes(file.file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
                      onClick={() => removeFile(file.id)}
                      aria-label="Remove file"
                    >
                      <XIcon aria-hidden="true" />
                    </Button>
                  </div>
                ))}
                {files.length > 1 && (
                  <div>
                    <Button size="sm" variant="outline" onClick={clearFiles}>
                      Remove all files
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <AlertDialogFooter className="flex flex-row items-center justify-between">
          <AlertDialogCancel className="flex-1" disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <Button
            className="flex-1"
            disabled={isLoading}
            type="submit"
            form="create-post-form"
          >
            {isLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              "Post"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const MenuBar = () => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <div className="control-group">
      <div className="button-group flex gap-x-1">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "outline"}
          size={"icon"}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
        >
          <Bold />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "outline"}
          size={"icon"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : "italic"}
        >
          <Italic />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("undo") ? "secondary" : "outline"}
          size={"icon"}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          <Undo />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("redo") ? "secondary" : "outline"}
          size={"icon"}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          <Redo />
        </Button>
      </div>
    </div>
  );
};
