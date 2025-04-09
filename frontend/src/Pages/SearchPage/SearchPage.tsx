import {
  DndContext,
  closestCenter,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { useState, useEffect, ChangeEvent, SyntheticEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import Search from "../../Components/Search/Search";
import { GroupCard } from "./Tiles/GroupCard";
import { DraggableTile } from "./Tiles/DraggableTile";



interface SearchTile {
  id: string;
  question: string;
  content: string;
}

interface TileGroup {
  id: string;
  name: string;
  tiles: SearchTile[];
}

const MAX_GROUPS = 20;

const SearchPage = () => {
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<TileGroup[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedApi, setSelectedApi] = useState("http://localhost:5000/query");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleDropdownChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedApi(
      value === "document"
        ? "http://localhost:5000/query"
        : "http://localhost:8000/query"
    );
  };

  const queryDynamicAPI = async (query: string) => {
    try {
      const res = await fetch(selectedApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      return await res.json();
    } catch {
      return "Server error. Please try again.";
    }
  };

  const onSearchSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();

    const result = await queryDynamicAPI(search);
    if (typeof result === "string" || (!result.answer && !result.top_matches)) {
      setServerError("Error fetching data");
      return;
    }

    const isDatasource = selectedApi.includes("8000");
    const newTile: SearchTile = {
      id: uuidv4(),
      question: search,
      content:
        isDatasource
          ? result.answer || "No content found"
          : result.top_matches?.[0]?.content || result.answer || "No content found",
    };

    const newGroup: TileGroup = {
      id: uuidv4(),
      name: "Untitled",
      tiles: [newTile],
    };

    setGroups((prev) => [newGroup, ...prev].slice(0, MAX_GROUPS));
    setServerError(null);
    setSearch("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let sourceGroup: TileGroup | undefined;
    let targetGroup: TileGroup | undefined;
    let draggedTile: SearchTile | undefined;

    groups.forEach((group) => {
      if (group.tiles.find((t) => t.id === active.id)) {
        sourceGroup = group;
        draggedTile = group.tiles.find((t) => t.id === active.id);
      }
      if (group.id === over.id) {
        targetGroup = group;
      }
    });

    if (!sourceGroup || !targetGroup || !draggedTile) return;

    if (sourceGroup.id === targetGroup.id) return;

    const updatedGroups = groups.map((group) => {
      if (group.id === sourceGroup!.id) {
        return { ...group, tiles: group.tiles.filter((t) => t.id !== draggedTile!.id) };
      } else if (group.id === targetGroup!.id) {
        return { ...group, tiles: [...group.tiles, draggedTile!] };
      } else {
        return group;
      }
    }).filter((g) => g.tiles.length > 0);

    setGroups(updatedGroups);
  };

  const renameGroup = (groupId: string, name: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name } : g))
    );
  };

  const removeTile = (groupId: string, tileId: string) => {
    setGroups((prev) =>
      prev
        .map((group) => ({
          ...group,
          tiles: group.tiles.filter((t) => t.id !== tileId),
        }))
        .filter((g) => g.tiles.length > 0)
    );
  };

  return (
    <div className="p-4 h-screen flex flex-col">
      {/* Dropdown */}
      <div className="mb-4">
        <select onChange={handleDropdownChange} className="p-2 border rounded">
          <option value="document">Document Upload</option>
          <option value="datasource">Datasource</option>
        </select>
      </div>

      <Search
        onSearchSubmit={onSearchSubmit}
        search={search}
        handleSearchChange={handleSearchChange}
      />

      {serverError && <div className="text-red-500">{serverError}</div>}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="mt-4 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onRename={renameGroup}
              onRemoveTile={removeTile}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default SearchPage;
