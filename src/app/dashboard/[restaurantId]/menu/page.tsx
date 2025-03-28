import { CreateMenu } from "@/app/_components/CreateMenu";
import { api } from "@/trpc/server";

export default async function Menu({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const restaurantId = parseInt((await params).restaurantId, 10);
  const menus = await api.menuRouter.getMenus({ restaurantId });

  return (
    <div className="flex flex-col">
      <div className="flex justify-between">
        <h1 className="text-3xl">Menu Editor</h1>
        <CreateMenu restaurantId={restaurantId}/>
      </div>
      <div className="grid-cols-3">
        <pre>{JSON.stringify(menus, null, 2)}</pre>
      </div>
    </div>
  );
}
