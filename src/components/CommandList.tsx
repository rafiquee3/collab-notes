import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

export const CommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (selectedIndex + props.items.length - 1) % props.items.length
        );
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-surface border-border flex flex-col overflow-hidden border shadow-xl min-w-[200px]">
      {props.items.length ? (
        props.items.map((item: any, index: number) => (
          <button
            key={index}
            onClick={() => selectItem(index)}
            className={`flex w-full items-center gap-2 px-4 py-3 text-left transition-colors ${
              index === selectedIndex
                ? "bg-border/20 text-foreground"
                : "text-accent hover:bg-border/10 hover:text-foreground"
            }`}
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest">{item.title}</span>
              <span className="text-accent text-xs mt-1">
                {item.description}
              </span>
            </div>
          </button>
        ))
      ) : (
        <div className="text-accent px-4 py-3 text-xs uppercase tracking-widest">No results</div>
      )}
    </div>
  );
});

CommandList.displayName = "CommandList";
