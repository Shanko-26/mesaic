import * as React from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  smooth?: boolean;
}

export function ChatMessageList({
  className,
  children,
  smooth = false,
  ...props
}: ChatMessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = React.useState(true);

  const scrollToBottom = React.useCallback(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
      setIsAtBottom(true);
      setAutoScrollEnabled(true);
    }
  }, [smooth]);

  const handleScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const distanceToBottom = Math.abs(scrollHeight - scrollTop - clientHeight);
      const atBottom = distanceToBottom <= 20;
      setIsAtBottom(atBottom);
      
      // Re-enable auto-scroll if at the bottom
      if (atBottom) {
        setAutoScrollEnabled(true);
      }
    }
  }, []);

  const disableAutoScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const distanceToBottom = Math.abs(scrollHeight - scrollTop - clientHeight);
      const atBottom = distanceToBottom <= 20;
      
      // Only disable if not at bottom
      if (!atBottom) {
        setAutoScrollEnabled(false);
      }
    }
  }, []);

  // Scroll to bottom when content changes
  React.useEffect(() => {
    if (autoScrollEnabled && scrollRef.current) {
      scrollToBottom();
    }
  }, [children, autoScrollEnabled, scrollToBottom]);

  // Add scroll event listener
  React.useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.addEventListener("scroll", handleScroll, { passive: true });
      return () => element.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  return (
    <div className="relative w-full h-full">
      <div
        className={cn("flex flex-col w-full h-full p-4 overflow-y-auto", className)}
        ref={scrollRef}
        onWheel={disableAutoScroll}
        onTouchMove={disableAutoScroll}
        {...props}
      >
        <div className="flex flex-col gap-6">{children}</div>
      </div>

      {!isAtBottom && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          variant="outline"
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 inline-flex rounded-full shadow-md"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
} 