"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type RouterOutputs } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const orderSchema = z.object({
  location: z.enum(["table", "to_go"]),
  tableNumber: z.number().optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Invalid phone number format")
    .optional(),
  name: z.string().optional(),
  restaurantId: z.number(),
  restaurantStaffId: z.number(),
});

const orderItemSchema = z.object({
  restaurantId: z.number(),
  menuItemId: z.number(),
  restaurantStaffId: z.number(),
  orderId: z.number(),
  specialInstructions: z.string().optional(),
  modifierIds: z.number().array(),
});

type Order = z.infer<typeof orderSchema>;
type OrderItem = z.infer<typeof orderItemSchema>;

export default function OrderTaker({
  menu,
  restaurantDetails,
}: {
  menu: RouterOutputs["menuRouter"]["getMenuById"];
  restaurantDetails: RouterOutputs["restaurantRouter"]["getRestaurantById"];
}) {
  const [location, setLocation] = useState<"to_go" | "table" | null>(null);
  const [phone, setPhone] = useState<string>("");
  const [table, setTable] = useState<string>("");
  const [name, setName] = useState<string>("");

  const [stage, setStage] = useState<"location" | "locInfo" | "items">(
    "location",
  );

  const [selectedItems, setSelectedItems] = useState<
    {
      item: (typeof menu.sections)[0]["items"][0];
      specialInstructions: string;
      selectedModifiers: number[];
    }[]
  >([]);

  const [specialInstructions, setSpecialInstructions] = useState<string>("");

  const [currentItem, setCurrentItem] = useState<
    (typeof menu.sections)[0]["items"][0] | null
  >(null);

  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([]);

  const nav = useRouter();

  function displayLocation(loc: typeof location) {
    if (loc === "to_go") {
      return "To Go";
    } else if (loc === "table") {
      return "Table";
    } else {
      return "You can't see this!";
    }
  }

  const calculateTotal = () => {
    return (
      selectedItems.reduce((total, item) => {
        let itemTotal = item.item.price || 0;

        itemTotal += item.selectedModifiers.reduce((modTotal, modId) => {
          const modifier = item.item.modifiers.find((mod) => mod.id === modId);
          return modTotal + (modifier?.priceAdjustment || 0);
        }, 0);

        return total + itemTotal;
      }, 0) / 100
    ).toFixed(2);
  };

  const addItemToOrder = (item: (typeof menu.sections)[0]["items"][0]) => {
    setCurrentItem(item);
    setSelectedModifiers([]);
    setSpecialInstructions("");
  };

  const confirmItem = () => {
    if (currentItem) {
      setSelectedItems([
        ...selectedItems,
        {
          item: currentItem,
          specialInstructions,
          selectedModifiers,
        },
      ]);
      setCurrentItem(null);
      setSelectedModifiers([]);
      setSpecialInstructions("");
    }
  };

  const toggleModifier = (modifierId: number) => {
    if (selectedModifiers.includes(modifierId)) {
      setSelectedModifiers(selectedModifiers.filter((id) => id !== modifierId));
    } else {
      setSelectedModifiers([...selectedModifiers, modifierId]);
    }
  };

  const removeItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const continueToItems = () => {
    if (location === "table" && !table) {
      alert("Please enter a table number!");
      return;
    }

    if (location === "to_go" && (!name || !phone || phone.length !== 10)) {
      alert("Please fill in name and valid phone number!");
      return;
    }

    setStage("items");
  };

  const addOrderMutation = api.orderRouter.addOrder.useMutation({
    onSuccess: () => {
      toast.success("Success", { description: "Order created successfully" });
      nav.push("/dashboard/1/orders/view");
    },
    onError: (e) =>
      toast.error("Error", { description: "Failed to create order: " + e }),
  });

  const submitOrder = () => {
    try {
      const order: Omit<Order, "orderId"> = {
        location: location!,
        restaurantId: restaurantDetails.id,
        restaurantStaffId: restaurantDetails.restaurantStaffId,
      };

      if (location === "table") {
        order.tableNumber = parseInt(table);
      } else if (location === "to_go") {
        order.name = name;
        order.phone = phone;
      }

      orderSchema.parse(order);

      addOrderMutation.mutate({
        location: order.location,
        tableNumber: order.tableNumber,
        name: order.name,
        phone: order.phone,
        restaurantId: restaurantDetails.id,
        restaurantStaffId: restaurantDetails.restaurantStaffId,
        orderItems: selectedItems.map((selectedItem) => ({
          restaurantId: restaurantDetails.id,
          menuItemId: selectedItem.item.id,
          restaurantStaffId: restaurantDetails.restaurantStaffId,
          specialInstructions: selectedItem.specialInstructions,
          modifierIds: selectedItem.selectedModifiers,
        })),
      });
    } catch (error) {
      console.error("Order validation failed:", error);
      alert("Failed to create order. Please check your inputs.");
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1/24">
        <Button
          onClick={() => {
            if (stage === "items") {
              setStage("locInfo");
            } else if (location && stage === "locInfo") {
              setLocation(null);
              setStage("location");
            } else {
              nav.push("/dashboard/1/orders/new");
            }
          }}
        >
          Back
        </Button>
      </div>
      <div className="flex h-full w-full flex-23/24">
        <div className="h-full flex-3/4 border-r-1 border-r-black pr-1">
          {stage === "location" && (
            <div className="grid h-full w-full grid-cols-3 gap-2">
              <div
                className="bg-secondary hover:bg-primary flex cursor-pointer items-center justify-center rounded-md text-3xl font-bold"
                onClick={() => {
                  setLocation("to_go");
                  setTable("");
                  setStage("locInfo");
                }}
              >
                To Go
              </div>
              <div
                className="bg-secondary hover:bg-primary flex cursor-pointer items-center justify-center rounded-md text-3xl font-bold"
                onClick={() => {
                  setLocation("table");
                  setName("");
                  setPhone("");
                  setStage("locInfo");
                }}
              >
                Table
              </div>
            </div>
          )}

          {stage === "locInfo" && location && (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <div className="w-1/2 rounded-lg bg-gray-100 p-2">
                {location === "table" ? (
                  <div>
                    <Label
                      htmlFor="table-number"
                      className="mb-1 block text-xl font-medium"
                    >
                      Table Number
                    </Label>
                    <Input
                      id="table-number"
                      type="text"
                      placeholder="Enter table number"
                      value={table}
                      onChange={(e) =>
                        setTable(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <Label
                        htmlFor="name"
                        className="mb-1 block text-xl font-medium"
                      >
                        Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter customer name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="phone"
                        className="mb-1 block text-xl font-medium"
                      >
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={(e) =>
                          setPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        className="w-full"
                      />
                    </div>
                  </>
                )}
                <div className="mt-2 flex w-full justify-end">
                  <Button onClick={continueToItems}>Continue</Button>
                </div>
              </div>
            </div>
          )}

          {stage === "items" && (
            <div className="h-full overflow-y-auto">
              {currentItem ? (
                <div className="p-4">
                  <h2 className="mb-4 text-2xl font-bold">
                    {currentItem.name}
                  </h2>
                  <div className="mb-4">
                    <Label
                      htmlFor="special-instructions"
                      className="mb-1 block text-lg"
                    >
                      Special Instructions
                    </Label>
                    <Input
                      id="special-instructions"
                      type="text"
                      placeholder="E.g. No onions, extra sauce"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {currentItem.modifiers.length > 0 && (
                    <div className="mb-4">
                      <h3 className="mb-2 text-xl font-semibold">Modifiers</h3>
                      <div className="space-y-2">
                        {currentItem.modifiers.map((modifier) => (
                          <div key={modifier.id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`modifier-${modifier.id}`}
                              checked={selectedModifiers.includes(modifier.id)}
                              onChange={() => toggleModifier(modifier.id)}
                              className="mr-2 h-5 w-5"
                            />
                            <Label
                              htmlFor={`modifier-${modifier.id}`}
                              className="flex-1"
                            >
                              {modifier.name} (+$
                              {(modifier.priceAdjustment / 100).toFixed(2)})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentItem(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={confirmItem}>Add to Order</Button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <h2 className="mb-4 text-2xl font-bold">Menu</h2>
                  <div className="space-y-6">
                    {menu.sections.map((section) => (
                      <div
                        key={section.id}
                        className="rounded-lg bg-gray-50 p-4"
                      >
                        <h3 className="mb-3 text-xl font-bold">
                          {section.name}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {section.items.map((item) => (
                            <div
                              key={item.id}
                              className="cursor-pointer rounded-md border border-gray-300 bg-white p-3 shadow-sm hover:bg-gray-50"
                              onClick={() => addItemToOrder(item)}
                            >
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-500">
                                {item.description}
                              </div>
                              <div className="mt-1 font-semibold">
                                ${(item.price / 100).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-1/4 flex-col justify-between border-l-1 border-l-black p-2 pl-1">
          <div>
            <h1 className="text-3xl font-bold">Order Summary:</h1>
            {location && (
              <div className="text-xl">{displayLocation(location)}</div>
            )}
            {location === "table" && table && (
              <div className="text-xl">Table Number: {table}</div>
            )}
            {location === "to_go" && (
              <>
                {name && <div className="text-xl">Name: {name}</div>}
                {phone && <div className="text-xl">Phone: {phone}</div>}
              </>
            )}

            {selectedItems.length > 0 && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold">Items:</h2>
                <div className="mt-2 max-h-80 overflow-y-auto">
                  {selectedItems.map((selItem, index) => (
                    <div
                      key={index}
                      className="mb-2 rounded border border-gray-200 p-2"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{selItem.item.name}</span>
                        <span>${(selItem.item.price / 100).toFixed(2)}</span>
                      </div>

                      {selItem.selectedModifiers.length > 0 && (
                        <div className="mt-1 ml-4 text-sm">
                          {selItem.selectedModifiers.map((modId) => {
                            const modifier = selItem.item.modifiers.find(
                              (m) => m.id === modId,
                            );
                            return modifier ? (
                              <div key={modId} className="flex justify-between">
                                <span>+ {modifier.name}</span>
                                <span>
                                  ${(modifier.priceAdjustment / 100).toFixed(2)}
                                </span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}

                      {selItem.specialInstructions && (
                        <div className="mt-1 text-sm italic">
                          Note: {selItem.specialInstructions}
                        </div>
                      )}

                      <button
                        className="mt-1 text-sm text-red-500"
                        onClick={() => removeItem(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-xl">
              <span className="font-bold">Total:</span> ${calculateTotal()}
            </p>

            {stage === "items" && selectedItems.length > 0 && (
              <Button className="mt-4 w-full" onClick={submitOrder}>
                Place Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
