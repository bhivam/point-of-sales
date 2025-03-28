"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api, type RouterOutputs } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type KeyboardEventHandler } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type Unpacked<T> = T extends (infer U)[] ? U : T;
type SectionData = Unpacked<
  RouterOutputs["menuRouter"]["getMenuById"]["sections"]
>;

const formSchema = z.object({
  name: z.string().min(1, "Item name is required").max(255),
  description: z.string().nonempty(),
  price: z.number().min(0, "Price cannot be negative"),
  displayOrder: z.number().default(0),
  preparationTime: z.number(),
  ingredients: z.array(z.string()),
  allergens: z.array(z.string()),
  dietaryFlags: z.object({
    vegetarian: z.boolean().default(false),
    vegan: z.boolean().default(false),
    glutenFree: z.boolean().default(false),
    dairyFree: z.boolean().default(false),
  }),
});

export default function SectionWithItemForm({
  sectionData,
}: {
  sectionData: SectionData;
}) {
  const [showForm, setShowForm] = useState(false);
  const nav = useRouter();

  const addItemMutation = api.menuRouter.addItem.useMutation({
    onSuccess: () => {
      toast.success("Success", {
        description: "Item successfully created",
      });
      form.reset();
      setShowForm(false);
      nav.refresh();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to create ",
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      displayOrder: 0,
      preparationTime: 0,
      ingredients: [],
      allergens: [],
      dietaryFlags: {
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        dairyFree: false,
      },
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addItemMutation.mutate({
      sectionId: sectionData.id,
      ...values,
    });
  }

  function onReset() {
    form.reset();
  }

  return (
    <div className="mt-2 flex flex-col">
      <Separator />
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-2xl">{sectionData.name}</h2>
          <p className="text-gray-800">{sectionData.description}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowForm((showForm) => !showForm)}
        >
          {showForm ? (
            "Cancel Add"
          ) : (
            <>
              {"Add Item"}
              <Plus />
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <div className="mt-6 mb-8">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold">Add New Menu Item</h3>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter item name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter item description"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="displayOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
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
                        <FormDescription>
                          Lower numbers appear first
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preparationTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preparation Time (minutes)</FormLabel>
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

                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => {
                    const [inputValue, setInputValue] = useState("");

                    const handleAddIngredient = () => {
                      if (
                        inputValue.trim() &&
                        !field.value.includes(inputValue.trim())
                      ) {
                        field.onChange([...field.value, inputValue.trim()]);
                        setInputValue("");
                      }
                    };

                    const handleKeyDown: KeyboardEventHandler<
                      HTMLInputElement
                    > = (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddIngredient();
                      }
                    };

                    const handleRemoveIngredient = (ingredient: string) => {
                      field.onChange(
                        field.value.filter((i) => i !== ingredient),
                      );
                    };

                    return (
                      <FormItem>
                        <FormLabel>Ingredients</FormLabel>
                        <div className="flex space-x-2">
                          <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add ingredient and press Enter"
                          />
                          <Button
                            type="button"
                            onClick={handleAddIngredient}
                            variant="secondary"
                          >
                            Add
                          </Button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {field.value.map((ingredient) => (
                            <Badge
                              key={ingredient}
                              variant="secondary"
                              className="px-2 py-1"
                            >
                              {ingredient}
                              <X
                                className="ml-1 h-3 w-3 cursor-pointer"
                                onClick={() =>
                                  handleRemoveIngredient(ingredient)
                                }
                              />
                            </Badge>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="allergens"
                  render={({ field }) => {
                    const [inputValue, setInputValue] = useState("");

                    const handleAddAllergen = () => {
                      if (
                        inputValue.trim() &&
                        !field.value.includes(inputValue.trim())
                      ) {
                        field.onChange([...field.value, inputValue.trim()]);
                        setInputValue("");
                      }
                    };

                    const handleKeyDown: KeyboardEventHandler<
                      HTMLInputElement
                    > = (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAllergen();
                      }
                    };

                    const handleRemoveAllergen = (allergen: string) => {
                      field.onChange(field.value.filter((a) => a !== allergen));
                    };

                    return (
                      <FormItem>
                        <FormLabel>Allergens</FormLabel>
                        <div className="flex space-x-2">
                          <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add allergen and press Enter"
                          />
                          <Button
                            type="button"
                            onClick={handleAddAllergen}
                            variant="secondary"
                          >
                            Add
                          </Button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {field.value.map((allergen) => (
                            <Badge
                              key={allergen}
                              variant="destructive"
                              className="px-2 py-1"
                            >
                              {allergen}
                              <X
                                className="ml-1 h-3 w-3 cursor-pointer"
                                onClick={() => handleRemoveAllergen(allergen)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <div className="space-y-4 rounded-md border p-4">
                  <h4 className="font-medium">Dietary Information</h4>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="dietaryFlags.vegetarian"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-2">
                          <div>
                            <FormLabel>Vegetarian</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dietaryFlags.vegan"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-2">
                          <div>
                            <FormLabel>Vegan</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dietaryFlags.glutenFree"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-2">
                          <div>
                            <FormLabel>Gluten Free</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dietaryFlags.dairyFree"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-2">
                          <div>
                            <FormLabel>Dairy Free</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
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
                    disabled={addItemMutation.isPending}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={addItemMutation.isPending}
                    className="min-w-24"
                  >
                    {addItemMutation.isPending ? "Saving..." : "Save Item"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for Ingredients
function IngredientsInput({
  value = [],
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  function handleAddIngredient() {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue("");
    }
  }

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  function handleRemoveIngredient(ingredient: string) {
    onChange(value.filter((i) => i !== ingredient));
  }

  return (
    <div className="space-y-2">
      <label htmlFor="ingredients" className="text-sm font-medium">
        Ingredients
      </label>
      <div className="flex space-x-2">
        <input
          id="ingredients"
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add ingredient and press Enter"
        />
        <button
          type="button"
          className="ring-offset-background focus-visible:ring-ring border-input bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          onClick={handleAddIngredient}
        >
          Add
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {value.map((ingredient) => (
          <span
            key={ingredient}
            className="focus:ring-ring bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center rounded-md border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
          >
            {ingredient}
            <button
              type="button"
              className="ring-offset-background focus:ring-ring ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
              onClick={() => handleRemoveIngredient(ingredient)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3"
              >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
              <span className="sr-only">Remove</span>
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
