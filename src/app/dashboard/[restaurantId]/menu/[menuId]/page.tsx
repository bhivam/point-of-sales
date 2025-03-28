import ItemList from "@/app/_components/ItemList";
import SectionForm from "@/app/_components/SectionForm";
import SectionWithItemForm from "@/app/_components/SectionWithItemForm";
import { api } from "@/trpc/server";

export default async function MenuEditor({
  params,
}: {
  params: Promise<{ menuId: string; restaurantId: string }>;
}) {
  const { menuId, restaurantId } = await params;

  const menuData = await api.menuRouter.getMenuById({
    menuId: parseInt(menuId, 10),
    restaurantId: parseInt(restaurantId, 10),
  });

  return (
    <div className="flex flex-col">
      <SectionForm menuData={menuData} />
      {menuData.sections
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((section) => (
          <div key={section.id}>
            <SectionWithItemForm sectionData={section} />
            <ItemList itemList={section.items} />
          </div>
        ))}
    </div>
  );
}
