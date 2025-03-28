import React from "react";
import type { RouterOutputs } from "@/trpc/react";
import { Clock } from "lucide-react";
import ModifierSectionWithForm from "@/app/_components/ModifierSectionWithForm"; // Import the new modifiers component

type Unpacked<T> = T extends (infer U)[] ? U : T;
type ItemList = Unpacked<RouterOutputs["menuRouter"]["getMenuById"]["sections"]>["items"];

export default function ItemList({ itemList }: { itemList: ItemList }) {
  function formatPrice(priceInCents: number) {
    return `$${(priceInCents / 100).toFixed(2)}`;
  }

  function getDietaryTags(dietaryFlags: Unpacked<ItemList>["dietaryFlags"]) {
    const tags = [];
    if (dietaryFlags.vegetarian) tags.push("V");
    if (dietaryFlags.vegan) tags.push("VG");
    if (dietaryFlags.glutenFree) tags.push("GF");
    if (dietaryFlags.dairyFree) tags.push("DF");
    return tags;
  }

  return (
    <div className="space-y-2">
      {itemList.map((item) => (
        <div key={item.name} className="border-b border-gray-200 py-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex-1">
              <div className="flex items-center">
                <h3 className="font-medium text-gray-800">{item.name}</h3>
                <div className="ml-2 flex flex-wrap gap-1">
                  {getDietaryTags(item.dietaryFlags).map((tag) => (
                    <span key={tag} className="ml-1 rounded-full bg-gray-200 px-2 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                {item.description}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                <Clock size={14} className="mr-1 inline" />
                <span>{item.preparationTime}m</span>
              </div>
              <div className="font-medium text-green-600">
                <span>{formatPrice(item.price)}</span>
              </div>
            </div>
          </div>
          {(item.ingredients.length > 0 || item.allergens.length > 0) && (
            <div className="mt-1 flex flex-wrap px-2 text-xs text-gray-500">
              {item.ingredients.length > 0 && (
                <span className="mr-2">
                  <span className="font-medium">Ingredients:</span>{" "}
                  {item.ingredients.join(", ")}
                </span>
              )}
              <span>
                <span className="font-medium text-amber-600">Allergens:</span>{" "}
                {item.allergens.length > 0 ? item.allergens.join(", ") : "None"}
              </span>
            </div>
          )}

          {/* Use the dedicated ItemModifiers component for all modifier-related functionality */}
          <div className="mt-1">
            <ModifierSectionWithForm modifiers={item.modifiers} menuItemId={item.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
