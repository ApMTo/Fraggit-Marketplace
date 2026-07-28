const NOTIFICATION_SOUND_SRC = '/sounds/chat-message.mp3';

let audio: HTMLAudioElement | null = null;
let unlockBound = false;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(NOTIFICATION_SOUND_SRC);
    audio.preload = 'auto';
    audio.volume = 0.55;
  }

  return audio;
}

export function unlockNotificationSound(): void {
  if (unlockBound || typeof window === 'undefined') {
    return;
  }

  unlockBound = true;

  const el = getAudio();
  el.muted = true;
  void el
    .play()
    .then(() => {
      el.pause();
      el.currentTime = 0;
      el.muted = false;
    })
    .catch(() => {
      el.muted = false;
    });
}

export function playNotificationSound(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const el = getAudio();
  el.currentTime = 0;
  void el.play().catch(() => {
  });
}
