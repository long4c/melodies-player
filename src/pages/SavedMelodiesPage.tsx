import { useEffect, useMemo, useState } from 'react';
import {
  getFirebaseErrorMessage,
  isFirebaseConfigured,
  signInWithGoogle,
  signOut,
  watchAuth,
  type User,
} from '../lib/firebase';
import {
  getMelodyUrl,
  getSavedMelodies,
  MELODY_CATEGORIES,
  removeSavedMelody,
  updateSavedMelodyDetails,
  type SavedMelody,
} from '../lib/savedMelodies';

type MelodyDraft = {
  category: string;
  note: string;
};

function formatSavedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function SavedMelodiesPage() {
  const [melodies, setMelodies] = useState<SavedMelody[]>([]);
  const [drafts, setDrafts] = useState<Record<string, MelodyDraft>>({});
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loadingMelodies, setLoadingMelodies] = useState(false);
  const [savingDetailsId, setSavingDetailsId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [message, setMessage] = useState('');

  const categories = useMemo(() => {
    return ['All', ...MELODY_CATEGORIES];
  }, []);

  const filteredMelodies = useMemo(() => {
    if (categoryFilter === 'All') {
      return melodies;
    }

    return melodies.filter((melody) => (melody.category || 'Uncategorized') === categoryFilter);
  }, [categoryFilter, melodies]);

  useEffect(() => {
    return watchAuth((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setMelodies([]);
      setDrafts({});
      return;
    }

    let ignore = false;
    setLoadingMelodies(true);

    void getSavedMelodies(user.uid)
      .then((nextMelodies) => {
        if (ignore) {
          return;
        }

        setMelodies(nextMelodies);
        setDrafts(
          Object.fromEntries(
            nextMelodies.map((melody) => [
              melody.id,
              {
                category: melody.category,
                note: melody.note,
              },
            ]),
          ),
        );
      })
      .catch((loadError) => setMessage(`Could not load saved melodies. ${getFirebaseErrorMessage(loadError)}`))
      .finally(() => {
        if (!ignore) {
          setLoadingMelodies(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [user]);

  function updateDraft(id: string, details: Partial<MelodyDraft>) {
    setDrafts((previousDrafts) => ({
      ...previousDrafts,
      [id]: {
        category: previousDrafts[id]?.category ?? 'Uncategorized',
        note: previousDrafts[id]?.note ?? '',
        ...details,
      },
    }));
  }

  async function removeMelody(id: string) {
    if (!user) {
      return;
    }

    await removeSavedMelody(user.uid, id);
    setMelodies((previousMelodies) => previousMelodies.filter((melody) => melody.id !== id));
    setDrafts((previousDrafts) => {
      const { [id]: _removedDraft, ...nextDrafts } = previousDrafts;
      return nextDrafts;
    });
  }

  async function saveDetails(melody: SavedMelody) {
    if (!user) {
      return;
    }

    const draft = drafts[melody.id] ?? {
      category: melody.category,
      note: melody.note,
    };

    setSavingDetailsId(melody.id);

    try {
      const nextDetails = await updateSavedMelodyDetails(user.uid, melody.id, draft);

      setMelodies((previousMelodies) =>
        previousMelodies.map((previousMelody) =>
          previousMelody.id === melody.id
            ? {
                ...previousMelody,
                ...nextDetails,
              }
            : previousMelody,
        ),
      );
      setDrafts((previousDrafts) => ({
        ...previousDrafts,
        [melody.id]: {
          category: nextDetails.category,
          note: nextDetails.note,
        },
      }));
      setMessage('Saved category and memo.');
    } catch (detailsError) {
      setMessage(`Could not save details. ${getFirebaseErrorMessage(detailsError)}`);
    } finally {
      setSavingDetailsId('');
    }
  }

  async function signIn() {
    try {
      await signInWithGoogle();
    } catch (signInError) {
      setMessage(`Could not sign in with Google. ${getFirebaseErrorMessage(signInError)}`);
    }
  }

  return (
    <main className="page-shell">
      <section className="app-header">
        <div className="header-copy">
          <p className="eyebrow">Melody Player</p>
          <h1>Saved melodies</h1>
        </div>
        <div className="header-side">
          <nav className="header-actions" aria-label="Primary navigation">
            {user ? (
              <button className="button secondary" type="button" onClick={signOut}>
                Sign out
              </button>
            ) : (
              <button className="button primary" type="button" onClick={signIn} disabled={!authReady || !isFirebaseConfigured}>
                Sign in
              </button>
            )}
            <a className="button secondary link-button" href="/">
              New link
            </a>
          </nav>
          {user ? <p className="auth-note">Signed in as {user.email ?? user.displayName ?? 'Google user'}</p> : null}
        </div>
      </section>

      {!isFirebaseConfigured ? (
        <section className="workspace">
          <p className="error-message" role="alert">
            Firebase config is missing. Add your Firebase web app keys to .env and restart the dev server.
          </p>
        </section>
      ) : null}

      <section className="workspace">
        {message ? (
          <p className={message.startsWith('Could not') ? 'error-message' : 'status-message'} role="status">
            {message}
          </p>
        ) : null}

        {!user ? (
          <div className="empty-state">
            <strong>Sign in to see your saved melodies.</strong>
            <span>Your mobile saves and home listening list will stay under the same Google account.</span>
          </div>
        ) : loadingMelodies ? (
          <div className="empty-state">
            <strong>Loading saved melodies.</strong>
          </div>
        ) : melodies.length === 0 ? (
          <div className="empty-state">
            <strong>No saved melodies yet.</strong>
            <span>Open a melody link and press Save to keep it in your account.</span>
          </div>
        ) : (
          <>
            <div className="saved-toolbar">
              <label className="field-label" htmlFor="category-filter">
                Category
              </label>
              <select
                id="category-filter"
                className="saved-select"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.currentTarget.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="saved-list">
              {filteredMelodies.map((melody) => (
                <article className="saved-item" key={melody.id}>
                  <div className="saved-copy">
                    <h2>{melody.title}</h2>
                    <p>
                      Key {melody.key} | Meter {melody.meter} | Tempo {melody.tempo}
                    </p>
                    <div className="saved-dates">
                      <span>Saved {formatSavedAt(melody.savedAt)}</span>
                      {melody.updatedAt ? <span>Updated {formatSavedAt(melody.updatedAt)}</span> : null}
                    </div>
                    <div className="saved-fields">
                      <label>
                        Category
                        <select
                          className="saved-select"
                          value={drafts[melody.id]?.category ?? melody.category}
                          onChange={(event) => updateDraft(melody.id, { category: event.currentTarget.value })}
                        >
                          {MELODY_CATEGORIES.map((melodyCategory) => (
                            <option key={melodyCategory} value={melodyCategory}>
                              {melodyCategory}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Memo
                        <textarea
                          className="saved-note"
                          value={drafts[melody.id]?.note ?? melody.note}
                          onChange={(event) => updateDraft(melody.id, { note: event.currentTarget.value })}
                          placeholder="Why this melody works, where to use it, arrangement ideas..."
                        />
                      </label>
                    </div>
                  </div>
                  <div className="button-row compact">
                    <a className="button primary link-button" href={getMelodyUrl(melody)}>
                      Play
                    </a>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => saveDetails(melody)}
                      disabled={savingDetailsId === melody.id}
                    >
                      {savingDetailsId === melody.id ? 'Saving' : 'Save details'}
                    </button>
                    <button className="button secondary" type="button" onClick={() => removeMelody(melody.id)}>
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
