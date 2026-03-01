import { useState } from 'react';
import { useTrainerContext } from '../contexts/index.js';
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storageUtils.js';

export const useOnboarding = () => {
    const { trainer, party, reserve } = useTrainerContext();
    const [dismissed, setDismissed] = useState(
        () => safeLocalStorageGet('pta-onboarding-dismissed', false)
    );

    const hasPokemon = (party?.length || 0) + (reserve?.length || 0) > 0;

    const steps = [
        { id: 'name',    label: 'Name your trainer',        done: !!(trainer?.name?.trim()), tab: 'trainer' },
        { id: 'stats',   label: 'Allocate all stat points', done: (trainer?.statPoints || 0) === 0, tab: 'trainer' },
        { id: 'class',   label: 'Pick a class',             done: (trainer?.classes?.length || 0) > 0, tab: 'trainer' },
        { id: 'pokemon', label: 'Add a Pokémon',            done: hasPokemon, tab: 'pokemon' },
    ];

    const allDone = steps.every(s => s.done);

    const dismiss = () => {
        safeLocalStorageSet('pta-onboarding-dismissed', true);
        setDismissed(true);
    };

    return { steps, allDone, dismissed, dismiss };
};
