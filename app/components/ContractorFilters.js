"use client";

import { useState } from "react";

const objectTypes = ["Квартира", "Дом", "Офис", "Отель", "Ресторан / Кафе", "Другое"];

export default function ContractorFilters() {
  const [selectedTypes, setSelectedTypes] = useState(["Дом"]);
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  function toggleType(type) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  return (
    <>
      <div>
        <h3 className="font-headline font-bold text-lg mb-5">Тип объекта</h3>
        <div className="flex flex-wrap gap-2">
          {objectTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedTypes.includes(type)
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container hover:bg-surface-container-high"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <div className="pt-4 space-y-3">
        <button
          type="button"
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className="w-full flex items-center justify-between p-3 bg-primary-fixed/30 rounded-xl cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
            <span className="text-sm font-bold text-on-primary-fixed-variant">Только проверенные</span>
          </div>
          <div className={`w-10 h-5 rounded-full relative transition-colors ${verifiedOnly ? "bg-primary" : "bg-outline-variant"}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${verifiedOnly ? "right-0.5" : "left-0.5"}`}></div>
          </div>
        </button>
      </div>
    </>
  );
}
