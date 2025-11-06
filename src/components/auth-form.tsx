import Form from "next/form";

import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function AuthForm({
  action,
  children,
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
}) {
  return (
    <Form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      <div className="flex flex-col gap-2">
        <Label
          className="font-normal text-[#FF6445] text-xs uppercase"
          htmlFor="email"
        >
          Email
        </Label>

        <Input
          autoComplete="email"
          autoFocus
          className="bg-gray-100 text-black text-sm border-none focus:ring-0 focus:ring-offset-0"
          id="email"
          name="email"
          placeholder="Enter your Email ID"
          required
          type="email"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          className="font-normal text-[#FF6445] text-xs uppercase"
          htmlFor="password"
        >
          Password
        </Label>

        <Input
          className="bg-gray-100 text-black text-sm border-none focus:ring-0 focus:ring-offset-0"
          id="password"
          name="password"
          placeholder="Enter your Password"
          required
          type="password"
        />
      </div>

      {children}
    </Form>
  );
}