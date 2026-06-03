import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import ChatWidget from '../chat/ChatWidget.jsx';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
      <ChatWidget />
    </div>
  );
}
