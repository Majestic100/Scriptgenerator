import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Animeret navigationsmenu med fælles "viewport": panelet skifter størrelse og
 * position blødt, når man går fra ét menupunkt til det næste, og indholdet
 * glider ind fra den side man kom fra.
 *
 * Tilpasset dette projekt: bruger `motion/react` (allerede installeret),
 * projektets egne farvetokens og en indbygget hover-markør bygget på
 * `layoutId` i stedet for et eksternt Highlight-primitiv.
 */

type Spring = { type: 'spring'; stiffness: number; damping: number; bounce: number };

type ContentRecord = { children: React.ReactNode; className?: string };

type MenuContextValue = {
  activeValue: string;
  direction: number;
  spring: Spring;
  viewportX: number | null;
  reduceMotion: boolean;
  openValue: (value: string) => void;
  closeMenu: () => void;
  registerContent: (value: string, content: ContentRecord) => () => void;
  updateViewportPosition: () => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);
const ItemContext = createContext<{ value?: string } | null>(null);
const HighlightContext = createContext<string | null>(null);

const contentVariants = {
  initial: (direction: number) => ({ x: 12 * direction, opacity: 0 }),
  active: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: -12 * direction, opacity: 0 })
};

/* ------------------------------------------------------------------ Rod */

type MotionNavigationMenuProps = Omit<React.ComponentPropsWithoutRef<'nav'>, 'onValueChange'> & {
  viewportClassName?: string;
  springBounce?: number;
  springStiffness?: number;
  springDamping?: number;
  value?: string;
  onValueChange?: (value: string) => void;
};

export function MotionNavigationMenu({
  className,
  children,
  viewportClassName,
  springBounce = 0,
  springStiffness = 350,
  springDamping = 32,
  value,
  onValueChange,
  onPointerLeave,
  onKeyDown,
  ...props
}: MotionNavigationMenuProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastActiveValueRef = useRef(value ?? '');
  const isControlled = value !== undefined;
  const reduceMotion = !!useReducedMotion();

  const [internalValue, setInternalValue] = useState('');
  const [direction, setDirection] = useState(1);
  const [viewportX, setViewportX] = useState<number | null>(null);
  const [contentByValue, setContentByValue] = useState<Record<string, ContentRecord>>({});

  const activeValue = value ?? internalValue;

  const spring = useMemo<Spring>(
    () => ({
      type: 'spring',
      bounce: springBounce,
      stiffness: springStiffness,
      damping: springDamping
    }),
    [springBounce, springStiffness, springDamping]
  );

  const getItemValues = useCallback(() => {
    const root = rootRef.current;
    if (!root) return [];
    const items = Array.from(
      root.querySelectorAll('[data-slot="navigation-menu-item"][data-value]')
    ) as HTMLElement[];
    return items.map((item) => item.dataset.value ?? '').filter(Boolean);
  }, []);

  /** Centrerer panelet under den åbne trigger, men holder det inden for skærmen. */
  const updateViewportPosition = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    frameRef.current = requestAnimationFrame(() => {
      const root = rootRef.current;
      if (!root) return;

      const rootRect = root.getBoundingClientRect();
      const activeTrigger = root.querySelector<HTMLElement>(
        '[data-slot="navigation-menu-trigger"][data-state="open"]'
      );

      if (!activeTrigger) {
        setViewportX(rootRect.width / 2);
        return;
      }

      const triggerRect = activeTrigger.getBoundingClientRect();
      const idealX = triggerRect.left - rootRect.left + triggerRect.width / 2;

      const measureEl = root.querySelector<HTMLElement>('[data-slot="navigation-menu-measure"]');
      const viewportEl = root.querySelector<HTMLElement>('[data-slot="navigation-menu-viewport"]');
      const contentWidth =
        (measureEl ? measureEl.offsetWidth : 0) || (viewportEl ? viewportEl.offsetWidth : 0);

      if (contentWidth <= 0) {
        setViewportX(idealX);
        return;
      }

      const half = contentWidth / 2;
      const margin = 12;
      const bounds = document.documentElement.getBoundingClientRect();
      const left = rootRect.left + idealX - half;
      const right = rootRect.left + idealX + half;

      let adjustment = 0;
      if (left < bounds.left + margin) adjustment = bounds.left + margin - left;
      else if (right > bounds.right - margin) adjustment = bounds.right - margin - right;

      setViewportX(idealX + adjustment);
    });
  }, []);

  const setActiveValue = useCallback(
    (nextValue: string) => {
      if (!isControlled) setInternalValue(nextValue);
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange]
  );

  const openValue = useCallback(
    (nextValue: string) => {
      if (!nextValue || nextValue === lastActiveValueRef.current) return;

      const itemValues = getItemValues();
      const previousIndex = itemValues.indexOf(lastActiveValueRef.current);
      const nextIndex = itemValues.indexOf(nextValue);
      if (previousIndex !== -1 && nextIndex !== -1) {
        setDirection(nextIndex > previousIndex ? 1 : -1);
      }

      lastActiveValueRef.current = nextValue;
      setActiveValue(nextValue);
      updateViewportPosition();
    },
    [getItemValues, setActiveValue, updateViewportPosition]
  );

  const closeMenu = useCallback(() => {
    lastActiveValueRef.current = '';
    setActiveValue('');
    updateViewportPosition();
  }, [setActiveValue, updateViewportPosition]);

  const registerContent = useCallback((contentValue: string, content: ContentRecord) => {
    setContentByValue((current) => {
      const previous = current[contentValue];
      if (previous?.children === content.children && previous?.className === content.className) {
        return current;
      }
      return { ...current, [contentValue]: content };
    });

    return () => {
      setContentByValue((current) => {
        if (!current[contentValue]) return current;
        const next = { ...current };
        delete next[contentValue];
        return next;
      });
    };
  }, []);

  useEffect(() => {
    if (value === undefined) return;
    if (!value) {
      lastActiveValueRef.current = '';
      return;
    }
    openValue(value);
  }, [openValue, value]);

  useLayoutEffect(() => {
    updateViewportPosition();
  }, [activeValue, updateViewportPosition]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') {
      return () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      };
    }

    const observer = new ResizeObserver(updateViewportPosition);
    observer.observe(root);

    return () => {
      observer.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [updateViewportPosition]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && event.target instanceof Node && !rootRef.current.contains(event.target)) {
        closeMenu();
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [closeMenu]);

  const contextValue = useMemo<MenuContextValue>(
    () => ({
      activeValue,
      direction,
      spring,
      viewportX,
      reduceMotion,
      openValue,
      closeMenu,
      registerContent,
      updateViewportPosition
    }),
    [
      activeValue,
      closeMenu,
      direction,
      openValue,
      reduceMotion,
      registerContent,
      spring,
      updateViewportPosition,
      viewportX
    ]
  );

  return (
    <MenuContext.Provider value={contextValue}>
      <nav
        ref={rootRef}
        data-slot="navigation-menu"
        className={cn('relative flex max-w-max flex-1 items-center justify-center', className)}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          closeMenu();
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key === 'Escape') closeMenu();
        }}
        {...props}
      >
        {children}
        <MotionNavigationMenuViewport className={viewportClassName} contentByValue={contentByValue} />
      </nav>
    </MenuContext.Provider>
  );
}

/* ------------------------------------------------------- Liste og markør */

export function MotionNavigationMenuList({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'ul'>) {
  const highlightId = useId();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <HighlightContext.Provider value={highlightId}>
      <ul
        data-slot="navigation-menu-list"
        className={cn('relative flex flex-1 list-none items-center justify-center gap-0.5', className)}
        onPointerLeave={() => setHovered(null)}
        {...props}
      >
        <HoverSetter value={hovered} onChange={setHovered}>
          {children}
        </HoverSetter>
      </ul>
    </HighlightContext.Provider>
  );
}

const HoverSetterContext = createContext<((value: string | null) => void) | null>(null);

function HoverSetter({
  onChange,
  children
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  children: React.ReactNode;
}) {
  return <HoverSetterContext.Provider value={onChange}>{children}</HoverSetterContext.Provider>;
}

export function MotionNavigationMenuItem({
  className,
  value,
  ...props
}: React.ComponentPropsWithoutRef<'li'> & { value?: string }) {
  const itemContextValue = useMemo(() => ({ value }), [value]);

  return (
    <ItemContext.Provider value={itemContextValue}>
      <li data-slot="navigation-menu-item" data-value={value} className={cn('relative', className)} {...props} />
    </ItemContext.Provider>
  );
}

/** Baggrundspillen der glider mellem menupunkter. */
function HoverPill({ show }: { show: boolean }) {
  const highlightId = useContext(HighlightContext);
  const context = useContext(MenuContext);
  if (!show || !highlightId) return null;

  return (
    <motion.span
      layoutId={highlightId}
      aria-hidden="true"
      className="absolute inset-0 -z-10 rounded-[var(--radius-control)] bg-sunken"
      transition={context?.reduceMotion ? { duration: 0 } : context?.spring}
    />
  );
}

export const motionNavigationMenuTriggerStyle =
  'relative inline-flex h-9 w-max items-center justify-center gap-1.5 rounded-[var(--radius-control)] bg-transparent px-3 text-[15px] font-semibold text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink/25 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

export function MotionNavigationMenuTrigger({
  className,
  children,
  onPointerEnter,
  onFocus,
  onClick,
  ...props
}: React.ComponentPropsWithoutRef<'button'>) {
  const context = useContext(MenuContext);
  const itemContext = useContext(ItemContext);
  const setHovered = useContext(HoverSetterContext);
  const value = itemContext?.value;
  const isOpen = !!value && context?.activeValue === value;

  return (
    <button
      type="button"
      data-slot="navigation-menu-trigger"
      data-state={isOpen ? 'open' : 'closed'}
      aria-expanded={isOpen}
      className={cn(motionNavigationMenuTriggerStyle, className)}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (value) {
          setHovered?.(value);
          context?.openValue(value);
        }
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (value) {
          setHovered?.(value);
          context?.openValue(value);
        }
      }}
      onClick={(event) => {
        onClick?.(event);
        if (value) context?.openValue(value);
      }}
      {...props}
    >
      <HoverPill show={isOpen} />
      {children}
      <motion.span
        aria-hidden="true"
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={context?.reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 24 }}
        className="inline-flex"
      >
        <ChevronDown className="w-3.5 h-3.5 text-muted" strokeWidth={2} />
      </motion.span>
    </button>
  );
}

/** Registrerer sit indhold i det fælles viewport. Rendrer intet selv. */
export function MotionNavigationMenuContent({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const context = useContext(MenuContext);
  const itemContext = useContext(ItemContext);
  const value = itemContext?.value;

  useLayoutEffect(() => {
    if (!context || !value) return;
    return context.registerContent(value, { children, className });
  }, [children, className, context, value]);

  return null;
}

function MotionNavigationMenuViewport({
  className,
  contentByValue
}: {
  className?: string;
  contentByValue: Record<string, ContentRecord>;
}) {
  const context = useContext(MenuContext);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [lastSize, setLastSize] = useState({ width: 0, height: 0 });

  const activeContent = context?.activeValue ? contentByValue[context.activeValue] : undefined;

  useLayoutEffect(() => {
    const node = measureRef.current;
    if (!node || !activeContent) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      const nextSize = { width: rect.width, height: rect.height };
      setSize(nextSize);
      if (nextSize.width > 0 || nextSize.height > 0) setLastSize(nextSize);
      context?.updateViewportPosition();
    };

    updateSize();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeContent, context]);

  const width = size.width > 0 ? size.width : lastSize.width;
  const height = size.height > 0 ? size.height : lastSize.height;
  const transition = context?.reduceMotion ? { duration: 0 } : context?.spring;

  return (
    <motion.div
      className="absolute top-full isolate z-50 flex -translate-x-1/2 justify-center"
      initial={false}
      animate={{ left: context?.viewportX ?? '50%' }}
      transition={transition}
    >
      <motion.div
        data-slot="navigation-menu-viewport"
        initial={false}
        animate={{
          width: activeContent ? width : 0,
          height: activeContent ? height : 0,
          opacity: activeContent ? 1 : 0
        }}
        transition={transition}
        className={cn(
          'relative mt-2 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[0_12px_32px_rgb(22_24_29/0.12)]',
          !activeContent && 'pointer-events-none border-transparent shadow-none',
          className
        )}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={context?.direction ?? 1}>
          {activeContent && context?.activeValue && (
            <motion.div
              data-slot="navigation-menu-content"
              key={context.activeValue}
              custom={context.direction}
              variants={context.reduceMotion ? undefined : contentVariants}
              initial="initial"
              animate="active"
              exit="exit"
              transition={transition}
              className={cn('p-2', activeContent.className)}
            >
              {activeContent.children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Skjult måling, så viewportet kender panelets endelige størrelse */}
      <div
        ref={measureRef}
        aria-hidden="true"
        data-slot="navigation-menu-measure"
        className="pointer-events-none invisible absolute top-2 left-0 w-max"
      >
        {activeContent && <div className={cn('p-2', activeContent.className)}>{activeContent.children}</div>}
      </div>
    </motion.div>
  );
}

/** Række i et panel. */
export function MotionNavigationMenuLink({
  className,
  onPointerEnter,
  ...props
}: React.ComponentPropsWithoutRef<'button'>) {
  const highlightId = useId();

  return (
    <HighlightContext.Provider value={highlightId}>
      <button
        type="button"
        data-slot="navigation-menu-link"
        className={cn(
          'group/link relative flex w-full flex-col gap-0.5 rounded-[var(--radius-control)] p-2.5 text-left outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ink/25 cursor-pointer',
          className
        )}
        onPointerEnter={onPointerEnter}
        {...props}
      />
    </HighlightContext.Provider>
  );
}
