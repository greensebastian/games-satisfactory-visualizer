import { createStore } from "zustand";
import { createContext, useContext } from "react";

type ViewStateProps = {
  activeBuildingIds: string[];
  hoveredBuildingId?: string;
};

export type ViewState = ViewStateProps & {
  set(update: (state: ViewState) => Partial<ViewState>): void;
};

type ViewStateStore = ReturnType<typeof createViewStateStore>;

export const createViewStateStore = (initProps?: Partial<ViewStateProps>) => {
  const DEFAULT_PROPS: ViewStateProps = {
    activeBuildingIds: [],
  };
  return createStore<ViewState>()((set, get) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    set(update) {
      set((state) => update(state));
    },
  }));
};

export const ViewStateContext = createContext<ViewStateStore | null>(null);

export const useViewStateStore = () => {
  const store = useContext(ViewStateContext);
  if (!store) throw new Error("Missing ViewContext.Provider in the tree");
  return store;
};
