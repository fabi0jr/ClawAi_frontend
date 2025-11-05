import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Video, BarChart3, GraduationCap, Settings } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/live-monitor', label: 'Live Monitor', icon: Video },
    { path: '/detection-insights', label: 'Detection Insights', icon: BarChart3 },
    { path: '/training', label: 'Training', icon: GraduationCap },
    { path: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className="border-b border-gray-800 bg-[#0a0b14]">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CA</span>
              </div>
              <span className="text-xl font-bold text-white">Claw AI</span>
            </Link>

            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={`gap-2 ${
                        isActive
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-500 text-sm font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}