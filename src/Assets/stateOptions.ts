import { useContext, useEffect } from 'react';
import { Context } from '../Components/Wrapper/Wrapper';
import { useConfig } from '../Components/Config/configHook';
import { ALL_VALID_WHITE_LABELS, WhiteLabel } from '../Types/WhiteLabel';
import { useTrackEvent } from './analytics';

export type StateOption = {
  code: string;
  name: string;
  public: boolean;
};

/** The states the "What is your state?" dropdown should offer, in display order. */
export function useStateOptions(): StateOption[] {
  const { getReferrer } = useContext(Context);
  const track = useTrackEvent();
  // Derived by the API from its white label registry, so a new or newly launched state needs no change here.
  const catalog = useConfig<StateOption[]>('state_options', []);

  // A state the API offers but this build has no route for would dead-end at /{code}.
  const routable = catalog.filter((state) => ALL_VALID_WHITE_LABELS.includes(state.code as WhiteLabel));

  // A referrer may name states that are not public yet, so this selects from the whole catalog
  // rather than the public subset.
  const named = getReferrer('stateOptions', []);
  const selected = named
    .map((code) => routable.find((state) => state.code === code))
    .filter((state): state is StateOption => state !== undefined);

  // A referrer that names states but matches none of them is always a config/build mismatch: the
  // codes are absent from the API's catalog, or from ALL_VALID_WHITE_LABELS in this build. Falling
  // back silently would serve the public list instead of the intended one, so report it.
  const unresolved = named.length > 0 && selected.length === 0;

  useEffect(() => {
    if (unresolved) {
      track('screener_state_options_unresolved', { referrer_state_options: named.join(',') });
    }
    // named is rebuilt each render, so key on its content rather than its identity.
  }, [unresolved, named.join(','), track]);

  return selected.length > 0 ? selected : routable.filter((state) => state.public);
}
