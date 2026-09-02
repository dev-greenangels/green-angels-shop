/**
 * Єдиний клас оболонки контенту на всьому сайті.
 * max-width і горизонтальні відступи — у `app/globals.css` (`--site-shell-*`).
 */
export const siteContentShellClassName = 'site-shell'

/** Вужчий вміст (статті блогу, довгі текстові сторінки). */
export const siteContentShellNarrowClassName = 'site-shell site-shell--narrow'

/** Компактна сторінка (особистий кабінет). */
export const siteContentShellCompactClassName = 'site-shell site-shell--compact'

/** Sticky-панель каталогу: та сама ширина/відступи, що й плаваючий хедер; -2px щоб прилипала без просвіту. */
export const siteStickyToolbarOuterClassName =
  'sticky top-[calc(var(--site-header-offset,5rem)-2px)] z-40 -mx-[var(--site-shell-padding-x)] mb-6 px-3 sm:px-4'

export const siteStickyToolbarInnerClassName =
  'boty-glass-sticky flex items-center gap-2 rounded-b-[0.5rem] border-b border-border/40 px-2.5 py-2 sm:px-3'

/** Правий кластер кнопок поверх горизонтального скролу чіпсів. */
export const siteStickyToolbarControlsClusterClassName =
  'relative z-10 flex h-8 shrink-0 items-center gap-2 boty-glass-match pl-1.5 before:pointer-events-none before:absolute before:inset-y-0 before:right-full before:w-5 before:bg-gradient-to-r before:from-transparent before:to-[var(--boty-glass-bg,rgba(255,255,255,0.78))] before:content-[""]'

/** Розділювачі пунктів мобільного меню — той самий відтінок у sticky-панелях каталогу. */
export const siteMobileMenuDividerClassName = 'border-[#65954f38]'
