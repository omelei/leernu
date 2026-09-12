import { useEffect, useId, useRef, useState, type FormEvent, type HTMLAttributes } from 'react';
import { t } from '@/i18n';

/**
 * The answer field of a round (S9): its label above it, never only inside it,
 * and "Kijk na" as the one primary action beside it. It has focus the moment
 * the question is shown. Cleared between questions by being keyed on the
 * question, which is simpler and harder to get wrong than resetting it by hand.
 *
 * Escape is not "empty the field": it opens the interruption, as everywhere in
 * a round (the question bar listens for it).
 */
export function AntwoordVeld({
  label,
  placeholder,
  inputMode,
  maxLength,
  onSubmit,
}: {
  readonly label: string;
  readonly placeholder: string;
  readonly inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  readonly maxLength: number;
  readonly onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    input.current?.focus();
  }, []);

  function handle(event: FormEvent) {
    event.preventDefault();
    if (value.trim().length === 0) return;
    onSubmit(value);
  }

  return (
    <form onSubmit={handle} className="ln-antwoordveld">
      <label htmlFor={id} className="ln-label">
        {label}
      </label>
      <div className="ln-antwoordveld-regel">
        <input
          ref={input}
          id={id}
          className="ln-veld"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={maxLength}
        />
        <button type="submit" className="ln-knop" disabled={value.trim().length === 0}>
          <span className="ln-knop-label">{t('practice.check')}</span>
        </button>
      </div>
    </form>
  );
}
