"use client";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { HoursSchema, restaurantInputSchema } from "@/server/api/zod-schemas";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/app/_components/Spinner";

const formSchema = restaurantInputSchema;

const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const HoursEditor = ({
  day,
  value,
  onChange,
}: {
  day: string;
  value: z.infer<typeof HoursSchema>;
  onChange: (newValue: z.infer<typeof HoursSchema>) => void;
}) => {
  const handleToggle = (checked: boolean) => {
    if (value.length === 0) {
      // Add default hours when toggling on: 9am to 5pm
      onChange([{ openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 }]);
    } else {
      // Remove hours when toggling off
      onChange([]);
    }
  };

  const updateHours = (index: number, field: string, newValue: string) => {
    const updatedHours = [...value];
    const num = parseInt(newValue, 10);

    const updatedRange = updatedHours[index];
    if (!updatedRange) {
      throw new Error("impossible integer value recieved");
    }

    updatedHours[index] = {
      ...updatedRange,
      [field]: num,
    };
    onChange(updatedHours);
  };

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={`toggle-${day}`} className="capitalize">
          {day}
        </Label>
        <Switch
          id={`toggle-${day}`}
          checked={value.length > 0}
          onCheckedChange={handleToggle}
        />
      </div>

      {value.length > 0 && (
        <div className="mt-2 ml-6 space-y-4">
          {value.map((hours, index) => (
            <div key={index} className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Opens</div>
                <div className="flex space-x-2">
                  <Select
                    value={hours.openHour.toString()}
                    onValueChange={(val) => updateHours(index, "openHour", val)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }).map((_, i) => (
                        <SelectItem key={`open-hour-${i}`} value={i.toString()}>
                          {i % 12 === 0 ? 12 : i % 12}
                          {i < 12 ? "am" : "pm"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={hours.openMinute.toString()}
                    onValueChange={(val) =>
                      updateHours(index, "openMinute", val)
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 15, 30, 45].map((minute) => (
                        <SelectItem
                          key={`open-min-${minute}`}
                          value={minute.toString()}
                        >
                          :{minute.toString().padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Closes</div>
                <div className="flex space-x-2">
                  <Select
                    value={hours.closeHour.toString()}
                    onValueChange={(val) =>
                      updateHours(index, "closeHour", val)
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }).map((_, i) => (
                        <SelectItem
                          key={`close-hour-${i}`}
                          value={i.toString()}
                        >
                          {i % 12 === 0 ? 12 : i % 12}
                          {i < 12 ? "am" : "pm"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={hours.closeMinute.toString()}
                    onValueChange={(val) =>
                      updateHours(index, "closeMinute", val)
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 15, 30, 45].map((minute) => (
                        <SelectItem
                          key={`close-min-${minute}`}
                          value={minute.toString()}
                        >
                          :{minute.toString().padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          {value.length > 0 && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  onChange([
                    ...value,
                    {
                      openHour: 12,
                      openMinute: 0,
                      closeHour: 17,
                      closeMinute: 0,
                    },
                  ]);
                }}
              >
                Add Additional Hours
              </Button>

              {value.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  onClick={() => {
                    const newValue = [...value];
                    newValue.pop();
                    onChange(newValue);
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function NewRestaurant() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      address: "",
      phone: "",
      email: "",
      taxRate: 0,
      openingHours: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const createRestaurant = api.restaurantRouter.createRestaurant.useMutation();

  function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true);
    createRestaurant.mutate(values, {
      onSuccess: () => {
        router.push("/dashboard");
      },
      onError: () => {
        setSubmitting(false);
      },
    });
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold">Create Restaurant</h1>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="contact">Contact Details</TabsTrigger>
                  <TabsTrigger value="hours">Opening Hours</TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Restaurant" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is the name of your restaurant
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Type</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Italian, Fast Food, Cafe"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The cuisine or type of your restaurant
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 8.25"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value === "" ? 0 : parseFloat(value),
                              );
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          The sales tax rate applied to orders
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Contact Details Tab */}
                <TabsContent value="contact" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main St, City, State, ZIP"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Physical location of your restaurant
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormDescription>
                          Contact phone for customers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="restaurant@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Email for bookings and inquiries
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Opening Hours Tab */}
                <TabsContent value="hours" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Business Hours</h3>
                    <p className="text-muted-foreground text-sm">
                      Set your regular opening and closing hours. Toggle days to
                      set hours.
                    </p>

                    {daysOfWeek.map((day) => (
                      <FormField
                        key={day}
                        control={form.control}
                        name={`openingHours.${day}`}
                        render={({ field }) => (
                          <HoursEditor
                            day={day}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
                {submitting ? (
                  <Button type="submit" disabled>
                    <Spinner />
                    creating...
                  </Button>
                ) : (
                  <Button type="submit">Create Restaurant</Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
