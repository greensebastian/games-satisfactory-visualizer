"use client";

import dynamic from "next/dynamic";

export const DynamicReactFlowWrapper = dynamic(
  () => import("./reactFlowWrapper").then((m) => m.ReactFlowWrapper),
  {
    ssr: false,
  },
);
