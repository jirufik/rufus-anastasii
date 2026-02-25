import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/ClientLayout.vue'),
    children: [
      { path: '', name: 'map', component: () => import('src/pages/client/MapPage.vue') },
      {
        path: 'location/:id',
        name: 'location-detail',
        component: () => import('src/pages/client/LocationDetailPage.vue'),
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('src/layouts/AdminLayout.vue'),
    children: [
      { path: 'login', name: 'admin-login', component: () => import('src/pages/admin/LoginPage.vue') },
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('src/pages/admin/DashboardPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'photos',
        name: 'admin-photos',
        component: () => import('src/pages/admin/PhotosManagePage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'locations',
        name: 'admin-locations',
        component: () => import('src/pages/admin/LocationsManagePage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'locations/:id',
        name: 'admin-location-edit',
        component: () => import('src/pages/admin/LocationEditPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('src/pages/client/MapPage.vue'),
  },
];

export default routes;
