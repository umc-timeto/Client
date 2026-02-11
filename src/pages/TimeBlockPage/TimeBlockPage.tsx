export default function TimeBlockPage() {
  const today = useMemo(() => startOfDay(new Date()), []);

  const [searchParams, setSearchParams] = useSearchParams();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const monthSectionRef = useRef<HTMLDivElement | null>(null);
  const [isCondensed, setIsCondensed] = useState(false);

  const { monthMatrix, selectedWeek, handlePickDate, hours } = useCalendarModel({
    today,
    searchParams,
    setSearchParams,
    isCondensed,
  });

  useEffect(() => {
    const monthEl = monthSectionRef.current;
    if (!monthEl) return;

    const rootEl = scrollRef.current;
    const isRootScrollable = (node: HTMLDivElement | null) => {
      if (!node) return false;
      return node.scrollHeight > node.clientHeight + 1;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        setIsCondensed(!entry.isIntersecting);
      },
      {
        root: isRootScrollable(rootEl) ? rootEl : null,
        threshold: 0,
        rootMargin: `-${HEADER_HEIGHT_PX + CONDENSE_EARLY_PX}px 0px 0px 0px`,
      }
    );

    io.observe(monthEl);
    return () => io.disconnect();
  }, []);

  return (
    <div className="h-full w-full bg-white">
      <div ref={scrollRef} className="h-full w-full overflow-y-auto">
        <div ref={monthSectionRef} className="px-5">
          <CalendarMonth dayLabels={DAY_LABELS} weeks={monthMatrix} onPickDate={handlePickDate} />
        </div>

        <CalendarWeekStrip
          dayLabels={DAY_LABELS}
          cells={selectedWeek}
          visible={isCondensed}
          topPx={HEADER_HEIGHT_PX}
          heightPx={WEEK_STRIP_HEIGHT_PX}
          animMs={WEEK_STRIP_ANIM_MS}
          onPickDate={handlePickDate}
        />

        <div className="px-5 pb-10">
          <div className="relative">
            {hours.map((h) => (
              <div key={h} className="relative flex min-h-16 items-center">
                <div className="shrink-0 text-[12px] text-grey-light-active">{toTimeLabel(h)}</div>
                <div className="ml-4.25 h-px flex-1 bg-grey-light" />
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
  );
}
