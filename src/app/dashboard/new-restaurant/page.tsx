"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/trpc/react";

// Import UI components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

export default function NewRestaurant() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    address: "",
    phone: "",
    email: "",
    taxRate: 0,
  });

  type ErrorType = {
    [x: string]: string[] | undefined;
    [x: number]: string[] | undefined;
    [x: symbol]: string[] | undefined;
  };

  const [errors, setErrors] = useState<ErrorType>({});

  const createRestaurant = api.restaurantRouter.createRestaurant.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error) => {
      setErrors(
        error.data?.zodError?.fieldErrors || {
          form: [error.message || "Failed to create restaurant"],
        },
      );
      setIsSubmitting(false);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) {
      newErrors.name = ["Restaurant name is required"];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    // Create default opening hours
    const defaultHours = [{ open: 9, close: 22 }];
    const emptyHours: never[] = [];

    createRestaurant.mutate({
      name: formData.name,
      type: formData.type,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      taxRate: parseFloat(formData.taxRate.toString()) || 0,
      openingHours: {
        monday: defaultHours,
        tuesday: defaultHours,
        wednesday: defaultHours,
        thursday: defaultHours,
        friday: defaultHours,
        saturday: defaultHours,
        sunday: emptyHours,
      },
    });
  };

  return (
    <main className="container mx-auto py-8">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        <h1 className="text-3xl font-bold">Add New Restaurant</h1>
        <p className="text-muted-foreground">
          Enter your restaurant details to get started
        </p>
      </div>

      <Separator className="my-6" />

      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>
            Fill out the basic information about your restaurant
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Restaurant Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter restaurant name"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-destructive text-sm">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Restaurant Type
              </label>
              <Input
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                placeholder="E.g., Italian, Fast Food, Cafe"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Restaurant address"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Contact phone"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Contact email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="taxRate" className="text-sm font-medium">
                Tax Rate (%)
              </label>
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                value={formData.taxRate}
                onChange={handleInputChange}
                placeholder="Default tax rate"
              />
            </div>

            {errors.form && (
              <p className="text-destructive text-sm">{errors.form}</p>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Restaurant"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
