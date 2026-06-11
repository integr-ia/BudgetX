"use client";

import { useState } from "react";
import { eq } from "drizzle-orm";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDbQuery, mutate } from "@/hooks/useDbQuery";
import { uid } from "@/db/client";
import * as schema from "@/db/schema";
import { PROJECT_COLORS } from "@/constants/categories";

export function CategoryManagerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const { data: categories } = useDbQuery((db) =>
    db.select().from(schema.categories)
  );
  const list = (categories ?? []).filter((c) => c.type === type);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    const color = PROJECT_COLORS[list.length % PROJECT_COLORS.length];
    await mutate((db) =>
      db.insert(schema.categories).values({
        id: uid(),
        name,
        type,
        color,
        isDefault: false,
      })
    );
    setNewName("");
  };

  const rename = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    await mutate((db) =>
      db.update(schema.categories).set({ name }).where(eq(schema.categories.id, id))
    );
    setEditingId(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ? Les transactions associées la conserveront.")) return;
    try {
      await mutate((db) => db.delete(schema.categories).where(eq(schema.categories.id, id)));
    } catch {
      alert("Impossible de supprimer : des transactions utilisent cette catégorie.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Catégories</DialogTitle>
        </DialogHeader>
        <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
          <TabsList className="w-full">
            <TabsTrigger value="expense" className="flex-1">Dépenses</TabsTrigger>
            <TabsTrigger value="income" className="flex-1">Revenus</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {list.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
              <div className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.color ?? "#737373" }} />
              {editingId === c.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 flex-1"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="size-8" onClick={() => rename(c.id)}>
                    <Check className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-8" onClick={() => setEditingId(null)}>
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm">{c.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                    }}
                    aria-label="Renommer"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  {!c.isDefault && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-red-500"
                      onClick={() => remove(c.id)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Nouvelle catégorie…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button onClick={add} disabled={!newName.trim()}>
            <Plus className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
