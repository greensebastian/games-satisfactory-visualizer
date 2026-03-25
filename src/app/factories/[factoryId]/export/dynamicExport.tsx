"use client";

import dynamic from "next/dynamic";

export const DynamicExport = dynamic(
  () => import("./export").then((m) => m.Export),
  {
    ssr: false,
  },
);
