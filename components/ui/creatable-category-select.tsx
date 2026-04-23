"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";
import { toast } from "sonner";

interface Category {
    slno: number;
    categoryName: string;
    companyId?: string | null;
}

interface CreatableCategorySelectProps {
    categories: Category[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    onCategoryCreated: (newCat: Category) => void;
    companyId: string | null;
}

export function CreatableCategorySelect({
    categories, selectedIds, onChange, onCategoryCreated, companyId
}: CreatableCategorySelectProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = categories.filter(c => c.categoryName.toLowerCase().includes(inputValue.toLowerCase()));

    // Check if exact match exists
    const exactMatch = categories.find(c => c.categoryName.toLowerCase() === inputValue.toLowerCase());

    const handleCreate = async () => {
        const val = inputValue.trim();
        if (!val) return;

        // Validation
        if (!/^[a-zA-Z0-9\s\-]+$/.test(val)) {
            toast.error("Only string, space and '-' allowed", { id: "cat-err" });
            return;
        }
        if (val.length > 20) {
            toast.error("Max 20 chars allowed", { id: "cat-len" });
            return;
        }

        if (exactMatch) {
            if (!selectedIds.includes(exactMatch.slno)) {
                onChange([...selectedIds, exactMatch.slno]);
            }
            setInputValue("");
            return;
        }

        const res = await fetch("/api/config/customer-category", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoryName: val, companyId })
        });

        const data = await res.json();
        if (res.ok) {
            onCategoryCreated(data);
            onChange([...selectedIds, data.slno]);
            setInputValue("");
        } else {
            toast.error(data.error || "Failed to create category");
        }
    };

    const toggleId = (id: number) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(x => x !== id));
        } else {
            onChange([...selectedIds, id]);
        }
        setInputValue("");
    };

    return (
        <div className="space-y-2 relative" ref={wrapperRef}>
            <div
                className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-zinc-200 rounded-md bg-white items-center relative focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all cursor-text"
                onClick={() => setOpen(true)}
            >
                {selectedIds.map(id => {
                    const cat = categories.find(c => c.slno === id);
                    if (!cat) return null;
                    return (
                        <span key={id} className="bg-zinc-100 border text-zinc-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium select-none shadow-sm pb-1.5 pt-1.5">
                            {cat.categoryName}
                            <div
                                className="w-4 h-4 rounded-full hover:bg-zinc-200 flex items-center justify-center cursor-pointer ml-1 transition-colors"
                                onClick={(e) => { e.stopPropagation(); onChange(selectedIds.filter(x => x !== id)); }}
                            >
                                <X className="w-3 h-3 text-zinc-500" />
                            </div>
                        </span>
                    );
                })}
                <input
                    type="text"
                    value={inputValue}
                    onChange={e => { setInputValue(e.target.value); setOpen(true); }}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreate();
                        }
                    }}
                    placeholder={selectedIds.length === 0 ? "Type to search or create..." : ""}
                    className="flex-1 bg-transparent min-w-[120px] outline-none text-sm placeholder:text-zinc-400 py-1"
                />
            </div>

            {open && (
                <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full bg-white border border-zinc-200 shadow-lg rounded-md max-h-[250px] overflow-y-auto hidden-scrollbar py-1">
                    {filtered.map(cat => {
                        const isSelected = selectedIds.includes(cat.slno);
                        return (
                            <div
                                key={cat.slno}
                                onClick={() => toggleId(cat.slno)}
                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-zinc-50 flex justify-between items-center ${isSelected ? "text-indigo-600 font-medium" : "text-zinc-700"}`}
                            >
                                {cat.categoryName}
                                {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                            </div>
                        );
                    })}

                    {!exactMatch && inputValue.trim().length > 0 && (
                        <div
                            onClick={handleCreate}
                            className="px-4 py-2.5 text-sm cursor-pointer text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 font-medium border-t border-indigo-100 flex items-center"
                        >
                            + Create &quot;{inputValue.trim()}&quot; (Enter)
                        </div>
                    )}

                    {filtered.length === 0 && !inputValue.trim() && (
                        <div className="px-4 py-3 text-sm text-zinc-500 text-center italic">No categories found. Type to create new.</div>
                    )}
                </div>
            )}
        </div>
    );
}
