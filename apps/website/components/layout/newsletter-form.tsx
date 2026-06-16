'use client';

import { useState } from 'react';
import { Send, Check } from 'lucide-react';

/** Footer newsletter capture. Visual-only for now — wire to the CRM/email API later. */
export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: POST to subscription endpoint via @ucpt/sdk.
    setDone(true);
    setEmail('');
  }

  return (
    <form onSubmit={submit} className="mt-5">
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1.5 pl-4 backdrop-blur transition-colors focus-within:border-gold-300/50">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (done) setDone(false);
          }}
          placeholder="Your email address"
          aria-label="Email address"
          className="min-w-0 flex-1 bg-transparent text-sm text-ivory placeholder:text-ivory/40 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Subscribe"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-gold-sheen px-4 text-sm font-semibold text-maroon-950 shadow-soft transition-all duration-300 ease-premium hover:shadow-glow active:scale-95 cursor-pointer"
        >
          {done ? <Check size={15} /> : <Send size={15} />}
          <span className="hidden sm:inline">{done ? 'Subscribed' : 'Subscribe'}</span>
        </button>
      </div>
      <p className="mt-2.5 text-xs text-ivory/50" role={done ? 'status' : undefined}>
        {done ? 'Thanks — you’re on the list.' : 'Campus visit tips and new universities. No spam, unsubscribe anytime.'}
      </p>
    </form>
  );
}
