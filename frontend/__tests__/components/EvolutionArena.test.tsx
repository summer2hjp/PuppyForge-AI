import { render, screen } from '@testing-library/react';
import { GrowthArena } from '@/components/EvolutionArena';

const mockSoul = {
  id: 1,
  name: '小奶狗',
  breed: null,
  level: 3,
  soul_fuel: 75,
  total_interactions: 42,
  evolution_stage: 'puppy',
  traits: {
    affection: 70,
    loyalty: 80,
    curiosity: 60,
    intelligence: 50,
    chaos: 40,
    aggression: 30,
    rebellion: 20,
  },
  health_score: 85,
};

describe('GrowthArena', () => {
  it('renders evolution timeline heading', () => {
    render(<GrowthArena soul={mockSoul} />);
    expect(screen.getByText('进化路线')).toBeInTheDocument();
  });

  it('shows all four evolution stages', () => {
    render(<GrowthArena soul={mockSoul} />);
    expect(screen.getByText('幼犬期')).toBeInTheDocument();
    expect(screen.getByText('成长期')).toBeInTheDocument();
    expect(screen.getByText('叛逆期')).toBeInTheDocument();
    expect(screen.getByText('传说')).toBeInTheDocument();
  });

  it('renders level progress section', () => {
    render(<GrowthArena soul={mockSoul} />);
    expect(screen.getByText('等级')).toBeInTheDocument();
    expect(screen.getByText('Lv.3 → Lv.4')).toBeInTheDocument();
  });

  it('renders soul fuel section', () => {
    render(<GrowthArena soul={mockSoul} />);
    expect(screen.getByText('灵魂燃料')).toBeInTheDocument();
    expect(screen.getByText('75/100')).toBeInTheDocument();
  });

  it('renders all seven trait labels', () => {
    render(<GrowthArena soul={mockSoul} />);
    expect(screen.getByText('灵魂特质')).toBeInTheDocument();
    expect(screen.getByText('亲密度')).toBeInTheDocument();
    expect(screen.getByText('忠诚度')).toBeInTheDocument();
    expect(screen.getByText('好奇心')).toBeInTheDocument();
    expect(screen.getByText('智慧')).toBeInTheDocument();
    expect(screen.getByText('混沌值')).toBeInTheDocument();
    expect(screen.getByText('攻击性')).toBeInTheDocument();
    expect(screen.getByText('反叛度')).toBeInTheDocument();
  });

  it('displays trait numeric values', () => {
    render(<GrowthArena soul={mockSoul} />);
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('handles "rebel" evolution stage', () => {
    const rebelSoul = { ...mockSoul, evolution_stage: 'rebel', level: 8 };
    render(<GrowthArena soul={rebelSoul} />);
    expect(screen.getByText('Lv.8 → Lv.9')).toBeInTheDocument();
  });

  it('handles "legend" evolution stage', () => {
    const legendSoul = { ...mockSoul, evolution_stage: 'legend', level: 15 };
    render(<GrowthArena soul={legendSoul} />);
    expect(screen.getByText('Lv.15 → Lv.16')).toBeInTheDocument();
  });

  it('handles "adult" evolution stage', () => {
    const adultSoul = { ...mockSoul, evolution_stage: 'adult', level: 5 };
    render(<GrowthArena soul={adultSoul} />);
    expect(screen.getByText('Lv.5 → Lv.6')).toBeInTheDocument();
  });

  it('handles unknown evolution stage gracefully', () => {
    const unknownSoul = { ...mockSoul, evolution_stage: 'unknown', level: 2 };
    render(<GrowthArena soul={unknownSoul} />);
    expect(screen.getByText('Lv.2 → Lv.3')).toBeInTheDocument();
  });
});
