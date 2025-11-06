import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pause, Download, Maximize } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { type Detection, type DashboardStats } from '@/types/api';
import { Skeleton } from '@/components/ui/skeleton';

const fetchDetections = async (): Promise<Detection[]> => {
  const { data } = await apiClient.get('/detections/recent?limit=3');
  return data;
};

const fetchStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get('/stats');
  return data;
};

export default function LiveMonitor() {

  const {
    data: detections,
    isLoading: isLoadingDetections,
    error: errorDetections,
  } = useQuery<Detection[]>({
    queryKey: ['detections'],
    queryFn: fetchDetections,
    refetchInterval: 2000,
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: errorStats,
  } = useQuery<DashboardStats>({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 2000,
  });

  const renderDetectionRows = () => {
    if (isLoadingDetections) {
      return Array(3)
        .fill(0)
        .map((_, i) => (
          <tr key={i} className="border-t border-gray-800">
            <td className="px-4 py-3">
              <Skeleton className="h-4 w-20" />
            </td>
            <td className="px-4 py-3">
              <Skeleton className="h-4 w-24" />
            </td>
            <td className="px-4 py-3">
              <Skeleton className="h-6 w-20 rounded-full" />
            </td>
            <td className="px-4 py-3">
              <Skeleton className="h-4 w-12" />
            </td>
            <td className="px-4 py-3">
              <Skeleton className="h-8 w-8" />
            </td>
          </tr>
        ));
    }

    if (errorDetections) {
      return (
        <tr>
          <td colSpan={5} className="p-4 text-center text-red-400">
            Erro ao carregar detecções.
          </td>
        </tr>
      );
    }

    if (detections && detections.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="p-4 text-center text-gray-500">
            Nenhuma detecção registrada ainda.
          </td>
        </tr>
      );
    }

    return detections?.map((detection) => (
      <tr
        key={detection.id}
        className="border-t border-gray-800 hover:bg-gray-800/50"
      >
        <td className="px-4 py-3 text-sm">
          {new Date(detection.timestamp).toLocaleTimeString()}
        </td>
        <td className="px-4 py-3 text-sm">{detection.type}</td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              detection.category === 'A'
                ? 'bg-blue-500/20 text-blue-400'
                : detection.category === 'B'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-purple-500/20 text-purple-400'
            }`}
          >
            {detection.status}
          </span>
        </td>
        <td className="px-4 py-3 text-sm">{detection.confidence}%</td>
        <td className="px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-400 hover:text-blue-300"
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </td>
      </tr>
    ));
  };

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white p-6">
      <div className="container mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Live Monitoring</h1>
          <p className="text-gray-400">
            Real-time AI detection and conveyor belt monitoring
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Camera Feed */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Live Camera Feed</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">09:41:37 AM</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="relative aspect-video bg-gray-950">
                <img
                  src="/assets/9055478.png"
                  alt="Conveyor belt monitoring"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1.5 rounded text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Camera 01 | 1920×1080 @ 30fps</span>
                </div>
              </div>
            </Card>

            {/* Recent Detections */}
            <Card className="mt-6 bg-gray-900 border-gray-800">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Detections</h2>
                <Button
                  variant="link"
                  className="text-blue-400 hover:text-blue-300"
                >
                  View All
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-950">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Confidence</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody>{renderDetectionRows()}</tbody>
                </table>
              </div>

              <div className="p-4 border-t border-gray-800 flex items-center justify-center gap-2">
                <Button variant="ghost" size="sm" className="text-gray-400">
                  ‹
                </Button>
                <span className="text-sm text-gray-400">1 / 3</span>
                <Button variant="ghost" size="sm" className="text-gray-400">
                  ›
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Item Separation */}
            <Card className="bg-gray-900 border-gray-800 p-4">
              <h2 className="text-xl font-semibold mb-4">Item Separation</h2>
              {isLoadingStats ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : errorStats ? (
                 <p className="text-sm text-red-400">Erro ao carregar estatísticas.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-sm text-gray-300">Category A</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {stats?.itemSeparation.categoryA}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-sm text-gray-300">Category B</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {stats?.itemSeparation.categoryB}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full" />
                      <span className="text-sm text-gray-300">Category C</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {stats?.itemSeparation.categoryC}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span className="text-sm text-gray-300">Unclassified</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-500">
                      {stats?.itemSeparation.unclassified}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Performance */}
            <Card className="bg-gray-900 border-gray-800 p-4">
              <h2 className="text-xl font-semibold mb-4">Performance</h2>
              {isLoadingStats ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : errorStats ? (
                 <p className="text-sm text-red-400">Erro ao carregar performance.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Classification Rate</span>
                      <span className="text-lg font-bold text-blue-400">
                        {stats?.performance.classificationRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${stats?.performance.classificationRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Processing Speed</span>
                      <span className="text-lg font-bold text-green-400">
                        {stats?.performance.processingSpeed}ms
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: '85%' }} // (Isso pode ser melhorado)
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* System Status */}
            <Card className="bg-gray-900 border-gray-800 p-4">
              <h2 className="text-xl font-semibold mb-4">System Status</h2>
              {isLoadingStats ? (
                <div className="space-y-3">
                   <Skeleton className="h-6 w-full" />
                   <Skeleton className="h-6 w-full" />
                   <Skeleton className="h-6 w-full" />
                </div>
              ) : errorStats ? (
                <p className="text-sm text-red-400">Erro ao carregar status.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">AI Model</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-green-400 font-medium">
                        {stats?.systemStatus.aiModel}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Camera Feed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-green-400 font-medium">
                        {stats?.systemStatus.cameraFeed}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Data Storage</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span className="text-sm text-yellow-400 font-medium">
                        {stats?.systemStatus.dataStorage}% Full
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Fullscreen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}