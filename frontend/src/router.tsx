import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { EffortPage } from './pages/EffortPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlannerPage } from './pages/PlannerPage';
import { PlanPage } from './pages/PlanPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProfilePage } from './pages/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'profil', element: <ProfilePage /> },
      { path: 'plan', element: <PlannerPage /> },
      { path: 'plans/:planId', element: <PlanPage /> },
      { path: 'produits', element: <ProductsPage /> },
      { path: 'effort/:planId', element: <EffortPage /> },
      { path: 'historique', element: <HistoryPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
