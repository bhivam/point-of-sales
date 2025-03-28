"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Spinner } from "@/app/_components/Spinner";

export function CreateMenu({ restaurantId }: { restaurantId: number }) {
  const [menuName, setMenuName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const addMenuMut = api.menuRouter.addMenu.useMutation();

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault(); // good to know about this lol

    if (!menuName.trim()) return;

    setIsSubmitting(true);

    addMenuMut.mutate(
      { restaurantId, name: menuName },
      {
        onSuccess: (data) => {
          setIsOpen(false);
          router.refresh();
          router.push(`/dashboard/${restaurantId}/menu/${data.id}`);
          setIsSubmitting(false);
        },
        onError: () => {
          setIsSubmitting(false);
        },
      },
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>Create Menu</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create Menu</DialogTitle>
            <DialogDescription>
              Give your menu a name to modify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Input
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="Menu Name"
                required
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-start">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner /> "Creating..."
                </>
              ) : (
                "Create Menu"
              )}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
