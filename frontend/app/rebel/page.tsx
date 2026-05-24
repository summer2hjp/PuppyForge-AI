import RebelPanel from '../../components/RebelPanel';

export default function RebelPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-16">
      <h1 className="text-5xl font-bold mb-4">Rebel Mode</h1>
      <p className="text-xl text-zinc-400 mb-12">唤醒宠物灵魂中的反叛因子</p>
      <RebelPanel />
    </div>
  );
}
