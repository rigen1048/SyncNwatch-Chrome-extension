import { useState, useEffect } from "react";

const STORAGE_KEY = "extension_unique_id";

function generateNewID(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

async function loadOrGenerateID(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      let storedId = result[STORAGE_KEY];
      if (typeof storedId === "string") {
        resolve(storedId);
      } else {
        const newId = generateNewID();
        chrome.storage.local.set({ [STORAGE_KEY]: newId }, () => {
          resolve(newId);
        });
      }
    });
  });
}

async function changeUniqueID(): Promise<string> {
  const newId = generateNewID();
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: newId }, () => resolve(newId));
  });
}

export function useUniqueId() {
  const [uniqueId, setUniqueId] = useState<string>("");

  useEffect(() => {
    loadOrGenerateID().then(setUniqueId);
  }, []);

  const handleChangeId = async () => {
    const newId = await changeUniqueID();
    setUniqueId(newId);
  };

  return { uniqueId, handleChangeId };
}
