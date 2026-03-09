import { useEffect } from "react";

const ensureMetaDescription = () => {
  let meta = document.querySelector("meta[name='description']");
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }
  return meta;
};

export const useSeo = ({ title, description }) => {
  useEffect(() => {
    document.title = title;
    const meta = ensureMetaDescription();
    meta.setAttribute("content", description);
  }, [title, description]);
};
