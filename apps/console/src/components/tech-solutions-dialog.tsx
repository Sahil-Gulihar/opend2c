"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Turnstile, useTurnstile } from "@/components/ui/turnstile";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(254),
  company: z.string().min(1, "Company / farm name is required").max(100),
  interest: z.enum(["farms", "d2c", "both"], {
    required_error: "Please select an area of interest",
  }),
  description: z
    .string()
    .min(10, "Please describe your needs (min 10 characters)")
    .max(2000),
  phone: z.string().max(30).optional(),
});

type FormValues = z.infer<typeof schema>;

interface TechSolutionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TechSolutionsDialog({
  open,
  onOpenChange,
}: TechSolutionsDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const turnstile = useTurnstile();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      interest: "both",
      description: "",
      phone: "",
    },
  });

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      form.reset();
      turnstile.reset();
    }
    onOpenChange(isOpen);
  }

  async function onSubmit(values: FormValues) {
    if (!turnstile.isVerified) {
      toast.error("Please complete the security check.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tech-solutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, turnstileToken: turnstile.token }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      toast.success("Request submitted! We'll be in touch soon.");
      handleClose(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
      turnstile.reset();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Tech Solutions</DialogTitle>
          <DialogDescription>
            Tell us about your farm or brand and we'll reach out with the right
            tools for you.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="jane@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company / Farm Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Sunrise Estate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phone{" "}
                      <span className="text-neutral-400 font-normal">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1 555 000 0000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="interest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>I am interested in solutions for</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row gap-6 mt-1"
                    >
                      {[
                        { value: "farms", label: "Coffee Farms" },
                        { value: "d2c", label: "D2C Brand" },
                        { value: "both", label: "Both" },
                      ].map((opt) => (
                        <div
                          key={opt.value}
                          className="flex items-center gap-2"
                        >
                          <RadioGroupItem value={opt.value} id={opt.value} />
                          <label
                            htmlFor={opt.value}
                            className="text-sm cursor-pointer"
                          >
                            {opt.label}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What do you need help with?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your current challenges or what tools you're looking for..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Turnstile
              onVerify={turnstile.handleVerify}
              onError={turnstile.handleError}
              onExpire={turnstile.handleExpire}
            />

            {turnstile.error && (
              <p className="text-xs text-red-500">
                Security check failed. Please refresh and try again.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !turnstile.isVerified}
              className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
