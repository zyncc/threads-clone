"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signInFormSchema } from "@/lib/zod-schemas";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

export default function SignInForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof signInFormSchema>>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof signInFormSchema>) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(values.identifier);
    if (isEmail) {
      authClient.signIn.email({
        email: values.identifier,
        password: values.password,
        fetchOptions: {
          onRequest: () => {
            setLoading(true);
          },
          onSuccess: () => {
            router.push("/");
            setLoading(false);
          },
          onError(context) {
            toast.error(context.error.message);
            setLoading(false);
          },
        },
      });
    } else {
      authClient.signIn.username({
        username: values.identifier,
        password: values.password,
        fetchOptions: {
          onRequest: () => {
            setLoading(true);
          },
          onSuccess: () => {
            setLoading(false);
            router.push("/");
          },
          onError(context) {
            setLoading(false);
            toast.error(context.error.message);
          },
        },
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username or Email</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder="Enter username or email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type={"password"}
                  placeholder="Enter your password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          disabled={loading}
          type="submit"
          className="w-full cursor-pointer"
        >
          {loading ? <LoaderCircle className="animate-spin" /> : null}
          Sign In
        </Button>
        <div className="text-center">
          <Button
            disabled={loading}
            variant="link"
            className="text-muted-foreground text-sm"
          >
            Forgot your password?
          </Button>
        </div>
      </form>
    </Form>
  );
}
