import PuppyProfile from '../../components/PuppyProfile';
import HealthScoreCard from '../../components/HealthScoreCard';

export default function ProfilePage() {
  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <h1 className="text-4xl font-bold mb-10">宠物数字档案</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PuppyProfile puppyId="p001" />
        <HealthScoreCard puppyId="p001" />
      </div>
    </div>
  );
}
