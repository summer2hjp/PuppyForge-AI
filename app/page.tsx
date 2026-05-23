'use client';

export default function PuppyForge() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-7xl font-bold mb-4">🐶 PUPPYFORGE AI</h1>
        <p className="text-2xl mb-8">Forging the healthiest puppies with ruthless AI intelligence</p>
        <div className="space-x-4">
          <button className="bg-white text-black px-8 py-4 rounded-xl font-bold">Start Diagnosis</button>
          <button className="border border-white px-8 py-4 rounded-xl">View Dashboard</button>
        </div>
      </div>
    </main>
  );
}