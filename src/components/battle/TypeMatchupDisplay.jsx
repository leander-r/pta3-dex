import React from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';
import { getCombinedTypeEffectiveness } from '../../data/typeChart.js';

const TypeChip = ({ type, label }) => (
    <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '3px',
        padding: '2px 7px', borderRadius: '10px',
        background: getTypeColor(type), color: 'white',
        fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap'
    }}>
        {type}{label && <span style={{ opacity: 0.85 }}>{label}</span>}
    </span>
);

const Row = ({ heading, headingColor, items, label }) => items.length === 0 ? null : (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: headingColor, whiteSpace: 'nowrap', minWidth: '76px', paddingTop: '3px' }}>
            {heading}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {items.map(t => <TypeChip key={t} type={t} label={label} />)}
        </div>
    </div>
);

const TypeMatchupDisplay = ({ selectedPokemon, megaEvolved, currentMegaForm, activeTypes: activeTypesProp }) => {
    if (!selectedPokemon || !(selectedPokemon.types || []).length) return null;

    const activeTypes = activeTypesProp
        || (megaEvolved && currentMegaForm?.types?.length > 0 ? currentMegaForm.types : (selectedPokemon.types || []));
    const eff = getCombinedTypeEffectiveness(activeTypes);

    const isMega = !activeTypesProp && megaEvolved && currentMegaForm?.types?.length > 0;
    const isTera = !!activeTypesProp && activeTypesProp !== selectedPokemon.types;

    return (
        <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary, #f5f5f5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    Type Matchup{isMega && (
                        <span style={{ fontWeight: 'normal', marginLeft: '4px', color: 'var(--text-muted)' }}>(Mega)</span>
                    )}{isTera && (
                        <span style={{ fontWeight: 'normal', marginLeft: '4px', color: '#c78600' }}>(Tera)</span>
                    )}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {activeTypes.map(t => <TypeChip key={t} type={t} />)}
                </div>
            </div>
            <Row heading="+2 dice" headingColor="#c62828" items={eff.superWeak} />
            <Row heading="+1 die"  headingColor="#f44336" items={eff.weak} />
            <Row heading="−1 die"  headingColor="#388e3c" items={eff.resist} />
            <Row heading="−2 dice" headingColor="#1b5e20" items={eff.superResist} />
            <Row heading="Immune"  headingColor="#555"    items={eff.immune} />
        </div>
    );
};

export default TypeMatchupDisplay;
