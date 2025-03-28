"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { z } from "zod";
import { api, type RouterOutputs } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

type Unpacked<T> = T extends (infer U)[] ? U : T;
type Modifiers = Unpacked<
  Unpacked<RouterOutputs["menuRouter"]["getMenuById"]["sections"]>["items"]
>["modifiers"];

const formSchema = z.object({
  name: z.string().min(1, "Modifier name is required").max(100),
  priceAdjustment: z.number().default(0),
  isDefault: z.boolean().default(false), // TODO remove isDefault as concept?
});

export default function ItemModifiers({
  modifiers,
  menuItemId,
}: {
  modifiers: Modifiers;
  menuItemId: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const nav = useRouter();

  const addModifierMutation = api.menuRouter.addModifier.useMutation({
    onSuccess: () => {
      toast.success("Success", {
        description: "Modifer successfully created",
      });
      form.reset();
      setShowForm(false);
      nav.refresh();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to create modifier",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addModifierMutation.mutate({
      menuItemId: menuItemId,
      ...values,
    });
  }

  function onReset() {
    form.reset();
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      priceAdjustment: 0,
      isDefault: false,
    },
  });

  function formatPrice(priceInCents: number) {
    return `$${(priceInCents / 100).toFixed(2)}`;
  }

  return (
    <div className="px-2 py-1">
      <div className="flex flex-wrap items-center">
        <span className="mr-2 text-xs font-medium text-gray-500">
          Modifiers:
        </span>

        <div className="flex-grow text-xs text-gray-800">
          {modifiers.length > 0 ? (
            modifiers.map((mod, i) => (
              <span
                key={i}
                className="bg-secondary mr-2 inline-block rounded-lg py-1 px-2 "
              >
                <span className="font-bold">Name:{" "}</span>
                {mod.name}{" "}
                <span className="font-bold">Price:{" "}</span>
                {formatPrice(mod.priceAdjustment)}{" "}
                <span className="font-bold">Default:{" "}</span>
                {mod.isDefault ? "Yes" : "No"}
              </span>
            ))
          ) : (
            <span className="mr-2 inline-block">None</span>
          )}
        </div>

        <button
          className="flex items-center rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
          onClick={() => setShowForm((showForm) => !showForm)}
        >
          {!showForm ? (
            <>
              <Plus size={14} className="mr-1" />
              Add Modifier
            </>
          ) : (
            <>
              <X size={14} className="mr-1" />
              Cancel
            </>
          )}
        </button>
      </div>
      {showForm && (
        <div className="mt-2 rounded-lg border p-4">
          <h2 className="mb-4 text-xl">Add New Modifier</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex w-full gap-2">
                <div className="flex-3/5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modifier Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter modifier name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex-1/5">
                  <FormField
                    control={form.control}
                    name="priceAdjustment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Adjustment</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex-1/5">
                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onReset}
                  disabled={addModifierMutation.isPending}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={addModifierMutation.isPending}
                  className="min-w-24"
                >
                  {addModifierMutation.isPending ? "Saving..." : "Save Item"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
