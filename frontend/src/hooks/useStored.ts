import { useEffect, useState } from 'react';

/** Relit une valeur persistée à chaque écriture (même onglet ou autre onglet). */
export function useStored<T>(reader: () => T): T {
  const [value, setValue] = useState(reader);
  useEffect(() => {
    const refresh = () => setValue(reader());
    window.addEventListener('chtri:storage', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('chtri:storage', refresh);
      window.removeEventListener('storage', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}
