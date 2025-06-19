"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

export default function AuthTabs() {
  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>

      <TabsContent value="signin" className="mt-6">
        <div className="space-y-4">
          <SignInForm />
        </div>
      </TabsContent>
      <TabsContent value="signup" className="mt-6">
        <div className="space-y-4">
          <SignUpForm />
        </div>
      </TabsContent>
    </Tabs>
  );
}
