"use client";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Spinner } from "@/app/_components/Spinner";

const formSchema = z.object({
  name: z.string().min(1, "Section name is required").max(100),
  description: z.string().min(1, "Description is required"),
  displayOrder: z.coerce.number().nonnegative().default(0),
});

export default function SectionForm({
  menuData,
}: {
  menuData: RouterOutputs["menuRouter"]["getMenuById"];
}) {
  const [showForm, setShowForm] = useState(false);
  const nav = useRouter();

  const addSectionMutation = api.menuRouter.addSection.useMutation({
    onSuccess: () => {
      toast.success("Success", {
        description: "Menu section created successfully",
      });
      form.reset();
      setShowForm(false);
      nav.refresh();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to create menu section",
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      displayOrder: 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addSectionMutation.mutate({
      menuId: menuData.id,
      ...values,
    });
  }

  function onReset() {
    form.reset();
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">{menuData.name}</h1>
        <Button onClick={() => setShowForm((showForm) => !showForm)}>
          {showForm ? "Cancel Add" : "Add Section"}
        </Button>
      </div>
      {showForm && (
        <div className="mt-4 rounded-lg border p-4">
          <h2 className="mb-4 text-xl">Add New Section</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter section name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the menu section
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter section description"
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of the menu section
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      The order in which this section appears (lower numbers
                      appear first)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={addSectionMutation.isPending}>
                  {addSectionMutation.isPending ? (
                    <>
                      <Spinner /> {"Submitting..."}
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onReset}
                  disabled={addSectionMutation.isPending}
                >
                  Clear
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
