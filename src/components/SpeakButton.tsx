import { useEffect, useState } from 'react';
import { t } from '@/i18n';
import { IcoonKnop } from './ds';
import { VoorleesIcon } from './Icon';

/**
 * The read-aloud button on every question (README: "Voorleesknop op elke
 * vraag"), with the browser's own voice. No cloud service: a text-to-speech
 * API receiving a child's question is a third party in the middle of a lesson,
 * and this product has none.
 *
 * Three things this has to survive, all of which make a naive version look
 * broken rather than absent: `getVoices()` is empty on Chrome's first call and
 * fills in later; a machine with no Dutch voice would say nothing at all; and
 * with no voices the button hides itself, because a control that does nothing
 * is worse than a control that is not there.
 *
 * A new question stops the old one being read.
 */
export function SpeakButton({ text }: { readonly text: string }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const read = () => setVoices(window.speechSynthesis.getVoices());
    read();
    window.speechSynthesis.addEventListener('voiceschanged', read);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', read);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeaking(false);
    };
  }, [text]);

  if (voices.length === 0) return null;

  function speak() {
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const dutch = voices.find((voice) => voice.lang.toLowerCase().startsWith('nl'));
    if (dutch) utterance.voice = dutch;
    utterance.lang = dutch?.lang ?? 'nl-NL';
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <IcoonKnop label={t('practice.speak')} aria-pressed={speaking} onClick={speak}>
      <VoorleesIcon size={22} />
    </IcoonKnop>
  );
}
